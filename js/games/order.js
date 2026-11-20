/* זיכרון – הסדר הנכון. Pictures appear one after another; then tap them in the same order.
   Levels: 3 → 8 pictures, each shown for less time; from level 21 extra pictures that were not shown are mixed in.
   Score = 85% pictures in the right place + 15% speed. */
(function () {
  const ROUNDS = 3;
  Games.register({
    id: "order", cat: "memory", name: "הסדר הנכון", icon: "🎞️",
    desc: "זכרו באיזה סדר הופיעו התמונות",
    how: `תמונות יופיעו אחת אחרי השנייה. זכרו את הסדר! אחר כך כולן יופיעו מעורבבות – געו בהן לפי הסדר שבו הופיעו. ${ROUNDS} סבבים. ברמות גבוהות יש יותר תמונות, הן מהירות יותר, ומרמה 21 מתערבבות גם תמונות שלא הופיעו.`,
    start(stage, level, api) {
      const k = Math.round(lerp(3, 8, level));
      const showMs = Math.round(lerp(1600, 800, level));
      const extra = level >= 27 ? 3 : level >= 24 ? 2 : level >= 21 ? 1 : 0;
      const T = timersKit();
      let round = 0, correct = 0, total = 0, fit = null;
      const times = [];

      function play() {
        round++; api.status(`סבב ${round}/${ROUNDS}`);
        const all = shuffle(ITEMS.slice()).slice(0, k + extra), seq = all.slice(0, k);
        total += k;
        api.msg("צפו בסדר", "soft");
        stage.innerHTML = `<div class="board"><div class="b-main"><div class="showpic"></div></div><div class="b-row"><span class="counter"></span></div></div>`;
        const sp = $(".showpic", stage), cnt = $(".counter", stage);
        let i = 0;
        const step = () => {
          if (i >= k) { sp.textContent = ""; return T.later(() => answer(all, seq), 400); }
          sp.textContent = seq[i].e; cnt.textContent = `${i + 1} מתוך ${k}`;
          sp.classList.remove("in"); void sp.offsetWidth; sp.classList.add("in");
          i++; T.later(() => { sp.textContent = ""; T.later(step, 250); }, showMs);
        };
        T.later(step, 500);
      }
      function answer(all, seq) {
        api.msg("געו בתמונות לפי הסדר", "soft");
        const mix = shuffle(all.slice());
        stage.innerHTML = `<div class="board">
            <div class="b-row seqrow">${seq.map(() => `<span class="slotpic"></span>`).join("")}</div>
            <div class="b-main"><div class="grid"></div></div></div>`;
        const grid = $(".grid", stage), slots = stage.querySelectorAll(".slotpic");
        grid.innerHTML = mix.map((it, j) => `<button class="cell pic" data-j="${j}">${it.e}</button>`).join("");
        fit = () => fitIn(grid, mix.length, 1); fit();
        let pos = 0, t0 = Date.now(), roundOk = 0;
        grid.onclick = (e) => {
          const b = e.target.closest(".cell"); if (!b || b.disabled || pos >= seq.length) return;
          const it = mix[Number(b.dataset.j)];
          const ok = it === seq[pos];
          slots[pos].textContent = it.e; slots[pos].classList.add(ok ? "ok" : "bad");
          b.disabled = true; b.classList.add(ok ? "right" : "wrong");
          if (ok) { correct++; roundOk++; api.sound.flip(); } else api.sound.bad();
          pos++;
          if (pos === seq.length) {
            times.push((Date.now() - t0) / 1000 / seq.length);
            if (roundOk === seq.length) { api.sound.good(); api.msg(praise(), "good"); }
            else { api.msg("הסדר הנכון: " + seq.map((x) => x.e).join(" "), "soft"); }
            T.later(round < ROUNDS ? play : finish, roundOk === seq.length ? 900 : 2600);
          }
        };
      }
      api.onResize(() => fit && fit());
      function finish() {
        const acc = correct / total, at = avg(times);
        api.finish({
          score: Math.round(85 * acc + 15 * speedFactor(at, 2) * acc),
          stats: [["במקום הנכון", `${correct} מתוך ${total}`], ["תמונות בכל סבב", k]]
        });
      }
      play();
      return { stop: T.clear };
    }
  });
})();
