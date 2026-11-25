// Allkirjastab LHV LinkPay makselingi nii, et summa, tellimuse number, nimi ja e-post on eeltäidetud.
// Salajane võti: Cloudflare Pages keskkonnamuutuja (secret) LHV_API_SECRET.
const BASE = 'https://payment.lhv.ee/lp';
const enc = (s) => encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const token = (env.LHV_LINKPAY_TOKEN || 'kzgd62vazd').trim();
  const secret = (env.LHV_API_SECRET || '').trim();

  const nr = (u.searchParams.get('nr') || '').trim().toUpperCase();
  const amountRaw = (u.searchParams.get('amount') || '').replace(',', '.').replace(/\s/g, '');
  const name = (u.searchParams.get('name') || '').trim().slice(0, 100);
  const email = (u.searchParams.get('email') || '').trim().slice(0, 120);

  const amount = Number(amountRaw);
  const ok = /^T\d{6}-[A-Z0-9]{3,6}$/.test(nr) && Number.isFinite(amount) && amount > 0 && amount <= 2000;
  if (!secret || !ok) {
    const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Makse</title>
<body style="font:16px/1.5 system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 16px;color:#15171c">
<h1 style="font-size:22px">Makselinki ei õnnestunud avada</h1>
<p>Tellimus on meieni jõudnud. Saadame sulle makse juhised e-postiga 1 tööpäeva jooksul.</p>
<p>Küsimuste korral: <a href="mailto:3d@kalvik.ee">3d@kalvik.ee</a></p>
<p><a href="/">← Tagasi poodi</a></p></body>`;
    console.log('pay: ' + (!secret ? 'LHV_API_SECRET puudub' : 'vigased andmed') + ' nr=' + nr + ' amount=' + amountRaw);
    return new Response(html, { status: secret ? 400 : 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const params = [['transaction_amount', amount.toFixed(2)], ['invoice_number', nr]];
  if (name) params.push(['customer_name', name]);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) params.push(['customer_email', email]);
  params.push(['linkpay_token', token]);

  const query = params.map(([k, v]) => `${k}=${enc(v)}`).join('&');
  const hmac = await hmacHex(secret, query);
  return Response.redirect(`${BASE}?${query}&hmac=${hmac}`, 302);
}
