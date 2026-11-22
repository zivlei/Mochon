/* חשבון – בקופה: everyday shopping sums and change. Levels: 3 → 5 items with half shekels, then quantities, change every time, and from level 16 agorot. */
(function () {
  const ITEMS = [["🍞", "לחם"], ["🥛", "חלב"], ["🧀", "גבינה"], ["🍎", "תפוחים"], ["🥚", "ביצים"], ["☕", "קפה"], ["🍅", "עגבניות"], ["🍌", "בננות"], ["🧈", "חמאה"], ["🍯", "דבש"], ["🥒", "מלפפונים"], ["🍪", "עוגיות"], ["🍫", "שוקולד"], ["🧃", "מיץ"], ["🍚", "אורז"], ["🫒", "זיתים"]];
  const fmt = (v) => (Math.round(v * 100) % 100 ? v.toFixed(2) : String(Math.round(v))) + " ₪";
  function gen(l) {
    const n = Math.round(lerp(3, 5, l)), maxP = Math.round(lerp(18, 38, l)), agorot = l >= 16;
    const items = shuffle(ITEMS.slice()).slice(0, n).map(([e, n]) => ({ e, n, q: 1, c: rand(3, maxP) * 100 + pick(agorot ? [0, 20, 40, 50, 70, 90] : [0, 50]) }));
    if (l >= 8) items[0].q = l >= 22 ? rand(2, 4) : 2; // two of the first product
    const total = items.reduce((s, x) => s + x.q * x.c, 0); // sums are kept in agorot
    const list = `<div class="receipt">${items.map((x) => `<div><span>${x.e} ${x.n}${x.q > 1 ? ` × ${x.q}` : ""}</span><b>${fmt(x.c / 100)}</b></div>`).join("")}</div>`;
    const deltas = agorot ? [100, -100, 1000, -1000, 10, -10, 200] : [100, -100, 1000, -1000, 50, -50, 200];
    const done = (q, c) => ({ html: list + `<div class="q-line">${q}</div>`, ans: c / 100, opts: numOptions(c, 4, deltas).map((v) => v / 100) });
    if (l <= 5 && Math.random() < 0.5) return done("כמה צריך לשלם בסך הכול?", total);
    const paid = (Math.floor(total / 5000) + 1) * 5000;
    return done(`שילמתם <b>${fmt(paid / 100)}</b> 💵 – כמה עודף תקבלו?`, paid - total);
  }
  Games.register({
    id: "change", cat: "math", name: "בקופה", icon: "🛒",
    desc: "חשבו כמה לשלם וכמה עודף לקבל",
    how: "8 שאלות מהסופרמרקט. מחברים מחירים עם חצאי שקלים ומחשבים עודף. מרמה 8 קונים כמה יחידות מאותו מוצר (המחיר הוא ליחידה), ומרמה 16 יש אגורות.",
    start(stage, level, api) {
      return runQuiz(stage, api, {
        rounds: 8, targetT: lerp(18, 30, level), label: fmt,
        make() { const q = gen(level); return { html: q.html, ans: q.ans, opts: q.opts }; }
      });
    }
  });
})();
