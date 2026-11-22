/* זיכרון – רשימת קניות. Study a shopping list, then pick its items from a shelf.
   Levels: 6 → 11 items, bigger shelf, less study time. Words only, and both rounds use the same shelf.
   Score = 80% found items (minus wrong picks) + 20% speed. */
(function () {
  const ROUNDS = 2;
  Games.register({
    id: "shopping", cat: "memory", name: "רשימת קניות", icon: "🛒",
    desc: "זכרו את הרשימה ומצאו במדף",
    how: `תופיע רשימת קניות – זכרו אותה. אחר כך יופיע מדף עם הרבה מוצרים: געו בכל מה שהיה ברשימה. אם שכחתם – לחצו "סיימתי". ${ROUNDS} סבבים.<br>ברמות גבוהות הרשימה ארוכה יותר ויש פחות זמן. הרשימה כתובה במילים, ובסבב השני אותו מדף – עם רשימה אחרת.`,
    start(stage, level, api) {
      const k = Math.round(lerp(6, 11, level));
      const shelfN = Math.min(24, Math.round(k * 2.5));
      const studyMs = Math.round(k * lerp(2100, 1350, level));
      const shelf = shuffle(itemsOf("fruit", "veg", "food")).slice(0, shelfN);
      const T = timersKit();
      let round = 0, hits = 0, wrong = 0, total = 0, fit = null;
      const times = [];

      function study() {
        round++; api.status(`סבב ${round}/${ROUNDS}`);
        const list = shuffle(shelf.slice()).slice(0, k);
        total += k;
        api.msg("זכרו את הרשימה", "soft");
        stage.innerHTML = `<div class="board">
            <div class="b-main"><div class="list-card ${k > 6 ? "two" : ""}">${list.map((i) => `<div class="li">•<b>${i.n}</b></div>`).join("")}</div></div>
            <div class="timebar small"><i></i></div>
            <div class="b-row"><button class="btn slim ready">✔ זכרתי</button></div></div>`;
        runBar($(".timebar i", stage), studyMs);
        const t = T.later(() => pickPhase(shelf, list), studyMs);
        $(".ready", stage).onclick = () => { clearTimeout(t); pickPhase(shelf, list); };
      }
      function pickPhase(shelf, list) {
        api.msg(`געו במוצרים שהיו ברשימה`, "soft");
        stage.innerHTML = `<div class="board">
            <div class="b-main"><div class="grid"></div></div>
            <div class="b-row"><span class="counter">נמצאו <b>0</b> מתוך ${k}</span><button class="btn secondary slim done">סיימתי</button></div></div>`;
        const grid = $(".grid", stage), cnt = $(".counter b", stage);
        const items = shuffle(shelf.slice());
        grid.innerHTML = items.map((it, i) => `<button class="cell pic" data-i="${i}" aria-label="${it.n}">${it.e}</button>`).join("");
        fit = () => fitIn(grid, items.length, 1); fit();
        let found = 0, t0 = Date.now(), over = false;
        const end = () => { if (over) return; over = true; T.later(round < ROUNDS ? study : finish, 900); };
        grid.addEventListener("click", (e) => {
          const b = e.target.closest(".cell"); if (!b || over || b.classList.contains("right") || b.classList.contains("wrong")) return;
          const it = items[Number(b.dataset.i)];
          if (list.includes(it)) {
            b.classList.add("right"); found++; hits++; cnt.textContent = found; api.sound.good();
            times.push((Date.now() - t0) / 1000); t0 = Date.now();
            if (found === k) { api.msg(praise(), "good"); end(); }
          } else { b.classList.add("wrong"); wrong++; api.sound.bad(); api.msg("זה לא היה ברשימה", "soft"); }
        });
        $(".done", stage).onclick = () => {
          if (over) return; over = true;
          grid.querySelectorAll(".cell").forEach((b) => { if (list.includes(items[Number(b.dataset.i)]) && !b.classList.contains("right")) b.classList.add("missed"); });
          api.msg("המסומנים בכתום היו ברשימה", "soft"); T.later(round < ROUNDS ? study : finish, 2000);
        };
      }
      api.onResize(() => fit && fit());
      function finish() {
        const acc = hits / total, pen = Math.min(1, wrong / total), at = avg(times);
        api.finish({
          score: Math.round(100 * acc * (1 - 0.6 * pen) * (0.8 + 0.2 * speedFactor(at, 2.5))),
          stats: [["מוצרים שנמצאו", `${hits} מתוך ${total}`], ["טעויות", wrong], ["אורך הרשימה", k]]
        });
      }
      study();
      return { stop: T.clear };
    }
  });
})();
