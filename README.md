# 3d.kalvik.ee

3D-prinditud toodete pood. `index.html` ehitatakse Claude'i admin-lehest („Ekspordi kliendileht“).

- `netlify/functions/pay.mjs` – allkirjastab LHV LinkPay makselingi (summa, tellimuse nr, nimi, e-post eeltäidetud).
- Netlify keskkonnamuutujad: `LHV_API_SECRET` (kohustuslik), `LHV_LINKPAY_TOKEN` (vaikimisi `kzgd62vazd`).
- Tellimused: Netlify Forms, vorm `tellimus`.

## Tellimused Google Sheetsis

`netlify/functions/submission-created.mjs` saadab iga uue tellimuse Google Sheetsi tabelisse
„3D pood – tellimused” (Apps Script veebirakendus, aadress keskkonnamuutujas `SHEETS_WEBHOOK_URL`).
Skripti kood: `tools/sheets-apps-script.gs`.
