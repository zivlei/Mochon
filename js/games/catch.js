/* קואורדינציה – תפוס את הפרי. Fruit falls from the top; slide the basket to catch it. From level 6 also avoid stones.
   Levels: faster falling, smaller basket, more at once. Score = 75% fruit caught + 25% stones avoided. */
(function () {
  const GOOD = ["🍎", "🍐", "🍊", "🍋", "🍌", "🍇", "🍓", "🍑", "🥝", "🍒"];
  Games.register({
    id: "catch", cat: "coord", name: "תפוס את הפרי", icon: "🧺",
    desc: "הזיזו את הסל ותפסו את הפירות",
    how: `פירות נופלים מלמעלה. החליקו את האצבע ימינה ושמאלה (בכל מקום על המסך) כדי להזיז את הסל 🧺 ולתפוס אותם. נופלות גם אבנים 🪨 – התחמקו מהן! ברמות גבוהות הכל נופל מהר יותר.`,
    start(stage, level, api) {
      const TOTAL = 20;
      const fallMs = lerp(5200, 1900, level);                 // time to fall the full height
      const gapMs = lerp(1700, 650, level);
      const stoneP = level >= 6 ? lerp(0.15, 0.35, level) : 0;
      const basketF = lerp(0.3, 0.17, level);
      stage.innerHTML = `<div class="b-main catch"><div class="basket">🧺</div></div>`;
      const box = $(".catch", stage), basket = $(".basket", stage);
      let W = 0, H = 0, bw = 0, bx = 0, items = [], spawned = 0, caught = 0, stones = 0, stonesHit = 0, last = 0, nextAt = 600, raf = 0, t0 = 0, over = false;
      const size = () => {
        W = box.clientWidth; H = box.clientHeight;
        bw = Math.max(90, Math.min(W * basketF * 1.4, 260));
        basket.style.width = bw + "px"; basket.style.fontSize = Math.round(bw * 0.62) + "px";
        bx = clamp(bx || W / 2, bw / 2, W - bw / 2); basket.style.left = bx - bw / 2 + "px";
      };
      size(); api.onResize(size);
      const moveTo = (e) => { const r = box.getBoundingClientRect(); bx = clamp(e.clientX - r.left, bw / 2, W - bw / 2); basket.style.left = bx - bw / 2 + "px"; };
      box.addEventListener("pointerdown", (e) => { e.preventDefault(); moveTo(e); });
      box.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "touch") moveTo(e); });
      const upd = () => api.status(`נתפסו ${caught}/${TOTAL}`);
      upd(); api.msg("הזיזו את הסל", "soft");
      function frame(ts) {
        if (over) return;
        if (!t0) { t0 = ts; last = ts; }
        const dt = Math.min(50, ts - last); last = ts;
        if (ts - t0 >= nextAt && spawned < TOTAL) {
          const stone = Math.random() < stoneP;
          const s = Math.round(Math.max(48, Math.min(W, H) * 0.11));
          const el = document.createElement("div"); el.className = "fall"; el.textContent = stone ? "🪨" : pick(GOOD);
          el.style.fontSize = s + "px";
          const x = s / 2 + Math.random() * (W - s);
          el.style.left = x - s / 2 + "px"; el.style.top = -s + "px";
          box.appendChild(el);
          items.push({ el, x, y: -s, s, stone, v: (H + s) / fallMs * (0.9 + Math.random() * 0.25) });
          if (stone) stones++; else spawned++;
          nextAt = ts - t0 + gapMs * (0.8 + Math.random() * 0.5);
        }
        const by = H - bw * 0.55;
        items = items.filter((it) => {
          it.y += it.v * dt; it.el.style.transform = `translateY(${it.y + it.s}px)`;
          if (it.y + it.s * 0.8 >= by && it.y < by + bw * 0.3 && Math.abs(it.x - bx) < bw / 2 + it.s * 0.2) {
            if (it.stone) { stonesHit++; api.sound.bad(); api.msg("אופס – אבן!", "soft"); basket.classList.add("hit"); setTimeout(() => basket.classList.remove("hit"), 300); }
            else { caught++; upd(); api.sound.good(); }
            it.el.remove(); return false;
          }
          if (it.y > H) { it.el.remove(); return false; }
          return true;
        });
        if (spawned >= TOTAL && !items.some((it) => !it.stone)) { over = true; return setTimeout(finish, 500); }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      function finish() {
        const rate = caught / TOTAL, avoid = stones ? 1 - stonesHit / stones : 1;
        const stats = [["פירות שנתפסו", `${caught} מתוך ${TOTAL}`]];
        if (stones) stats.push(["אבנים שהתחמקתם מהן", `${stones - stonesHit} מתוך ${stones}`]);
        api.finish({ score: Math.round(75 * rate + 25 * avoid * Math.min(1, rate * 1.5)), stats });
      }
      return { stop() { over = true; cancelAnimationFrame(raf); } };
    }
  });
})();
