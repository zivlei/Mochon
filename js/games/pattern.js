/* היגיון – מה הקטע? A row of coloured shapes repeats a pattern – which comes next?
   Levels: AB → ABC, AAB, ABB → longer units → from level 21 shape and colour change on separate cycles.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 10;
  const SH = { circle: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"], square: ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"], heart: ["❤️", "🧡", "💛", "💚", "💙", "💜"] };
  const UNITS = [[[0, 1]], [[0, 1, 2], [0, 0, 1], [0, 1, 1]], [[0, 1, 2, 3], [0, 0, 1, 1], [0, 1, 0, 2], [0, 1, 2, 2]], [[0, 0, 1, 2], [0, 1, 1, 2, 2], [0, 1, 2, 1], [0, 1, 2, 3, 4]]];
  /** everything that could come next: one answer for each cycle length the row agrees with */
  const continuations = (seq) => {
    const next = new Set();
    for (let p = 1; p < seq.length; p++) if (seq.every((x, k) => k < p || x === seq[k - p])) next.add(seq[seq.length - p]);
    return next;
  };
  Games.register({
    id: "pattern", cat: "logic", name: "מה הקטע?", icon: "🔷",
    desc: "מצאו את הקטע שחוזר והשלימו את מה שחסר",
    how: `מופיעה שורה של צורות צבעוניות, ובה קטע שחוזר שוב ושוב. מצאו את הקטע בשורה והשלימו מה חסר במקום סימן השאלה, בסוף השורה. קוראים משמאל לימין. ${ROUNDS} שאלות.<br>ברמות גבוהות הקטע ארוך יותר, ומרמה 21 הצורה והצבע מתחלפים כל אחד בקצב משלו.`,
    start(stage, level, api) {
      const tier = level <= 5 ? 0 : level <= 12 ? 1 : level <= 20 ? 2 : 3;
      const dual = level >= 21;
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(5, 10, level), accW: 80, optClass: "emo",
        make() {
          const shapes = shuffle(Object.keys(SH)), cols = shuffle([0, 1, 2, 3, 4, 5]);
          // Phone: 6 places (5 shapes + "?"), so only units of up to 4 – the row has to show where the unit starts again
          const phone = (stage.clientWidth || 400) < 600, maxP = phone ? 4 : Infinity;
          let len = Math.round(lerp(6, 9, level)), item, P;
          if (!dual) {
            const unit = pick(UNITS[Math.min(tier, 3)].filter((u) => u.length <= maxP));
            const shape = shapes[0];
            P = unit.length; len = phone ? 5 : Math.max(len, P + 2);
            item = (k) => SH[shape][cols[unit[k % P]]];
          } else {
            const cu = pick(UNITS[1]), su = pick([[0, 1], [0, 0, 1], [0, 1, 2]].filter((u) => !phone || u.length === cu.length));
            P = cu.length % su.length === 0 ? cu.length : cu.length * su.length; // full cycle (both lengths are 2 or 3)
            item = (k) => SH[shapes[su[k % su.length]]][cols[cu[k % cu.length]]];
            len = phone ? 5 : Math.max(Math.min(len, 10), P + 1);
          }
          // the missing shape is always the last one
          // start at a point in the unit where only one continuation is possible (🔴🔴🟢🔴🔴 could go on with 🟢 or 🔴)
          const rows = Array.from({ length: P }, (_, from) => Array.from({ length: len + 1 }, (_, k) => item(from + k)));
          const row = pick(rows.filter((r) => continuations(r.slice(0, len)).size === 1));
          const seq = row.slice(0, len), ans = row[len];
          // wrong options: same colour other shape, same shape other colour, and one more
          const wrong = new Set();
          const allItems = Object.values(SH).flat();
          const [ansShape] = Object.entries(SH).find(([, a]) => a.includes(ans));
          const ci = SH[ansShape].indexOf(ans);
          seq.forEach((x) => x !== ans && wrong.add(x));
          Object.keys(SH).forEach((s) => s !== ansShape && wrong.add(SH[s][ci]));
          let opts = shuffle([...wrong]).slice(0, 3);
          while (opts.length < 3) { const x = pick(allItems); if (x !== ans && !opts.includes(x)) opts.push(x); }
          const html = `<div class="seq pat" style="--n:${len + 1}">${seq.map((x) => `<span>${x}</span>`).join("")}<span class="qmark">?</span></div>`;
          return { html, ans, opts: shuffle([ans, ...opts]), prompt: "מה חסר במקום סימן השאלה?" };
        }
      });
    }
  });
})();
