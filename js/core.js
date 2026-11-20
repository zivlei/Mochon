/* מוחון – core: helpers, storage, users, levels, stats, daily tasks, sound, quiz engine, games registry */
"use strict";

/** Bump this together with version.json on every release – installed apps compare it to show "update available". */
const APP_VERSION = "3.3.1";

// ---------- helpers ----------
const $ = (s, r) => (r || document).querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[rand(0, arr.length - 1)];
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
function fmtDate(d) { const [, m, dd] = d.split("-"); return dd + "/" + m; }
/** 1 when time <= target, falls to 0 at 2.5x target */
const speedFactor = (t, target) => (t == null ? 0 : clamp((2.5 * target - t) / (1.5 * target), 0, 1));
const PRAISE = ["יפה מאוד!", "מצוין!", "כל הכבוד!", "נהדר!", "מעולה!", "יופי!"];
const praise = () => pick(PRAISE);
function wpick(items, w) {
  const tot = items.reduce((s, x) => s + w(x), 0);
  let r = Math.random() * tot;
  for (const x of items) { r -= w(x); if (r <= 0) return x; }
  return items[items.length - 1];
}
/** distinct wrong options around a correct numeric answer */
function numOptions(ans, n, deltas) {
  const opts = new Set([ans]);
  deltas = deltas || [1, 2, 3, 10, -1, -2, -3, -10, 5, -5];
  let guard = 0;
  while (opts.size < n && guard++ < 200) { const v = ans + pick(deltas); if (v >= 0) opts.add(v); }
  let k = 11; while (opts.size < n) opts.add(ans + k++);
  return shuffle([...opts]);
}

/** Size a CSS grid of n cells to fit W x H. ratio = cell height / width. */
function fitGrid(grid, n, W, H, ratio, colsChoice) {
  const gap = Math.round(clamp(W * 0.018, 8, 18));
  let best = { w: 0, cols: 1 };
  const tryCols = Array.isArray(colsChoice) ? colsChoice : colsChoice ? [colsChoice] : [1, 2, 3, 4, 5, 6, 7, 8];
  for (const cols of tryCols) {
    const rows = Math.ceil(n / cols);
    const w = Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows / ratio);
    if (w > best.w) best = { w, cols };
  }
  const w = Math.max(36, Math.floor(Math.min(best.w, 260)));
  grid.style.gridTemplateColumns = `repeat(${best.cols}, ${w}px)`;
  grid.style.gap = gap + "px";
  grid.style.setProperty("--cell", w + "px");
  return w;
}

// ---------- categories & levels ----------
const CATS = {
  memory:   { name: "זיכרון", icon: "🧠", color: "#2f7fb5" },
  math:     { name: "חשבון", icon: "🔢", color: "#c25e0f" },
  focus:    { name: "ריכוז", icon: "🎯", color: "#7b4fb5" },
  coord:    { name: "קואורדינציה", icon: "✋", color: "#2e8b57" },
  language: { name: "שפה", icon: "📝", color: "#b03a6a" },
  logic:    { name: "היגיון", icon: "🧩", color: "#0f7c86" },
  daily:    { name: "יום־יום", icon: "🧭", color: "#8a5a14" }
};
const MAX_LEVEL = 30, PASS_SCORE = 50;
/** linear interpolation over levels 1..30 */
const lerp = (a, b, l) => a + ((b - a) * (clamp(l, 1, MAX_LEVEL) - 1)) / (MAX_LEVEL - 1);
const levelMult = (l) => Math.round((1 + (l - 1) * 0.1) * 10) / 10;

// ---------- shared picture bank: emoji, Hebrew name, type, colour (colour only where it is clear on every device) ----------
const ITEMS = [
  ["🍎", "תפוח", "fruit", "red"], ["🍌", "בננה", "fruit", "yellow"], ["🍇", "ענבים", "fruit"], ["🍓", "תות", "fruit", "red"],
  ["🍊", "תפוז", "fruit", "orange"], ["🍋", "לימון", "fruit", "yellow"], ["🍐", "אגס", "fruit"], ["🍒", "דובדבן", "fruit", "red"],
  ["🍉", "אבטיח", "fruit"], ["🥝", "קיווי", "fruit", "green"], ["🍑", "אפרסק", "fruit", "orange"], ["🍍", "אננס", "fruit"], ["🍏", "תפוח ירוק", "fruit", "green"],
  ["🥕", "גזר", "veg", "orange"], ["🍅", "עגבנייה", "veg", "red"], ["🥒", "מלפפון", "veg", "green"], ["🌽", "תירס", "veg", "yellow"],
  ["🥦", "ברוקולי", "veg", "green"], ["🧅", "בצל", "veg"], ["🍆", "חציל", "veg"], ["🥔", "תפוח אדמה", "veg"], ["🌶️", "פלפל חריף", "veg", "red"], ["🫑", "פלפל ירוק", "veg", "green"],
  ["🥛", "חלב", "food"], ["🧀", "גבינה", "food", "yellow"], ["🍞", "לחם", "food"], ["🥚", "ביצה", "food"], ["🍯", "דבש", "food"],
  ["🍫", "שוקולד", "food"], ["☕", "קפה", "food"], ["🍪", "עוגייה", "food"], ["🧂", "מלח", "food"], ["🍚", "אורז", "food"], ["🧈", "חמאה", "food"],
  ["🐶", "כלב", "animal"], ["🐱", "חתול", "animal"], ["🐸", "צפרדע", "animal", "green"], ["🐞", "פרת משה רבנו", "animal", "red"],
  ["🐥", "אפרוח", "animal", "yellow"], ["🐢", "צב", "animal", "green"], ["🐳", "לוויתן", "animal"], ["🦀", "סרטן", "animal", "red"],
  ["🐘", "פיל", "animal"], ["🦋", "פרפר", "animal"], ["🐰", "ארנב", "animal"], ["🦁", "אריה", "animal", "orange"], ["🐄", "פרה", "animal"], ["🐔", "תרנגולת", "animal"],
  ["🚗", "מכונית", "vehicle", "red"], ["🚕", "מונית", "vehicle", "yellow"], ["🚌", "אוטובוס", "vehicle"], ["🚲", "אופניים", "vehicle"], ["✈️", "מטוס", "vehicle"], ["🚂", "רכבת", "vehicle"],
  ["🌹", "ורד", "plant", "red"], ["🌻", "חמנייה", "plant", "yellow"], ["🌷", "צבעוני", "plant"], ["🌵", "קקטוס", "plant", "green"], ["🍀", "תלתן", "plant", "green"],
  ["🔑", "מפתח", "thing"], ["👓", "משקפיים", "thing"], ["☂️", "מטרייה", "thing"], ["⏰", "שעון", "thing"], ["📱", "טלפון", "thing"],
  ["✂️", "מספריים", "thing"], ["🎈", "בלון", "thing", "red"], ["📕", "ספר", "thing", "red"], ["💡", "נורה", "thing", "yellow"],
  ["🧦", "גרביים", "thing"], ["👒", "כובע", "thing"], ["🎁", "מתנה", "thing"], ["🕯️", "נר", "thing"], ["🧸", "דובי", "thing"], ["🪴", "עציץ", "thing"]
].map(([e, n, t, c]) => ({ e, n, t, c: c || null }));
const itemsOf = (...types) => ITEMS.filter((i) => types.includes(i.t));
/** timers that a game can clear in one go on stop() */
function timersKit() {
  const ts = [];
  return { later: (f, ms) => { const t = setTimeout(f, ms); ts.push(t); return t; }, clear: () => ts.forEach(clearTimeout) };
}
/** fit a .grid of n cells inside its parent element */
const fitIn = (grid, n, ratio, cols) => fitGrid(grid, n, grid.parentElement.clientWidth, grid.parentElement.clientHeight, ratio || 1, cols);
/** run a CSS width countdown on a .timebar i element */
function runBar(bar, ms) {
  bar.style.transition = "none"; bar.style.width = "100%"; void bar.offsetWidth;
  bar.style.transition = `width ${ms}ms linear`; bar.style.width = "0%";
}

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
    if (u.results.length > 5000) u.results = u.results.slice(-5000);
  }
};

// ---------- levels ----------
const Levels = {
  /** best score per level for a game: array index = level */
  bests(u, g) {
    const b = new Array(MAX_LEVEL + 1).fill(null);
    u.results.forEach((r) => { if (r.g === g && r.l >= 1 && r.l <= MAX_LEVEL && (b[r.l] === null || r.s > b[r.l])) b[r.l] = r.s; });
    return b;
  },
  /** highest playable level: level n opens when level n-1 scored >= PASS_SCORE */
  unlocked(u, g, bests) {
    const b = bests || this.bests(u, g);
    let n = 1;
    while (n < MAX_LEVEL && b[n] !== null && b[n] >= PASS_SCORE) n++;
    return n;
  },
  passed(u, g, bests) {
    const b = bests || this.bests(u, g);
    return b.filter((s) => s !== null && s >= PASS_SCORE).length;
  }
};

// ---------- stats ----------
const Stats = {
  catResults(u, c) { return u.results.filter((r) => r.c === c); },
  catAvg(u, c, n) { const r = this.catResults(u, c).slice(-(n || 10)); return r.length ? avg(r.map((x) => x.s)) : null; },
  gameAvg(u, g, n) { return avg(u.results.filter((r) => r.g === g).slice(-(n || 5)).map((r) => r.s)); },
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
  trend(u, c) {
    const r = this.catResults(u, c).map((x) => x.s);
    if (r.length < 4) return 0;
    const half = Math.min(5, Math.floor(r.length / 2));
    return avg(r.slice(-half)) - avg(r.slice(-2 * half, -half));
  },
  catPassed(u, c) { return Games.inCat(c).reduce((s, g) => s + Levels.passed(u, g.id), 0); },
  /** games played per day for the last n days (oldest first) */
  gamesPerDay(u, n) {
    const counts = {};
    u.results.forEach((r) => { counts[r.d] = (counts[r.d] || 0) + 1; });
    return Array.from({ length: n }, (_, i) => { const d = dayStr(i - n + 1); return { d, n: counts[d] || 0 }; });
  },
  gamesToday(u) { const t = today(); return u.results.filter((r) => r.d === t).length; },
  avgPerActiveDay(u) { const days = this.days(u).size; return days ? u.results.length / days : 0; }
};

// ---------- daily tasks (weighted toward weak categories) ----------
const Daily = {
  ensure(u) {
    if (!u.daily || u.daily.date !== today() || u.daily.tasks.some((t) => !Games.byId[t.game])) u.daily = this.generate(u);
    return u.daily;
  },
  weakness(u, c) {
    const a = Stats.catAvg(u, c, 5);
    return a === null ? 70 : 100 - a + 15; // never-played categories count as fairly weak
  },
  generate(u) {
    const cats = Object.keys(CATS);
    const sorted = shuffle(cats.slice()).sort((a, b) => this.weakness(u, b) - this.weakness(u, a));
    const picks = [sorted[0]];               // weakest category is always first
    let rest = sorted.slice(1);
    while (picks.length < 3 && rest.length) {
      const c = wpick(rest, (x) => this.weakness(u, x));
      picks.push(c); rest = rest.filter((x) => x !== c);
    }
    return { date: today(), tasks: picks.map((c, i) => this.makeTask(u, c, i === 0)), bonus: false, round: 1 };
  },
  /** after finishing all of today's tasks: a fresh set for the same day */
  more(u) {
    const prev = this.ensure(u);
    if (!prev.bonus) return prev;
    const d = this.generate(u);
    d.round = (prev.round || 1) + 1;
    u.daily = d;
    return d;
  },
  makeTask(u, c, focus) {
    const games = Games.inCat(c);
    let g = pick(games);
    if (focus) { // weakest (or never played) game in the weakest category
      const scored = games.map((x) => ({ x, a: Stats.gameAvg(u, x.id) }));
      scored.sort((p, q) => (p.a === null ? -1 : p.a) - (q.a === null ? -1 : q.a));
      g = scored[0].x;
    }
    const a = Stats.gameAvg(u, g.id);
    const r = Math.random();
    if (focus || a === null || r < 0.3) return { cat: c, game: g.id, kind: "play", focus, done: false, text: `שחקו ב"${g.name}"` };
    if (r < 0.65) {
      const lvl = Levels.unlocked(u, g.id);
      return { cat: c, game: g.id, kind: "level", level: lvl, focus, done: false, text: `עברו את רמה ${lvl} ב"${g.name}"` };
    }
    const target = clamp(Math.round((a + 8) / 5) * 5, 40, 95);
    return { cat: c, game: g.id, kind: "score", target, focus, done: false, text: `השיגו ${target} נקודות ומעלה ב"${g.name}"` };
  },
  /** mark tasks completed by this result; returns {newly:[], allDone:bool} */
  check(u, r) {
    const d = this.ensure(u), newly = [];
    d.tasks.forEach((t) => {
      if (t.done || t.game !== r.g) return;
      const ok = t.kind === "play" || (t.kind === "score" && r.s >= t.target) || (t.kind === "level" && r.l >= t.level && r.s >= PASS_SCORE);
      if (ok) { t.done = true; newly.push(t); }
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

// ---------- multiple-choice quiz engine (shared by several games) ----------
/**
 * cfg: rounds, targetT (sec per correct answer), accW (weight of accuracy, default 80),
 *      make(i) => { html, ans, opts, prompt? }, label(v) => html, optClass, unit
 */
function runQuiz(stage, api, cfg) {
  stage.innerHTML = '<div class="quiz"><div class="quiz-q"></div><div class="opts"></div></div>';
  const qEl = $(".quiz-q", stage), oEl = $(".opts", stage);
  const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
  const lab = cfg.label || ((v) => String(v));
  const accW = cfg.accW || 80;
  let n = 0, correct = 0, cur, shown, lock = false;
  const times = [];

  function next() {
    if (n >= cfg.rounds) return finish();
    n++; cur = cfg.make(n); lock = false; shown = Date.now();
    api.status(`${cfg.unit || "שאלה"} ${n}/${cfg.rounds}`);
    api.msg(cur.prompt || cfg.prompt || "", "soft");
    qEl.innerHTML = cur.html;
    oEl.className = "opts" + (cur.opts.length > 4 ? " many" : "") + ((cur.optClass || cfg.optClass) ? " " + (cur.optClass || cfg.optClass) : "");
    oEl.innerHTML = cur.opts.map((v, i) => `<button class="opt" data-i="${i}">${lab(v)}</button>`).join("");
  }
  oEl.addEventListener("click", (e) => {
    const b = e.target.closest(".opt"); if (!b || lock) return;
    lock = true;
    const v = cur.opts[Number(b.dataset.i)], ok = v === cur.ans;
    if (ok) { correct++; times.push((Date.now() - shown) / 1000); b.classList.add("right"); api.sound.good(); api.msg(praise(), "good"); }
    else {
      b.classList.add("wrong"); api.sound.bad();
      oEl.querySelector(`[data-i="${cur.opts.indexOf(cur.ans)}"]`).classList.add("right");
      api.msg("התשובה הנכונה מסומנת בירוק", "soft");
    }
    if (cur.reveal) cur.reveal(qEl, ok);
    later(next, ok ? 1000 : 2200);
  });
  function finish() {
    const acc = correct / cfg.rounds, at = avg(times);
    api.finish({
      score: Math.round(accW * acc + (100 - accW) * speedFactor(at, cfg.targetT) * acc),
      stats: [["תשובות נכונות", `${correct} מתוך ${cfg.rounds}`], ["זמן ממוצע לתשובה נכונה", at === null ? "—" : at.toFixed(1) + " שניות"]]
    });
  }
  next();
  return { stop() { timers.forEach(clearTimeout); } };
}
