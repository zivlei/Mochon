/* ריכוז – שומר הסף. Pictures pass one by one. Press the big button only when a picture fits the rule.
   Levels: kind + colour (red fruit) → kind without a colour (fruit that is not red); less time per picture.
   Score = 60% catching the right ones + 40% not pressing on the wrong ones. */
(function () {
  const TOTAL = 24;

  const COLORS = { red: "אדום", yellow: "צהוב", green: "ירוק", orange: "כתום" };
  const KIND1 = { fruit: "פרי", veg: "ירק", animal: "בעל חיים", vehicle: "כלי תחבורה", plant: "צמח", thing: "חפץ" };
  Games.register({
    id: "gatekeeper", cat: "focus", name: "שומר הסף", icon: "🚪",
    desc: "לחצו רק כשהתמונה מתאימה לכלל",
    how: `למעלה כתוב כלל, למשל "רק פרי אדום". תמונות יעברו אחת אחרי השנייה. לחצו על הכפתור ✋ רק כשהתמונה מתאימה לכלל – ואל תלחצו על כל השאר. ${TOTAL} תמונות.<br>הכלל משלב סוג וצבע, ומרמה 11 יש בו "לא" ("רק פרי שאינו אדום").`,
    start(stage, level, api) {
      const windowMs = Math.round(lerp(1950, 1085, level));
      const T = timersKit();
      // choose a rule with enough matching pictures
      const negate = level >= 11;
      let rule, match, ruleTx, bank;
      for (let g = 0; g < 50; g++) {
        const c = pick(Object.keys(COLORS)), k = pick(Object.keys(KIND1).filter((x) => x !== "vehicle"));
        match = (i) => i.t === k && !!i.c && (negate ? i.c !== c : i.c === c);
        ruleTx = `רק ${KIND1[k]} ${negate ? "שאינו " : ""}${COLORS[c]}`;
        rule = { c, k };
        // pictures of that kind without one clear colour (🍐, 🍉) would be unfair, so they stay out
        bank = ITEMS.filter((i) => i.t !== k || i.c);
        if (bank.filter(match).length >= 2 && bank.some((i) => i.t === k && !match(i))) break;
      }
      const yes = bank.filter(match), no = bank.filter((i) => !match(i));
      // "no" pictures that share the colour or the kind are the traps
      const nearNo = no.filter((i) => i.c === rule.c || i.t === rule.k);
      const nYes = Math.round(TOTAL * 0.35);
      const seq = shuffle([...Array.from({ length: nYes }, () => pick(yes)), ...Array.from({ length: TOTAL - nYes }, () => (Math.random() < 0.5 && nearNo.length ? pick(nearNo) : pick(no)))]);

      stage.innerHTML = `<div class="board gate">
          <div class="rulebox">${ruleTx}</div>
          <div class="b-main"><div class="gatepic"></div></div>
          <div class="timebar small"><i></i></div>
          <button class="btn stopbtn">✋ מתאים!</button></div>`;
      const pic = $(".gatepic", stage), bar = $(".timebar i", stage), btn = $(".stopbtn", stage);
      let i = -1, pressed = false, hits = 0, falseP = 0, misses = 0;
      const rts = []; let shown = 0;
      function next() {
        if (i >= 0 && !pressed && match(seq[i])) { misses++; api.msg("פספוס – זה התאים", "soft"); }
        i++;
        if (i >= TOTAL) return T.later(finish, 400);
        api.status(`${i + 1}/${TOTAL}`);
        pressed = false; pic.className = "gatepic"; void pic.offsetWidth; pic.classList.add("in");
        pic.textContent = seq[i].e; shown = Date.now();
        runBar(bar, windowMs);
        T.later(() => { pic.textContent = ""; T.later(next, 250); }, windowMs);
      }
      btn.onclick = () => {
        if (i < 0 || i >= TOTAL || pressed || !pic.textContent) return;
        pressed = true;
        if (match(seq[i])) { hits++; rts.push(Date.now() - shown); pic.classList.add("ok"); api.sound.good(); api.msg(praise(), "good"); }
        else { falseP++; pic.classList.add("no"); api.sound.bad(); api.msg("זה לא מתאים לכלל", "soft"); }
      };
      function finish() {
        const hitRate = hits / nYes, avoid = 1 - falseP / (TOTAL - nYes), art = avg(rts);
        api.finish({
          score: Math.round(60 * hitRate + 40 * avoid * Math.min(1, hitRate * 2)),
          stats: [["תפסתם", `${hits} מתוך ${nYes}`], ["לחיצות מיותרות", falseP], ["זמן תגובה", art === null ? "—" : (art / 1000).toFixed(2) + " שניות"]]
        });
      }
      api.msg("לחצו רק כשמתאים לכלל", "soft");
      T.later(next, 1500);
      return { stop: T.clear };
    }
  });
})();
