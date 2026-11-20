/* חשבון – תרגילים. 30 levels from small additions up to multi-step and division. */
(function () {
  function gen(l) {
    let text, ans;
    const two = (a, op, b) => { text = `${a} ${op} ${b}`; ans = op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : a / b; };
    if (l <= 5) { const m = 4 + l * 3; two(rand(1, m), "+", rand(1, m)); }
    else if (l <= 10) {
      const m = 15 + (l - 5) * 7;
      if (Math.random() < 0.5) two(rand(5, m), "+", rand(2, m));
      else { const a = rand(10, m + 10); two(a, "-", rand(2, a - 1)); }
    } else if (l <= 15) {
      const m = 50 + (l - 10) * 10;
      if (Math.random() < 0.5) two(rand(15, m), "+", rand(10, m));
      else { const a = rand(30, m + 20); two(a, "-", rand(10, a - 5)); }
    } else if (l <= 20) {
      const t = 3 + (l - 16) * 2; // tables grow up to 10
      if (Math.random() < 0.55) two(rand(2, Math.min(10, t)), "×", rand(2, 10));
      else if (Math.random() < 0.5) two(rand(40, 150), "+", rand(20, 120));
      else { const a = rand(80, 200); two(a, "-", rand(20, a - 10)); }
    } else if (l <= 25) {
      const r = Math.random();
      if (r < 0.3) two(rand(3, 12), "×", rand(3, 12));
      else if (r < 0.6) { const b = rand(2, 10), k = rand(2, 10 + (l - 21) * 2); two(b * k, "÷", b); }
      else if (r < 0.8) two(rand(120, 500), "+", rand(80, 400));
      else { const a = rand(250, 600); two(a, "-", rand(60, a - 30)); }
    } else {
      const r = Math.random();
      if (r < 0.35) { const a = rand(20, 120), b = rand(10, 90), c = rand(5, a + b - 5); text = `${a} + ${b} − ${c}`; ans = a + b - c; }
      else if (r < 0.65) { const a = rand(3, 12), b = rand(3, 12), c = rand(5, 60); text = `${a} × ${b} + ${c}`; ans = a * b + c; }
      else if (r < 0.85) two(rand(11, 25), "×", rand(3, 9));
      else { const b = rand(3, 12), k = rand(6, 25); two(b * k, "÷", b); }
    }
    return { text: text.replace(/-/g, "−"), ans };
  }

  Games.register({
    id: "math", cat: "math", name: "תרגילים", icon: "➕",
    desc: "פתרו תרגילי חשבון ובחרו את התשובה",
    how: "10 תרגילים. בחרו את התשובה הנכונה. ברמות הראשונות חיבור, אחר כך חיסור, כפל, חילוק ותרגילים בכמה שלבים.",
    start(stage, level, api) {
      return runQuiz(stage, api, {
        rounds: 10, targetT: lerp(8, 16, level), unit: "תרגיל",
        make() {
          const q = gen(level);
          return {
            html: `<div class="big-q" dir="ltr">${q.text} = <span class="qmark">?</span></div>`,
            ans: q.ans, opts: numOptions(q.ans, 4),
            reveal: (el) => { el.querySelector(".qmark").textContent = q.ans; }
          };
        }
      });
    }
  });
})();
