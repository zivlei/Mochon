/* ריכוז – דגים. A fish swims across the pond.
   🔵 blue fish → answer where its HEAD points.  🔴 red fish → answer where it SWIMS (ignore the head).
   Levels: always mixed (level 1 opens with 2 blue and 2 red for practice); head and swim direction differ more,
   less time, smaller fish, and from level 4 grey fish swim around as distractors.
   Score = 75% correct + 25% speed (speed counts only on correct answers). */
(function () {
  const TRIALS = 16;
  const DIRS = ["left", "up", "down", "right"];
  const VEC = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const HEAD = { right: "none", left: "scaleX(-1)", up: "rotate(-90deg)", down: "rotate(90deg)" };
  const NAME = { left: "שמאלה", right: "ימינה", up: "למעלה", down: "למטה" };
  const COL = { blue: ["#2f7fb5", "#8cc7ef"], red: ["#d64545", "#f4a3a3"], grey: ["#8b96a3", "#c9d0d8"] };
  const fishSvg = (kind) => {
    const [c, belly] = COL[kind];
    return `<svg viewBox="0 0 100 60" aria-hidden="true">
      <polygon points="18,30 1,10 5,30 1,50" fill="${c}"/>
      <ellipse cx="50" cy="30" rx="36" ry="21" fill="${c}"/>
      <ellipse cx="54" cy="37" rx="25" ry="10" fill="${belly}"/>
      <path d="M40 10 Q52 -2 62 11 Z" fill="${c}"/>
      <path d="M44 40 Q50 52 58 41 Z" fill="${belly}"/>
      <circle cx="72" cy="24" r="7" fill="#fff"/><circle cx="74" cy="24" r="3.6" fill="#1b2430"/>
      <path d="M84 33 Q80 36 84 38" stroke="#1b2430" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </svg>`;
  };
  const arrowSvg = (d) => `<svg viewBox="0 0 100 100" style="transform:rotate(${{ right: 0, down: 90, left: 180, up: -90 }[d]}deg)" aria-hidden="true"><path d="M14 40 H56 V18 L90 50 L56 82 V60 H14 Z" fill="currentColor"/></svg>`;

  Games.register({
    id: "fish", cat: "focus", name: "דגים", icon: "🐟",
    desc: "כחול – לאן הראש, אדום – לאן הוא שוחה",
    how: `${TRIALS} דגים ישחו על המסך. בתחתית יש 4 חיצים.<br>🔵 <b>דג כחול</b> – לחצו על החץ לכיוון שאליו <b>הראש</b> פונה.<br>🔴 <b>דג אדום</b> – לחצו על החץ לכיוון שאליו הוא <b>שוחה</b>, גם אם הראש פונה לצד אחר.<br>ברמה הראשונה מתחילים בשני כחולים ושני אדומים להיכרות, ומשם – מעורבב. מרמה 4 שוחים גם דגים אפורים – מתעלמים מהם.`,
    start(stage, level, api) {
      const practice = level === 1 ? ["blue", "blue", "red", "red"] : [];
      const windowMs = Math.round(lerp(4250, 1950, level));
      const mismatchP = lerp(0.65, 0.9, level);
      const sizeF = lerp(0.213, 0.148, level);
      const nGrey = level >= 18 ? 3 : level >= 4 ? 2 : 0;
      const legend = `<span class="lg-b">🔵 כחול: לאן הראש פונה</span><span class="lg-r">🔴 אדום: לאן הוא שוחה</span>`;
      stage.innerHTML = `<div class="fishgame">
          <div class="legend">${legend}</div>
          <div class="pond"></div>
          <div class="timebar small"><i></i></div>
          <div class="arrows">${DIRS.map((d) => `<button class="arrow" data-dir="${d}" aria-label="${NAME[d]}">${arrowSvg(d)}</button>`).join("")}</div>
        </div>`;
      const pond = $(".pond", stage), bar = $(".timebar i", stage), arrowsEl = $(".arrows", stage);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let n = 0, correct = 0, cur = null, shown = 0, lock = true, trialTimer = null, lastKind = null;
      const times = [];

      // place one fish so that its whole swim stays inside the pond
      function addFish(kind, head, move, main) {
        const W = pond.clientWidth, H = pond.clientHeight;
        const size = Math.round(clamp(Math.min(W, H) * sizeF * (main ? 1 : 0.85), 64, 210));
        const [vx, vy] = VEC[move];
        const span = vx ? W - size : H - size;
        const dist = Math.max(0, Math.min(span * 0.75, size * 3));
        const freeX = Math.max(0, W - size - Math.abs(vx) * dist), freeY = Math.max(0, H - size - Math.abs(vy) * dist);
        let x = Math.random() * freeX, y = Math.random() * freeY;
        if (vx < 0) x += dist; if (vy < 0) y += dist;
        const f = document.createElement("div");
        f.className = "fish " + kind + (main ? " main" : "");
        f.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
        f.innerHTML = `<div class="fbody" style="transform:${HEAD[head]}">${fishSvg(kind)}</div>`;
        pond.appendChild(f);
        void f.offsetWidth;
        f.style.transition = `transform ${windowMs}ms linear, opacity .3s`;
        f.style.transform = `translate(${vx * dist}px, ${vy * dist}px)`;
        return f;
      }
      const otherDir = (d) => pick(DIRS.filter((x) => x !== d));

      function next() {
        if (n >= TRIALS) return finish();
        n++; api.status(`${n}/${TRIALS}`);
        pond.innerHTML = "";
        arrowsEl.querySelectorAll(".arrow").forEach((b) => b.classList.remove("right", "wrong"));
        // the colour switches more often as levels rise
        const kind = practice[n - 1] || (lastKind && Math.random() > lerp(0.5, 0.7, level) ? lastKind : pick(["blue", "red"]));
        const head = pick(DIRS);
        const move = Math.random() < mismatchP ? otherDir(head) : head;
        for (let i = 0; i < nGrey; i++) { const h = pick(DIRS); addFish("grey", h, Math.random() < 0.6 ? otherDir(h) : h, false); }
        const el = addFish(kind, head, move, true);
        cur = { kind, ans: kind === "blue" ? head : move, el };
        api.msg(kind !== lastKind ? (kind === "blue" ? "🔵 כחול – הראש" : "🔴 אדום – כיוון השחייה") : "", "soft");
        lastKind = kind;
        bar.style.transition = "none"; bar.style.width = "100%"; void bar.offsetWidth;
        bar.style.transition = `width ${windowMs}ms linear`; bar.style.width = "0%";
        lock = false; shown = Date.now();
        trialTimer = setTimeout(() => answer(null), windowMs); timers.push(trialTimer);
      }
      function answer(dir) {
        if (lock) return;
        lock = true; clearTimeout(trialTimer);
        const ok = dir === cur.ans;
        arrowsEl.querySelector(`[data-dir="${cur.ans}"]`).classList.add("right");
        pond.querySelectorAll(".fish:not(.main)").forEach((f) => (f.style.opacity = ".25"));
        if (ok) { correct++; times.push((Date.now() - shown) / 1000); api.sound.good(); api.msg(praise(), "good"); }
        else {
          if (dir) arrowsEl.querySelector(`[data-dir="${dir}"]`).classList.add("wrong");
          api.sound.bad();
          api.msg(!dir ? "נגמר הזמן" : cur.kind === "blue" ? `דג כחול – הראש פונה ${NAME[cur.ans]}` : `דג אדום – הוא שוחה ${NAME[cur.ans]}`, "soft");
        }
        later(next, ok ? 700 : 1700);
      }
      arrowsEl.addEventListener("click", (e) => { const b = e.target.closest(".arrow"); if (b) answer(b.dataset.dir); });
      function finish() {
        pond.innerHTML = "";
        const acc = correct / TRIALS, at = avg(times);
        api.finish({
          score: Math.round(75 * acc + 25 * speedFactor(at, windowMs / 1000 / 2.5) * acc),
          stats: [["תשובות נכונות", `${correct} מתוך ${TRIALS}`], ["זמן ממוצע לתשובה", at === null ? "—" : at.toFixed(1) + " שניות"]]
        });
      }
      api.msg("שימו לב לצבע הדג", "soft");
      later(next, 1300);
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
