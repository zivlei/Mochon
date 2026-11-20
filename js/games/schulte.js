/* ריכוז – מספרים לפי הסדר (טבלת שולטה). Levels: 3x3→6x6, tighter time target. Score = 60% accuracy + 40% speed */
(function () {
  Games.register({
    id: "schulte", cat: "focus", name: "מספרים לפי הסדר", icon: "🔢",
    desc: "לחצו על המספרים מהקטן לגדול",
    how: "המספרים מפוזרים על הלוח. לחצו עליהם לפי הסדר: 1, 2, 3 וכן הלאה. ברמות גבוהות יש יותר מספרים, ומרמה 21 הם גם בצבעים שונים כדי לבלבל.",
    start(stage, level, api) {
      const cols = level <= 5 ? 3 : level <= 12 ? 4 : level <= 20 ? 5 : 6, n = cols * cols;
      const perNum = lerp(3.2, 1.7, level);
      const colors = ["#1d2733", "#c0392b", "#1f5f8b", "#2e8b57", "#7b4fb5", "#c25e0f"];
      const grid = document.createElement("div");
      grid.className = "grid"; stage.appendChild(grid);
      let nextNum = 1, wrong = 0, finished = false;
      const t0 = Date.now();
      shuffle(Array.from({ length: n }, (_, i) => i + 1)).forEach((v) => {
        const b = document.createElement("button");
        b.className = "cell num"; b.textContent = v; b.dataset.v = v;
        if (level >= 21) b.style.color = pick(colors);
        grid.appendChild(b);
      });
      const upd = () => api.status(`הבא: ${nextNum}`);
      upd(); api.msg("התחילו מהמספר 1", "soft");

      grid.addEventListener("click", (e) => {
        const b = e.target.closest(".cell"); if (!b || b.classList.contains("right") || finished) return;
        if (Number(b.dataset.v) === nextNum) {
          b.classList.add("right"); api.sound.flip(); nextNum++;
          if (nextNum > n) { api.sound.good(); api.msg("סיימתם!", "good"); setTimeout(finish, 600); }
          else { upd(); api.msg("", ""); }
        } else {
          wrong++; api.sound.bad(); api.msg(`חפשו את המספר ${nextNum}`, "soft");
          b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
        }
      });
      function finish() {
        if (finished) return; finished = true;
        const time = (Date.now() - t0) / 1000, acc = n / (n + wrong);
        api.finish({ score: Math.round(60 * acc + 40 * speedFactor(time, n * perNum) * acc), stats: [["טעויות", wrong], ["מספרים", n]] });
      }
      function layout() {
        const r = stage.getBoundingClientRect();
        const w = fitGrid(grid, n, r.width, r.height, 1, cols);
        grid.style.setProperty("--emoji", Math.round(w * 0.42) + "px");
      }
      layout(); api.onResize(layout);
      return { stop() { finished = true; } };
    }
  });
})();
