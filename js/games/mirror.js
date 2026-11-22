/* קואורדינציה – מראה. Copy the coloured shape onto the empty board as its mirror image.
   Levels: 5x5 board with 8 squares → 6x6 with 15; some boards mirror upside down; from level 16 some mirror both ways.
   Score = 75% correct without mistakes + 25% speed. */
(function () {
  const ROUNDS = 4;
  Games.register({
    id: "mirror", cat: "coord", name: "מראה", icon: "🪞",
    desc: "ציירו את תמונת המראה של הצורה",
    how: `בלוח אחד יש צורה צבועה. צבעו בלוח הריק את תמונת המראה שלה – כאילו יש מראה על הקו שבין הלוחות. געו במשבצת כדי לצבוע. משבצת לא נכונה תהבהב באדום. ${ROUNDS} לוחות. ברמות גבוהות הלוח גדול יותר, ולפעמים המראה למטה. מרמה 16 יש גם מראה כפולה – הופכים גם לצדדים וגם למעלה־למטה.`,
    start(stage, level, api) {
      const n = level <= 14 || stage.clientHeight < 480 ? 5 : 6; // a small phone has no room for two 6x6 boards
      const k = Math.round(lerp(8, 15, level));
      const T = timersKit();
      let round = 0, right = 0, mistakes = 0, need = 0, times = [], fit = null;
      function play() {
        round++; api.status(`לוח ${round}/${ROUNDS}`);
        // mirror line between top and bottom boards: sometimes, and always when the boards would not fit side by side
        const narrow = stage.clientWidth < stage.clientHeight * 0.8;
        const vertical = narrow || Math.random() < 0.5;
        const both = level >= 16 && Math.random() < 0.5;
        const filled = new Set(shuffle([...Array(n * n).keys()]).slice(0, Math.min(k, n * n - 2)));
        const mirrorOf = (i) => { const r = Math.floor(i / n), c = i % n; return both ? (n - 1 - r) * n + (n - 1 - c) : vertical ? (n - 1 - r) * n + c : r * n + (n - 1 - c); };
        const target = new Set([...filled].map(mirrorOf));
        need += target.size;
        api.msg(both ? "מראה כפולה – גם לצדדים וגם למעלה־למטה" : vertical ? "המראה למטה – ציירו הפוך" : "ציירו את תמונת המראה", "soft");
        stage.innerHTML = `<div class="board"><div class="b-main mirwrap ${vertical ? "vert" : ""}"><div class="grid m-src"></div><div class="m-line"></div><div class="grid m-dst"></div></div>
          <div class="b-row"><span class="counter">נשארו <b>${target.size}</b></span></div></div>`;
        const src = $(".m-src", stage), dst = $(".m-dst", stage), wrap = $(".mirwrap", stage), cnt = $(".counter b", stage);
        src.innerHTML = [...Array(n * n).keys()].map((i) => `<div class="cell mcell ${filled.has(i) ? "on" : ""}"></div>`).join("");
        dst.innerHTML = [...Array(n * n).keys()].map((i) => `<button class="cell mcell" data-i="${i}"></button>`).join("");
        src.style.direction = dst.style.direction = "ltr";
        fit = () => {
          const W = wrap.clientWidth, H = wrap.clientHeight;
          const w = vertical ? W : (W - 20) / 2, h = vertical ? (H - 20) / 2 : H;
          fitGrid(src, n * n, w, h, 1, n); fitGrid(dst, n * n, w, h, 1, n);
        };
        fit();
        // the source board sits on the reading-start side (right) – mirror line in the middle
        let left = target.size, t0 = Date.now();
        dst.onclick = (e) => {
          const b = e.target.closest(".mcell"); if (!b || left === 0 || b.classList.contains("on")) return;
          const i = Number(b.dataset.i);
          if (target.has(i)) {
            b.classList.add("on"); left--; right++; cnt.textContent = left; api.sound.flip();
            if (!left) { times.push((Date.now() - t0) / 1000 / target.size); api.sound.good(); api.msg(praise(), "good"); T.later(round < ROUNDS ? play : finish, 1000); }
          } else { mistakes++; b.classList.add("wrong"); T.later(() => b.classList.remove("wrong"), 500); api.sound.bad(); }
        };
      }
      api.onResize(() => fit && fit());
      function finish() {
        const acc = need / (need + mistakes), at = avg(times);
        api.finish({
          score: Math.round(100 * acc * (0.75 + 0.25 * speedFactor(at, 2.2))),
          stats: [["משבצות", need], ["טעויות", mistakes], ["גודל הלוח", `${n}×${n}`]]
        });
      }
      play();
      return { stop: T.clear };
    }
  });
})();
