/* יום־יום – קריאת שלט. Read a notice (opening hours, price list, recipe, bus timetable) and answer a question about it.
   Levels: short notices with direct questions → bigger tables and questions that need a small calculation.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 8;
  const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
  const money = (v) => v + " ₪";
  function hours(level) {
    const rows = DAYS.slice(0, level <= 10 ? 3 : 6).map((d, i) => {
      const open = pick([7, 8, 9, 10]), close = d === "שישי" ? pick([13, 14]) : pick([17, 18, 19, 20]);
      return { d, open, close };
    });
    const r = pick(rows);
    const html = `<div class="notice"><div class="n-h">🏪 שעות פתיחה</div>${rows.map((x) => `<div class="n-r"><span>יום ${x.d}</span><b>${x.open}:00–${x.close}:00</b></div>`).join("")}</div>`;
    if (level <= 10 || Math.random() < 0.4) return { html, q: `מתי נסגרת החנות ביום ${r.d}?`, ans: `${r.close}:00`, opts: shuffle([...new Set([r.close, ...rows.map((x) => x.close), r.close + 1, r.close - 1])].slice(0, 4)).map((h) => `${h}:00`) };
    const h = rand(r.open - 1, r.close + 1), ok = h >= r.open && h < r.close;
    return { html, q: `האם החנות פתוחה ביום ${r.d} בשעה ${h}:30?`, ans: ok ? "כן, פתוחה" : "לא, סגורה", opts: ["כן, פתוחה", "לא, סגורה"] };
  }
  function prices(level) {
    const menu = shuffle([["☕ קפה", 12], ["🍰 עוגה", 18], ["🥐 קרואסון", 10], ["🥪 כריך", 25], ["🍵 תה", 9], ["🧃 מיץ", 11], ["🥗 סלט", 32]]).slice(0, level <= 10 ? 3 : 5);
    const html = `<div class="notice"><div class="n-h">📋 מחירון</div>${menu.map(([n, p]) => `<div class="n-r"><span>${n}</span><b>${money(p)}</b></div>`).join("")}</div>`;
    const a = pick(menu);
    if (level <= 6) return { html, q: `כמה עולה ${a[0].slice(2)}?`, ans: money(a[1]), opts: shuffle([...new Set(menu.map((m) => m[1]).concat([a[1] + 2, a[1] - 2]))].slice(0, 4)).map(money) };
    const b = pick(menu.filter((m) => m !== a)), qa = level >= 18 ? rand(2, 3) : 1;
    const sum = a[1] * qa + b[1];
    const q = `כמה עולים ${qa > 1 ? qa + " " : ""}${a[0].slice(2)} ו${b[0].slice(2)}?`;
    if (level >= 24) { const paid = Math.ceil((sum + 1) / 50) * 50; return { html, q: `${q.replace("כמה עולים", "קניתם")} ושילמתם ${paid} ₪. כמה עודף?`, ans: money(paid - sum), opts: numOptions(paid - sum, 4, [1, 2, 5, 10, -1, -2, -5, -10]).map(money) }; }
    return { html, q, ans: money(sum), opts: numOptions(sum, 4, [1, 2, 5, 10, -1, -2, -5, -10]).map(money) };
  }
  function recipe(level) {
    const ing = shuffle([["ביצים", 3, ""], ["קמח", 2, " כוסות"], ["סוכר", 1, " כוס"], ["חלב", 1, " כוס"], ["שמן", 2, " כפות"], ["תפוחים", 4, ""]]).slice(0, level <= 10 ? 3 : 5);
    const html = `<div class="notice"><div class="n-h">🍰 מתכון לעוגה אחת</div>${ing.map(([n, q, u]) => `<div class="n-r"><span>${n}</span><b>${q}${u}</b></div>`).join("")}</div>`;
    const [n, q, u] = pick(ing);
    if (level <= 8) return { html, q: `כמה ${n} צריך לעוגה אחת?`, ans: q, opts: numOptions(q, 4, [1, 2, 3, -1]) };
    const m = level >= 20 ? pick([2, 3, 4]) : 2;
    return { html, q: `כמה ${n} צריך ל-${m} עוגות?`, ans: q * m, opts: numOptions(q * m, 4, [1, 2, -1, -2, q, -q]) };
  }
  function bus(level) {
    const line = rand(1, 60), first = rand(6, 8) * 60 + pick([0, 15, 30]), every = pick(level <= 10 ? [30, 60] : [15, 20, 30, 40]);
    const t = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
    const html = `<div class="notice"><div class="n-h">🚌 קו ${line}</div><div class="n-r"><span>יציאה ראשונה</span><b>${t(first)}</b></div><div class="n-r"><span>כל</span><b>${every} דקות</b></div><div class="n-r"><span>אחרון</span><b>${t(first + every * 20)}</b></div></div>`;
    const k = rand(1, level <= 10 ? 3 : 6), ans = first + every * k;
    if (level <= 15) return { html, q: `מתי יוצא האוטובוס ה-${k + 1} של הבוקר?`, ans: t(ans), opts: shuffle([ans, ans + every, ans - every, ans + 10].filter((x, i, a) => a.indexOf(x) === i)).map(t) };
    const now = ans - rand(1, every - 1);
    return { html, q: `השעה ${t(now)}. מתי האוטובוס הבא?`, ans: t(ans), opts: shuffle([ans, ans + every, ans - every, now + 5].filter((x, i, a) => a.indexOf(x) === i && x !== now)).slice(0, 4).map(t) };
  }
  Games.register({
    id: "sign", cat: "daily", name: "קריאת שלט", icon: "🪧",
    desc: "קראו שלט או מתכון וענו על שאלה",
    how: `מופיע שלט – שעות פתיחה, מחירון, מתכון או לוח אוטובוסים – ושאלה עליו. קראו בעיון ובחרו את התשובה. ${ROUNDS} שאלות.<br>ברמות גבוהות השלטים ארוכים יותר והשאלות דורשות חישוב קטן (למשל כמה עולים שני דברים, או כמה עודף).`,
    start(stage, level, api) {
      const makers = [hours, prices, recipe, bus];
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(8, 14, level), accW: 80, optClass: "txt",
        make() {
          const m = pick(makers)(level);
          return { html: `${m.html}<div class="q-line">${m.q}</div>`, ans: m.ans, opts: m.opts.includes(m.ans) ? m.opts : shuffle([m.ans, ...m.opts.slice(0, 3)]), prompt: "קראו את השלט" };
        }
      });
    }
  });
})();
