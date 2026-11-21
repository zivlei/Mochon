/* היגיון – מה הקטע? A row of coloured shapes repeats a pattern – which comes next?
   Levels: AB → ABC, AAB, ABB → longer units → from level 21 shape and colour change on separate cycles.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 10;
  const SH = { circle: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"], square: ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"], heart: ["❤️", "🧡", "💛", "💚", "💙", "💜"] };
  const UNITS = [[[0, 1]], [[0, 1, 2], [0, 0, 1], [0, 1, 1]], [[0, 1, 2, 3], [0, 0, 1, 1], [0, 1, 0, 2], [0, 1, 2, 2]], [[0, 0, 1, 2], [0, 1, 1, 2, 2], [0, 1, 2, 1], [0, 1, 2, 3, 4]]];
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
          // one row only: on a narrow phone show fewer shapes so they stay big
          const fitN = Math.max(7, Math.floor((stage.clientWidth || 400) / 40)) - 1;
          let len = Math.min(Math.round(lerp(6, 9, level)), fitN), item, P;
          if (!dual) {
            const unit = pick(UNITS[Math.min(tier, 3)]);
            const shape = shapes[0];
            P = unit.length; len = Math.max(len, P + 2);
            item = (k) => SH[shape][cols[unit[k % P]]];
          } else {
            const cu = pick(UNITS[1]), su = pick([[0, 1], [0, 0, 1], [0, 1, 2]]);
            P = cu.length % su.length === 0 ? cu.length : cu.length * su.length; // full cycle (both lengths are 2 or 3)
            item = (k) => SH[shapes[su[k % su.length]]][cols[cu[k % cu.length]]];
            len = Math.max(Math.min(len, 10), P + 1);
          }
          // the missing shape is always the last one
          const seq = Array.from({ length: len }, (_, k) => item(k)), ans = item(len);
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
