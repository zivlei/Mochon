/* חשבון – בקופה: everyday shopping sums and change. Levels: 2 items → several items, change from bills, half shekels. */
(function () {
  const ITEMS = [["🍞", "לחם"], ["🥛", "חלב"], ["🧀", "גבינה"], ["🍎", "תפוחים"], ["🥚", "ביצים"], ["☕", "קפה"], ["🍅", "עגבניות"], ["🍌", "בננות"], ["🧈", "חמאה"], ["🍯", "דבש"], ["🥒", "מלפפונים"], ["🍪", "עוגיות"], ["🍫", "שוקולד"], ["🧃", "מיץ"], ["🍚", "אורז"], ["🫒", "זיתים"]];
  const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".0", "")) + " ₪";
  function gen(l) {
    const nItems = l <= 6 ? 2 : l <= 12 ? rand(2, 3) : l <= 18 ? rand(1, 2) : l <= 24 ? rand(2, 3) : rand(2, 4);
    const maxP = l <= 6 ? 4 + l : l <= 12 ? 20 : l <= 18 ? 25 : 40;
    const half = l >= 25;
    const items = shuffle(ITEMS.slice()).slice(0, nItems).map(([e, n]) => ({ e, n, p: rand(2, maxP) + (half && Math.random() < 0.5 ? 0.5 : 0) }));
    const total = items.reduce((s, x) => s + x.p, 0);
    const list = `<div class="receipt">${items.map((x) => `<div><span>${x.e} ${x.n}</span><b>${fmt(x.p)}</b></div>`).join("")}</div>`;
    if (l <= 12) {
      return { html: list + '<div class="q-line">כמה צריך לשלם בסך הכול?</div>', ans: total, deltas: [1, 2, 3, 5, -1, -2, -3, -5, 10, -10] };
    }
    const bills = [10, 20, 50, 100, 200].filter((b) => b > total);
    const bill = l <= 18 ? bills[0] : pick(bills.slice(0, 2));
    return {
      html: list + `<div class="q-line">שילמתם בשטר של <b>${bill} ₪</b> 💵<br>כמה עודף תקבלו?</div>`,
      ans: bill - total, deltas: half ? [0.5, -0.5, 1, -1, 1.5, 2, -2, 10, -10] : [1, 2, 3, 5, -1, -2, -3, -5, 10, -10]
    };
  }
  Games.register({
    id: "change", cat: "math", name: "בקופה", icon: "🛒",
    desc: "חשבו כמה לשלם וכמה עודף לקבל",
    how: "8 שאלות מהסופרמרקט. ברמות הראשונות מחברים מחירים, אחר כך מחשבים עודף משטר, וברמות הגבוהות יש גם חצאי שקלים.",
    start(stage, level, api) {
      return runQuiz(stage, api, {
        rounds: 8, targetT: lerp(12, 24, level), label: fmt,
        make() { const q = gen(level); return { html: q.html, ans: q.ans, opts: numOptions(q.ans, 4, q.deltas) }; }
      });
    }
  });
})();
