// Tellimuse lahtilugemine (vormi väljad → struktureeritud tellimus Google Sheetsi jaoks)
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

export const METHODS = { pickup: 'Järeletulek (Nõmme)', local: 'Kohaletoomine', omniva: 'Omniva pakiautomaat', dpd: 'DPD pakiautomaat', unisend: 'Unisend pakiautomaat' };

export function buildOrder(d) {
  return {
    nr: String(d['tellimuse-nr'] || '').trim().toUpperCase(),
    date: new Date().toISOString(),
    name: d.nimi || '', email: d.email || '', tel: d.telefon || '',
    method: METHODS[d.tarneviis] || d.tarneviis || '', place: d.pakiautomaat || d.aadress || '',
    note: d.markus || '',
    items: parseLines(d.tooted),
    rawItems: d.tooted || '', rawSum: d.summa || '',
    ...parseSum(d.summa),
  };
}
