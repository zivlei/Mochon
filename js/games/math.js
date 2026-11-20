/* חשבון – תרגילים: score = 80% correctness + 20% speed (speed only counts on correct answers) */
(function () {
  const QN = 10;
  function gen(level) {
    let a, b, op;
    if (level === 1) {
      if (Math.random() < 0.6) { op = "+"; a = rand(1, 10); b = rand(1, 10); }
      else { op = "-"; a = rand(5, 15); b = rand(1, Math.min(9, a)); }
    } else if (level === 2) {
      if (Math.random() < 0.5) { op = "+"; a = rand(10, 40); b = rand(5, 30); }
      else { op = "-"; a = rand(20, 60); b = rand(5, a - 5); }
    } else {
      const r = Math.random();
      if (r < 0.35) { op = "×"; a = rand(2, 10); b = rand(2, 10); }
      else if (r < 0.7) { op = "+"; a = rand(25, 80); b = rand(15, 60); }
      else { op = "-"; a = rand(40, 100); b = rand(10, a - 10); }
    }
    const ans = op === "+" ? a + b : op === "-" ? a - b : a * b;
    const opts = new Set([ans]);
    const deltas = [1, 2, 3, 10, -1, -2, -3, -10, 5, -5];
    while (opts.size < 4) { const v = ans + deltas[rand(0, deltas.length - 1)]; if (v >= 0) opts.add(v); }
    return { text: `${a} ${op} ${b} = ?`, ans, opts: shuffle([...opts]) };
  }

  Games.register({
    id: "math", cat: "math", name: "תרגילים", icon: "➕",
    desc: "פתרו תרגילי חשבון ובחרו את התשובה",
    how: `${QN} תרגילים. בחרו את התשובה הנכונה מבין ארבע אפשרויות. הניקוד לפי מספר התשובות הנכונות, ומעט גם לפי המהירות.`,
    start(stage, level, api) {
      const targetT = [0, 8, 10, 12][level];
      stage.innerHTML = '<div class="math"><div class="math-q" dir="ltr"></div><div class="opts"></div></div>';
      const qEl = $(".math-q", stage), oEl = $(".opts", stage);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let n = 0, correct = 0, times = [], q, shown, lock = false;

      function next() {
        if (n >= QN) return finish();
        n++; q = gen(level); lock = false; shown = Date.now();
        api.status(`תרגיל ${n}/${QN}`); api.msg("", "");
        qEl.textContent = q.text;
        oEl.innerHTML = q.opts.map((v) => `<button class="opt" data-v="${v}">${v}</button>`).join("");
      }
      oEl.addEventListener("click", (e) => {
        const b = e.target.closest(".opt"); if (!b || lock) return;
        lock = true;
        const v = Number(b.dataset.v), ok = v === q.ans;
        if (ok) { correct++; times.push((Date.now() - shown) / 1000); b.classList.add("right"); api.sound.good(); api.msg(praise(), "good"); }
        else {
          b.classList.add("wrong"); api.sound.bad();
          oEl.querySelector(`[data-v="${q.ans}"]`).classList.add("right");
          api.msg(`התשובה הנכונה: ${q.ans}`, "soft");
        }
        qEl.textContent = q.text.replace("?", q.ans);
        later(next, ok ? 900 : 1900);
      });
      function finish() {
        const acc = correct / QN;
        const at = avg(times);
        const sp = at === null ? 0 : speedFactor(at, targetT);
        api.finish({
          score: Math.round(80 * acc + 20 * sp * acc),
          stats: [["תשובות נכונות", `${correct} מתוך ${QN}`], ["זמן ממוצע לתשובה נכונה", at === null ? "—" : at.toFixed(1) + " שניות"]]
        });
      }
      next();
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
