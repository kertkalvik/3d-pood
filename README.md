# 3d.kalvik.ee

3D-prinditud toodete pood. `index.html` ehitatakse Claude'i admin-lehest („Ekspordi kliendileht“).

- `netlify/functions/pay.mjs` – allkirjastab LHV LinkPay makselingi (summa, tellimuse nr, nimi, e-post eeltäidetud).
- Netlify keskkonnamuutujad: `LHV_API_SECRET` (kohustuslik), `LHV_LINKPAY_TOKEN` (vaikimisi `kzgd62vazd`).
- Tellimused: Netlify Forms, vorm `tellimus`.
