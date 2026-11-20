/* היגיון – המשך הסדרה. Levels in tiers of 5: +1/+2 → bigger steps & descending → ×2 → alternating steps → growing gaps/squares → Fibonacci & interleaved. */
(function () {
  function gen(l) {
    const tier = Math.ceil(l / 5);
    let seq = [];
    const arith = (a, d, k) => Array.from({ length: k }, (_, i) => a + d * i);
    switch (tier) {
      case 1: seq = arith(rand(1, 10), l <= 2 ? 1 : rand(1, 2) + (l >= 4 ? 1 : 0), 5); break;
      case 2: { const d = rand(2, 5); seq = Math.random() < 0.5 ? arith(rand(1, 20), d, 5) : arith(rand(30, 60), -d, 5); break; }
      case 3: {
        if (Math.random() < 0.5) { const d = rand(3, 10) * (Math.random() < 0.3 ? -1 : 1); seq = arith(d < 0 ? rand(60, 100) : rand(1, 30), d, 5); }
        else { const a = rand(1, 5); seq = [a, a * 2, a * 4, a * 8, a * 16]; }
        break;
      }
      case 4: {
        if (Math.random() < 0.5) { const p = rand(2, 5), q = rand(1, 4); let v = rand(5, 14); seq = [v]; for (let i = 1; i < 6; i++) { v += i % 2 ? p : -q; seq.push(v); } }
        else { let v = rand(1, 10), d = rand(1, 3); seq = [v]; for (let i = 0; i < 5; i++) { v += d; d += 1; seq.push(v); } }
        break;
      }
      case 5: {
        const r = Math.random();
        if (r < 0.35) { const s = rand(1, 4); seq = Array.from({ length: 5 }, (_, i) => (s + i) ** 2); }
        else if (r < 0.7) { const a = rand(1, 3); seq = [a, a * 3, a * 9, a * 27, a * 81]; }
        else { let v = rand(1, 5); seq = [v]; for (let i = 0; i < 5; i++) { v = v * 2 + 1; seq.push(v); } }
        break;
      }
      default: {
        const r = Math.random();
        if (r < 0.4) { let a = rand(1, 4), b = rand(a, a + 4); seq = [a, b]; for (let i = 0; i < 5; i++) { const c = seq[seq.length - 1] + seq[seq.length - 2]; seq.push(c); } }
        else if (r < 0.75) { const a = rand(1, 10), d1 = rand(2, 5), b = rand(20, 40), d2 = -rand(1, 4); seq = []; for (let i = 0; i < 7; i++) seq.push(i % 2 ? b + d2 * ((i - 1) / 2) : a + d1 * (i / 2)); }
        else { let v = rand(2, 6); seq = [v]; for (let i = 0; i < 5; i++) { v = i % 2 ? v * 2 : v + rand(1, 5); seq.push(v); } seq = seq; }
      }
    }
    const ans = seq[seq.length - 1];
    return { shown: seq.slice(0, -1), ans };
  }
  Games.register({
    id: "series", cat: "logic", name: "המשך הסדרה", icon: "🔜",
    desc: "גלו את החוק ומצאו את המספר הבא",
    how: "8 סדרות של מספרים. גלו לפי איזה חוק הן מתקדמות ובחרו את המספר הבא. בהתחלה החוק פשוט (עוד 1, עוד 2), וברמות הגבוהות הוא מורכב יותר.",
    start(stage, level, api) {
      return runQuiz(stage, api, {
        rounds: 8, targetT: lerp(8, 20, level),
        make() {
          const q = gen(level);
          return {
            html: `<div class="seq" dir="ltr">${q.shown.map((v) => `<span>${v}</span>`).join("")}<span class="qmark">?</span></div>`,
            ans: q.ans, opts: numOptions(q.ans, 4, [1, 2, -1, -2, 3, -3, 4, 5, -5, 10]),
            reveal: (el) => { el.querySelector(".qmark").textContent = q.ans; }
          };
        }
      });
    }
  });
})();
