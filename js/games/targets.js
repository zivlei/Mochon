/* קואורדינציה – בועות: score = 60% hits + 20% precision (few stray taps) + 20% reaction speed */
(function () {
  const ICONS = ["🎈", "⭐", "🌸", "🍎", "🐞", "🦋"];
  const TOTAL = 15;
  Games.register({
    id: "targets", cat: "coord", name: "בועות", icon: "🫧",
    desc: "געו בבועות לפני שהן נעלמות",
    how: `${TOTAL} בועות יופיעו בזו אחר זו במקומות שונים. געו בכל בועה לפני שהיא נעלמת. הניקוד לפי הפגיעות, הדיוק ומהירות התגובה.`,
    start(stage, level, api) {
      const life = [0, 3200, 2400, 1700][level], sizeF = [0, 0.3, 0.23, 0.17][level];
      stage.classList.add("arena");
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let shown = 0, hits = 0, stray = 0, bubble = null, bornAt = 0, lifeTimer = null;
      const rts = [];
      const upd = () => api.status(`פגיעות: ${hits}/${TOTAL}`);
      upd(); api.msg("מתחילים בעוד רגע...", "soft");

      stage.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".bubble")) return;
        if (bubble) stray++;
      });
      function spawn() {
        if (shown >= TOTAL) return later(finish, 500);
        shown++;
        const r = stage.getBoundingClientRect();
        const size = Math.round(clamp(Math.min(r.width, r.height) * sizeF, 64, 220));
        const b = document.createElement("button");
        b.className = "bubble"; b.textContent = ICONS[rand(0, ICONS.length - 1)];
        b.style.width = b.style.height = size + "px";
        b.style.fontSize = Math.round(size * 0.5) + "px";
        b.style.left = rand(0, Math.max(0, Math.floor(r.width - size))) + "px";
        b.style.top = rand(0, Math.max(0, Math.floor(r.height - size))) + "px";
        b.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          if (b !== bubble) return;
          clearTimeout(lifeTimer);
          hits++; rts.push(Date.now() - bornAt); upd(); api.sound.good(); api.msg(praise(), "good");
          b.classList.add("pop"); bubble = null;
          later(() => b.remove(), 300); later(spawn, 450);
        });
        stage.appendChild(b); bubble = b; bornAt = Date.now();
        lifeTimer = setTimeout(() => {
          if (bubble !== b) return;
          bubble = null; b.classList.add("gone"); api.msg("פספוס – הבאה!", "soft");
          later(() => b.remove(), 300); later(spawn, 500);
        }, life);
        timers.push(lifeTimer);
      }
      function finish() {
        const hitRate = hits / TOTAL;
        const precision = hits ? hits / (hits + stray) : 0;
        const art = avg(rts);
        const speed = art === null ? 0 : clamp((life - art) / (life * 0.6), 0, 1);
        api.finish({
          score: Math.round(100 * (0.6 * hitRate + 0.2 * precision + 0.2 * speed * hitRate)),
          stats: [["פגיעות", `${hits} מתוך ${TOTAL}`], ["נגיעות מחוץ לבועה", stray], ["זמן תגובה ממוצע", art === null ? "—" : (art / 1000).toFixed(2) + " שניות"]]
        });
      }
      later(spawn, 1500);
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
