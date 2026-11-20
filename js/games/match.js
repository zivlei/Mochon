/* זיכרון – זוגות: score = finishing bonus + accuracy (tries vs pairs) + speed */
(function () {
  const SYMBOLS = ["🍎", "🌻", "🐱", "🏠", "☀️", "🚗", "🐟", "🎈", "🍇", "🌳", "🐶", "⭐", "🍌", "🦋", "☕", "🎵"];
  Games.register({
    id: "match", cat: "memory", name: "זוגות", icon: "🃏",
    desc: "מצאו זוגות של קלפים זהים",
    how: "הפכו שני קלפים בכל פעם. אם הם זהים – הם נשארים פתוחים. נסו לזכור איפה כל תמונה! הניקוד לפי מספר הניסיונות והזמן.",
    start(stage, level, api) {
      const pairs = [0, 6, 8, 10][level];
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
        c.innerHTML = '<div class="card-inner"><div class="face back"></div><div class="face front">' + sym + "</div></div>";
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
          later(() => { [a, b].forEach((x) => { x.classList.remove("flipped"); x.setAttribute("aria-label", "קלף סגור"); }); lock = false; }, 1600);
        }
      }
      function done() {
        const time = (Date.now() - t0) / 1000;
        const q = clamp((pairs * 2.5 - tries) / (pairs * 1.5), 0, 1);
        const sp = speedFactor(time, pairs * 7);
        api.finish({ score: Math.round(20 + 55 * q + 25 * sp), stats: [["ניסיונות", tries], ["זוגות", pairs]] });
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
