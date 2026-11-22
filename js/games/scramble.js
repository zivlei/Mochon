/* שפה – מילים מבולבלות: arrange shuffled letters into a word. Levels: 5 → 7+ letters; picture hint hidden from level 4 until a mistake; from level 11 extra letters. */
(function () {
  const WORDS = [
    ["בית", "🏠"], ["ספר", "📖"], ["שמש", "☀️"], ["ירח", "🌙"], ["כלב", "🐶"], ["סוס", "🐴"], ["פרח", "🌸"], ["לחם", "🍞"], ["חלב", "🥛"], ["גזר", "🥕"],
    ["תות", "🍓"], ["דבש", "🍯"], ["גשם", "🌧️"], ["שלג", "❄️"], ["ענן", "☁️"], ["פיל", "🐘"], ["דוב", "🐻"], ["נמר", "🐯"], ["פרה", "🐄"], ["נחש", "🐍"],
    ["זאב", "🐺"], ["קוף", "🐒"], ["תוף", "🥁"], ["כתר", "👑"], ["בצל", "🧅"], ["שום", "🧄"], ["אגס", "🍐"], ["רגל", "🦵"],
    ["חתול", "🐱"], ["כיסא", "🪑"], ["תפוח", "🍎"], ["בננה", "🍌"], ["מטוס", "✈️"], ["רכבת", "🚂"], ["שעון", "⌚"], ["כובע", "🎩"], ["פרפר", "🦋"], ["זברה", "🦓"],
    ["ארנב", "🐰"], ["מפתח", "🔑"], ["מכתב", "✉️"], ["כוכב", "⭐"], ["כדור", "⚽"], ["עוגה", "🎂"], ["פיצה", "🍕"], ["תפוז", "🍊"], ["חציל", "🍆"], ["תירס", "🌽"],
    ["כבשה", "🐑"], ["אריה", "🦁"], ["שועל", "🦊"], ["עכבר", "🐭"], ["מסוק", "🚁"], ["שמלה", "👗"], ["צעיף", "🧣"], ["מתנה", "🎁"], ["בלון", "🎈"], ["מחשב", "💻"], ["טבעת", "💍"],
    ["ענבים", "🍇"], ["אבטיח", "🍉"], ["ציפור", "🐦"], ["דבורה", "🐝"], ["טלפון", "📞"], ["גיטרה", "🎸"], ["גלידה", "🍦"], ["לימון", "🍋"], ["ברווז", "🦆"], ["ינשוף", "🦉"],
    ["תמנון", "🐙"], ["צפרדע", "🐸"], ["משאית", "🚚"], ["רמזור", "🚦"], ["פסנתר", "🎹"], ["כינור", "🎻"], ["חולצה", "👕"], ["כפפות", "🧤"], ["פעמון", "🔔"], ["יהלום", "💎"], ["ארמון", "🏰"], ["מצלמה", "📷"],
    ["מכונית", "🚗"], ["אופניים", "🚲"], ["אוטובוס", "🚌"], ["מלפפון", "🥒"], ["דולפין", "🐬"], ["לוויתן", "🐋"], ["גרביים", "🧦"], ["תרנגול", "🐓"], ["מספריים", "✂️"],
    ["מכנסיים", "👖"], ["משקפיים", "👓"], ["עיפרון", "✏️"], ["מזוודה", "🧳"], ["פינגווין", "🐧"], ["שוקולד", "🍫"], ["מטאטא", "🧹"], ["קרוסלה", "🎠"],
    ["אמבולנס", "🚑"], ["היפופוטם", "🦛"], ["טלסקופ", "🔭"], ["מיקרוסקופ", "🔬"], ["סופגנייה", "🍩"], ["חנוכייה", "🕎"], ["אוזניות", "🎧"],
    ["ברוקולי", "🥦"], ["אבוקדו", "🥑"], ["פטרייה", "🍄"], ["חמנייה", "🌻"], ["מטרייה", "☂️"], ["טרקטור", "🚜"], ["דינוזאור", "🦕"], ["אקורדיון", "🪗"], ["מצנח", "🪂"]
  ];
  const ABC = "אבגדהוזחטיכלמנסעפצקרשת".split("");
  const ROUNDS = 6;
  Games.register({
    id: "scramble", cat: "language", name: "מילים מבולבלות", icon: "🔤",
    desc: "סדרו את האותיות למילה הנכונה",
    how: `${ROUNDS} מילים. האותיות מבולבלות – לחצו עליהן לפי הסדר כדי ליצור את המילה (מימין לשמאל). התמונה עוזרת לנחש. ברמות גבוהות המילים ארוכות יותר, מרמה 4 התמונה מופיעה רק אחרי טעות, ומרמה 11 יש גם אותיות מיותרות.`,
    start(stage, level, api) {
      const len = level <= 7 ? 5 : level <= 17 ? 6 : 7;
      const pool = shuffle(WORDS.filter(([w]) => (len === 7 ? w.length >= 7 : w.length === len)));
      const hideHint = level >= 4;
      const nExtra = level >= 21 ? 2 : level >= 11 ? 1 : 0;
      const targetT = lerp(10, 25, level);
      stage.innerHTML = '<div class="scramble"><div class="hint"></div><div class="answer"></div><div class="tiles"></div><div class="srow"><button class="btn secondary sbtn" data-a="del">⌫ מחק אות</button></div></div>';
      const hintEl = $(".hint", stage), ansEl = $(".answer", stage), tilesEl = $(".tiles", stage);
      const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
      let round = 0, sum = 0, word, emoji, built = [], tries = 0, shown, lock = false;
      const times = [];

      function next() {
        if (round >= ROUNDS) return finish();
        [word, emoji] = pool[round % pool.length];
        round++; tries = 0; built = []; lock = false; shown = Date.now();
        api.status(`מילה ${round}/${ROUNDS}`); api.msg("לחצו על האותיות לפי הסדר", "soft");
        hintEl.textContent = hideHint ? "❓" : emoji;
        let letters;
        const extra = shuffle(ABC.filter((c) => !word.includes(c))).slice(0, nExtra);
        do { letters = shuffle(word.split("").concat(extra)); } while (letters.join("") === word);
        tilesEl.innerHTML = letters.map((ch, i) => `<button class="tile" data-i="${i}">${ch}</button>`).join("");
        draw();
      }
      function draw() {
        ansEl.style.setProperty("--n", word.length);
        ansEl.innerHTML = word.split("").map((_, i) => `<span class="slot ${built[i] ? "full" : ""}">${built[i] ? built[i].ch : ""}</span>`).join("");
      }
      tilesEl.addEventListener("click", (e) => {
        const t = e.target.closest(".tile"); if (!t || lock || t.classList.contains("used")) return;
        t.classList.add("used"); built.push({ ch: t.textContent, el: t }); api.sound.flip(); draw();
        if (built.length === word.length) check();
      });
      stage.querySelector('[data-a="del"]').addEventListener("click", () => {
        if (lock || !built.length) return;
        built.pop().el.classList.remove("used"); draw();
      });
      function check() {
        lock = true;
        if (built.map((b) => b.ch).join("") === word) {
          sum += tries === 0 ? 1 : 0.6; times.push((Date.now() - shown) / 1000);
          ansEl.classList.add("ok"); hintEl.textContent = emoji; api.sound.good(); api.msg(praise() + " " + word, "good");
          later(() => { ansEl.classList.remove("ok"); next(); }, 1300);
        } else {
          tries++; api.sound.bad(); ansEl.classList.add("bad");
          if (tries >= 2) {
            api.msg(`המילה היא: ${word}`, "soft"); hintEl.textContent = emoji;
            ansEl.innerHTML = word.split("").map((ch) => `<span class="slot full">${ch}</span>`).join("");
            later(() => { ansEl.classList.remove("bad"); next(); }, 2200);
          } else {
            api.msg("כמעט – נסו שוב" + (hideHint ? " (הנה רמז)" : ""), "soft"); hintEl.textContent = emoji;
            later(() => { ansEl.classList.remove("bad"); built.forEach((b) => b.el.classList.remove("used")); built = []; draw(); lock = false; }, 900);
          }
        }
      }
      function finish() {
        const acc = sum / ROUNDS, at = avg(times);
        api.finish({ score: Math.round(80 * acc + 20 * speedFactor(at, targetT) * acc), stats: [["מילים שפתרתם", `${times.length} מתוך ${ROUNDS}`], ["אותיות במילה", len === 7 ? "7 ומעלה" : len]] });
      }
      next();
      return { stop() { timers.forEach(clearTimeout); } };
    }
  });
})();
