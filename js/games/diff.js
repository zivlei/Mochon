/* ריכוז – מצאו את ההבדלים. Two boards of pictures, almost the same. Tap every picture that is different (on either board).
   Levels: 5x5 → 6x5 boards, 4 → 6 differences. Every change is a look-alike (🍎/🍏, 🐶/🐕).
   Score = 70% differences found (minus wrong taps) + 30% speed. */
(function () {
  const ROUNDS = 3;
  const PAIRS = [["🍎", "🍏"], ["🐶", "🐕"], ["🐱", "🐈"], ["🌹", "🌷"], ["🚗", "🚙"], ["🍊", "🍑"], ["🌕", "🌝"], ["⭐", "🌟"], ["🐭", "🐹"], ["🍋", "🍌"],
    ["🐢", "🐊"], ["🚌", "🚎"], ["☕", "🍵"], ["🎈", "🎀"], ["🐓", "🐔"], ["🍇", "🫐"], ["🌻", "🌼"], ["🐄", "🐂"], ["🦆", "🐥"], ["🍪", "🥯"], ["🧀", "🍰"], ["🌲", "🌳"]];
  Games.register({
    id: "diff", cat: "focus", name: "מצאו את ההבדלים", icon: "🔍",
    desc: "שני לוחות כמעט זהים – מה שונה?",
    how: `יש שני לוחות של תמונות, כמעט זהים. געו בכל תמונה ששונה בין הלוחות (אפשר בכל אחד מהלוחות). למטה רואים כמה הבדלים נשארו. ${ROUNDS} סבבים.<br>ברמות גבוהות הלוחות גדולים יותר, ויש יותר הבדלים. ההבדלים תמיד דומים מאוד (🍎 ו-🍏).`,
    start(stage, level, api) {
      const cols = level <= 8 ? 5 : 6;
      const rows = 5;
      const n = cols * rows;
      const nd = Math.round(lerp(4, 6, level));
      const T = timersKit();
      let round = 0, found = 0, total = 0, wrong = 0, fit = null, t0 = 0;
      const times = [];

      function play() {
        round++; api.status(`סבב ${round}/${ROUNDS}`);
        const pool = PAIRS.flat();
        const base = Array.from({ length: n }, () => pick(pool));
        const other = base.slice();
        const where = shuffle([...Array(n).keys()]).slice(0, nd);
        where.forEach((i) => (other[i] = PAIRS.find((p) => p.includes(base[i])).find((x) => x !== base[i])));
        total += nd;
        stage.innerHTML = `<div class="board"><div class="b-main diffwrap"><div class="grid d1"></div><div class="grid d2"></div></div>
          <div class="b-row"><span class="counter">נשארו <b>${nd}</b> הבדלים</span></div></div>`;
        const g1 = $(".d1", stage), g2 = $(".d2", stage), wrap = $(".diffwrap", stage), cnt = $(".counter b", stage);
        g1.innerHTML = base.map((e, i) => `<button class="cell pic" data-i="${i}">${e}</button>`).join("");
        g2.innerHTML = other.map((e, i) => `<button class="cell pic" data-i="${i}">${e}</button>`).join("");
        fit = () => {
          const W = wrap.clientWidth, H = wrap.clientHeight, side = W > H * 1.1;
          wrap.classList.toggle("side", side);
          const w = side ? (W - 24) / 2 : W, h = side ? H : (H - 16) / 2;
          fitGrid(g1, n, w, h, 1, cols); fitGrid(g2, n, w, h, 1, cols);
        };
        fit();
        api.msg(`מצאו ${nd} הבדלים`, "soft");
        let left = nd; t0 = Date.now();
        const onTap = (e) => {
          const b = e.target.closest(".cell"); if (!b || left === 0) return;
          const i = Number(b.dataset.i);
          if (where.includes(i)) {
            if (b.classList.contains("right")) return;
            g1.children[i].classList.add("right"); g2.children[i].classList.add("right");
            left--; found++; cnt.textContent = left; api.sound.good();
            if (left === 0) { times.push((Date.now() - t0) / 1000 / nd); api.msg(praise(), "good"); T.later(round < ROUNDS ? play : finish, 1000); }
          } else { wrong++; b.classList.add("wrong"); T.later(() => b.classList.remove("wrong"), 500); api.sound.bad(); }
        };
        g1.onclick = onTap; g2.onclick = onTap;
        // a gentle way out if someone is stuck: after a long time, the remaining differences are shown
        T.later(() => {
          if (left === 0) return;
          where.forEach((i) => { if (!g1.children[i].classList.contains("right")) { g1.children[i].classList.add("missed"); g2.children[i].classList.add("missed"); } });
          left = 0; api.msg("ההבדלים שנשארו מסומנים בכתום", "soft");
          T.later(round < ROUNDS ? play : finish, 2200);
        }, Math.round(nd * lerp(25000, 15000, level)));
      }
      api.onResize(() => fit && fit());
      function finish() {
        const acc = found / total, pen = Math.min(1, wrong / (total * 2)), at = avg(times);
        api.finish({
          score: Math.round(100 * acc * (1 - 0.5 * pen) * (0.7 + 0.3 * speedFactor(at, lerp(5, 7, level)))),
          stats: [["הבדלים שנמצאו", `${found} מתוך ${total}`], ["נגיעות שגויות", wrong], ["זמן להבדל", at === null ? "—" : at.toFixed(1) + " שניות"]]
        });
      }
      play();
      return { stop: T.clear };
    }
  });
})();
