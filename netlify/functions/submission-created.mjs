// Netlify käivitab selle iga vormi esitamise järel ise (sündmus "submission-created").
// Tellimus loetakse lahti ja saadetakse Google Sheetsi (Apps Script veebirakendus, URL on
// keskkonnamuutujas SHEETS_WEBHOOK_URL). Kui URL puudub, ei tehta midagi.

const num = (s) => {
  const n = Number(String(s || '').replace(/[\s  €]/g, '').replace(',', '.').replace('−', '-'));
  return Number.isFinite(n) ? n : 0;
};

// "2 × Kristalldraakon, 60 cm pikk, värv: Must (14,00 €)"
export function parseLines(text) {
  return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(\d+)\s*×\s*(.+?)(?:,\s*värv:\s*(.+?))?\s*\(([^()]*€)\)$/);
    if (!m) return { qty: 1, name: l, color: '', price: 0 };
    return { qty: Number(m[1]), name: m[2].trim(), color: (m[3] || '').trim(), price: num(m[4]) };
  });
}

// "20,00 € (tooted 17,50 €, sooduskood MUSTREEDE −1,00 €, tarne 3,50 €)"
export function parseSum(text) {
  const t = String(text || '');
  const N = '([\\d\\s\\u00a0\\u202f.,]+€)';
  const total = num((t.match(new RegExp('^\\s*' + N)) || [])[1]);
  const subtotal = num((t.match(new RegExp('tooted\\s+' + N)) || [])[1]);
  const shipping = num((t.match(new RegExp('tarne\\s+' + N)) || [])[1]);
  const d = t.match(new RegExp('sooduskood\\s+(.+?)\\s+[−-]\\s*' + N));
  return { total, subtotal, shipping, code: d ? d[1].replace(/\s*\(.*\)\s*$/, '') : '', discount: d ? num(d[2]) : 0 };
}

const METHODS = { pickup: 'Järeletulek (Nõmme)', local: 'Kohaletoomine', omniva: 'Omniva pakiautomaat', dpd: 'DPD pakiautomaat', unisend: 'Unisend pakiautomaat' };

export const handler = async (event) => {
  const url = (process.env.SHEETS_WEBHOOK_URL || '').trim();
  try {
    const { payload } = JSON.parse(event.body || '{}');
    if (!payload || payload.form_name !== 'tellimus') return { statusCode: 200, body: 'skip' };
    const d = payload.data || {};
    const nr = String(d['tellimuse-nr'] || '').trim().toUpperCase();
    if (!url) { console.log('SHEETS_WEBHOOK_URL puudub, tellimus', nr, 'jäi tabelisse lisamata'); return { statusCode: 200, body: 'no url' }; }
    const s = parseSum(d.summa);
    const order = {
      nr,
      date: payload.created_at || new Date().toISOString(),
      name: d.nimi || '', email: d.email || '', tel: d.telefon || '',
      method: METHODS[d.tarneviis] || d.tarneviis || '', place: d.pakiautomaat || d.aadress || '',
      note: d.markus || '',
      items: parseLines(d.tooted),
      ...s,
    };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order), redirect: 'follow' });
    console.log('Sheets', nr, r.status, (await r.text()).slice(0, 200));
  } catch (err) {
    console.log('Sheets viga', String(err));
  }
  return { statusCode: 200, body: 'ok' };
};
