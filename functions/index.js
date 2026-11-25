// Tellimusvorm postitab lehe juurele ("/"). GET-päringud teenindab staatiline public/index.html.
// Tellimus salvestatakse Cloudflare KV-sse (varukoopia) ja saadetakse Google Sheetsi
// (Apps Script veebirakendus, aadress keskkonnamuutujas SHEETS_WEBHOOK_URL), mis saadab ka e-kirja.
import { buildOrder } from './_order.js';

export async function onRequestPost({ request, env, waitUntil }) {
  let d = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) d = await request.json();
    else d = Object.fromEntries(await request.formData());
  } catch (e) {
    return new Response('Vigane päring', { status: 400 });
  }
  if (d['bot-field']) return new Response('ok');
  if (d['form-name'] && d['form-name'] !== 'tellimus') return new Response('ok');

  const order = buildOrder(d);
  if (!/^T\d{6}-[A-Z0-9]{3,6}$/.test(order.nr) || !order.email) {
    return new Response('Tellimuse andmed on puudulikud', { status: 400 });
  }

  // varukoopia KV-sse (kui seotud)
  if (env.ORDERS) {
    try { await env.ORDERS.put('tellimus:' + order.date + ':' + order.nr, JSON.stringify({ ...order, form: d })); }
    catch (e) { console.log('KV viga', String(e)); }
  }

  const url = (env.SHEETS_WEBHOOK_URL || '').trim();
  if (url) {
    const send = fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order), redirect: 'follow' })
      .then(async (r) => console.log('Sheets', order.nr, r.status, (await r.text()).slice(0, 200)))
      .catch((e) => console.log('Sheets viga', order.nr, String(e)));
    waitUntil(send);
  } else {
    console.log('SHEETS_WEBHOOK_URL puudub, tellimus', order.nr);
  }
  return new Response('ok', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
