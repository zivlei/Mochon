/* היגיון – מה הקטע? A row of coloured shapes repeats a pattern – which comes next?
   Levels: units of 4–5 → from level 10 shape and colour change on separate cycles → from level 20 with units of 4.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 10;
  const SH = { circle: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"], square: ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"], heart: ["❤️", "🧡", "💛", "💚", "💙", "💜"] };
  const UNITS = { short: [[0, 1, 2], [0, 0, 1], [0, 1, 1]], four: [[0, 1, 0, 2], [0, 1, 2, 2], [0, 0, 1, 2], [0, 1, 2, 1]], five: [[0, 1, 1, 2, 2], [0, 1, 2, 3, 4], [0, 1, 0, 2, 2]] };
  /** everything that could come next: one answer for each cycle length the row agrees with */
  const continuations = (seq) => {
    const next = new Set();
    for (let p = 1; p < seq.length; p++) if (seq.every((x, k) => k < p || x === seq[k - p])) next.add(seq[seq.length - p]);
    return next;
  };
  Games.register({
    id: "pattern", cat: "logic", name: "מה הקטע?", icon: "🔷",
    desc: "מצאו את הקטע שחוזר והשלימו את מה שחסר",
    how: `מופיעה שורה של צורות צבעוניות, ובה קטע שחוזר שוב ושוב. מצאו את הקטע בשורה והשלימו מה חסר במקום סימן השאלה, בסוף השורה. קוראים משמאל לימין. ${ROUNDS} שאלות.<br>ברמות גבוהות הקטע ארוך יותר, ומרמה 10 הצורה והצבע מתחלפים כל אחד בקצב משלו.`,
    start(stage, level, api) {
      const dual = level >= 10, longDual = level >= 20;
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(5, 10, level), accW: 80, optClass: "emo",
        make() {
          const shapes = shuffle(Object.keys(SH)), cols = shuffle([0, 1, 2, 3, 4, 5]);
          // Phone: 6 places (5 shapes + "?"), so only units of up to 4 – the row has to show where the unit starts again
          const phone = (stage.clientWidth || 400) < 600, maxP = phone ? 4 : Infinity;
          let len = Math.round(lerp(7, 9, level)), item, P;
          if (!dual) {
            const unit = pick((level <= 4 ? UNITS.four : UNITS.four.concat(UNITS.five)).filter((u) => u.length <= maxP));
            const shape = shapes[0];
            P = unit.length; len = phone ? 5 : Math.max(len, P + 2);
            item = (k) => SH[shape][cols[unit[k % P]]];
          } else {
            const cu = pick(longDual ? UNITS.four : UNITS.short);
            const su = pick((longDual ? [[0, 1], [0, 0, 1, 1]] : [[0, 1], [0, 0, 1], [0, 1, 2]]).filter((u) => !phone || cu.length % u.length === 0));
            P = cu.length % su.length === 0 ? cu.length : cu.length * su.length; // full cycle (lengths 3 with 2/3, or 4 with 2/4)
            item = (k) => SH[shapes[su[k % su.length]]][cols[cu[k % cu.length]]];
            len = phone ? 5 : Math.max(Math.min(len, 10), P + 1);
          }
          // the missing shape is always the last one
          // start at a point in the unit where only one continuation is possible (🔴🔴🟢🔴🔴 could go on with 🟢 or 🔴)
          const rows = Array.from({ length: P }, (_, from) => Array.from({ length: len + 1 }, (_, k) => item(from + k)));
          const row = pick(rows.filter((r) => continuations(r.slice(0, len)).size === 1));
          const seq = row.slice(0, len), ans = row[len];
          // wrong options: other mixes of the shapes and colours in this very row, so every option looks plausible
          const at = (x) => { const [s, a] = Object.entries(SH).find(([, list]) => list.includes(x)); return [s, a.indexOf(x)]; };
          const inRow = seq.map(at);
          const mixes = new Set(inRow.flatMap(([s]) => inRow.map(([, c]) => SH[s][c])));
          mixes.delete(ans);
          const opts = shuffle([...mixes]).slice(0, 3);
          const sameShape = SH[at(ans)[0]];
          while (opts.length < 3) { const x = pick(sameShape); if (x !== ans && !opts.includes(x)) opts.push(x); }
          const html = `<div class="seq pat" style="--n:${len + 1}">${seq.map((x) => `<span>${x}</span>`).join("")}<span class="qmark">?</span></div>`;
          return { html, ans, opts: shuffle([ans, ...opts]), prompt: "מה חסר במקום סימן השאלה?" };
        }
      });
    }
  });
})();
