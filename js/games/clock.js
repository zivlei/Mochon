/* היגיון – מה השעה? Read an analog clock. Levels: whole hours → halves → quarters → 5 minutes → any minute → "what time in N minutes". */
(function () {
  const fmt = (h, m) => `${h}:${String(m).padStart(2, "0")}`;
  const norm = (t) => { t = ((t % 720) + 720) % 720; const h = Math.floor(t / 60); return { h: h === 0 ? 12 : h, m: t % 60 }; };
  function clockSVG(h, m) {
    const nums = Array.from({ length: 12 }, (_, i) => {
      const n = i + 1, a = (n * 30 - 90) * Math.PI / 180;
      return `<text x="${100 + 72 * Math.cos(a)}" y="${100 + 72 * Math.sin(a)}" dominant-baseline="central" text-anchor="middle">${n}</text>`;
    }).join("");
    const ticks = Array.from({ length: 60 }, (_, i) => {
      const a = (i * 6 - 90) * Math.PI / 180, r1 = i % 5 ? 88 : 84;
      return `<line x1="${100 + r1 * Math.cos(a)}" y1="${100 + r1 * Math.sin(a)}" x2="${100 + 92 * Math.cos(a)}" y2="${100 + 92 * Math.sin(a)}" stroke-width="${i % 5 ? 1.5 : 3}"/>`;
    }).join("");
    const ha = (h % 12) * 30 + m * 0.5, ma = m * 6;
    return `<svg class="clock" viewBox="0 0 200 200" role="img" aria-label="שעון">
      <circle cx="100" cy="100" r="96" class="c-face"/><g class="c-ticks">${ticks}</g><g class="c-nums">${nums}</g>
      <line x1="100" y1="100" x2="100" y2="52" class="c-hour" transform="rotate(${ha} 100 100)"/>
      <line x1="100" y1="100" x2="100" y2="26" class="c-min" transform="rotate(${ma} 100 100)"/>
      <circle cx="100" cy="100" r="6" class="c-pin"/></svg>`;
  }
  Games.register({
    id: "clock", cat: "logic", name: "מה השעה?", icon: "🕰️",
    desc: "קראו את השעון ובחרו את השעה הנכונה",
    how: "8 שעונים. המחוג הקצר מראה שעות והארוך מראה דקות. בהתחלה רק שעות עגולות, אחר כך חצאים, רבעים ודקות. מרמה 26 צריך גם לחשב מה תהיה השעה בעוד כמה דקות.",
    start(stage, level, api) {
      const step = level <= 5 ? 60 : level <= 10 ? 30 : level <= 15 ? 15 : level <= 20 ? 5 : 1;
      const future = level >= 26;
      return runQuiz(stage, api, {
        rounds: 8, targetT: lerp(7, 18, level), optClass: "txt time",
        make() {
          const h = rand(1, 12), m = level <= 25 ? rand(0, 59 / step | 0) * step % 60 : rand(0, 11) * 5;
          const add = future ? pick([10, 15, 20, 25, 30, 40, 45, 50, 70, 90]) : 0;
          const base = (h % 12) * 60 + m;
          const t = norm(base + add);
          const ans = fmt(t.h, t.m);
          const unit = Math.max(step === 60 ? 60 : step, 5);
          const cands = [norm(base + add + 60), norm(base + add - 60), norm(base + add + unit), norm(base + add - unit), norm(base + add + 30),
            norm(((t.m / 5 | 0) % 12) * 60 + (t.h % 12) * 5)]; // swapped hands
          const opts = new Set([ans]);
          shuffle(cands).forEach((c) => { if (opts.size < 4) opts.add(fmt(c.h, c.m)); });
          return {
            html: `<div class="clock-wrap">${clockSVG(h, m)}</div>` + (future ? `<div class="q-line">מה תהיה השעה בעוד <b>${add} דקות</b>?</div>` : ""),
            ans, opts: shuffle([...opts]), prompt: future ? "" : "מה השעה בשעון?"
          };
        },
        label: (v) => `<span dir="ltr">${v}</span>`
      });
    }
  });
})();
