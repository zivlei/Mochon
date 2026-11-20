/* זיכרון – זוגות. Levels: 3→12 pairs, shorter look time. Score = finish bonus + accuracy (tries) + speed */
(function () {
  const SYMBOLS = ["🍎", "🌻", "🐱", "🏠", "☀️", "🚗", "🐟", "🎈", "🍇", "🌳", "🐶", "⭐", "🍌", "🦋", "☕", "🎵"];
  Games.register({
    id: "match", cat: "memory", name: "זוגות", icon: "🃏",
    desc: "מצאו זוגות של קלפים זהים",
    how: "הפכו שני קלפים בכל פעם. אם הם זהים – הם נשארים פתוחים. נסו לזכור איפה כל תמונה! ברמות גבוהות יש יותר קלפים והם נסגרים מהר יותר.",
    start(stage, level, api) {
      const pairs = Math.min(12, 3 + Math.floor((level - 1) / 3));
      const lookMs = Math.round(lerp(1800, 950, level));
      const deck = shuffle(shuffle(SYMBOLS.slice()).slice(0, pairs).flatMap((s) => [s, s]));
      const board = document.createElement("div");
      board.className = "grid"; stage.appendChild(board);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let first = null, lock = false, matched = 0, tries = 0;
      const t0 = Date.now();
      const upd = () => api.status(`זוגות: ${matched}/${pairs}`);
      upd(); api.msg("הפכו שני קלפים", "soft");

      deck.forEach((sym) => {
        const c = document.createElement("button");
        c.className = "card"; c.dataset.sym = sym; c.setAttribute("aria-label", "קלף סגור");
        c.innerHTML = '<div class="card-inner"><div class="face cback"></div><div class="face front">' + sym + "</div></div>";
        c.addEventListener("click", () => flip(c));
        board.appendChild(c);
      });

      function flip(c) {
        if (lock || c === first || c.classList.contains("flipped")) return;
        c.classList.add("flipped"); c.setAttribute("aria-label", c.dataset.sym); api.sound.flip();
        if (!first) { first = c; return; }
        const a = first, b = c; first = null; tries++; lock = true;
        if (a.dataset.sym === b.dataset.sym) {
          later(() => {
            a.classList.add("matched"); b.classList.add("matched");
            matched++; upd(); api.sound.good(); api.msg(praise(), "good"); lock = false;
            if (matched === pairs) later(done, 800);
          }, 350);
        } else {
          api.msg("לא זוג – ננסה שוב", "soft");
          later(() => { [a, b].forEach((x) => { x.classList.remove("flipped"); x.setAttribute("aria-label", "קלף סגור"); }); lock = false; }, lookMs);
        }
      }
      function done() {
        const time = (Date.now() - t0) / 1000;
        const q = clamp((pairs * 2.5 - tries) / (pairs * 1.5), 0, 1);
        api.finish({ score: Math.round(20 + 55 * q + 25 * speedFactor(time, pairs * lerp(7, 5, level))), stats: [["ניסיונות", tries], ["זוגות", pairs]] });
      }
      function layout() {
        const r = stage.getBoundingClientRect();
        const w = fitGrid(board, deck.length, r.width, r.height, 4 / 3);
        board.style.setProperty("--emoji", Math.round(w * 0.58) + "px");
      }
      layout(); api.onResize(layout);
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
