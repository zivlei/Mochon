/* קואורדינציה – מעקב בקו. Slide a finger along a winding road from the green dot to the flag without leaving it.
   Levels: wide gentle road → narrow road with more bends. Score = 55% staying on the road + 25% reaching the end + 20% speed. */
(function () {
  const ROUNDS = 3;
  Games.register({
    id: "trace", cat: "coord", name: "מעקב בקו", icon: "✍️",
    desc: "החליקו את האצבע לאורך הדרך",
    how: `שימו את האצבע על הנקודה הירוקה והחליקו לאורך הדרך עד הדגל 🏁, בלי לצאת מהדרך. אם הרמתם את האצבע – המשיכו מאיפה שעצרתם. ${ROUNDS} דרכים. ברמות גבוהות הדרך צרה יותר ומתפתלת יותר.`,
    start(stage, level, api) {
      const T = timersKit();
      const bends = Math.round(lerp(4, 8, level));
      const widthF = lerp(0.092, 0.0443, level);
      let round = 0, inSum = 0, reachSum = 0, times = [];
      function play() {
        round++; api.status(`דרך ${round}/${ROUNDS}`); api.msg("החליקו מהנקודה הירוקה אל הדגל", "soft");
        stage.innerHTML = `<div class="board"><div class="b-main trace"><svg class="tr-svg"></svg></div></div>`;
        const box = $(".trace", stage), svg = $(".tr-svg", stage);
        const W = box.clientWidth, H = box.clientHeight;
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
        const roadW = Math.max(26, Math.min(110, Math.min(W, H) * widthF * 1.6));
        const m = roadW * 0.75 + 12;
        // control points: from right to left, alternating up and down
        const pts = [];
        const horiz = W >= H * 0.8;
        for (let i = 0; i <= bends + 1; i++) {
          const f = i / (bends + 1);
          if (horiz) pts.push([W - m - f * (W - 2 * m), i === 0 || i === bends + 1 ? H / 2 + (Math.random() - 0.5) * H * 0.3 : m + Math.random() * (H - 2 * m)]);
          else pts.push([i === 0 || i === bends + 1 ? W / 2 + (Math.random() - 0.5) * W * 0.3 : m + Math.random() * (W - 2 * m), m + f * (H - 2 * m)]);
        }
        // smooth path through the points (Catmull-Rom → Bezier)
        let d = `M${pts[0][0]},${pts[0][1]}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
          d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
        }
        const end = pts[pts.length - 1];
        svg.innerHTML = `<path class="tr-road" d="${d}" stroke-width="${roadW}"/><path class="tr-mid" d="${d}"/><path class="tr-done" d="${d}" stroke-width="${roadW * 0.5}"/>
          <circle class="tr-start" cx="${pts[0][0]}" cy="${pts[0][1]}" r="${roadW * 0.6}"/><text class="tr-flag" x="${end[0]}" y="${end[1]}" font-size="${roadW * 1.1}">🏁</text>
          <circle class="tr-finger" r="${roadW * 0.35}" cx="${pts[0][0]}" cy="${pts[0][1]}" visibility="hidden"/>`;
        const path = $(".tr-mid", svg), done = $(".tr-done", svg), finger = $(".tr-finger", svg);
        const L = path.getTotalLength();
        const samples = Array.from({ length: 400 }, (_, i) => { const p = path.getPointAtLength((L * i) / 399); return [p.x, p.y]; });
        done.style.strokeDasharray = `${L} ${L}`; done.style.strokeDashoffset = L;
        let progress = 0, inside = 0, outside = 0, active = false, t0 = 0, over = false;
        const local = (e) => { const r = svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        function onMove(e) {
          if (!active || over) return;
          const [x, y] = local(e);
          finger.setAttribute("cx", x); finger.setAttribute("cy", y); finger.setAttribute("visibility", "visible");
          // nearest sample a little ahead of the current progress (so crossings of the road do not skip ahead)
          let bi = -1, bd = 1e9;
          const from = Math.max(0, progress - 10), to = Math.min(399, progress + 40);
          for (let i = from; i <= to; i++) { const dx = samples[i][0] - x, dy = samples[i][1] - y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; bi = i; } }
          const dist = Math.sqrt(bd);
          if (dist <= roadW / 2 + 4) { inside++; if (bi > progress) progress = bi; finger.classList.remove("off"); }
          else { outside++; finger.classList.add("off"); }
          done.style.strokeDashoffset = L * (1 - progress / 399);
          if (progress >= 392) finishRoad(true);
        }
        svg.addEventListener("pointerdown", (e) => {
          e.preventDefault(); if (over) return;
          const [x, y] = local(e);
          const at = samples[progress];
          if (Math.hypot(at[0] - x, at[1] - y) <= roadW * 0.9) { active = true; if (!t0) t0 = Date.now(); onMove(e); }
          else api.msg(progress ? "המשיכו מהמקום שבו עצרתם" : "התחילו מהנקודה הירוקה", "soft");
        });
        svg.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", () => (active = false));
        function finishRoad(reached) {
          if (over) return; over = true;
          const acc = inside + outside ? inside / (inside + outside) : 0;
          inSum += acc; reachSum += progress / 399;
          times.push(t0 ? (Date.now() - t0) / 1000 : 99);
          if (reached) { api.sound.good(); api.msg(praise(), "good"); }
          T.later(round < ROUNDS ? play : finish, 1000);
        }
        T.later(() => { if (!over) { api.msg("נגמר הזמן לדרך הזאת", "soft"); finishRoad(false); } }, Math.round(lerp(40000, 30000, level)));
      }
      function finish() {
        const acc = inSum / ROUNDS, reach = reachSum / ROUNDS, at = avg(times);
        api.finish({
          score: Math.round(100 * reach * (0.55 * acc + 0.25 + 0.2 * speedFactor(at, lerp(6, 9, level)))),
          stats: [["בתוך הדרך", Math.round(acc * 100) + "%"], ["הגעתם עד הסוף", Math.round(reach * 100) + "%"], ["זמן לדרך", at === null ? "—" : at.toFixed(1) + " שניות"]]
        });
      }
      T.later(play, 50);
      return { stop: T.clear };
    }
  });
})();
