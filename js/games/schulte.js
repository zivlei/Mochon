/* ריכוז – מספרים לפי הסדר (טבלת שולטה): score = 60% accuracy + 40% speed */
(function () {
  Games.register({
    id: "schulte", cat: "focus", name: "מספרים לפי הסדר", icon: "🔢",
    desc: "לחצו על המספרים מהקטן לגדול",
    how: "המספרים מפוזרים על הלוח. לחצו עליהם לפי הסדר: 1, 2, 3 וכן הלאה. הניקוד לפי הדיוק והמהירות.",
    start(stage, level, api) {
      const cols = [0, 3, 4, 5][level], n = cols * cols, perNum = [0, 3, 2.6, 2.3][level];
      const grid = document.createElement("div");
      grid.className = "grid"; stage.appendChild(grid);
      let nextNum = 1, wrong = 0;
      const t0 = Date.now();
      shuffle(Array.from({ length: n }, (_, i) => i + 1)).forEach((v) => {
        const b = document.createElement("button");
        b.className = "cell num"; b.textContent = v; b.dataset.v = v;
        grid.appendChild(b);
      });
      const upd = () => api.status(`הבא: ${nextNum}`);
      upd(); api.msg("התחילו מהמספר 1", "soft");

      grid.addEventListener("click", (e) => {
        const b = e.target.closest(".cell"); if (!b || b.classList.contains("right")) return;
        if (Number(b.dataset.v) === nextNum) {
          b.classList.add("right"); api.sound.flip(); nextNum++;
          if (nextNum > n) { api.sound.good(); api.msg("סיימתם!", "good"); setTimeout(finish, 600); }
          else { upd(); api.msg("", ""); }
        } else {
          wrong++; api.sound.bad(); api.msg(`חפשו את המספר ${nextNum}`, "soft");
          b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
        }
      });
      let finished = false;
      function finish() {
        if (finished) return; finished = true;
        const time = (Date.now() - t0) / 1000;
        const acc = n / (n + wrong);
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
