/* זיכרון – מה חסר? Look at N pictures, one disappears, choose which. Levels: 3→12 pictures, shorter viewing, more options. */
(function () {
  const POOL = ["🍎", "🌻", "🐱", "🏠", "☀️", "🚗", "🐟", "🎈", "🍇", "🌳", "🐶", "⭐", "🍌", "🦋", "☕", "🎵", "🔑", "👓", "📖", "⏰", "🎩", "🧦", "🍞", "🥕", "🐢", "🚲", "🌂", "🎁", "🕯️", "🪑", "🐘", "🍓"];
  const ROUNDS = 6;
  Games.register({
    id: "missing", cat: "memory", name: "מה חסר?", icon: "🫥",
    desc: "זכרו את התמונות וגלו איזו נעלמה",
    how: `${ROUNDS} סיבובים. הסתכלו על התמונות וזכרו אותן. אחרי כמה שניות אחת מהן תיעלם – בחרו איזו. ברמות גבוהות יש יותר תמונות ופחות זמן להסתכל.`,
    start(stage, level, api) {
      const N = 3 + Math.floor((level - 1) / 3);
      const viewMs = Math.round(N * lerp(1500, 750, level) + 1000);
      const nOpts = level >= 16 ? 6 : 4;
      stage.innerHTML = '<div class="missing"><div class="mgrid-wrap"><div class="grid mgrid"></div></div><div class="mbottom"></div></div>';
      const grid = $(".mgrid", stage), wrap = $(".mgrid-wrap", stage), bottom = $(".mbottom", stage);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let round = 0, correct = 0, items, gone, shown, lock = true, cells = N;
      const times = [];

      function render(list) {
        cells = list.length;
        grid.innerHTML = list.map((e) => `<div class="cell static">${e}</div>`).join("");
        layout();
      }
      function next() {
        if (round >= ROUNDS) return finish();
        round++; lock = true; api.status(`סיבוב ${round}/${ROUNDS}`);
        items = shuffle(POOL.slice()).slice(0, N);
        render(items);
        api.msg("זכרו את התמונות", "soft");
        bottom.innerHTML = '<button class="btn ready">✔ זכרתי</button><div class="timebar"><i></i></div>';
        const bar = $(".timebar i", bottom);
        bar.style.transition = `width ${viewMs}ms linear`; requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = "0%"; }));
        const t = setTimeout(ask, viewMs); timers.push(t);
        $(".ready", bottom).onclick = () => { clearTimeout(t); ask(); };
      }
      function ask() {
        gone = pick(items);
        render(shuffle(items.filter((x) => x !== gone)));
        const others = shuffle(POOL.filter((x) => !items.includes(x))).slice(0, nOpts - 1);
        const opts = shuffle([gone, ...others]);
        api.msg("איזו תמונה נעלמה?", "soft");
        bottom.innerHTML = `<div class="opts emo ${nOpts > 4 ? "many" : ""}">${opts.map((o) => `<button class="opt" data-v="${o}">${o}</button>`).join("")}</div>`;
        lock = false; shown = Date.now();
      }
      bottom.addEventListener("click", (e) => {
        const b = e.target.closest(".opt"); if (!b || lock) return;
        lock = true;
        if (b.dataset.v === gone) { correct++; times.push((Date.now() - shown) / 1000); b.classList.add("right"); api.sound.good(); api.msg(praise(), "good"); }
        else { b.classList.add("wrong"); bottom.querySelector(`[data-v="${gone}"]`).classList.add("right"); api.sound.bad(); api.msg("זו התמונה שנעלמה – מסומנת בירוק", "soft"); }
        later(next, 1600);
      });
      function finish() {
        const acc = correct / ROUNDS, at = avg(times);
        api.finish({ score: Math.round(85 * acc + 15 * speedFactor(at, 6) * acc), stats: [["תשובות נכונות", `${correct} מתוך ${ROUNDS}`], ["מספר תמונות", N]] });
      }
      function layout() {
        const r = wrap.getBoundingClientRect();
        const w = fitGrid(grid, cells, r.width, r.height, 1);
        grid.style.setProperty("--emoji", Math.round(w * 0.6) + "px");
      }
      api.onResize(layout); next();
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
