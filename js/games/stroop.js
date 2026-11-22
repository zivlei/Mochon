/* ריכוז – צבע או מילה (Stroop with rule switching).
   A colour name is written in a different ink colour. A sign says whether to answer by the INK colour or by the WORD.
   Levels: six colours throughout; rule switches more often, fewer matching word/ink pairs, less time per answer.
   Score = 75% correct + 25% speed (speed counts only on correct answers). */
(function () {
  const COLORS = [
    { id: "red", name: "אדום", c: "#ff5a5a" },
    { id: "blue", name: "כחול", c: "#4da3ff" },
    { id: "green", name: "ירוק", c: "#3ddc84" },
    { id: "yellow", name: "צהוב", c: "#ffd93b" },
    { id: "purple", name: "סגול", c: "#c18cff" },
    { id: "orange", name: "כתום", c: "#ff9f43" }
  ];
  const TRIALS = 16;
  const RULES = { ink: { label: "🎨 לפי הצבע", cls: "r-ink" }, word: { label: "📖 לפי המילה", cls: "r-word" } };

  Games.register({
    id: "stroop", cat: "focus", name: "צבע או מילה", icon: "🎨",
    desc: "לחצו לפי צבע הכתב – או לפי מה שכתוב",
    how: `${TRIALS} מילים של צבעים, כתובות בצבעים אחרים. המסך מראה לפי מה עונים:<br>🎨 <b>לפי הצבע</b> – לוח כהה וכפתורי צבע. לחצו על הצבע שבו המילה כתובה, והתעלמו ממה שכתוב.<br>📖 <b>לפי המילה</b> – לוח בהיר כמו דף, וכפתורים עם מילים. לחצו על המילה שכתובה, והתעלמו מצבע הכתב.<br>ברמות גבוהות השלט מתחלף יותר, יש פחות זמן.`,
    start(stage, level, api) {
      const palette = COLORS;
      const windowMs = Math.round(lerp(4400, 2200, level));
      const congruentP = lerp(0.15, 0, level);
      const switchP = lerp(0.35, 0.55, level);
      stage.innerHTML = `<div class="stroop">
          <div class="rule"></div>
          <div class="sword"><b class="sbadge"></b><span></span></div>
          <div class="timebar small"><i></i></div>
          <div class="sopts six">${palette.map((p) => `<button class="sopt" data-id="${p.id}" style="--sc:${p.c}"><i></i><span>${p.name}</span></button>`).join("")}</div>
        </div>`;
      const ruleEl = $(".rule", stage), wordEl = $(".sword span", stage), bar = $(".timebar i", stage), optsEl = $(".sopts", stage), badgeEl = $(".sbadge", stage);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let n = 0, correct = 0, rule = "ink", cur = null, shown = 0, lock = true, trialTimer = null, switches = 0;
      const times = [];

      function nextRule() {
        let r = rule;
        if (n === 1) r = pick(["ink", "word"]);
        else if (Math.random() < switchP) r = rule === "ink" ? "word" : "ink";
        if (r !== rule && n > 1) switches++;
        const changed = r !== rule || n === 1;
        rule = r;
        ruleEl.textContent = RULES[r].label;
        ruleEl.className = "rule " + RULES[r].cls + (changed ? " flash" : "");
        // the whole board changes look with the rule: dark "paint" card + colour buttons for INK, paper card + word buttons for WORD
        stage.firstElementChild.classList.toggle("m-ink", r === "ink"); stage.firstElementChild.classList.toggle("m-word", r === "word");
        badgeEl.textContent = r === "ink" ? "🎨" : "📖";
        return changed;
      }
      function next() {
        if (n >= TRIALS) return finish();
        n++; api.status(`${n}/${TRIALS}`);
        const changed = nextRule();
        const word = pick(palette);
        const ink = Math.random() < congruentP ? word : pick(palette.filter((p) => p !== word));
        cur = { word, ink, ans: rule === "ink" ? ink.id : word.id };
        wordEl.textContent = word.name; wordEl.style.color = ink.c;
        wordEl.parentElement.classList.remove("show"); void wordEl.offsetWidth; wordEl.parentElement.classList.add("show");
        optsEl.querySelectorAll(".sopt").forEach((b) => b.classList.remove("right", "wrong"));
        api.msg(changed && n > 1 ? "שימו לב – השלט התחלף!" : "", "soft");
        bar.style.transition = "none"; bar.style.width = "100%"; void bar.offsetWidth;
        bar.style.transition = `width ${windowMs}ms linear`; bar.style.width = "0%";
        lock = false; shown = Date.now();
        trialTimer = setTimeout(() => answer(null), windowMs); timers.push(trialTimer);
      }
      function answer(id) {
        if (lock) return;
        lock = true; clearTimeout(trialTimer);
        const ok = id === cur.ans;
        const rightBtn = optsEl.querySelector(`[data-id="${cur.ans}"]`);
        if (ok) { correct++; times.push((Date.now() - shown) / 1000); rightBtn.classList.add("right"); api.sound.good(); api.msg(praise(), "good"); }
        else {
          if (id) optsEl.querySelector(`[data-id="${id}"]`).classList.add("wrong");
          rightBtn.classList.add("right"); api.sound.bad();
          api.msg(id ? (rule === "ink" ? "צריך לפי צבע הכתב" : "צריך לפי מה שכתוב") : "נגמר הזמן", "soft");
        }
        later(next, ok ? 650 : 1500);
      }
      optsEl.addEventListener("click", (e) => { const b = e.target.closest(".sopt"); if (b) answer(b.dataset.id); });
      function finish() {
        const acc = correct / TRIALS, at = avg(times);
        api.finish({
          score: Math.round(75 * acc + 25 * speedFactor(at, windowMs / 1000 / 2.5) * acc),
          stats: [["תשובות נכונות", `${correct} מתוך ${TRIALS}`], ["זמן ממוצע לתשובה", at === null ? "—" : at.toFixed(1) + " שניות"], ["החלפות שלט", switches]]
        });
      }
      api.msg("קראו את השלט לפני כל תשובה", "soft");
      later(next, 1200);
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
