/* שפה – אות פותחת. Tap every word that starts with the given letter (from level 16: and belongs to a category).
   Levels: board of 6 → 16 words, 2 → 5 targets; harder look-alike letters (ב/כ, ס/ש, ת/ט) later.
   Score = 75% found (minus wrong taps) + 25% speed. */
(function () {
  const ROUNDS = 3;
  const CATS_W = {
    "פירות": ["תפוח", "תות", "תמר", "בננה", "ענבים", "אגס", "אבטיח", "שזיף", "משמש", "מנגו", "לימון", "רימון", "פומלה", "קיווי", "אפרסק", "תאנה", "דובדבן", "גויאבה"],
    "חיות": ["כלב", "חתול", "סוס", "פרה", "פיל", "קוף", "ארנב", "דוב", "זאב", "שועל", "גמל", "תנין", "תוכי", "תרנגול", "אריה", "נמר", "ג׳ירפה", "צב", "כבש", "עז", "דג", "ברווז", "חמור", "לטאה"],
    "בבית": ["כיסא", "שולחן", "מיטה", "ארון", "ספה", "מדף", "כרית", "שמיכה", "מנורה", "תמונה", "שטיח", "חלון", "דלת", "מראה", "מקרר", "תנור", "כוס", "צלחת", "סיר", "מזלג", "סכין", "כף"],
    "בגדים": ["חולצה", "מכנסיים", "שמלה", "חצאית", "מעיל", "כובע", "גרביים", "צעיף", "סוודר", "פיג׳מה", "נעליים", "סנדלים", "כפפות", "חגורה", "עניבה", "מגפיים"],
    "מקומות": ["ירושלים", "חיפה", "תל אביב", "באר שבע", "נתניה", "אילת", "טבריה", "צפת", "עכו", "אשדוד", "חולון", "רחובות", "נהריה", "כרמיאל", "דימונה", "ערד"]
  };
  const ALL = Object.entries(CATS_W).flatMap(([c, ws]) => ws.map((w) => ({ w, c })));
  const first = (w) => w[0];
  const LOOK = { "ב": "כ", "כ": "ב", "ס": "ש", "ש": "ס", "ת": "ט", "ט": "ת", "ח": "כ", "א": "ע", "ע": "א" };
  Games.register({
    id: "letter", cat: "language", name: "אות פותחת", icon: "🔠",
    desc: "מצאו את המילים שמתחילות באות",
    how: `למעלה כתובה אות. געו בכל המילים שמתחילות באות הזאת. כשמצאתם את כולן – עוברים ללוח הבא. ${ROUNDS} לוחות.<br>ברמות גבוהות יש יותר מילים, ומרמה 16 צריך גם קטגוריה – למשל "חיות שמתחילות ב-ק".`,
    start(stage, level, api) {
      const n = Math.round(lerp(6, 16, level));
      const k = Math.round(lerp(2, 5, level));
      const withCat = level >= 16;
      const T = timersKit();
      let round = 0, found = 0, total = 0, wrong = 0, fit = null;
      const times = [];
      function board() {
        round++; api.status(`לוח ${round}/${ROUNDS}`);
        let letter, cat, yes = [], g = 0;
        while (g++ < 200) {
          const seed = pick(ALL); letter = first(seed.w); cat = withCat ? seed.c : null;
          yes = ALL.filter((x) => first(x.w) === letter && (!cat || x.c === cat));
          if (yes.length >= Math.min(k, 2)) break;
        }
        const kk = Math.min(k, yes.length);
        const targets = shuffle(yes).slice(0, kk);
        const isT = (x) => first(x.w) === letter && (!cat || x.c === cat);
        // decoys: look-alike letter and (with category) same letter from another category
        const decoyPool = ALL.filter((x) => !isT(x));
        const near = decoyPool.filter((x) => first(x.w) === LOOK[letter] || (cat && first(x.w) === letter));
        const decoys = shuffle(near).slice(0, Math.round((n - kk) * (level >= 8 ? 0.5 : 0.2)));
        const rest = shuffle(decoyPool.filter((x) => !decoys.includes(x))).slice(0, n - kk - decoys.length);
        const words = shuffle([...targets, ...decoys, ...rest]);
        total += kk;
        stage.innerHTML = `<div class="board">
            <div class="rulebox">${cat ? `${cat} שמתחילים ב-` : "מילים שמתחילות ב-"}<b class="bigletter">${letter}</b></div>
            <div class="b-main"><div class="grid words"></div></div>
            <div class="b-row"><span class="counter">נשארו <b>${kk}</b></span><button class="btn secondary slim done">סיימתי</button></div></div>`;
        const grid = $(".grid", stage), cnt = $(".counter b", stage);
        grid.innerHTML = words.map((x, i) => `<button class="cell wordc" data-i="${i}">${x.w}</button>`).join("");
        fit = () => fitIn(grid, words.length, 0.5, n > 12 ? [3, 4] : [2, 3]); fit();
        api.msg("געו בכל המילים המתאימות", "soft");
        let left = kk, t0 = Date.now(), over = false;
        const next = (ms) => { over = true; T.later(round < ROUNDS ? board : finish, ms); };
        grid.onclick = (e) => {
          const b = e.target.closest(".cell"); if (!b || over || b.classList.contains("right")) return;
          const x = words[Number(b.dataset.i)];
          if (isT(x)) {
            b.classList.add("right"); left--; found++; cnt.textContent = left; api.sound.good();
            if (!left) { times.push((Date.now() - t0) / 1000 / kk); api.msg(praise(), "good"); next(900); }
          } else { wrong++; b.classList.add("wrong"); T.later(() => b.classList.remove("wrong"), 500); api.sound.bad(); }
        };
        $(".done", stage).onclick = () => {
          if (over) return;
          words.forEach((x, i) => { if (isT(x) && !grid.children[i].classList.contains("right")) grid.children[i].classList.add("missed"); });
          api.msg("המילים שנשארו מסומנות בכתום", "soft"); next(2000);
        };
      }
      api.onResize(() => fit && fit());
      function finish() {
        const acc = found / total, pen = Math.min(1, wrong / (total * 2)), at = avg(times);
        api.finish({
          score: Math.round(100 * acc * (1 - 0.5 * pen) * (0.75 + 0.25 * speedFactor(at, 4))),
          stats: [["מילים שנמצאו", `${found} מתוך ${total}`], ["נגיעות שגויות", wrong]]
        });
      }
      board();
      return { stop: T.clear };
    }
  });
})();
