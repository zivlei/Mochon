/* קואורדינציה – רמזור (go / no-go). Tap when green, hold back on red. Yellow also cancels the next green, so the last light has to be remembered.
   Levels: shorter window, more "stop" signals. Score = 80% correct decisions + 20% reaction speed */
(function () {
  const TOTAL = 20;
  Games.register({
    id: "traffic", cat: "coord", name: "רמזור", icon: "🚦",
    desc: "ירוק – לוחצים, אבל לא אחרי צהוב",
    how: `${TOTAL} אורות. כשהעיגול ירוק – לחצו עליו מהר. כשהוא אדום – אל תלחצו! <br>🟡 <b>צהוב</b> – לא לוחצים, וגם <b>לא על הירוק הבא</b> אחריו (אפילו אם יש אדום באמצע).`,
    start(stage, level, api) {
      const win = Math.round(lerp(1550, 685, level));
      const stopP = lerp(0.35, 0.45, level);
      let go = false, skip = false;
      stage.innerHTML = '<div class="traffic"><button class="light off" aria-label="רמזור"></button></div>';
      const light = $(".light", stage);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let shown = 0, state = "off", bornAt = 0, endTimer = null;
      let hits = 0, misses = 0, rejects = 0, falseAlarms = 0, greens = 0;
      const rts = [];
      const upd = () => api.status(`${shown}/${TOTAL}`);
      upd(); api.msg("אחרי צהוב – מדלגים על הירוק הבא", "soft");

      function setLight(s) { state = s; light.className = "light " + s; light.textContent = { off: "", green: "●", red: "■", yellow: "▲" }[s]; }
      function nextSignal() {
        if (shown >= TOTAL) return later(finish, 600);
        setLight("off");
        later(() => {
          shown++; upd();
          const stop = Math.random() < stopP;
          const s = !stop ? "green" : !skip && Math.random() < 0.5 ? "yellow" : "red";
          go = s === "green" && !skip;
          if (s === "green") skip = false; else if (s === "yellow") skip = true;
          if (go) greens++;
          setLight(s);
          bornAt = Date.now();
          endTimer = setTimeout(() => {
            if (go) { misses++; api.msg("פספוס – היה ירוק", "soft"); }
            else if (state !== "off") { rejects++; api.msg("יפה שעצרתם!", "good"); }
            nextSignal();
          }, win);
          timers.push(endTimer);
        }, rand(600, 1400));
      }
      light.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (state === "off") return;
        clearTimeout(endTimer);
        if (go) { hits++; rts.push(Date.now() - bornAt); api.sound.good(); api.msg(praise(), "good"); }
        else { falseAlarms++; api.sound.bad(); api.msg("אופס – באור הזה לא לוחצים", "soft"); }
        nextSignal();
      });
      function finish() {
        const acc = (hits + rejects) / TOTAL;
        const art = avg(rts);
        const speed = art === null ? 0 : clamp((win - art) / (win * 0.6), 0, 1);
        const hitRate = greens ? hits / greens : 1;
        api.finish({
          score: Math.round(100 * (0.8 * acc + 0.2 * speed * hitRate)),
          stats: [["לחיצות נכונות בירוק", `${hits} מתוך ${greens}`], ["עצירות נכונות", `${rejects} מתוך ${TOTAL - greens}`], ["זמן תגובה ממוצע", art === null ? "—" : (art / 1000).toFixed(2) + " שניות"]]
        });
      }
      later(nextSignal, 800);
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
