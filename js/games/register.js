/* חשבון – קופה. Pay the exact price by tapping coins and notes.
   Levels: small whole prices → bigger prices → from level 16 prices with half shekels and 10 agorot.
   Score = 70% paying without overpaying + 30% speed. */
(function () {
  const ROUNDS = 6;
  const MONEY = [
    { v: 0.1, l: "10 אג׳", k: "coin s" }, { v: 0.5, l: "½ ₪", k: "coin s" }, { v: 1, l: "1 ₪", k: "coin" }, { v: 2, l: "2 ₪", k: "coin" },
    { v: 5, l: "5 ₪", k: "coin" }, { v: 10, l: "10 ₪", k: "coin gold" }, { v: 20, l: "20 ₪", k: "note n20" }, { v: 50, l: "50 ₪", k: "note n50" }, { v: 100, l: "100 ₪", k: "note n100" }
  ];
  const fmt = (v) => (Math.round(v * 100) % 100 ? v.toFixed(2) : String(Math.round(v))) + " ₪";
  Games.register({
    id: "register", cat: "math", name: "הארנק", icon: "👛",
    desc: "שלמו את הסכום המדויק במטבעות ושטרות",
    how: `מופיע מוצר ומחיר. געו במטבעות ובשטרות כדי לשלם בדיוק את הסכום. טעיתם? לחצו "מהתחלה". ${ROUNDS} קניות.<br>ברמות גבוהות המחירים גבוהים יותר, ומרמה 16 יש גם אגורות.`,
    start(stage, level, api) {
      const T = timersKit();
      const maxP = Math.round(lerp(12, 260, level));
      const cents = level >= 16;
      const money = MONEY.filter((m) => (cents || m.v >= 1) && m.v <= Math.max(10, maxP));
      const products = itemsOf("fruit", "veg", "food", "thing");
      let n = 0, overs = 0, cur = null, sum = 0, t0 = 0;
      const times = [];
      stage.innerHTML = `<div class="board reg">
          <div class="pcard"><span class="prod"></span><span>לשלם: <b class="price"></b></span></div>
          <div class="paid">שולם: <b>0 ₪</b></div>
          <div class="b-main"><div class="money">${money.map((m, i) => `<button class="${m.k}" data-i="${i}">${m.l}</button>`).join("")}</div></div>
          <div class="b-row"><button class="btn secondary slim reset">↺ מהתחלה</button></div></div>`;
      const paidEl = $(".paid b", stage);
      function next() {
        if (n >= ROUNDS) return finish();
        n++; api.status(`קנייה ${n}/${ROUNDS}`);
        const it = pick(products);
        let p = rand(Math.max(3, Math.round(maxP * 0.35)), maxP);
        if (cents) p += pick([0.5, 0.9, 0.3, 0.7, 0.2, 0.6, 0.4, 0.8, 0.1]);
        cur = { p: Math.round(p * 100) / 100 };
        $(".prod", stage).textContent = it.e + " " + it.n;
        $(".price", stage).textContent = fmt(cur.p);
        sum = 0; paidEl.textContent = fmt(0); paidEl.className = "";
        api.msg("שלמו בדיוק", "soft"); t0 = Date.now();
      }
      $(".money", stage).onclick = (e) => {
        const b = e.target.closest("button"); if (!b || !cur) return;
        sum = Math.round((sum + money[Number(b.dataset.i)].v) * 100) / 100;
        paidEl.textContent = fmt(sum); api.sound.flip();
        if (Math.abs(sum - cur.p) < 0.001) {
          cur = null; times.push((Date.now() - t0) / 1000); paidEl.className = "ok";
          api.sound.good(); api.msg(praise(), "good"); T.later(next, 1000);
        } else if (sum > cur.p) {
          if (paidEl.className !== "over") overs++;
          paidEl.className = "over"; api.sound.bad(); api.msg("יותר מדי – לחצו מהתחלה", "soft");
        }
      };
      $(".reset", stage).onclick = () => { if (!cur) return; sum = 0; paidEl.textContent = fmt(0); paidEl.className = ""; api.msg("שלמו בדיוק", "soft"); };
      function finish() {
        const acc = ROUNDS / (ROUNDS + overs), at = avg(times);
        api.finish({
          score: Math.round(100 * acc * (0.7 + 0.3 * speedFactor(at, lerp(8, 18, level)))),
          stats: [["קניות", ROUNDS], ["פעמים ששילמתם יותר מדי", overs], ["זמן לקנייה", at === null ? "—" : at.toFixed(1) + " שניות"]]
        });
      }
      next();
      return { stop: T.clear };
    }
  });
})();
