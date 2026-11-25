# 3d.kalvik.ee

3D-prinditud toodete pood, majutatud **Cloudflare Pages**-is (projekt `3d-pood`, ehitab GitHubi `main` harust).
`public/index.html` ehitatakse Claude'i admin-lehest („Ekspordi kliendileht“).

- `functions/index.js` – võtab vastu tellimusvormi (POST `/`), salvestab varukoopia KV-sse `ORDERS` ja saadab tellimuse Google Sheetsi.
- `functions/api/pay.js` – allkirjastab LHV LinkPay makselingi (summa, tellimuse nr, nimi, e-post eeltäidetud).
- Keskkonnamuutujad: `LHV_API_SECRET` (salajane, kohustuslik), `LHV_LINKPAY_TOKEN` (vaikimisi `kzgd62vazd`), `SHEETS_WEBHOOK_URL`.
- Google Sheetsi Apps Script: `tools/sheets-apps-script.gs` (lisab tellimuse tabelisse ja saadab teavituskirja).
