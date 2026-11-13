/**
 * 3D pood – tellimused Google Sheetsi.
 * Netlify funktsioon submission-created saadab iga uue tellimuse siia (POST, JSON).
 * Paigaldus: Laiendused → Apps Script → kleebi see kood → Juuruta → Uus juurutus →
 * tüüp "Veebirakendus", käivita kui "Mina", juurdepääs "Kõik". Kopeeri veebirakenduse URL
 * Netlify keskkonnamuutujasse SHEETS_WEBHOOK_URL.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var o = JSON.parse(e.postData.contents);
    if (!o || !/^T\d{6}-[A-Z0-9]{3,6}$/.test(String(o.nr || ''))) return out({ok: false, error: 'bad nr'});
    var ss = SpreadsheetApp.getActive();
    var tell = ss.getSheetByName('Tellimused'), read = ss.getSheetByName('Read'), tooted = ss.getSheetByName('Tooted');

    // sama tellimust kaks korda ei lisa
    if (lastRow(tell, 2) > 1) {
      var nrs = tell.getRange(2, 2, lastRow(tell, 2) - 1, 1).getValues().map(function (r) { return String(r[0]); });
      if (nrs.indexOf(o.nr) !== -1) return out({ok: true, duplicate: true});
    }
    var when = o.date ? new Date(o.date) : new Date();
    var email = String(o.email || '').trim().toLowerCase();

    var r = lastRow(tell, 2) + 1;
    tell.getRange(r, 1, 1, 11).setValues([[when, o.nr, o.name || '', email, o.tel ? "'" + o.tel : '', o.method || '', o.place || '',
      num(o.subtotal), num(o.discount), num(o.shipping), num(o.total)]]);
    tell.getRange(r, 15, 1, 2).setValues([[o.code || '', o.note || '']]);

    var lines = (o.items || []).map(function (it) {
      return [o.nr, when, email, it.name || '', it.color || '', num(it.qty) || 1, num(it.price)];
    });
    if (lines.length) read.getRange(lastRow(read, 1) + 1, 1, lines.length, 7).setValues(lines);

    // uus toode, mida tabelis veel pole → lisa Tooted lehele (kulu jääb tühjaks, rida on kollane)
    var tn = lastRow(tooted, 1);
    var known = tn > 1 ? tooted.getRange(2, 1, tn - 1, 1).getValues().map(function (x) { return String(x[0]); }) : [];
    (o.items || []).forEach(function (it) {
      if (it.name && known.indexOf(it.name) === -1) {
        tooted.getRange(lastRow(tooted, 1) + 1, 1, 1, 2).setValues([[it.name, num(it.price)]]);
        known.push(it.name);
      }
    });
    return out({ok: true});
  } catch (err) {
    return out({ok: false, error: String(err)});
  } finally {
    lock.releaseLock();
  }
}

function lastRow(sheet, col) {
  var v = sheet.getRange(1, col, sheet.getMaxRows(), 1).getValues();
  for (var i = v.length - 1; i >= 0; i--) if (v[i][0] !== '' && v[i][0] !== null) return i + 1;
  return 1;
}
function num(x) { var n = Number(x); return isFinite(n) ? n : 0; }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
