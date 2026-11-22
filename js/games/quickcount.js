/* ריכוז – ספירה מהירה. Pictures flash for a moment – how many were there?
   Levels: 5 → 14 pictures, shown for less time. Always count one kind among others.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 10;
  const KINDS = ["⭐", "🍎", "🐟", "🌸", "⚽", "🎈", "🍋", "🐞"];
  Games.register({
    id: "quickcount", cat: "focus", name: "ספירה מהירה", icon: "⚡",
    desc: "כמה תמונות הבזיקו על המסך?",
    how: `תמונות יופיעו לרגע קצר ויעלמו. כמה היו? בחרו את המספר. ${ROUNDS} שאלות.<br>ברמות גבוהות יש יותר תמונות והן נעלמות מהר יותר. סופרים רק סוג אחד – למשל רק את הכוכבים.`,
    start(stage, level, api) {
      const showMs = Math.round(lerp(2090, 875, level));
      const maxN = Math.round(lerp(9, 14, level)), minN = maxN - 4;
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: 3, accW: 80,
        make() {
          const kinds = shuffle(KINDS.slice());
          const target = kinds[0], cnt = rand(minN, maxN);
          const others = rand(3, Math.round(lerp(5, 8, level)));
          const icons = shuffle([...Array(cnt).fill(target), ...Array.from({ length: others }, () => pick(kinds.slice(1, 3)))]);
          // scatter on a jittered grid so nothing overlaps
          const cells = icons.length, gc = Math.ceil(Math.sqrt(cells * 1.6)), gr = Math.ceil(cells / gc);
          const slots = shuffle([...Array(gc * gr).keys()]).slice(0, cells);
          const dots = icons.map((e, i) => {
            const s = slots[i], x = ((s % gc) + 0.2 + Math.random() * 0.6) / gc * 100, y = (Math.floor(s / gc) + 0.2 + Math.random() * 0.6) / gr * 100;
            return `<span style="left:${x}%;top:${y}%">${e}</span>`;
          }).join("");
          const firstOpt = cnt - rand(0, 3); // four neighbours – the answer is equally likely to be any of them
          return {
            html: `<div class="flashbox" style="--n:${Math.max(gc, gr)}"><div class="flashdots" style="animation-delay:${showMs}ms">${dots}</div><div class="flashq">כמה ${target} היו?</div></div>`,
            ans: cnt, opts: shuffle([0, 1, 2, 3].map((k) => firstOpt + k)),
            prompt: `ספרו רק את ה-${target}`
          };
        }
      });
    }
  });
})();
