/* קואורדינציה – רמזור (go / no-go). Tap when green, hold back on red (and yellow from level 16).
   Levels: shorter window, more "stop" signals. Score = 80% correct decisions + 20% reaction speed */
(function () {
  const TOTAL = 20;
  Games.register({
    id: "traffic", cat: "coord", name: "רמזור", icon: "🚦",
    desc: "לחצו כשהאור ירוק, עצרו כשהוא אדום",
    how: `${TOTAL} אורות. כשהעיגול ירוק – לחצו עליו מהר. כשהוא אדום – אל תלחצו! מרמה 16 יש גם אור צהוב – גם בו לא לוחצים.`,
    start(stage, level, api) {
      const win = Math.round(lerp(2200, 700, level));
      const stopP = lerp(0.25, 0.4, level);
      const useYellow = level >= 16;
      stage.innerHTML = '<div class="traffic"><button class="light off" aria-label="רמזור"></button></div>';
      const light = $(".light", stage);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let shown = 0, state = "off", bornAt = 0, endTimer = null;
      let hits = 0, misses = 0, rejects = 0, falseAlarms = 0, greens = 0;
      const rts = [];
      const upd = () => api.status(`${shown}/${TOTAL}`);
      upd(); api.msg("ירוק = לוחצים · אדום = לא לוחצים", "soft");

      function setLight(s) { state = s; light.className = "light " + s; light.textContent = s === "green" ? "👆" : s === "off" ? "" : "✋"; }
      function nextSignal() {
        if (shown >= TOTAL) return later(finish, 600);
        setLight("off");
        later(() => {
          shown++; upd();
          const stop = Math.random() < stopP;
          if (!stop) greens++;
          setLight(stop ? (useYellow && Math.random() < 0.4 ? "yellow" : "red") : "green");
          bornAt = Date.now();
          endTimer = setTimeout(() => {
            if (state === "green") { misses++; api.msg("פספוס – היה ירוק", "soft"); }
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
        if (state === "green") { hits++; rts.push(Date.now() - bornAt); api.sound.good(); api.msg(praise(), "good"); }
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
