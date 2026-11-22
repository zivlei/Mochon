/* קואורדינציה – בועות. Levels: bubbles shrink and vanish faster; red "do not touch" bubbles throughout, more of them as levels rise.
   Score = hits + precision + reaction speed + avoiding red bubbles */
(function () {
  const ICONS = ["🎈", "⭐", "🌸", "🍎", "🐞", "🦋"];
  const TOTAL = 15;
  Games.register({
    id: "targets", cat: "coord", name: "בועות", icon: "🫧",
    desc: "געו בבועות לפני שהן נעלמות",
    how: `${TOTAL} בועות כחולות יופיעו בזו אחר זו. געו בכל בועה לפני שהיא נעלמת. יופיעו גם בועות אדומות עם ✋ – בהן אסור לגעת!`,
    start(stage, level, api) {
      const life = Math.round(lerp(2300, 1150, level)), sizeF = lerp(0.22, 0.13, level);
      const decoyP = lerp(0.25, 0.4, level);
      stage.classList.add("arena");
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let good = 0, hits = 0, stray = 0, decoys = 0, decoyHits = 0, bubble = null, bornAt = 0;
      const rts = [];
      const upd = () => api.status(`פגיעות: ${hits}/${TOTAL}`);
      upd(); api.msg("מתחילים בעוד רגע...", "soft");

      stage.addEventListener("pointerdown", (e) => { if (!e.target.closest(".bubble") && bubble) stray++; });
      function spawn() {
        if (good >= TOTAL) return later(finish, 500);
        const isDecoy = good > 0 && Math.random() < decoyP;
        if (isDecoy) decoys++; else good++;
        const r = stage.getBoundingClientRect();
        const size = Math.round(clamp(Math.min(r.width, r.height) * sizeF, 60, 230));
        const b = document.createElement("button");
        b.className = "bubble" + (isDecoy ? " decoy" : ""); b.textContent = isDecoy ? "✋" : pick(ICONS);
        b.style.width = b.style.height = size + "px";
        b.style.fontSize = Math.round(size * 0.5) + "px";
        b.style.left = rand(0, Math.max(0, Math.floor(r.width - size))) + "px";
        b.style.top = rand(0, Math.max(0, Math.floor(r.height - size))) + "px";
        let lifeTimer;
        b.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          if (b !== bubble) return;
          clearTimeout(lifeTimer); bubble = null;
          if (isDecoy) { decoyHits++; api.sound.bad(); api.msg("אופס – בבועה אדומה לא נוגעים", "soft"); }
          else { hits++; rts.push(Date.now() - bornAt); upd(); api.sound.good(); api.msg(praise(), "good"); }
          b.classList.add("pop"); later(() => b.remove(), 300); later(spawn, 450);
        });
        stage.appendChild(b); bubble = b; bornAt = Date.now();
        lifeTimer = setTimeout(() => {
          if (bubble !== b) return;
          bubble = null; b.classList.add("gone");
          api.msg(isDecoy ? "יפה שלא נגעתם!" : "פספוס – הבאה!", isDecoy ? "good" : "soft");
          later(() => b.remove(), 300); later(spawn, 500);
        }, isDecoy ? life * 0.9 : life);
        timers.push(lifeTimer);
      }
      function finish() {
        const hitRate = hits / TOTAL;
        const precision = hits ? hits / (hits + stray) : 0;
        const art = avg(rts);
        const speed = art === null ? 0 : clamp((life - art) / (life * 0.6), 0, 1);
        const avoid = decoys ? 1 - decoyHits / decoys : 1;
        const stats = [["פגיעות", `${hits} מתוך ${TOTAL}`], ["נגיעות מחוץ לבועה", stray], ["זמן תגובה ממוצע", art === null ? "—" : (art / 1000).toFixed(2) + " שניות"]];
        if (decoys) stats.push(["בועות אדומות שנמנעתם מהן", `${decoys - decoyHits} מתוך ${decoys}`]);
        api.finish({ score: Math.round(100 * (0.55 * hitRate + 0.15 * precision + 0.15 * speed * hitRate + 0.15 * avoid * hitRate)), stats });
      }
      later(spawn, 1500);
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
