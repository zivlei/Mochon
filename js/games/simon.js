/* זיכרון – רצף. Levels: target 3→12, faster playback, 6 buttons from level 16. Score = longest sequence vs target */
(function () {
  const PADS = [
    { e: "☀️", c: "#f2c230", f: 392, n: "שמש" },
    { e: "🍀", c: "#3aa35b", f: 330, n: "תלתן" },
    { e: "💧", c: "#2f7fb5", f: 262, n: "טיפה" },
    { e: "❤️", c: "#d64545", f: 523, n: "לב" },
    { e: "🍇", c: "#8e5bc4", f: 440, n: "ענבים" },
    { e: "🍊", c: "#ee8a2a", f: 294, n: "תפוז" }
  ];
  Games.register({
    id: "simon", cat: "memory", name: "רצף", icon: "🔁",
    desc: "זכרו את סדר ההדלקה וחזרו עליו",
    how: "צפו בכפתורים שנדלקים לפי הסדר, ואז לחצו עליהם באותו הסדר. בכל שלב הרצף מתארך באחד. מותר לטעות פעם אחת. מרמה 16 יש 6 כפתורים.",
    start(stage, level, api) {
      const target = 3 + Math.floor((level - 1) / 3);
      const startLen = Math.max(2, target - 5);
      const speed = Math.round(lerp(1050, 520, level));
      const nPads = level >= 16 ? 6 : 4;
      const grid = document.createElement("div");
      grid.className = "grid"; stage.appendChild(grid);
      const pads = PADS.slice(0, nPads).map((p, k) => {
        const b = document.createElement("button");
        b.className = "pad"; b.style.setProperty("--pc", p.c); b.textContent = p.e; b.setAttribute("aria-label", p.n);
        b.addEventListener("click", () => press(k));
        grid.appendChild(b); return b;
      });
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      const seq = []; let pos = 0, accepting = false, lives = 2, best = 0, mistakes = 0;
      for (let i = 0; i < startLen; i++) seq.push(rand(0, nPads - 1));

      function light(k, dur) {
        pads[k].classList.add("lit"); api.sound.tone(PADS[k].f, Math.min(0.5, dur / 1000));
        later(() => pads[k].classList.remove("lit"), dur);
      }
      function play() {
        accepting = false; grid.classList.add("watching");
        api.status(`אורך: ${seq.length} | מטרה: ${target}`);
        api.msg("צפו ברצף...", "soft");
        let i = 0;
        const step = () => {
          if (i >= seq.length) { later(() => { accepting = true; pos = 0; grid.classList.remove("watching"); api.msg("עכשיו תורכם!", "good"); }, 300); return; }
          light(seq[i], speed * 0.7); i++; later(step, speed);
        };
        later(step, 800);
      }
      function press(k) {
        if (!accepting) return;
        light(k, 280);
        if (k === seq[pos]) {
          pos++;
          if (pos === seq.length) {
            accepting = false; best = seq.length;
            if (best >= target) { api.msg("השלמתם את כל הרצף!", "good"); later(finish, 900); }
            else { api.msg(praise(), "good"); seq.push(rand(0, nPads - 1)); later(play, 1100); }
          }
        } else {
          accepting = false; mistakes++; lives--; api.sound.bad();
          if (lives <= 0) { api.msg("הרצף הסתיים", "soft"); later(finish, 1300); }
          else { api.msg("לא נורא – נראה שוב את אותו הרצף", "soft"); later(play, 1600); }
        }
      }
      function finish() {
        let score = Math.round((100 * best) / target);
        if (best >= target) score -= 10 * mistakes;
        api.finish({ score: clamp(score, 0, 100), stats: [["הרצף הארוך ביותר", best], ["מטרה", target], ["טעויות", mistakes]] });
      }
      function layout() {
        const r = stage.getBoundingClientRect();
        const w = fitGrid(grid, nPads, r.width, r.height, 1, nPads === 4 ? 2 : [2, 3]);
        grid.style.setProperty("--emoji", Math.round(w * 0.45) + "px");
      }
      layout(); api.onResize(layout); play();
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
