/**
 * Cloudflare Worker – AI-proxy for Bobiltur-appen
 *
 * Oppsett (én gang):
 * 1. Gå til https://workers.cloudflare.com og logg inn (gratis konto)
 * 2. Klikk "Create a Worker"
 * 3. Erstatt alt innholdet i editoren med denne filen
 * 4. Klikk "Deploy"
 * 5. Kopier Worker-URL-en (f.eks. https://bobiltur-proxy.dittbrukernavn.workers.dev)
 * 6. Lim inn URL + "/api/chat" i appen under Innstillinger → AI-proxy URL
 *    Eksempel: https://bobiltur-proxy.dittbrukernavn.workers.dev/api/chat
 *
 * Gratis tier: 100 000 forespørsler/dag – mer enn nok til personlig bruk.
 */

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Ant-Key',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/chat' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    const key = request.headers.get('X-Ant-Key') || '';
    if (!key) {
      return json(400, { error: { message: 'Mangler API-nøkkel' } }, origin);
    }

    let body;
    try { body = await request.text(); } catch {
      return json(400, { error: { message: 'Ugyldig body' } }, origin);
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body,
      });
      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    } catch (e) {
      return json(502, { error: { message: String(e) } }, origin);
    }
  },
};

function json(status, data, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
  });
}
