/* היגיון – מבוך. Lead the ball from start to the flag. Tap the next square or slide a finger along the path.
   Levels: maze 4x4 → 11x11. Score = 60% short route (few dead ends) + 40% speed. */
(function () {
  const ROUNDS = 2;
  function makeMaze(n) {
    const cells = Array.from({ length: n * n }, () => ({ t: 1, r: 1, b: 1, l: 1, seen: false }));
    const stack = [0]; cells[0].seen = true;
    while (stack.length) {
      const c = stack[stack.length - 1], x = c % n, y = Math.floor(c / n);
      const nb = [];
      if (y > 0 && !cells[c - n].seen) nb.push([c - n, "t", "b"]);
      if (x < n - 1 && !cells[c + 1].seen) nb.push([c + 1, "r", "l"]);
      if (y < n - 1 && !cells[c + n].seen) nb.push([c + n, "b", "t"]);
      if (x > 0 && !cells[c - 1].seen) nb.push([c - 1, "l", "r"]);
      if (!nb.length) { stack.pop(); continue; }
      const [d, w1, w2] = pick(nb);
      cells[c][w1] = 0; cells[d][w2] = 0; cells[d].seen = true; stack.push(d);
    }
    return cells;
  }
  function shortest(cells, n, from, to) {
    const dist = new Array(n * n).fill(-1), q = [from]; dist[from] = 0;
    while (q.length) {
      const c = q.shift();
      for (const [d, w] of [[c - n, "t"], [c + 1, "r"], [c + n, "b"], [c - 1, "l"]]) if (!cells[c][w] && dist[d] < 0) { dist[d] = dist[c] + 1; q.push(d); }
    }
    return dist[to];
  }
  Games.register({
    id: "maze", cat: "logic", name: "מבוך", icon: "🌀",
    desc: "הובילו את הכדור אל הדגל",
    how: `הובילו את הכדור 🔵 אל הדגל 🏁. געו במשבצת שליד הכדור כדי להזיז אותו, או החליקו את האצבע לאורך השביל. אי אפשר לעבור דרך קירות. ${ROUNDS} מבוכים. ככל שתגיעו בדרך קצרה ומהירה יותר – הציון גבוה יותר. ברמות גבוהות המבוך גדול יותר.`,
    start(stage, level, api) {
      const n = Math.round(lerp(4, 11, level));
      const T = timersKit();
      let round = 0, effSum = 0, times = [], fit = null;
      function play() {
        round++; api.status(`מבוך ${round}/${ROUNDS}`); api.msg("הובילו את הכדור אל הדגל", "soft");
        const cells = makeMaze(n), start = n - 1, goal = n * (n - 1);    // top-right → bottom-left (reading direction)
        const best = shortest(cells, n, start, goal);
        stage.innerHTML = `<div class="board"><div class="b-main"><div class="mz" style="--n:${n}"></div></div></div>`;
        const mz = $(".mz", stage);
        mz.innerHTML = cells.map((c, i) => `<div class="mc${c.t ? " wt" : ""}${c.r ? " wr" : ""}${c.b ? " wb" : ""}${c.l ? " wl" : ""}${i === goal ? " goal" : ""}" data-i="${i}"></div>`).join("");
        fit = () => { const p = mz.parentElement; const s = Math.floor(Math.min(p.clientWidth, p.clientHeight) / n) * n; mz.style.width = mz.style.height = s + "px"; };
        fit();
        let pos = start, moves = 0, done = false, t0 = 0;
        const el = (i) => mz.children[i];
        const draw = () => { mz.querySelectorAll(".ball").forEach((x) => x.classList.remove("ball")); el(pos).classList.add("ball", "trail"); };
        draw();
        const canGo = (a, b) => (b === a - n && !cells[a].t) || (b === a + n && !cells[a].b) || (b === a + 1 && a % n < n - 1 && !cells[a].r) || (b === a - 1 && a % n > 0 && !cells[a].l);
        function tryMove(i) {
          if (done || i === pos) return;
          if (!canGo(pos, i)) return;
          if (!t0) t0 = Date.now();
          pos = i; moves++; api.sound.flip(); draw();
          if (pos === goal) {
            done = true; const t = (Date.now() - t0) / 1000; times.push(t / best);
            effSum += Math.min(1, best / moves); api.sound.good(); api.msg(praise(), "good");
            T.later(round < ROUNDS ? play : finish, 1100);
          }
        }
        let dragging = false;
        const cellAt = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest && t.closest(".mc"); };
        mz.addEventListener("pointerdown", (e) => { e.preventDefault(); dragging = true; const c = cellAt(e); if (c) tryMove(Number(c.dataset.i)); });
        mz.addEventListener("pointermove", (e) => { if (!dragging) return; const c = cellAt(e); if (c) tryMove(Number(c.dataset.i)); });
        window.addEventListener("pointerup", () => (dragging = false));
      }
      api.onResize(() => fit && fit());
      function finish() {
        const eff = effSum / ROUNDS, at = avg(times);
        api.finish({
          score: Math.round(100 * eff * (0.6 + 0.4 * speedFactor(at, 0.9))),
          stats: [["יעילות הדרך", Math.round(eff * 100) + "%"], ["גודל המבוך", `${n}×${n}`]]
        });
      }
      play();
      return { stop: T.clear };
    }
  });
})();
