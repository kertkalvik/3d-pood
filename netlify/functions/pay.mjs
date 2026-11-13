// Allkirjastab LHV LinkPay makselingi nii, et summa, tellimuse number, nimi ja e-post on eeltäidetud.
// Salajane võti: Netlify keskkonnamuutuja LHV_API_SECRET (LHV portaal → Üldised seaded → API secret).
import { createHmac } from 'node:crypto';

const BASE = 'https://payment.lhv.ee/lp';

// PHP rawurlencode-iga ühilduv kodeerimine (LHV juhendi järgi asendatakse "+" → "%20")
const enc = (s) => encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

export default async (req) => {
  const u = new URL(req.url);
  const token = (Netlify.env.get('LHV_LINKPAY_TOKEN') || 'kzgd62vazd').trim();
  const secret = (Netlify.env.get('LHV_API_SECRET') || '').trim();
  const plain = `${BASE}/${token}`;

  const nr = (u.searchParams.get('nr') || '').trim().toUpperCase();
  const amountRaw = (u.searchParams.get('amount') || '').replace(',', '.').replace(/\s/g, '');
  const name = (u.searchParams.get('name') || '').trim().slice(0, 100);
  const email = (u.searchParams.get('email') || '').trim().slice(0, 120);

  const amount = Number(amountRaw);
  const ok = /^T\d{6}-[A-Z0-9]{3,6}$/.test(nr) && Number.isFinite(amount) && amount > 0 && amount <= 2000;
  if (!secret || !ok) return Response.redirect(plain, 302);

  const params = [
    ['transaction_amount', amount.toFixed(2)],
    ['invoice_number', nr],
  ];
  if (name) params.push(['customer_name', name]);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) params.push(['customer_email', email]);
  params.push(['linkpay_token', token]);

  const query = params.map(([k, v]) => `${k}=${enc(v)}`).join('&');
  const hmac = createHmac('sha256', secret).update(query).digest('hex');
  return Response.redirect(`${BASE}?${query}&hmac=${hmac}`, 302);
};

export const config = { path: '/api/pay' };
