/* חשבון – קופה. Pay the exact price from a limited wallet – each coin or note can be used once.
   Levels: 9 → 13 pieces in the wallet, bigger notes, from level 11 agorot. Taking the biggest piece first does not work.
   Score = 70% paying without overpaying + 30% speed. */
(function () {
  const ROUNDS = 6;
  const MONEY = [
    { v: 0.1, l: "10 אג׳", k: "coin s" }, { v: 0.5, l: "½ ₪", k: "coin s" }, { v: 1, l: "1 ₪", k: "coin" }, { v: 2, l: "2 ₪", k: "coin" },
    { v: 5, l: "5 ₪", k: "coin" }, { v: 10, l: "10 ₪", k: "coin gold" }, { v: 20, l: "20 ₪", k: "note n20" }, { v: 50, l: "50 ₪", k: "note n50" }, { v: 100, l: "100 ₪", k: "note n100" }
  ];
  const inCents = (m) => Math.round(m.v * 100);
  /** a wallet and a price it can pay exactly – but not by just taking the biggest piece that fits */
  function purchase(level) {
    const size = Math.round(lerp(9, 13, level)), top = level <= 5 ? 20 : level <= 18 ? 50 : 100;
    const kinds = MONEY.filter((m) => m.v <= top && (level >= 11 || m.v >= 0.5));
    for (let tries = 1; ; tries++) {
      const wallet = Array.from({ length: size }, () => pick(kinds)).sort((a, b) => b.v - a.v);
      const sol = new Set(shuffle([...wallet.keys()]).slice(0, Math.round(size / 2)));
      const price = [...sol].reduce((s, i) => s + inCents(wallet[i]), 0);
      let greedy = 0;
      wallet.forEach((m) => { if (greedy + inCents(m) <= price) greedy += inCents(m); });
      if ((greedy !== price && price >= 1000) || tries > 5000) return { wallet, sol, price };
    }
  }
  const fmt = (v) => (Math.round(v * 100) % 100 ? v.toFixed(2) : String(Math.round(v))) + " ₪";
  Games.register({
    id: "register", cat: "math", name: "הארנק", icon: "👛",
    desc: "שלמו בדיוק ממה שיש בארנק",
    how: `מופיע מוצר, מחיר וארנק. שלמו בדיוק את הסכום ממה שיש בארנק – כל מטבע ושטר אפשר לתת פעם אחת, ולא תמיד כדאי להתחיל מהגדול. טעיתם? לחצו "מהתחלה". לא מוצאים? "הראו לי" יגלה את הפתרון. ${ROUNDS} קניות.<br>ברמות גבוהות הארנק מלא יותר, ומרמה 11 יש גם אגורות.`,
    start(stage, level, api) {
      const T = timersKit();
      const products = itemsOf("fruit", "veg", "food", "thing");
      let n = 0, overs = 0, solved = 0, cur = null, sum = 0, over = false, t0 = 0;
      const times = [];
      stage.innerHTML = `<div class="board reg">
          <div class="pcard"><span class="prod"></span><span>לשלם: <b class="price"></b></span></div>
          <div class="paid">שולם: <b>0 ₪</b></div>
          <div class="b-main"><div class="money"></div></div>
          <div class="b-row"><button class="btn secondary slim reset">↺ מהתחלה</button><button class="btn secondary slim give">💡 הראו לי</button></div></div>`;
      const paidEl = $(".paid b", stage), moneyEl = $(".money", stage);
      function clearPaid() {
        sum = 0; over = false; paidEl.textContent = fmt(0); paidEl.className = "";
        moneyEl.innerHTML = cur.wallet.map((m, i) => `<button class="${m.k}" data-i="${i}">${m.l}</button>`).join("");
      }
      function next() {
        if (n >= ROUNDS) return finish();
        n++; api.status(`קנייה ${n}/${ROUNDS}`);
        cur = purchase(level);
        const it = pick(products);
        $(".prod", stage).textContent = it.e + " " + it.n;
        $(".price", stage).textContent = fmt(cur.price / 100);
        clearPaid();
        api.msg("שלמו בדיוק ממה שבארנק", "soft"); t0 = Date.now();
      }
      moneyEl.onclick = (e) => {
        const b = e.target.closest("button"); if (!b || !cur || over || b.disabled) return;
        sum += inCents(cur.wallet[Number(b.dataset.i)]);
        b.disabled = true; b.style.opacity = 0.25;
        paidEl.textContent = fmt(sum / 100); api.sound.flip();
        if (sum === cur.price) {
          cur = null; solved++; times.push((Date.now() - t0) / 1000); paidEl.className = "ok";
          api.sound.good(); api.msg(praise(), "good"); T.later(next, 1000);
        } else if (sum > cur.price) {
          over = true; overs++; paidEl.className = "over"; api.sound.bad(); api.msg("יותר מדי – לחצו מהתחלה", "soft");
        }
      };
      $(".reset", stage).onclick = () => { if (!cur) return; clearPaid(); api.msg("שלמו בדיוק ממה שבארנק", "soft"); };
      $(".give", stage).onclick = () => {
        if (!cur) return;
        clearPaid();
        [...moneyEl.children].forEach((b, i) => { b.disabled = true; if (!cur.sol.has(i)) b.style.opacity = 0.2; });
        paidEl.textContent = fmt(cur.price / 100); cur = null;
        api.msg("כך אפשר היה לשלם", "soft"); T.later(next, 3000);
      };
      function finish() {
        const acc = (solved / ROUNDS) * (ROUNDS / (ROUNDS + overs * 0.5)), at = avg(times);
        api.finish({
          score: Math.round(100 * acc * (0.7 + 0.3 * speedFactor(at, lerp(18, 28, level)))),
          stats: [["קניות ששולמו", `${solved} מתוך ${ROUNDS}`], ["פעמים ששילמתם יותר מדי", overs], ["זמן לקנייה", at === null ? "—" : at.toFixed(1) + " שניות"]]
        });
      }
      next();
      return { stop: T.clear };
    }
  });
})();
