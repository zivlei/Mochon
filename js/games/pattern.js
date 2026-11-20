/* היגיון – מה ממשיך? A row of coloured shapes repeats a pattern – which comes next?
   Levels: AB → ABC, AAB, ABB → longer units → from level 21 shape and colour change on separate cycles.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 10;
  const SH = { circle: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"], square: ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"], heart: ["❤️", "🧡", "💛", "💚", "💙", "💜"] };
  const UNITS = [[[0, 1]], [[0, 1, 2], [0, 0, 1], [0, 1, 1]], [[0, 1, 2, 3], [0, 0, 1, 1], [0, 1, 0, 2], [0, 1, 2, 2]], [[0, 0, 1, 2], [0, 1, 1, 2, 2], [0, 1, 2, 1], [0, 1, 2, 3, 4]]];
  Games.register({
    id: "pattern", cat: "logic", name: "מה ממשיך?", icon: "🔷",
    desc: "גלו את החוקיות ובחרו מה בא אחר כך",
    how: `מופיעה שורה של צורות צבעוניות שחוזרות לפי חוקיות. מה בא במקום סימן השאלה? ${ROUNDS} שאלות.<br>ברמות גבוהות החוקיות ארוכה יותר, ומרמה 21 הצורה והצבע מתחלפים כל אחד בקצב משלו.`,
    start(stage, level, api) {
      const tier = level <= 5 ? 0 : level <= 12 ? 1 : level <= 20 ? 2 : 3;
      const dual = level >= 21;
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(5, 10, level), accW: 80, optClass: "emo",
        make() {
          const shapes = shuffle(Object.keys(SH)), cols = shuffle([0, 1, 2, 3, 4, 5]);
          let seq = [], ans, len = Math.round(lerp(6, 9, level));
          const unit = pick(UNITS[Math.min(tier, 2 + (dual ? 0 : 1))]);
          if (!dual) {
            len = Math.max(len, unit.length + 3);
            const shape = shapes[0];
            const item = (k) => SH[shape][cols[unit[k % unit.length]]];
            for (let k = 0; k < len; k++) seq.push(item(k));
            ans = item(len);
          } else {
            const cu = pick(UNITS[1]), su = pick([[0, 1], [0, 0, 1], [0, 1, 2]]);
            const item = (k) => SH[shapes[su[k % su.length]]][cols[cu[k % cu.length]]];
            len = Math.max(len, cu.length * su.length + 1);
            len = Math.min(len, 10);
            for (let k = 0; k < len; k++) seq.push(item(k));
            ans = item(len);
          }
          // wrong options: same colour other shape, same shape other colour, and one more
          const wrong = new Set();
          const allItems = Object.values(SH).flat();
          const [ansShape] = Object.entries(SH).find(([, a]) => a.includes(ans));
          const ci = SH[ansShape].indexOf(ans);
          seq.forEach((x) => x !== ans && wrong.add(x));
          Object.keys(SH).forEach((s) => s !== ansShape && wrong.add(SH[s][ci]));
          let opts = shuffle([...wrong]).slice(0, 3);
          while (opts.length < 3) { const x = pick(allItems); if (x !== ans && !opts.includes(x)) opts.push(x); }
          return { html: `<div class="seq pat">${seq.map((x) => `<span>${x}</span>`).join("")}<span class="qmark">?</span></div>`, ans, opts: shuffle([ans, ...opts]), prompt: "מה בא במקום סימן השאלה?" };
        }
      });
    }
  });
})();
