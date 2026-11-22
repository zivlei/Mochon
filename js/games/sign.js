/* יום־יום – קריאת שלט. Read a notice (opening hours, price list, recipe, bus timetable) and answer a question about it.
   Levels: full notices, every question needs a calculation → two or three steps (several items and change, when will I arrive).
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 8;
  const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
  const money = (v) => v + " ₪";
  const clockText = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  const row = (name, val) => `<div class="n-r"><span>${name}</span><b>${val}</b></div>`;
  const notice = (head, rows) => `<div class="notice"><div class="n-h">${head}</div>${rows.join("")}</div>`;
  const timeOpts = (ans, deltas) => numOptions(ans, 4, deltas).map(clockText);
  function hours(level) {
    const rows = DAYS.map((d) => ({ d, open: pick([7, 8, 9, 10]) * 60 + pick([0, 30]), close: (d === "שישי" ? pick([13, 14]) : pick([17, 18, 19, 20])) * 60 + pick([0, 15, 30, 45]) }));
    const r = pick(rows);
    const html = notice("🏪 שעות פתיחה", rows.map((x) => row(`יום ${x.d}`, `${clockText(x.open)}–${clockText(x.close)}`)));
    if (Math.random() < 0.5) {
      const len = r.close - r.open;
      const opts = numOptions(len, 4, [15, 30, 60, 120]).map(clockText);
      return { html, q: `כמה זמן החנות פתוחה ביום ${r.d}? (שעות:דקות)`, ans: clockText(len), opts };
    }
    const shop = rand(4, 10) * 5, way = level >= 11 ? rand(12, 38) : 0, ans = r.close - shop - way;
    const q = way ? `יום ${r.d}: הדרך לחנות ${way} דקות, והקנייה ${shop} דקות. מתי לכל המאוחר לצאת?` : `יום ${r.d}: הקנייה לוקחת ${shop} דקות. מתי לכל המאוחר להיכנס לחנות?`;
    return { html, q, ans: clockText(ans), opts: timeOpts(ans, [10, 30, 60, shop]) };
  }
  function prices(level) {
    const menu = shuffle([["☕ קפה", 13], ["🍰 עוגה", 28], ["🥐 קרואסון", 16], ["🥪 כריך", 34], ["🍵 תה", 11], ["🧃 מיץ", 17], ["🥗 סלט", 46]]).slice(0, 6);
    const html = notice("📋 מחירון", menu.map(([n, p]) => row(n, money(p))));
    const order = shuffle(menu.slice()).slice(0, level >= 14 ? 3 : 2).map(([n, p], i) => ({ n: n.split(" ")[1], p, k: i === 0 ? rand(2, level >= 20 ? 4 : 3) : 1 }));
    const sum = order.reduce((s, x) => s + x.p * x.k, 0);
    const what = order.map((x) => (x.k > 1 ? `${x.n} (${x.k} יחידות)` : x.n)).join(", ");
    const change = level >= 6 || Math.random() < 0.4;
    const paid = (Math.floor(sum / 50) + 1) * 50, ans = change ? paid - sum : sum;
    return { html, q: change ? `קניתם: ${what}. שילמתם ${paid} ₪. כמה עודף?` : `כמה עולים יחד: ${what}?`, ans: money(ans), opts: numOptions(ans, 4, [10, -10, 2, -2, 20, 1, -1]).map(money) };
  }
  function recipe(level) {
    const ing = shuffle([["ביצים", 3, ""], ["קמח", 4, " כוסות"], ["סוכר", 2, " כוסות"], ["חלב", 3, " כוסות"], ["שמן", 5, " כפות"], ["תפוחים", 6, ""]]).slice(0, 5);
    const html = notice("🍰 מתכון לעוגה אחת", ing.map(([n, q, u]) => row(n, `${q}${u}`)));
    const [n, q, u] = pick(ing), m = rand(3, Math.round(lerp(5, 9, level))), need = q * m;
    const have = rand(2, need - 2), ans = need - have;
    return { html, q: `אופים ${m} עוגות. בבית יש ${have}${u || " " + n}${u ? " " + n : ""}. כמה חסר?`, ans, opts: numOptions(ans, 4, [1, -1, 2, -2, q, -q, 10]) };
  }
  function bus(level) {
    const line = rand(1, 60), first = rand(6, 8) * 60 + pick([0, 5, 10, 15, 20, 25]), every = pick(level <= 10 ? [15, 20, 25, 30] : [12, 17, 18, 24, 35]);
    const html = notice(`🚌 קו ${line}`, [row("יציאה ראשונה", clockText(first)), row("כל", `${every} דקות`), row("אחרון", clockText(first + every * 20))]);
    const dep = first + every * rand(2, level <= 10 ? 5 : 9);
    const walk = rand(4, 14), now = dep - walk - rand(1, every - 1); // the bus before this one leaves too early to catch
    if (level < 14) return { html, q: `השעה ${clockText(now)}, והתחנה במרחק ${walk} דקות. מתי יוצא האוטובוס הראשון שתספיקו לעלות עליו?`, ans: clockText(dep), opts: timeOpts(dep, [every, every * 2, every * 3]) };
    const ride = rand(17, 58), ans = dep + ride;
    return { html, q: `השעה ${clockText(now)}. ${walk} דקות לתחנה, והנסיעה ${ride} דקות. מתי תגיעו, הכי מוקדם?`, ans: clockText(ans), opts: timeOpts(ans, [every, 10, 60, every * 2]) };
  }
  Games.register({
    id: "sign", cat: "daily", name: "קריאת שלט", icon: "🪧",
    desc: "קראו שלט או מתכון וענו על שאלה",
    how: `מופיע שלט – שעות פתיחה, מחירון, מתכון או לוח אוטובוסים – ושאלה עליו. קראו בעיון ובחרו את התשובה. ${ROUNDS} שאלות.<br>כל שאלה דורשת חישוב, וברמות גבוהות יש יותר שלבים (כמה מוצרים ועודף, או מתי תגיעו ליעד).`,
    start(stage, level, api) {
      const makers = [hours, prices, recipe, bus];
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(12, 20, level), accW: 80, optClass: "txt",
        make() {
          const m = pick(makers)(level);
          return { html: `${m.html}<div class="q-line">${m.q}</div>`, ans: m.ans, opts: m.opts.includes(m.ans) ? m.opts : shuffle([m.ans, ...m.opts.slice(0, 3)]), prompt: "קראו את השלט" };
        }
      });
    }
  });
})();
