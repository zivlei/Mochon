/* זיכרון – איפה הוא היה? Pictures appear on a board, hide, then you point to where each one was.
   Levels: board 3x3 → 5x5, 2 → 7 pictures, less time to look. Score = 85% correct places + 15% speed. */
(function () {
  const ROUNDS = 3;
  Games.register({
    id: "places", cat: "memory", name: "איפה הוא היה?", icon: "📍",
    desc: "זכרו איפה כל תמונה הופיעה",
    how: `תמונות יופיעו על לוח. זכרו איפה כל אחת נמצאת! אחר כך הן יוסתרו, ולמטה תופיע תמונה – געו במשבצת שבה היא הייתה. ${ROUNDS} לוחות. ברמות גבוהות הלוח גדול יותר, יש יותר תמונות ופחות זמן.`,
    start(stage, level, api) {
      const side = level <= 7 ? 3 : level <= 17 ? 4 : 5;
      const k = Math.round(lerp(2, 7, level));
      const lookMs = Math.round(k * lerp(2200, 1100, level) + 800);
      const T = timersKit();
      let round = 0, correct = 0, total = 0, fit = null;
      const times = [];

      function board() {
        round++; api.status(`לוח ${round}/${ROUNDS}`);
        const cells = shuffle([...Array(side * side).keys()]).slice(0, k);
        const pics = shuffle(ITEMS.slice()).slice(0, k);
        const at = {}; cells.forEach((c, i) => (at[c] = pics[i]));
        stage.innerHTML = `<div class="board">
            <div class="b-main"><div class="grid"></div></div>
            <div class="b-row ask"><div class="timebar small grow"><i></i></div></div></div>`;
        const grid = $(".grid", stage), ask = $(".ask", stage);
        grid.innerHTML = [...Array(side * side).keys()].map((c) => `<button class="cell pic" data-c="${c}">${at[c] ? at[c].e : ""}</button>`).join("");
        fit = () => fitIn(grid, side * side, 1, side); fit();
        api.msg("זכרו איפה כל תמונה", "soft");
        runBar($(".timebar i", stage), lookMs);
        T.later(() => {
          grid.querySelectorAll(".cell").forEach((b) => { b.textContent = ""; b.classList.add("hidden"); });
          let order = shuffle(cells.slice()), idx = 0, shown = 0, lock = false;
          const q = () => {
            const it = at[order[idx]];
            ask.innerHTML = `<div class="askpic"><span>איפה היה</span><b>${it.e}</b><span>?</span></div>`;
            api.msg(`פריט ${idx + 1} מתוך ${k}`, "soft"); shown = Date.now(); lock = false;
          };
          grid.onclick = (e) => {
            const b = e.target.closest(".cell"); if (!b || lock || b.classList.contains("shown")) return;
            lock = true; total++;
            const want = order[idx], c = Number(b.dataset.c), rightB = grid.querySelector(`[data-c="${want}"]`);
            rightB.textContent = at[want].e; rightB.classList.add("shown");
            if (c === want) { correct++; times.push((Date.now() - shown) / 1000); rightB.classList.add("right"); api.sound.good(); }
            else { b.classList.add("wrong"); T.later(() => b.classList.remove("wrong"), 600); api.sound.bad(); }
            idx++;
            T.later(() => (idx < k ? q() : round < ROUNDS ? board() : finish()), c === want ? 600 : 1300);
          };
          q();
        }, lookMs);
      }
      api.onResize(() => fit && fit());
      function finish() {
        const acc = correct / total, at = avg(times);
        api.finish({
          score: Math.round(85 * acc + 15 * speedFactor(at, 2.5) * acc),
          stats: [["מקומות נכונים", `${correct} מתוך ${total}`], ["זמן ממוצע", at === null ? "—" : at.toFixed(1) + " שניות"], ["גודל הלוח", `${side}×${side}`]]
        });
      }
      board();
      return { stop: T.clear };
    }
  });
})();
