/* היגיון – מה השעה? Read an analog clock. Always "what time in N minutes": then exact minutes → also "N minutes ago" → a face without numbers → more than an hour. */
(function () {
  const fmt = (h, m) => `${h}:${String(m).padStart(2, "0")}`;
  const norm = (t) => { t = ((t % 720) + 720) % 720; const h = Math.floor(t / 60); return { h: h === 0 ? 12 : h, m: t % 60 }; };
  function clockSVG(h, m, bare) {
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
      <circle cx="100" cy="100" r="96" class="c-face"/><g class="c-ticks">${ticks}</g><g class="c-nums">${bare ? "" : nums}</g>
      <line x1="100" y1="100" x2="100" y2="52" class="c-hour" transform="rotate(${ha} 100 100)"/>
      <line x1="100" y1="100" x2="100" y2="26" class="c-min" transform="rotate(${ma} 100 100)"/>
      <circle cx="100" cy="100" r="6" class="c-pin"/></svg>`;
  }
  Games.register({
    id: "clock", cat: "logic", name: "מה השעה?", icon: "🕰️",
    desc: "קראו את השעון וחשבו מה תהיה השעה",
    how: "8 שעונים. קראו את השעה (המחוג הקצר – שעות, הארוך – דקות) וחשבו מה תהיה השעה בעוד כמה דקות. מרמה 6 הדקות מדויקות, מרמה 11 שואלים גם מה הייתה השעה קודם, מרמה 16 אין מספרים על השעון, ומרמה 21 מוסיפים גם יותר משעה.",
    start(stage, level, api) {
      const step = level <= 5 ? 5 : 1, bare = level >= 16;
      return runQuiz(stage, api, {
        rounds: 8, targetT: lerp(10, 18, level), optClass: "txt time",
        make() {
          const h = rand(1, 12), m = rand(0, Math.floor(59 / step)) * step;
          const back = level >= 11 && Math.random() < 0.5;
          const add = level <= 5 ? pick([15, 20, 25, 35, 40, 45, 50]) : level <= 20 ? rand(13, Math.round(lerp(55, 95, level))) : rand(48, 175);
          const base = (h % 12) * 60 + m, res = base + (back ? -add : add);
          const t = norm(res), ans = fmt(t.h, t.m);
          // the trap: adding when asked to go back, and the other way round
          const opts = numOptions(res + 1440, 4, [10, 20, 30, 60, 2 * add]).map((v) => { const o = norm(v); return fmt(o.h, o.m); });
          return {
            html: `<div class="clock-wrap">${clockSVG(h, m, bare)}</div><div class="q-line">${back ? "מה הייתה השעה לפני" : "מה תהיה השעה בעוד"} <b>${add} דקות</b>?</div>`,
            ans, opts, prompt: back ? "⏪ הולכים אחורה" : "⏩ הולכים קדימה"
          };
        },
        label: (v) => `<span dir="ltr">${v}</span>`
      });
    }
  });
})();
