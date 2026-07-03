/**
 * Captura fbp/fbc/UTMs do Meta Pixel e propaga para links de checkout externo (ex: Kiwify).
 *
 * Uso (Next.js): importe `initFbTracking` e chame dentro de um useEffect em um Client Component
 * montado uma vez no layout raiz. Ver FbTrackingScript.tsx.
 */

const DEBUG = true; // mude para false antes de subir pra produção

// Domínios de checkout cujos links/botões devem receber os parâmetros.
// Adicione/remova conforme as plataformas de checkout que você usa.
const CHECKOUT_HOSTS = [
  'pay.kiwify.com.br',
  'kiwify.com.br',
  'checkout.kiwify.com.br',
  'pay.hotmart.com',
  'go.hotmart.com',
  'pay.eduzz.com',
  'sun.eduzz.com',
  'checkout.perfectpay.com.br',
  'app.monetizze.com.br',
];

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function getFbp(): string | null {
  return readCookie('_fbp');
}

function getFbc(urlParams: URLSearchParams): string | null {
  const existing = readCookie('_fbc');
  if (existing) return existing;

  const fbclid = urlParams.get('fbclid');
  if (!fbclid) return null;

  // Formato oficial da Meta: fb.{subdomain_index}.{timestamp}.{fbclid}
  return `fb.1.${Date.now()}.${fbclid}`;
}

function getUtms(urlParams: URLSearchParams): Record<string, string> {
  const utms: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = urlParams.get(key);
    if (value) utms[key] = value;
  }
  return utms;
}

function isCheckoutLink(href: string): boolean {
  try {
    const url = new URL(href, window.location.href);
    return CHECKOUT_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function buildUrlWithParams(href: string, params: Record<string, string>): string | null {
  try {
    const url = new URL(href, window.location.href);
    for (const [key, value] of Object.entries(params)) {
      // Não sobrescreve parâmetros que já existam no link
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  } catch {
    return null;
  }
}

function appendParamsToCheckoutLinks(params: Record<string, string>): number {
  let updated = 0;

  // Links <a href="...">
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || !isCheckoutLink(href)) return;

    const newHref = buildUrlWithParams(href, params);
    if (newHref) {
      anchor.setAttribute('href', newHref);
      updated++;
    }
  });

  // Botões/elementos que guardam a URL de checkout em data-href ou data-checkout-url
  // (comum em construtores de landing page tipo Elementor/WordPress ou botões custom)
  document.querySelectorAll<HTMLElement>('[data-href], [data-checkout-url]').forEach((el) => {
    const attr = el.hasAttribute('data-checkout-url') ? 'data-checkout-url' : 'data-href';
    const href = el.getAttribute(attr);
    if (!href || !isCheckoutLink(href)) return;

    const newHref = buildUrlWithParams(href, params);
    if (newHref) {
      el.setAttribute(attr, newHref);
      updated++;
    }
  });

  if (DEBUG) {
    console.log(`[fbTracking] ${updated} link(s)/botão(ões) de checkout atualizados com:`, params);
  }

  return updated;
}

export function initFbTracking(): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);

  const fbp = getFbp();
  const fbc = getFbc(urlParams);
  const utms = getUtms(urlParams);

  const params: Record<string, string> = { ...utms };
  if (fbp) params.fbp = fbp;
  if (fbc) params.fbc = fbc;

  if (DEBUG) {
    console.log('[fbTracking] Valores capturados:', {
      fbp,
      fbc,
      utms,
      fbclid_na_url: urlParams.get('fbclid'),
    });
  }

  if (Object.keys(params).length === 0) {
    if (DEBUG) console.log('[fbTracking] Nenhum parâmetro para propagar (sem fbp/fbc/UTMs).');
    return;
  }

  // Varredura inicial (cobre todos os checkouts/CTAs já presentes no HTML)
  appendParamsToCheckoutLinks(params);

  // Reaplica quando novos links/botões de checkout entram no DOM depois
  // (ex: modal de compra, seção carregada sob demanda, múltiplos produtos na página)
  const observer = new MutationObserver(() => {
    appendParamsToCheckoutLinks(params);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
