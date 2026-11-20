/* מוחון – core: helpers, storage, users, stats, daily tasks, sound, games registry */
"use strict";

// ---------- helpers ----------
const $ = (s, r) => (r || document).querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function dayStr(offset) {
  const d = new Date(); d.setDate(d.getDate() + (offset || 0));
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
const today = () => dayStr(0);
function fmtTime(sec) {
  sec = Math.round(sec);
  if (sec < 60) return sec + " שניות";
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0") + " דקות";
}
function fmtDate(d) { const [y, m, dd] = d.split("-"); return dd + "/" + m; }
/** 1 when time <= target, falls to 0 at 2.5x target */
const speedFactor = (t, target) => clamp((2.5 * target - t) / (1.5 * target), 0, 1);
const PRAISE = ["יפה מאוד!", "מצוין!", "כל הכבוד!", "נהדר!", "מעולה!", "יופי!"];
const praise = () => PRAISE[rand(0, PRAISE.length - 1)];
function wpick(items, w) {
  const tot = items.reduce((s, x) => s + w(x), 0);
  let r = Math.random() * tot;
  for (const x of items) { r -= w(x); if (r <= 0) return x; }
  return items[items.length - 1];
}

/** Size a CSS grid of n square-ish cells to fit W x H. ratio = cell height / width. */
function fitGrid(grid, n, W, H, ratio, fixedCols) {
  const gap = Math.round(clamp(W * 0.02, 8, 16));
  let best = { w: 0, cols: 1 };
  const tryCols = fixedCols ? [fixedCols] : [1, 2, 3, 4, 5, 6, 7, 8];
  for (const cols of tryCols) {
    const rows = Math.ceil(n / cols);
    const w = Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows / ratio);
    if (w > best.w) best = { w, cols };
  }
  const w = Math.max(40, Math.floor(best.w));
  grid.style.gridTemplateColumns = `repeat(${best.cols}, ${w}px)`;
  grid.style.gap = gap + "px";
  grid.style.setProperty("--cell", w + "px");
  return w;
}

// ---------- categories & levels ----------
const CATS = {
  memory: { name: "זיכרון", icon: "🧠", color: "#2f7fb5" },
  math:   { name: "חשבון", icon: "🔢", color: "#c96f1c" },
  focus:  { name: "ריכוז", icon: "🎯", color: "#7b4fb5" },
  coord:  { name: "קואורדינציה", icon: "✋", color: "#2e8b57" }
};
const LEVELS = { 1: { name: "קל", mult: 1 }, 2: { name: "בינוני", mult: 1.5 }, 3: { name: "מאתגר", mult: 2 } };

// ---------- games registry ----------
const Games = {
  list: [], byId: {},
  register(g) { this.list.push(g); this.byId[g.id] = g; },
  inCat(c) { return this.list.filter((g) => g.cat === c); }
};

// ---------- storage ----------
const Store = {
  KEY: "mochon-data-v1",
  data: { users: [], currentId: null, sound: true },
  load() {
    try { const s = localStorage.getItem(this.KEY); if (s) this.data = Object.assign(this.data, JSON.parse(s)); } catch (e) {}
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {} },
  user() { return this.data.users.find((u) => u.id === this.data.currentId) || null; },
  addUser(name, avatar) {
    const u = { id: "u" + Date.now().toString(36) + rand(100, 999), name, avatar, created: Date.now(), results: [], daily: null, taskDays: [] };
    this.data.users.push(u); this.data.currentId = u.id; this.save();
    return u;
  },
  removeUser(id) {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    if (this.data.currentId === id) this.data.currentId = null;
    this.save();
  },
  addResult(u, r) {
    u.results.push(r);
    if (u.results.length > 3000) u.results = u.results.slice(-3000);
  }
};

// ---------- stats ----------
const Stats = {
  catResults(u, c) { return u.results.filter((r) => r.c === c); },
  catAvg(u, c, n) { const r = this.catResults(u, c).slice(-(n || 10)); return r.length ? avg(r.map((x) => x.s)) : null; },
  best(u, g, l) {
    const r = u.results.filter((x) => x.g === g && (l == null || x.l === l));
    return r.length ? Math.max(...r.map((x) => x.s)) : null;
  },
  totalPoints(u) { return u.results.reduce((s, r) => s + r.p, 0); },
  days(u) { return new Set(u.results.map((r) => r.d)); },
  streak(u) {
    const days = this.days(u);
    let off = days.has(today()) ? 0 : -1, n = 0;
    while (days.has(dayStr(off))) { n++; off--; }
    return n;
  },
  /** suggest a level from the last results of this game */
  recLevel(u, g) {
    const r = u.results.filter((x) => x.g === g);
    if (!r.length) return 1;
    const last = r[r.length - 1].l;
    const same = r.filter((x) => x.l === last).slice(-3);
    const a = avg(same.map((x) => x.s));
    if (a >= 80 && last < 3) return last + 1;
    if (a < 40 && last > 1) return last - 1;
    return last;
  },
  trend(u, c) {
    const r = this.catResults(u, c).map((x) => x.s);
    if (r.length < 4) return 0;
    const half = Math.min(5, Math.floor(r.length / 2));
    return avg(r.slice(-half)) - avg(r.slice(-2 * half, -half));
  }
};

// ---------- daily tasks (weighted toward weak categories) ----------
const Daily = {
  ensure(u) {
    if (!u.daily || u.daily.date !== today()) u.daily = this.generate(u);
    return u.daily;
  },
  weakness(u, c) {
    const a = Stats.catAvg(u, c, 5);
    return a === null ? 70 : 100 - a + 15; // never-played categories count as fairly weak
  },
  generate(u) {
    const cats = Object.keys(CATS);
    const sorted = cats.slice().sort((a, b) => this.weakness(u, b) - this.weakness(u, a));
    const picks = [sorted[0]];               // weakest category is always first
    let rest = sorted.slice(1);
    while (picks.length < 3 && rest.length) {
      const c = wpick(rest, (x) => this.weakness(u, x));
      picks.push(c); rest = rest.filter((x) => x !== c);
    }
    return { date: today(), tasks: picks.map((c, i) => this.makeTask(u, c, i === 0)), bonus: false };
  },
  makeTask(u, c, focus) {
    const games = Games.inCat(c);
    // prefer the weakest game in the category for the focus task
    let g = games[rand(0, games.length - 1)];
    if (focus) {
      const scored = games.map((x) => ({ x, a: avg(u.results.filter((r) => r.g === x.id).slice(-5).map((r) => r.s)) }));
      scored.sort((p, q) => (p.a === null ? -1 : p.a) - (q.a === null ? -1 : q.a));
      g = scored[0].x;
    }
    const a = avg(u.results.filter((r) => r.g === g.id).slice(-5).map((r) => r.s));
    if (focus || a === null || Math.random() < 0.4) {
      return { cat: c, game: g.id, kind: "play", focus, done: false, text: `שחקו ב"${g.name}"` };
    }
    const target = clamp(Math.round((a + 8) / 5) * 5, 40, 95);
    return { cat: c, game: g.id, kind: "score", target, focus, done: false, text: `השיגו ${target} נקודות ומעלה ב"${g.name}"` };
  },
  /** mark tasks completed by this result; returns {newly:[], allDone:bool} */
  check(u, r) {
    const d = this.ensure(u), newly = [];
    d.tasks.forEach((t) => {
      if (!t.done && t.game === r.g && (t.kind === "play" || r.s >= t.target)) { t.done = true; newly.push(t); }
    });
    let allDone = false;
    if (!d.bonus && d.tasks.every((t) => t.done)) {
      d.bonus = true; allDone = true;
      if (!u.taskDays.includes(d.date)) u.taskDays.push(d.date);
    }
    return { newly, allDone };
  }
};

// ---------- sound (Web Audio tones, no files) ----------
const Sound = {
  ctx: null,
  tone(freq, dur, delay) {
    if (!Store.data.sound) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  },
  flip() { this.tone(520, 0.12); },
  good() { this.tone(660, 0.18); this.tone(880, 0.25, 0.15); },
  bad() { this.tone(220, 0.25); },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, i * 0.18)); }
};
