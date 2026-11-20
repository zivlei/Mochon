/* ריכוז – ספירה מהירה. Pictures flash for a moment – how many were there?
   Levels: 3 → 12 pictures, shown for less time; from level 16 count only one kind among others.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 10;
  const KINDS = ["⭐", "🍎", "🐟", "🌸", "⚽", "🎈", "🍋", "🐞"];
  Games.register({
    id: "quickcount", cat: "focus", name: "ספירה מהירה", icon: "⚡",
    desc: "כמה תמונות הבזיקו על המסך?",
    how: `תמונות יופיעו לרגע קצר ויעלמו. כמה היו? בחרו את המספר. ${ROUNDS} שאלות.<br>ברמות גבוהות יש יותר תמונות והן נעלמות מהר יותר. מרמה 16 סופרים רק סוג אחד – למשל רק את הכוכבים.`,
    start(stage, level, api) {
      const showMs = Math.round(lerp(3000, 900, level));
      const maxN = Math.round(lerp(4, 12, level)), minN = Math.max(2, maxN - 4);
      const mixed = level >= 16;
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: 3, accW: 80,
        make() {
          const kinds = shuffle(KINDS.slice());
          const target = kinds[0], cnt = rand(minN, maxN);
          const others = mixed ? rand(2, Math.round(lerp(3, 7, level))) : 0;
          const icons = shuffle([...Array(cnt).fill(target), ...Array.from({ length: others }, () => pick(kinds.slice(1, 3)))]);
          // scatter on a jittered grid so nothing overlaps
          const cells = icons.length, gc = Math.ceil(Math.sqrt(cells * 1.6)), gr = Math.ceil(cells / gc);
          const slots = shuffle([...Array(gc * gr).keys()]).slice(0, cells);
          const dots = icons.map((e, i) => {
            const s = slots[i], x = ((s % gc) + 0.2 + Math.random() * 0.6) / gc * 100, y = (Math.floor(s / gc) + 0.2 + Math.random() * 0.6) / gr * 100;
            return `<span style="left:${x}%;top:${y}%">${e}</span>`;
          }).join("");
          return {
            html: `<div class="flashbox" style="--n:${Math.max(gc, gr)}"><div class="flashdots" style="animation-delay:${showMs}ms">${dots}</div><div class="flashq">${mixed ? `כמה ${target} היו?` : "כמה היו?"}</div></div>`,
            ans: cnt, opts: shuffle(shuffle([cnt - 2, cnt - 1, cnt + 1, cnt + 2].filter((v) => v > 0)).slice(0, 3).concat(cnt)),
            prompt: mixed ? `ספרו רק את ה-${target}` : "ספרו מהר!"
          };
        }
      });
    }
  });
})();
