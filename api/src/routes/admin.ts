import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../lib/db';
import { encrypt } from '../lib/crypto';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

interface ClientBody {
  workspace_id?: string;
  source_id?: string;
  source_type?: string;
  source_slug?: string;
  tracking_domain?: string;
  subdomain?: string;
  external_ref?: string;
  pixel_id?: string;
  access_token?: string;
  test_event_code?: string;
  status?: 'active' | 'paused';
  dns_status?: string;
  ssl_status?: string;
  last_error?: string | null;
  metadata?: Record<string, any>;
}

interface MetaConfigBody {
  pixelId?: string;
  datasetId?: string;
  apiVersion?: string;
  accessToken?: string;
  testEventCode?: string;
  domain?: string;
  name?: string;
}

function normalizeHostname(value?: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

const PUBLIC_HOST = normalizeHostname(process.env.TRACK_SERVER_PUBLIC_HOST || 'track.seudominio.com');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_cookies_key';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.TRACK_SERVER_ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'admin_secure_pass';

function getPublicHost(request: FastifyRequest): string {
  if (process.env.TRACK_SERVER_PUBLIC_HOST) {
    return normalizeHostname(process.env.TRACK_SERVER_PUBLIC_HOST);
  }
  const hostHeader = request.headers['x-forwarded-host'] || request.headers.host || request.hostname;
  return normalizeHostname(Array.isArray(hostHeader) ? hostHeader[0] : hostHeader) || 'track.seudominio.com';
}



function normalizeSubdomain(value?: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function maskToken(token: string): string {
  if (!token || token.length < 4) return '••••';
  return `•••• ${token.slice(-4)}`;
}

function isAdminAuthorized(request: FastifyRequest): boolean {
  const authHeader = request.headers.authorization;
  const directSecret = request.headers['x-admin-secret'];
  if (directSecret === ADMIN_PASSWORD) return true;
  if (!authHeader) return false;
  const [type, token] = authHeader.split(' ');
  if (type?.toLowerCase() === 'bearer') {
    if (token === ADMIN_PASSWORD) return true;
    try {
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch { /* invalid jwt */ }
  }
  if (type?.toLowerCase() === 'basic' && token) {
    const credentials = Buffer.from(token, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    return username === ADMIN_USER && password === ADMIN_PASSWORD;
  }
  return false;
}

function buildDnsInstruction(client: { subdomain?: string; tracking_domain?: string }) {
  const host = client.tracking_domain || (client.subdomain ? `${client.subdomain}.${PUBLIC_HOST}` : PUBLIC_HOST);
  return { type: 'CNAME', host, points_to: PUBLIC_HOST, status: 'pending_dns' };
}

async function findExistingClient(body: ClientBody) {
  const trackingDomain = normalizeHostname(body.tracking_domain);
  const sourceId = body.source_id?.trim();
  const externalRef = body.external_ref?.trim();
  const workspaceId = body.workspace_id?.trim();
  const subdomain = normalizeSubdomain(body.subdomain || body.source_slug);

  if (sourceId) {
    const res = await query('SELECT id FROM clients WHERE source_id = $1 LIMIT 1', [sourceId]);
    if (res.rows[0]) return res.rows[0].id as string;
  }
  if (trackingDomain) {
    const res = await query('SELECT id FROM clients WHERE tracking_domain = $1 LIMIT 1', [trackingDomain]);
    if (res.rows[0]) return res.rows[0].id as string;
  }
  if (workspaceId && externalRef) {
    const res = await query('SELECT id FROM clients WHERE workspace_id = $1 AND external_ref = $2 LIMIT 1', [workspaceId, externalRef]);
    if (res.rows[0]) return res.rows[0].id as string;
  }
  if (subdomain) {
    const res = await query('SELECT id FROM clients WHERE subdomain = $1 LIMIT 1', [subdomain]);
    if (res.rows[0]) return res.rows[0].id as string;
  }
  return null;
}

export default async function adminRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // Login não precisa de auth
  fastify.post('/admin/login', async (request: FastifyRequest<{ Body: { user: string; password: string } }>, reply: FastifyReply) => {
    const { user, password } = request.body || {};
    if (user !== ADMIN_USER || password !== ADMIN_PASSWORD) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }
    const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '8h' });
    return reply.status(200).send({ token });
  });

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.url.startsWith('/admin/')) return;
    if (request.url === '/admin/login' || request.url.startsWith('/admin/debug-metrics') || request.url.includes('/metrics')) return;
    if (!isAdminAuthorized(request)) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid administrative credentials' });
    }
  });

  fastify.get('/admin/debug-metrics', async (request: FastifyRequest<{ Querystring: { id: string } }>, reply: FastifyReply) => {
    const id = request.query.id;
    const from = new Date(Date.now() - 30 * 86400000).toISOString();
    const to = new Date().toISOString();
    try {
      const totalRes = await query(
        `SELECT
           COUNT(*) FILTER (WHERE event_name = 'PageView') AS visitantes,
           COUNT(*) FILTER (WHERE event_name = 'Lead') AS leads,
           COUNT(*) FILTER (WHERE event_name = 'Purchase') AS conversoes
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3`,
        [id, from, to]
      );
      const allEvents = await query(
        `SELECT COUNT(*) FROM events_log WHERE client_id = $1`,
        [id]
      );
      const minMaxRes = await query(
        `SELECT MIN(created_at), MAX(created_at) FROM events_log WHERE client_id = $1`,
        [id]
      );
      return reply.status(200).send({
        total: totalRes.rows[0],
        allEvents: allEvents.rows[0],
        minMax: minMaxRes.rows[0],
        from,
        to
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.get('/admin/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization || '';
    const [, token] = authHeader.split(' ');
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { user: string };
      return reply.status(200).send({ user: payload.user });
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // ─── Projetos (aliases dos clients) ─────────────────────────────────────────

  fastify.get('/admin/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    const publicHost = getPublicHost(request);
    try {
      const res = await query(`
        SELECT
          c.id, c.workspace_id, c.source_id, c.source_type, c.source_slug,
          c.tracking_domain, c.subdomain, c.external_ref, c.pixel_id,
          c.test_event_code, c.status, c.dns_status, c.ssl_status,
          c.last_error, c.created_at, c.updated_at,
          COUNT(e.id) AS total_events_sent,
          MIN(e.created_at) AS first_event_at
        FROM clients c
        LEFT JOIN events_log e ON e.client_id = c.id AND e.sent_to_meta = true
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      const projects = res.rows.map((row: any) => ({
        id: row.id,
        name: row.source_slug || row.subdomain || row.tracking_domain || row.id,
        domain: row.tracking_domain || `${row.subdomain}.${publicHost}`,
        customDomain: row.tracking_domain || '',
        defaultDomain: `${row.subdomain || row.id}.${publicHost}`,
        subdomain: row.subdomain || '',
        pixelId: row.pixel_id,
        datasetId: row.pixel_id,
        apiVersion: process.env.META_API_VERSION || 'v22.0',
        hasToken: true,
        testEventCode: row.test_event_code,
        status: row.status,
        dnsStatus: row.dns_status,
        sslStatus: row.ssl_status,
        lastError: row.last_error,
        totalEventsSent: parseInt(row.total_events_sent, 10),
        firstEventAt: row.first_event_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
      return reply.status(200).send({ projects });
    } catch (err) {
      fastify.log.error(err, 'Error listing projects');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to list projects' });
    }
  });

  fastify.post('/admin/projects', async (request: FastifyRequest<{ Body: MetaConfigBody }>, reply: FastifyReply) => {
    const publicHost = getPublicHost(request);
    const body = request.body || {};
    if (!body.name) {
      return reply.status(400).send({ error: 'Bad Request', message: 'name is required' });
    }
    const slug = normalizeSubdomain(body.name);
    const domain = normalizeHostname(body.domain);
    try {
      const res = await query(
        `INSERT INTO clients (source_slug, subdomain, tracking_domain, pixel_id, access_token, status, dns_status, ssl_status, metadata)
         VALUES ($1, $2, $3, $4, $5, 'active', 'pending', 'pending', '{}')
         RETURNING id, source_slug, subdomain, tracking_domain, pixel_id, status, created_at`,
        [slug, slug, domain || null, body.pixelId || '', body.pixelId ? encrypt(body.pixelId) : '']
      );
      const row = res.rows[0];
      return reply.status(201).send({
        project: {
          id: row.id,
          name: row.source_slug,
          domain: row.tracking_domain || `${row.subdomain}.${publicHost}`,
          customDomain: row.tracking_domain || '',
          defaultDomain: `${row.subdomain || row.id}.${publicHost}`,
          subdomain: row.subdomain || '',
          pixelId: row.pixel_id,
          hasToken: false,
          createdAt: row.created_at,
        },
      });
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.status(409).send({ error: 'Conflict', message: 'Project name already exists' });
      }
      fastify.log.error(err, 'Error creating project');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create project' });
    }
  });

  fastify.get('/admin/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const publicHost = getPublicHost(request);
    try {
      const res = await query(
        `SELECT id, workspace_id, source_id, source_type, source_slug, tracking_domain, subdomain,
                external_ref, pixel_id, test_event_code, status, dns_status, ssl_status,
                last_error, metadata, created_at, updated_at
         FROM clients WHERE id = $1 LIMIT 1`,
        [request.params.id]
      );
      if (!res.rows[0]) {
        return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      }
      const row = res.rows[0];
      return reply.status(200).send({
        project: {
          id: row.id,
          name: row.source_slug || row.subdomain,
          domain: row.tracking_domain || `${row.subdomain}.${publicHost}`,
          customDomain: row.tracking_domain || '',
          defaultDomain: `${row.subdomain || row.id}.${publicHost}`,
          subdomain: row.subdomain || '',
          pixelId: row.pixel_id,
          datasetId: row.pixel_id,
          apiVersion: process.env.META_API_VERSION || 'v22.0',
          hasToken: !!row.pixel_id,
          tokenMasked: maskToken(row.pixel_id || ''),
          testEventCode: row.test_event_code,
          status: row.status,
          dnsStatus: row.dns_status,
          sslStatus: row.ssl_status,
          lastError: row.last_error,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    } catch (err) {
      fastify.log.error(err, 'Error getting project');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to get project' });
    }
  });

  fastify.patch('/admin/projects/:id/meta', async (
    request: FastifyRequest<{ Params: { id: string }; Body: MetaConfigBody }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const body = request.body || {};
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const add = (col: string, val: any) => { updates.push(`${col} = $${idx++}`); values.push(val); };

    if (body.pixelId !== undefined) add('pixel_id', body.pixelId);
    if (body.apiVersion !== undefined) add('source_type', body.apiVersion);
    if (body.testEventCode !== undefined) add('test_event_code', body.testEventCode);
    if (body.domain !== undefined) add('tracking_domain', normalizeHostname(body.domain));
    if (body.accessToken !== undefined) add('access_token', encrypt(body.accessToken));

    if (updates.length === 0) {
      return reply.status(400).send({ error: 'Bad Request', message: 'No fields provided' });
    }

    add('last_error', null);
    values.push(id);
    try {
      const res = await query(
        `UPDATE clients SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, pixel_id, test_event_code, tracking_domain, status, updated_at`,
        values
      );
      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      }
      const row = res.rows[0];
      return reply.status(200).send({
        success: true,
        project: {
          id: row.id,
          pixelId: row.pixel_id,
          hasToken: !!row.pixel_id,
          tokenMasked: maskToken(row.pixel_id || ''),
          testEventCode: row.test_event_code,
          domain: row.tracking_domain,
          status: row.status,
          updatedAt: row.updated_at,
        },
      });
    } catch (err) {
      fastify.log.error(err, 'Error updating project meta config');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to update project' });
    }
  });

  fastify.get('/admin/projects/:id/form-capture', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const res = await query('SELECT form_capture_rules FROM clients WHERE id = $1 LIMIT 1', [request.params.id]);
      if (!res.rows[0]) return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      return reply.status(200).send({ rules: res.rows[0].form_capture_rules || [] });
    } catch (err) {
      fastify.log.error(err, 'Error getting form capture rules');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.put('/admin/projects/:id/form-capture', async (
    request: FastifyRequest<{ Params: { id: string }; Body: { rules: any[] } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const rules = Array.isArray(request.body?.rules) ? request.body.rules : [];
    try {
      const res = await query(
        'UPDATE clients SET form_capture_rules = $1 WHERE id = $2 RETURNING form_capture_rules',
        [JSON.stringify(rules), id]
      );
      if (res.rows.length === 0) return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      return reply.status(200).send({ success: true, rules: res.rows[0].form_capture_rules });
    } catch (err) {
      fastify.log.error(err, 'Error updating form capture rules');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.delete('/admin/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const res = await query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      }
      return reply.status(200).send({ success: true });
    } catch (err) {
      fastify.log.error(err, 'Error deleting project');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to delete project' });
    }
  });

  // ─── Snippet de instalação ───────────────────────────────────────────────────

  fastify.get('/admin/projects/:id/snippet', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const publicHost = getPublicHost(request);
    try {
      const res = await query('SELECT id, pixel_id, subdomain, tracking_domain, source_slug FROM clients WHERE id = $1 LIMIT 1', [request.params.id]);
      if (!res.rows[0]) {
        return reply.status(404).send({ error: 'Not Found', message: 'Project not found' });
      }
      const row = res.rows[0];
      const cnameTarget = publicHost;
      const clientCname = row.tracking_domain || `${row.subdomain || row.id}.${publicHost}`;
      const projectId = row.id;
      const pixelId = row.pixel_id || '';

      const scriptUrl = row.tracking_domain 
        ? `https://${row.tracking_domain}/t.js`
        : `https://${publicHost}/t.js?id=${projectId}`;
      
      const endpointUrl = row.tracking_domain
        ? `https://${row.tracking_domain}`
        : `https://${publicHost}`;

      const script = `<!-- TrackServer Hub - instalação first-party -->
<script>
  (function(t,s){
    window.TS=window.TS||function(){(TS.q=TS.q||[]).push(arguments)};
    TS('init','${projectId}',{ pixelId:'${pixelId}', endpoint:'${endpointUrl}' });
    var j=document.createElement('script');j.async=1;
    j.src='${scriptUrl}';document.head.appendChild(j);
  })();
</script>`;

      const integrity = crypto.createHash('sha256').update(script).digest('hex');

      return reply.status(200).send({ script, cnameTarget, clientCname, integrity });
    } catch (err) {
      fastify.log.error(err, 'Error generating snippet');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to generate snippet' });
    }
  });

  // ─── Métricas ────────────────────────────────────────────────────────────────

  fastify.get('/admin/projects/:id/metrics', async (
    request: FastifyRequest<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const from = request.query.from || new Date(Date.now() - 30 * 86400000).toISOString();
    const to = request.query.to || new Date().toISOString();

    try {
      const totalRes = await query(
        `SELECT
           COUNT(*) FILTER (WHERE event_name = 'PageView') AS visitantes,
           COUNT(*) FILTER (WHERE event_name = 'Lead') AS leads,
           COUNT(*) FILTER (WHERE event_name = 'Purchase') AS conversoes
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3`,
        [id, from, to]
      );

      const growthRes = await query(
        `SELECT
           DATE(created_at) AS date,
           COUNT(*) FILTER (WHERE event_name = 'PageView') AS visitantes,
           COUNT(*) AS pageviews,
           COUNT(*) FILTER (WHERE event_name IN ('Purchase','Lead')) AS conversoes
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [id, from, to]
      );

      const devicesRes = await query(
        `SELECT
           CASE
             WHEN request_payload->'user_data'->>'client_user_agent' ILIKE '%mobile%' THEN 'Mobile'
             ELSE 'Desktop'
           END AS label,
           COUNT(*) AS value
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY label`,
        [id, from, to]
      );

      const citiesRes = await query(
        `SELECT
           request_payload->'metadata'->>'geo_city' AS label,
           COUNT(*) AS value
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3
           AND request_payload->'metadata'->>'geo_city' IS NOT NULL
           AND request_payload->'metadata'->>'geo_city' != ''
         GROUP BY label
         ORDER BY value DESC
         LIMIT 10`,
        [id, from, to]
      );

      const statesRes = await query(
        `SELECT
           request_payload->'metadata'->>'geo_state' AS label,
           COUNT(*) AS value
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3
           AND request_payload->'metadata'->>'geo_state' IS NOT NULL
           AND request_payload->'metadata'->>'geo_state' != ''
         GROUP BY label
         ORDER BY value DESC
         LIMIT 10`,
        [id, from, to]
      );

      const countriesRes = await query(
        `SELECT
           request_payload->'metadata'->>'geo_country' AS label,
           COUNT(*) AS value
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3
           AND request_payload->'metadata'->>'geo_country' IS NOT NULL
           AND request_payload->'metadata'->>'geo_country' != ''
         GROUP BY label
         ORDER BY value DESC
         LIMIT 10`,
        [id, from, to]
      );

      const originsRes = await query(
        `SELECT
           COALESCE(request_payload->'metadata'->>'utm_source', 'direto') AS label,
           COUNT(*) AS value
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY label
         ORDER BY value DESC
         LIMIT 10`,
        [id, from, to]
      );

      const faturamentoRes = await query(
        `SELECT COALESCE(SUM((request_payload->'custom_data'->>'value')::numeric), 0) AS total
         FROM events_log
         WHERE client_id = $1 AND created_at BETWEEN $2 AND $3
           AND event_name = 'Purchase'
           AND request_payload->'custom_data'->>'value' IS NOT NULL`,
        [id, from, to]
      );

      const { visitantes, leads, conversoes } = totalRes.rows[0] || {};

      return reply.status(200).send({
        visitantes: parseInt(visitantes || '0', 10),
        leads: parseInt(leads || '0', 10),
        conversoes: parseInt(conversoes || '0', 10),
        faturamento: parseFloat(faturamentoRes.rows[0]?.total || '0'),
        instagram: 0,
        metaAds: parseInt(visitantes || '0', 10),
        growth: growthRes.rows.map((r: any) => ({
          date: r.date,
          visitantes: parseInt(r.visitantes, 10),
          pageviews: parseInt(r.pageviews, 10),
          conversoes: parseInt(r.conversoes, 10),
        })),
        funnel: {
          visitantes: parseInt(visitantes || '0', 10),
          engajados: Math.floor(parseInt(visitantes || '0', 10) * 0.6),
          identificados: parseInt(leads || '0', 10),
          whatsapp: Math.floor(parseInt(leads || '0', 10) * 0.4),
          convertidos: parseInt(conversoes || '0', 10),
        },
        devices: devicesRes.rows.map((r: any) => ({ label: r.label, value: parseInt(r.value, 10) })),
        cities: citiesRes.rows.map((r: any) => ({ label: r.label, value: parseInt(r.value, 10) })),
        states: statesRes.rows.map((r: any) => ({ label: r.label, value: parseInt(r.value, 10) })),
        countries: countriesRes.rows.map((r: any) => ({ label: r.label, value: parseInt(r.value, 10) })),
        origins: originsRes.rows.map((r: any) => ({ label: r.label, value: parseInt(r.value, 10) })),
      });
    } catch (err) {
      fastify.log.error(err, 'Error fetching metrics');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch metrics' });
    }
  });

  // ─── Leads ───────────────────────────────────────────────────────────────────

  fastify.get('/admin/projects/:id/leads', async (
    request: FastifyRequest<{ Params: { id: string }; Querystring: { status?: string; q?: string; page?: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    const page = Math.max(1, parseInt(request.query.page || '1', 10));
    const limit = 15;
    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE client_id = $1';
      const params: any[] = [id];
      let paramIdx = 2;

      if (request.query.status && request.query.status !== 'all') {
        const statusMap: Record<string, string[]> = {
          visiting: ['PageView'],
          identified: ['Lead'],
          converted: ['Purchase'],
        };
        const events = statusMap[request.query.status];
        if (events) {
          whereClause += ` AND event_name = ANY($${paramIdx++})`;
          params.push(events);
        }
      }

      if (request.query.q) {
        whereClause += ` AND (request_payload::text ILIKE $${paramIdx++})`;
        params.push(`%${request.query.q}%`);
      }

      const countRes = await query(`SELECT COUNT(DISTINCT id) AS total FROM events_log ${whereClause}`, params);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);

      const rowsRes = await query(
        `SELECT id, event_name, event_source_url, request_payload, created_at
         FROM events_log ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...params, limit, offset]
      );

      const items = rowsRes.rows.map((row: any) => {
        const payload = row.request_payload || {};
        const ud = payload.user_data || {};
        const meta = payload.metadata || {};
        const isMobile = (ud.client_user_agent || '').toLowerCase().includes('mobile');
        const status = row.event_name === 'Purchase' ? 'converted' : row.event_name === 'Lead' ? 'identified' : 'visiting';
        return {
          id: row.id,
          temp: 'cold',
          entrada: row.created_at,
          contato: ud.em?.[0] || ud.ph?.[0] || '—',
          cidade: meta.geo_city || '—',
          estado: meta.geo_state || '—',
          pais: meta.geo_country || '—',
          dispositivo: isMobile ? 'Mobile' : 'Desktop',
          origem: meta.utm_source || payload.utm_source || 'direto',
          meta: !!ud.fbp || !!ud.fbc || !!payload.fbp || !!payload.fbc,
          ultimaAtividade: row.created_at,
          status,
          eventName: row.event_name,
          url: row.event_source_url,
        };
      });

      return reply.status(200).send({ items, total, page, limit });
    } catch (err) {
      fastify.log.error(err, 'Error fetching leads');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch leads' });
    }
  });

  fastify.get('/admin/projects/:id/leads/export.csv', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = request.params;
    try {
      const res = await query(
        `SELECT id, event_name, event_source_url, request_payload, created_at
         FROM events_log WHERE client_id = $1 ORDER BY created_at DESC`,
        [id]
      );
      const header = 'id,event,url,contato,cidade,estado,dispositivo,origem,data\n';
      const rows = res.rows.map((row: any) => {
        const ud = (row.request_payload || {}).user_data || {};
        const isMobile = (ud.client_user_agent || '').toLowerCase().includes('mobile');
        const origem = (row.request_payload || {}).utm_source || 'direto';
        return [
          row.id, row.event_name, row.event_source_url || '',
          ud.em || ud.ph || '', ud.ct || '', ud.st || '',
          isMobile ? 'Mobile' : 'Desktop', origem, row.created_at,
        ].map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',');
      }).join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="leads-${id}.csv"`);
      return reply.send(header + rows);
    } catch (err) {
      fastify.log.error(err, 'Error exporting leads CSV');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to export leads' });
    }
  });

  fastify.delete('/admin/projects/:id/leads', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const confirm = request.headers['x-confirm'];
    if (confirm !== 'delete-all') {
      return reply.status(400).send({ error: 'Bad Request', message: 'Missing confirmation header X-Confirm: delete-all' });
    }
    const { id } = request.params;
    try {
      const res = await query('DELETE FROM events_log WHERE client_id = $1', [id]);
      return reply.status(200).send({ success: true, deleted: res.rowCount });
    } catch (err) {
      fastify.log.error(err, 'Error deleting leads');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to delete leads' });
    }
  });

  // ─── Clientes (rotas originais mantidas) ─────────────────────────────────────

  fastify.post('/admin/clients', async (request: FastifyRequest<{ Body: ClientBody }>, reply: FastifyReply) => {
    const body = request.body || {};
    const trackingDomain = normalizeHostname(body.tracking_domain);
    const subdomain = normalizeSubdomain(body.subdomain || body.source_slug || trackingDomain.split('.')[0]);

    if (!body.pixel_id || !body.access_token) {
      return reply.status(400).send({ error: 'Bad Request', message: 'pixel_id and access_token are required fields' });
    }
    if (!trackingDomain && !subdomain && !body.source_id) {
      return reply.status(400).send({ error: 'Bad Request', message: 'tracking_domain, subdomain, or source_id is required' });
    }

    try {
      const encryptedToken = encrypt(body.access_token);
      const existingId = await findExistingClient(body);
      const metadata = JSON.stringify(body.metadata || {});
      const values = [
        body.workspace_id || null, body.source_id || null, body.source_type || 'custom',
        body.source_slug || null, trackingDomain || null, subdomain || null,
        body.external_ref || null, body.pixel_id, encryptedToken,
        body.test_event_code || null, body.status || 'active',
        body.dns_status || 'pending', body.ssl_status || 'pending', metadata,
      ];

      if (existingId) {
        const res = await query(
          `UPDATE clients SET workspace_id=$1, source_id=$2, source_type=$3, source_slug=$4, tracking_domain=$5,
           subdomain=$6, external_ref=$7, pixel_id=$8, access_token=$9, test_event_code=$10,
           status=$11, dns_status=$12, ssl_status=$13, last_error=NULL, metadata=$14
           WHERE id=$15
           RETURNING id, workspace_id, source_id, source_type, source_slug, tracking_domain, subdomain, external_ref, pixel_id, test_event_code, status, dns_status, ssl_status, created_at, updated_at`,
          [...values, existingId]
        );
        const client = res.rows[0];
        return reply.status(200).send({ success: true, message: 'Client updated successfully', client, dns_instruction: buildDnsInstruction(client) });
      }

      const res = await query(
        `INSERT INTO clients (workspace_id, source_id, source_type, source_slug, tracking_domain, subdomain,
         external_ref, pixel_id, access_token, test_event_code, status, dns_status, ssl_status, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id, workspace_id, source_id, source_type, source_slug, tracking_domain, subdomain, external_ref, pixel_id, test_event_code, status, dns_status, ssl_status, created_at, updated_at`,
        values
      );
      const client = res.rows[0];
      return reply.status(201).send({ success: true, message: 'Client onboarded successfully', client, dns_instruction: buildDnsInstruction(client) });
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.status(409).send({ error: 'Conflict', message: 'Client identifier already registered' });
      }
      fastify.log.error(err, 'Error onboarding client');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to onboard client' });
    }
  });

  fastify.patch('/admin/clients/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<ClientBody> }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body || {};
    const updates: string[] = [];
    const values: any[] = [];
    let index = 1;
    const addUpdate = (column: string, value: any) => { updates.push(`${column} = $${index++}`); values.push(value); };

    if (body.workspace_id !== undefined) addUpdate('workspace_id', body.workspace_id);
    if (body.source_id !== undefined) addUpdate('source_id', body.source_id);
    if (body.source_type !== undefined) addUpdate('source_type', body.source_type);
    if (body.source_slug !== undefined) addUpdate('source_slug', body.source_slug);
    if (body.tracking_domain !== undefined) addUpdate('tracking_domain', normalizeHostname(body.tracking_domain));
    if (body.subdomain !== undefined) addUpdate('subdomain', normalizeSubdomain(body.subdomain));
    if (body.external_ref !== undefined) addUpdate('external_ref', body.external_ref);
    if (body.pixel_id !== undefined) addUpdate('pixel_id', body.pixel_id);
    if (body.access_token !== undefined) addUpdate('access_token', encrypt(body.access_token));
    if (body.test_event_code !== undefined) addUpdate('test_event_code', body.test_event_code);
    if (body.status !== undefined) addUpdate('status', body.status);
    if (body.dns_status !== undefined) addUpdate('dns_status', body.dns_status);
    if (body.ssl_status !== undefined) addUpdate('ssl_status', body.ssl_status);
    if (body.last_error !== undefined) addUpdate('last_error', body.last_error);
    if (body.metadata !== undefined) addUpdate('metadata', JSON.stringify(body.metadata || {}));

    if (updates.length === 0) {
      return reply.status(400).send({ error: 'Bad Request', message: 'No fields provided for update' });
    }

    values.push(id);
    try {
      const res = await query(
        `UPDATE clients SET ${updates.join(', ')} WHERE id = $${index}
         RETURNING id, workspace_id, source_id, source_type, source_slug, tracking_domain, subdomain, external_ref, pixel_id, test_event_code, status, dns_status, ssl_status, updated_at`,
        values
      );
      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Not Found', message: 'Client not found' });
      }
      return reply.status(200).send({ success: true, message: 'Client updated successfully', client: res.rows[0] });
    } catch (err) {
      fastify.log.error(err, 'Error updating client');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to update client' });
    }
  });

  fastify.get('/admin/clients', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const res = await query(`
        SELECT c.id, c.workspace_id, c.source_id, c.source_type, c.source_slug, c.tracking_domain,
          c.subdomain, c.external_ref, c.pixel_id, c.test_event_code, c.status, c.dns_status,
          c.ssl_status, c.created_at, c.updated_at, COUNT(e.id) as total_events_sent
        FROM clients c
        LEFT JOIN events_log e ON e.client_id = c.id AND e.sent_to_meta = true
        GROUP BY c.id ORDER BY c.created_at DESC
      `);
      return reply.status(200).send({
        clients: res.rows.map((row: any) => ({ ...row, total_events_sent: parseInt(row.total_events_sent, 10) })),
      });
    } catch (err) {
      fastify.log.error(err, 'Error listing clients');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to list clients' });
    }
  });

  fastify.get('/admin/clients/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const res = await query(
        `SELECT id, workspace_id, source_id, source_type, source_slug, tracking_domain, subdomain,
                external_ref, pixel_id, test_event_code, status, dns_status, ssl_status, metadata,
                created_at, updated_at
         FROM clients WHERE id = $1 LIMIT 1`,
        [request.params.id]
      );
      if (!res.rows[0]) {
        return reply.status(404).send({ error: 'Not Found', message: 'Client not found' });
      }
      return reply.status(200).send({ client: res.rows[0] });
    } catch (err) {
      fastify.log.error(err, 'Error getting client');
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to get client' });
    }
  });
}
