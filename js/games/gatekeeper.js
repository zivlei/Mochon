/* ריכוז – שומר הסף. Pictures pass one by one. Press the big button only when a picture fits the rule.
   Levels: rule by kind (fruit) → by colour (red things) → both (red fruit); less time per picture.
   Score = 60% catching the right ones + 40% not pressing on the wrong ones. */
(function () {
  const TOTAL = 24;
  const KINDS = { fruit: "פירות", veg: "ירקות", animal: "בעלי חיים", vehicle: "כלי תחבורה", plant: "פרחים וצמחים", thing: "חפצים" };
  const COLORS = { red: "אדום", yellow: "צהוב", green: "ירוק", orange: "כתום" };
  const KIND1 = { fruit: "פרי", veg: "ירק", animal: "בעל חיים", vehicle: "כלי תחבורה", plant: "צמח", thing: "חפץ" };
  Games.register({
    id: "gatekeeper", cat: "focus", name: "שומר הסף", icon: "🚪",
    desc: "לחצו רק כשהתמונה מתאימה לכלל",
    how: `למעלה כתוב כלל, למשל "רק פירות". תמונות יעברו אחת אחרי השנייה. לחצו על הכפתור ✋ רק כשהתמונה מתאימה לכלל – ואל תלחצו על כל השאר. ${TOTAL} תמונות.<br>ברמות 11–20 הכלל הוא צבע ("רק דברים אדומים"), ומרמה 21 – שניהם ("רק פרי אדום").`,
    start(stage, level, api) {
      const windowMs = Math.round(lerp(2600, 1100, level));
      const T = timersKit();
      // choose a rule with enough matching pictures
      let rule, match, ruleTx;
      for (let g = 0; g < 50; g++) {
        if (level <= 10) { const k = pick(Object.keys(KINDS)); match = (i) => i.t === k; ruleTx = `רק ${KINDS[k]}`; }
        else if (level <= 20) { const c = pick(Object.keys(COLORS)); match = (i) => i.c === c; ruleTx = `רק דברים בצבע ${COLORS[c]}`; }
        else { const c = pick(Object.keys(COLORS)), k = pick(["fruit", "veg", "animal", "thing", "plant"]); match = (i) => i.c === c && i.t === k; ruleTx = `רק ${KIND1[k]} ${COLORS[c]}`; rule = { c, k }; }
        if (ITEMS.filter(match).length >= 2) break;
      }
      const yes = ITEMS.filter(match), no = ITEMS.filter((i) => !match(i));
      // look-alike "no" pictures make higher levels harder (same colour or same kind)
      const nearNo = rule ? no.filter((i) => i.c === rule.c || i.t === rule.k) : no;
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
