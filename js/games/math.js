/* חשבון – תרגילים. 30 levels from two- and three-digit sums and tables up to brackets, percentages and several steps. */
(function () {
  function gen(l) {
    const mx = Math.round(lerp(150, 700, l)); // the size of plain sums grows with every level
    const q = (text, ans) => ({ text: text.replace(/-/g, "−"), ans });
    const add = () => { const a = rand(38, mx), b = rand(27, mx); return q(`${a} + ${b}`, a + b); };
    const sub = () => { const a = rand(90, mx + 60), b = rand(28, a - 15); return q(`${a} - ${b}`, a - b); };
    const table = () => { const a = rand(6, 12), b = rand(4, 12); return q(`${a} × ${b}`, a * b); };
    const div = () => { const b = rand(3, 12), k = rand(5, Math.round(lerp(12, 25, l))); return q(`${b * k} ÷ ${b}`, k); };
    const three = () => { const a = rand(35, mx), b = rand(18, 120), c = rand(15, a + b - 10); return q(`${a} + ${b} - ${c}`, a + b - c); };
    const gap = () => { const a = rand(25, mx), x = rand(18, mx); return q(`${a} + ? = ${a + x}`, x); };
    const wide = () => { const a = rand(13, 29), b = rand(3, 9); return q(`${a} × ${b}`, a * b); };
    const mulAdd = () => { const a = rand(4, 12), b = rand(4, 12), c = rand(17, 89); return q(`${a} × ${b} + ${c}`, a * b + c); };
    const percent = () => {
      const p = pick(l < 22 ? [10, 20, 25, 50] : [5, 15, 20, 30, 40, 75]);
      const base = rand(3, 20) * 20;
      return { pct: [p, base], ans: (p * base) / 100 };
    };
    const twoByTwo = () => { const a = rand(11, 15), b = rand(12, 25); return q(`${a} × ${b}`, a * b); };
    const gapMul = () => { const a = rand(6, 15), x = rand(4, 14); return q(`? × ${a} = ${a * x}`, x); };
    const brackets = () => { const a = rand(8, 35), b = rand(5, 25), c = rand(3, 9); return q(`(${a} + ${b}) × ${c}`, (a + b) * c); };
    const twoProducts = () => { const a = rand(7, 12), b = rand(6, 12), c = rand(2, 6), d = rand(3, 6); return q(`${a} × ${b} - ${c} × ${d}`, a * b - c * d); };
    const kinds = l <= 5 ? [add, sub, table, div]
      : l <= 10 ? [add, sub, table, div, three, gap]
        : l <= 15 ? [three, gap, wide, div, mulAdd]
          : l <= 20 ? [three, wide, mulAdd, percent, gapMul, div]
            : l <= 25 ? [wide, mulAdd, percent, gapMul, twoByTwo, brackets]
              : [percent, twoByTwo, brackets, twoProducts, gapMul];
    return pick(kinds)();
  }

  Games.register({
    id: "math", cat: "math", name: "תרגילים", icon: "➕",
    desc: "פתרו תרגילי חשבון ובחרו את התשובה",
    how: "10 תרגילים. בחרו את התשובה הנכונה. בהתחלה חיבור וחיסור של מספרים גדולים, כפל וחילוק. בהמשך נעלם, אחוזים, סוגריים ותרגילים בכמה שלבים.",
    start(stage, level, api) {
      return runQuiz(stage, api, {
        rounds: 10, targetT: lerp(10, 18, level), unit: "תרגיל",
        make() {
          const q = gen(level);
          const mark = '<span class="qmark">?</span>';
          const html = q.pct ? `<div class="big-q">${q.pct[0]}% מתוך ${q.pct[1]} = ${mark}</div>`
            : `<div class="big-q" dir="ltr">${q.text.includes("?") ? q.text.replace("?", mark) : `${q.text} = ${mark}`}</div>`;
          // wrong answers usually end in the same digit, so the last digit alone does not give it away
          const deltas = q.ans >= 30 ? [10, -10, 20, -20, 10, -10, 2, -2, 30] : [1, -1, 2, -2, 3, -3, 10, 4];
          return {
            html,
            ans: q.ans, opts: numOptions(q.ans, 4, deltas),
            reveal: (el) => { el.querySelector(".qmark").textContent = q.ans; }
          };
        }
      });
    }
  });
})();
