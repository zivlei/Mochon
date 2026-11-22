/* היגיון – המשך הסדרה. Levels in tiers of 5: alternating & growing steps → squares, doubling → Fibonacci & interleaved → two operations → primes, cubes, sum of three. */
(function () {
  const build = (first, n, step) => { const s = [first]; while (s.length < n) s.push(step(s[s.length - 1], s.length - 1, s)); return s; };
  const R = {
    alternate: () => { const p = rand(5, 12), q = rand(1, p - 1); return [build(rand(5, 30), 7, (v, i) => (i % 2 ? v - q : v + p)), `לסירוגין +${p} ו-−${q}`]; },
    growing: () => { const d = rand(2, 6), k = rand(1, 4); return [build(rand(1, 15), 6, (v, i) => v + d + i * k), `ההפרש גדל כל פעם ב-${k}`]; },
    times: () => { const m = pick([2, 3]); return [build(rand(2, m === 2 ? 9 : 4), 5, (v) => v * m), `כל פעם כפול ${m}`]; },
    shrinking: () => { const d = rand(2, 5); return [build(rand(90, 140), 6, (v, i) => v - d - i * 2), "ההפחתה גדלה כל פעם ב-2"]; },
    squares: () => { const s = rand(1, 5), c = pick([0, 0, 1, 2]); return [Array.from({ length: 6 }, (_, i) => (s + i) ** 2 + c), c ? `ריבועים ועוד ${c}` : "מספרים בריבוע"]; },
    plusOne: () => { const c = rand(1, 3); return [build(rand(1, 6), 6, (v) => v * 2 + c), `כפול 2 ועוד ${c}`]; },
    fib: () => { const b = rand(2, 7); return [build(rand(1, 5), 7, (v, i, s) => (i ? v + s[i - 1] : b)), "כל מספר הוא סכום השניים שלפניו"]; },
    weave: () => { const a = rand(1, 15), p = rand(2, 7), b = rand(30, 60), q = rand(1, 6); return [Array.from({ length: 8 }, (_, i) => (i % 2 ? b - q * ((i - 1) / 2) : a + p * (i / 2))), "שתי סדרות לסירוגין"]; },
    twoOps: () => { const k = rand(1, 5); return [build(rand(2, 7), 7, (v, i) => (i % 2 ? v * 2 : v + k)), `לסירוגין +${k} וכפול 2`]; },
    minus: () => { const c = rand(1, 2); return [build(rand(2, 4), 6, (v) => v * 3 - c), `כפול 3 פחות ${c}`]; },
    gapTwice: () => { const d = rand(2, 4); return [build(rand(1, 12), 6, (v, i) => v + d * 2 ** i), "ההפרש מוכפל ב-2 כל פעם"]; },
    primes: () => { const p = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37], s = rand(0, 5); return [p.slice(s, s + 7), "מספרים ראשוניים"]; },
    cubes: () => { const c = rand(0, 3); return [[1, 2, 3, 4, 5, 6].map((i) => i ** 3 + c), c ? `מספרים בשלישית ועוד ${c}` : "מספרים בשלישית"]; },
    three: () => { const b = rand(1, 4), c = rand(2, 5); return [build(rand(1, 3), 7, (v, i, s) => (i === 0 ? b : i === 1 ? c : v + s[i - 1] + s[i - 2])), "כל מספר הוא סכום השלושה שלפניו"]; }
  };
  const TIERS = [
    ["alternate", "growing", "times", "shrinking"],
    ["alternate", "growing", "squares", "times", "plusOne", "shrinking"],
    ["squares", "plusOne", "fib", "weave"],
    ["fib", "weave", "twoOps", "gapTwice"],
    ["twoOps", "gapTwice", "minus", "fib", "weave"],
    ["minus", "primes", "cubes", "three", "twoOps", "gapTwice"]
  ];
  function gen(l) {
    const [seq, rule] = R[pick(TIERS[Math.ceil(l / 5) - 1])]();
    return { shown: seq.slice(0, -1), ans: seq[seq.length - 1], rule };
  }
  Games.register({
    id: "series", cat: "logic", name: "המשך הסדרה", icon: "🔜",
    desc: "גלו את החוק ומצאו את המספר הבא",
    how: "8 סדרות של מספרים. גלו לפי איזה חוק הן מתקדמות ובחרו את המספר הבא. למשל צעדים לסירוגין, הכפלה או הפרש שגדל. אם טעיתם – יופיע החוק. ברמות הגבוהות החוקים מורכבים יותר.",
    start(stage, level, api) {
      return runQuiz(stage, api, {
        rounds: 8, targetT: lerp(12, 22, level),
        make() {
          const q = gen(level);
          return {
            html: `<div class="seq" dir="ltr">${q.shown.map((v) => `<span>${v}</span>`).join("")}<span class="qmark">?</span></div>`,
            ans: q.ans, opts: numOptions(q.ans, 4, q.ans >= 100 ? [10, -10, 2, -2, 20, -20, 4] : [1, -1, 2, -2, 3, -3, 4, 10]),
            reveal: (el, ok) => { el.querySelector(".qmark").textContent = q.ans; if (!ok) api.msg(`החוק: ${q.rule}`, "soft"); }
          };
        }
      });
    }
  });
})();
