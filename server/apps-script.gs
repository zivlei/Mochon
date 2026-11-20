/**
 * מוחון – central ratings & usage collector (Google Apps Script, bound to a Google Sheet).
 * Setup steps are in server/README.md. The app sends anonymous events only (random device code, no names).
 *
 * Sheets created automatically:
 *   plays   – one row per finished game: time, device, game, category, level, score, seconds, version
 *   ratings – one row per device+game (updated when the rating changes): time, device, game, stars, version
 *   summary – refreshed on every request, easy to read: game, average stars, number of ratings, plays, players
 */
const SHEETS = {
  plays: ["זמן", "מכשיר", "משחק", "תחום", "רמה", "ציון", "שניות", "גרסה", "שם המשחק"],
  ratings: ["זמן", "מכשיר", "משחק", "כוכבים", "גרסה", "שם המשחק"],
  summary: ["שם המשחק", "קוד", "ממוצע כוכבים", "מספר דירוגים", "משחקים ששוחקו", "מכשירים שונים", "ציון ממוצע"]
};

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(SHEETS[name]); sh.setFrozenRows(1); sh.setRightToLeft(true); }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const events = (body.events || []).slice(0, 200);
    const plays = sheet_("plays"), ratings = sheet_("ratings");
    const playRows = [];
    let rateData = null;
    events.forEach((ev) => {
      const when = new Date(Number(ev.ts) || Date.now());
      const dev = String(ev.dev || "").slice(0, 40), g = String(ev.g || "").slice(0, 40);
      if (ev.type === "play") {
        playRows.push([when, dev, g, String(ev.c || "").slice(0, 20), Number(ev.l) || 0, Number(ev.s) || 0, Number(ev.t) || 0, String(ev.v || "").slice(0, 12), String(ev.gn || "").slice(0, 40)]);
      } else if (ev.type === "rate") {
        const stars = Math.max(1, Math.min(5, Number(ev.stars) || 0));
        if (!rateData) rateData = ratings.getDataRange().getValues();
        const idx = rateData.findIndex((r, i) => i > 0 && r[1] === dev && r[2] === g);
        const row = [when, dev, g, stars, String(ev.v || "").slice(0, 12), String(ev.gn || "").slice(0, 40)];
        if (idx > 0) { ratings.getRange(idx + 1, 1, 1, row.length).setValues([row]); rateData[idx] = row; }
        else { ratings.appendRow(row); rateData.push(row); }
      }
    });
    if (playRows.length) plays.getRange(plays.getLastRow() + 1, 1, playRows.length, playRows[0].length).setValues(playRows);
    return json_({ ok: true, saved: events.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "summary") return json_(summary_());
  return json_({ ok: true, app: "mochon" });
}

/** totals per game; also written to the "summary" sheet so it is easy to look at */
function summary_() {
  const games = {};
  const get = (g) => (games[g] = games[g] || { stars: 0, n: 0, plays: 0, devs: {}, score: 0, name: "" });
  const plays = sheet_("plays").getDataRange().getValues().slice(1);
  plays.forEach((r) => { const x = get(r[2]); x.plays++; x.devs[r[1]] = 1; x.score += Number(r[5]) || 0; if (r[8]) x.name = r[8]; });
  sheet_("ratings").getDataRange().getValues().slice(1).forEach((r) => { const x = get(r[2]); x.stars += Number(r[3]) || 0; x.n++; if (r[5] && !x.name) x.name = r[5]; });
  const out = {}, rows = [], allDevs = {};
  plays.forEach((r) => (allDevs[r[1]] = 1));
  Object.keys(games).forEach((g) => {
    const x = games[g];
    const players = Object.keys(x.devs).length;
    out[g] = { avg: x.n ? Math.round((x.stars / x.n) * 10) / 10 : null, n: x.n, plays: x.plays, players };
    rows.push([x.name || g, g, out[g].avg === null ? "" : out[g].avg, x.n, x.plays, players, x.plays ? Math.round(x.score / x.plays) : ""]);
  });
  rows.sort((a, b) => b[4] - a[4]);
  const sh = sheet_("summary");
  sh.getRange(2, 1, Math.max(1, sh.getLastRow()), SHEETS.summary.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, SHEETS.summary.length).setValues(rows);
  return { ok: true, games: out, totalPlays: plays.length, players: Object.keys(allDevs).length, updated: new Date().toISOString() };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
