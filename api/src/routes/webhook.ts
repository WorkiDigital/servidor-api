import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import * as crypto from 'crypto';
import { query } from '../lib/db';
import redis from '../lib/redis';
import { normalizeAndHashUserData } from '../lib/hash';

interface ClientRecord {
  id: string;
  workspace_id?: string | null;
  source_id?: string | null;
  source_type?: string | null;
  pixel_id: string;
  test_event_code?: string | null;
  status: string;
}

async function resolveClientBySourceId(sourceId: string): Promise<ClientRecord | null> {
  const IS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const col = IS_UUID.test(sourceId) ? 'id' : 'source_id';
  const res = await query(
    `SELECT id, workspace_id, source_id, source_type, pixel_id, test_event_code, status
     FROM clients WHERE ${col} = $1 LIMIT 1`,
    [sourceId]
  );
  return res.rows[0] || null;
}

async function enqueueWebhookEvent(client: ClientRecord, event: {
  event_name: string;
  event_id: string;
  event_source_url?: string;
  user_data: Record<string, any>;
  custom_data?: Record<string, any>;
}) {
  const dedupKey = `dedup:${client.id}:${event.event_id}`;
  const isNew = await redis.set(dedupKey, '1', 'EX', 86400, 'NX');
  if (!isNew) return;

  const payload = {
    client_id: client.id,
    workspace_id: client.workspace_id || undefined,
    source_id: client.source_id || undefined,
    source_type: client.source_type || 'custom',
    pixel_id: client.pixel_id,
    test_event_code: client.test_event_code || undefined,
    event_name: event.event_name,
    event_id: event.event_id,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: event.event_source_url,
    user_data: normalizeAndHashUserData(event.user_data),
    custom_data: event.custom_data || {},
    metadata: {},
  };

  await redis.lpush('queue:events', JSON.stringify(payload));
}

function splitName(fullName?: string): { first_name: string; last_name: string } {
  const parts = (fullName || '').trim().split(/\s+/);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || '',
  };
}

// ─── Kiwify ──────────────────────────────────────────────────────────────────

const KIWIFY_PURCHASE_EVENTS = new Set(['compra_aprovada']);
const KIWIFY_CHECKOUT_EVENTS = new Set(['carrinho_abandonado', 'pix_gerado', 'boleto_gerado']);

function parseKiwifyEvent(body: any): { event_name: string; event_id: string; user_data: Record<string, any>; custom_data: Record<string, any> } | null {
  const trigger: string = body.webhook_event_type || body.order_status || '';

  let event_name: string;
  if (KIWIFY_PURCHASE_EVENTS.has(trigger)) {
    event_name = 'Purchase';
  } else if (KIWIFY_CHECKOUT_EVENTS.has(trigger)) {
    event_name = 'InitiateCheckout';
  } else {
    return null;
  }

  const customer = body.Customer || {};
  const product = body.Product || {};
  const commissions = body.Commissions || {};
  const { first_name, last_name } = splitName(customer.full_name);

  const user_data = {
    email: customer.email,
    phone: customer.mobile,
    first_name,
    last_name,
  };

  const custom_data: Record<string, any> = {
    content_name: product.name,
    content_ids: [product.id].filter(Boolean),
    content_type: 'product',
  };

  if (event_name === 'Purchase') {
    custom_data.value = commissions.charge_amount || commissions.my_commission;
    custom_data.currency = 'BRL';
    custom_data.order_id = body.order_id;
  }

  return {
    event_name,
    event_id: body.order_id || crypto.randomUUID(),
    user_data,
    custom_data,
  };
}

// ─── Hotmart ─────────────────────────────────────────────────────────────────

const HOTMART_PURCHASE_EVENTS = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
const HOTMART_CHECKOUT_EVENTS = new Set(['PURCHASE_OUT_OF_SHOPPING_CART', 'PURCHASE_WAITING_PAYMENT']);

function validateHotmartSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return !secret;
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

function parseHotmartEvent(body: any): { event_name: string; event_id: string; user_data: Record<string, any>; custom_data: Record<string, any> } | null {
  const event: string = body.event || '';

  let event_name: string;
  if (HOTMART_PURCHASE_EVENTS.has(event)) {
    event_name = 'Purchase';
  } else if (HOTMART_CHECKOUT_EVENTS.has(event)) {
    event_name = 'InitiateCheckout';
  } else {
    return null;
  }

  const data = body.data || {};
  const buyer = data.buyer || {};
  const purchase = data.purchase || {};
  const product = data.product || {};
  const price = purchase.full_price || {};

  const user_data = {
    email: buyer.email,
    phone: buyer.phone,
    first_name: buyer.name,
    last_name: buyer.last_name,
  };

  const custom_data: Record<string, any> = {
    content_name: product.name,
    content_ids: [String(product.id || '')].filter(Boolean),
    content_type: 'product',
  };

  if (event_name === 'Purchase') {
    custom_data.value = price.value;
    custom_data.currency = price.currency_value || 'BRL';
    custom_data.order_id = purchase.transaction;
  }

  return {
    event_name,
    event_id: purchase.transaction || body.id || crypto.randomUUID(),
    user_data,
    custom_data,
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export default async function webhookRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {

  // Kiwify
  fastify.post('/webhook/kiwify', {
    config: { rawBody: true },
  }, async (request: FastifyRequest<{ Querystring: { source_id?: string } }>, reply: FastifyReply) => {
    const sourceId = request.query.source_id;
    if (!sourceId) return reply.status(400).send({ error: 'source_id is required' });

    const client = await resolveClientBySourceId(sourceId);
    if (!client || client.status !== 'active') return reply.status(404).send({ error: 'Client not found' });

    const body = request.body as any;

    // Validação simples via token no body (Kiwify envia campo token = secret configurado)
    const webhookSecret = process.env[`KIWIFY_SECRET_${client.id.replace(/-/g, '_').toUpperCase()}`]
      || process.env.KIWIFY_WEBHOOK_SECRET;
    if (webhookSecret && body.token !== webhookSecret) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    const parsed = parseKiwifyEvent(body);
    if (!parsed) return reply.status(200).send({ skipped: true });

    await enqueueWebhookEvent(client, parsed);
    return reply.status(200).send({ success: true, event: parsed.event_name, event_id: parsed.event_id });
  });

  // Hotmart
  fastify.post('/webhook/hotmart', {
    config: { rawBody: true },
  }, async (request: FastifyRequest<{ Querystring: { source_id?: string; hottok?: string } }>, reply: FastifyReply) => {
    const sourceId = request.query.source_id;
    if (!sourceId) return reply.status(400).send({ error: 'source_id is required' });

    const client = await resolveClientBySourceId(sourceId);
    if (!client || client.status !== 'active') return reply.status(404).send({ error: 'Client not found' });

    const body = request.body as any;
    const rawBody = (request as any).rawBody as string || JSON.stringify(body);

    // Validação via HMAC-SHA256 ou hottok
    const webhookSecret = process.env[`HOTMART_SECRET_${client.id.replace(/-/g, '_').toUpperCase()}`]
      || process.env.HOTMART_WEBHOOK_SECRET;
    const signature = request.headers['x-hotmart-signature'] as string;
    const hottok = request.query.hottok;

    if (webhookSecret) {
      if (signature) {
        if (!validateHotmartSignature(rawBody, signature, webhookSecret)) {
          return reply.status(401).send({ error: 'Invalid signature' });
        }
      } else if (hottok !== webhookSecret) {
        return reply.status(401).send({ error: 'Invalid hottok' });
      }
    }

    const parsed = parseHotmartEvent(body);
    if (!parsed) return reply.status(200).send({ skipped: true });

    await enqueueWebhookEvent(client, parsed);
    return reply.status(200).send({ success: true, event: parsed.event_name, event_id: parsed.event_id });
  });
}
