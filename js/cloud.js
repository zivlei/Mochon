/* מוחון – anonymous ratings & usage stats, sent to a central Google Sheet (see server/README.md).
   Nothing personal is sent: no names, only a random device code, the game, level, score, time and star rating.
   Events wait in a local outbox and are sent when online, so playing offline loses nothing. */
"use strict";

/** Paste the Google Apps Script web-app address here (ends with /exec). Empty = keep everything on the device only. */
const CLOUD_URL = "";

const Cloud = {
  MAX_OUTBOX: 500,
  SUMMARY_TTL: 3 * 60 * 60 * 1000,
  enabled() { return !!CLOUD_URL && Store.data.share !== false; },
  device() {
    if (!Store.data.deviceId) { Store.data.deviceId = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); Store.save(); }
    return Store.data.deviceId;
  },
  push(ev) {
    if (Store.data.share === false) return;
    const ob = (Store.data.outbox = Store.data.outbox || []);
    ob.push(Object.assign({ dev: this.device(), v: APP_VERSION, ts: Date.now() }, ev));
    if (ob.length > this.MAX_OUTBOX) ob.splice(0, ob.length - this.MAX_OUTBOX);
    Store.save();
    this.flushSoon();
  },
  play(r) { this.push({ type: "play", g: r.g, gn: (Games.byId[r.g] || {}).name, c: r.c, l: r.l, s: r.s, t: r.t }); },
  rate(g, stars) { this.push({ type: "rate", g, gn: (Games.byId[g] || {}).name, stars }); },
  _timer: null,
  flushSoon() { clearTimeout(this._timer); this._timer = setTimeout(() => this.flush(), 1500); },
  async flush() {
    const ob = Store.data.outbox || [];
    if (!this.enabled() || !ob.length || !navigator.onLine || this._sending) return;
    this._sending = true;
    const batch = ob.slice(0, 100);
    try {
      // text/plain keeps this a "simple" request (no CORS preflight), which Apps Script requires
      const res = await fetch(CLOUD_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ events: batch }), keepalive: true });
      if (res.ok) {
        Store.data.outbox = (Store.data.outbox || []).filter((e) => !batch.includes(e));
        Store.save();
        if (Store.data.outbox.length) this.flushSoon();
      }
    } catch (e) { /* offline or blocked – try again later */ }
    this._sending = false;
  },
  /** community numbers: { games: { id: { avg, n, plays, players } }, totalPlays, players, updated } */
  summary() { return Store.data.cloudSummary || null; },
  async refresh(force) {
    if (!CLOUD_URL || !navigator.onLine) return null;
    const s = Store.data.cloudSummary;
    if (!force && s && Date.now() - (s.fetched || 0) < this.SUMMARY_TTL) return s;
    try {
      const res = await fetch(CLOUD_URL + "?action=summary&t=" + Date.now(), { cache: "no-store" });
      const data = await res.json();
      if (data && data.games) { data.fetched = Date.now(); Store.data.cloudSummary = data; Store.save(); return data; }
    } catch (e) {}
    return null;
  }
};
window.addEventListener("online", () => Cloud.flush());
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") Cloud.flush(); });
