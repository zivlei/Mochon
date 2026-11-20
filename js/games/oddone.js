/* ריכוז – מצאו את השונה. Levels: grid 3x3→6x6, pictures become more similar. Score = 65% accuracy + 35% speed */
(function () {
  const PAIRS = {
    1: [["🍎", "🍌"], ["🐱", "🐟"], ["⭐", "🌙"], ["🚗", "🏠"], ["🌻", "☕"], ["🎈", "🍇"], ["🐶", "🌳"]],
    2: [["🍎", "🍅"], ["🐱", "🐯"], ["🌻", "🌼"], ["🚗", "🚕"], ["🐶", "🐺"], ["🍋", "🍌"], ["🐝", "🐞"], ["🍇", "🫐"]],
    3: [["😀", "😃"], ["🙂", "😊"], ["😐", "😑"], ["🕐", "🕑"], ["🌲", "🌳"], ["🍎", "🍏"], ["🐕", "🐩"], ["🌖", "🌗"]]
  };
  const ROUNDS = 8;
  Games.register({
    id: "oddone", cat: "focus", name: "מצאו את השונה", icon: "🔍",
    desc: "מצאו את התמונה היחידה שאינה כמו האחרות",
    how: `${ROUNDS} סיבובים. בכל סיבוב כל התמונות זהות חוץ מאחת – לחצו עליה. ברמות גבוהות יש יותר תמונות והן דומות יותר.`,
    start(stage, level, api) {
      const cols = level <= 6 ? 3 : level <= 14 ? 4 : level <= 22 ? 5 : 6, n = cols * cols;
      const set = PAIRS[level <= 10 ? 1 : level <= 20 ? 2 : 3];
      const targetT = lerp(4, 9, level);
      const grid = document.createElement("div");
      grid.className = "grid"; stage.appendChild(grid);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let round = 0, wrong = 0, oddIdx, shown, lock = false;
      const times = [];
      api.msg("לחצו על התמונה השונה", "soft");

      function next() {
        if (round >= ROUNDS) return finish();
        round++; lock = false; api.status(`סיבוב ${round}/${ROUNDS}`);
        const pair = pick(set);
        const [main, odd] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
        oddIdx = rand(0, n - 1);
        grid.innerHTML = "";
        for (let i = 0; i < n; i++) {
          const b = document.createElement("button");
          b.className = "cell"; b.textContent = i === oddIdx ? odd : main; b.dataset.i = i;
          grid.appendChild(b);
        }
        shown = Date.now();
      }
      grid.addEventListener("click", (e) => {
        const b = e.target.closest(".cell"); if (!b || lock) return;
        if (Number(b.dataset.i) === oddIdx) {
          lock = true; times.push((Date.now() - shown) / 1000);
          b.classList.add("right"); api.sound.good(); api.msg(praise(), "good");
          later(next, 700);
        } else {
          wrong++; api.sound.bad(); api.msg("לא זו – חפשו שוב", "soft");
          b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
        }
      });
      function finish() {
        const acc = ROUNDS / (ROUNDS + wrong), at = avg(times);
        api.finish({
          score: Math.round(65 * acc + 35 * speedFactor(at, targetT) * acc),
          stats: [["טעויות", wrong], ["זמן ממוצע למציאה", at.toFixed(1) + " שניות"]]
        });
      }
      function layout() {
        const r = stage.getBoundingClientRect();
        const w = fitGrid(grid, n, r.width, r.height, 1, cols);
        grid.style.setProperty("--emoji", Math.round(w * 0.62) + "px");
      }
      layout(); api.onResize(layout); next();
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
