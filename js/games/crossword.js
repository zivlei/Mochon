/* שפה – תשבץ. A crossword-style clue; some letters are given, tap the missing ones in order.
   Levels: short words with many given letters → longer words, fewer given letters, more extra letters to choose from.
   Score = 80% words solved without help + 20% speed. */
(function () {
  const ROUNDS = 6;
  const CLUES = [
    ["פרי צהוב וארוך", "בננה"], ["בעל חיים שנובח", "כלב"], ["מאירה ביום בשמיים", "שמש"], ["יורד מהשמיים בחורף", "גשם"], ["משקה לבן מהפרה", "חלב"],
    ["אופים אותו בתנור, פרוסה ממנו בבוקר", "לחם"], ["ירק כתום שארנבים אוהבים", "גזר"], ["מדביקים עליו בול ושולחים", "מכתב"], ["בה מבשלים מרק", "סיר"], ["כלי נגינה עם קלידים", "פסנתר"],
    ["בירת ישראל", "ירושלים"], ["החודש הראשון בשנה האזרחית", "ינואר"], ["חג האורים", "חנוכה"], ["חג המצות", "פסח"], ["היום השביעי בשבוע", "שבת"],
    ["מראה את השעה", "שעון"], ["שותים בו תה", "כוס"], ["בעל חיים עם חדק", "פיל"], ["מלך החיות", "אריה"], ["חרק שמייצר דבש", "דבורה"],
    ["ציפור הלילה", "ינשוף"], ["פותחים איתו דלת נעולה", "מפתח"], ["רואה בו את עצמך", "מראה"], ["מגן מגשם", "מטרייה"], ["כלי תחבורה על פסים", "רכבת"],
    ["ים מלוח מאוד בישראל", "המלח"], ["העיר הדרומית בישראל", "אילת"], ["מתוק, עושות אותו דבורות", "דבש"], ["פרי אדום קטן עם עלים ירוקים", "תות"], ["לובשים על הראש", "כובע"],
    ["עוף שמטיל ביצים", "תרנגולת"], ["קוראים בו, יש לו דפים", "ספר"], ["אוכלים איתו מרק", "כף"], ["הצבע של השמיים", "כחול"], ["ההפך של לילה", "יום"],
    ["משחק עם מלך ומלכה על לוח", "שחמט"], ["שולחים ממנו הודעה ומדברים", "טלפון"], ["פרח אדום עם קוצים", "ורד"], ["ירק ירוק וארוך לסלט", "מלפפון"], ["אוכלים בה ביום הולדת", "עוגה"],
    ["רופא של שיניים", "רופא שיניים"], ["חג שבו יושבים בסוכה", "סוכות"], ["מכסה בלילה במיטה", "שמיכה"], ["צבע הדשא", "ירוק"], ["כלי לכתיבה", "עט"]
  ].filter(([, w]) => !w.includes(" "));
  const ABC = "אבגדהוזחטיכלמנסעפצקרשת".split("");
  Games.register({
    id: "crossword", cat: "language", name: "תשבץ", icon: "✏️",
    desc: "פתרו הגדרה והשלימו את האותיות",
    how: `מופיעה הגדרה, כמו בתשבץ, וחלק מהאותיות כבר כתובות. געו באותיות החסרות לפי הסדר (מימין לשמאל). אות לא נכונה לא תיכנס. ${ROUNDS} הגדרות.<br>ברמות גבוהות המילים ארוכות יותר, יש פחות אותיות גלויות ויותר אותיות לבחירה.`,
    start(stage, level, api) {
      const reveal = lerp(0.6, 0.15, level);
      const extra = Math.round(lerp(1, 5, level));
      const maxLen = level <= 8 ? 4 : level <= 18 ? 5 : 8;
      const minLen = level <= 8 ? 2 : level <= 18 ? 3 : 4;
      const pool = shuffle(CLUES.filter(([, w]) => w.length >= minLen && w.length <= maxLen));
      const T = timersKit();
      let round = 0, sum = 0, cur = null, errs = 0, helps = 0;
      const times = [];
      stage.innerHTML = `<div class="scramble"><div class="clue"></div><div class="answer"></div><div class="tiles"></div>
        <div class="srow"><button class="btn secondary sbtn" data-a="help">💡 רמז – אות אחת</button></div></div>`;
      const clueEl = $(".clue", stage), ansEl = $(".answer", stage), tilesEl = $(".tiles", stage);
      function next() {
        if (round >= ROUNDS) return finish();
        const [clue, word] = pool[round % pool.length];
        round++;
        const letters = word.split("");
        const n = letters.length;
        const shownIdx = new Set(shuffle([...Array(n).keys()]).slice(0, Math.min(n - 1, Math.round(n * reveal))));
        cur = { word, letters, filled: letters.map((ch, i) => (shownIdx.has(i) ? ch : null)), errors: 0, helps: 0, t0: Date.now() };
        api.status(`הגדרה ${round}/${ROUNDS}`); api.msg("געו באותיות החסרות", "soft");
        clueEl.textContent = clue;
        const need = letters.filter((_, i) => !shownIdx.has(i));
        const extras = shuffle(ABC.filter((x) => !need.includes(x))).slice(0, extra);
        tilesEl.innerHTML = shuffle([...need, ...extras]).map((ch, i) => `<button class="tile" data-i="${i}">${ch}</button>`).join("");
        draw();
      }
      function draw() {
        ansEl.style.setProperty("--n", cur.letters.length);
        const nextI = cur.filled.indexOf(null);
        ansEl.innerHTML = cur.filled.map((ch, i) => `<span class="slot ${ch ? "full" : ""} ${i === nextI ? "nexts" : ""}">${ch || ""}</span>`).join("");
      }
      function place(ch, tile) {
        const i = cur.filled.indexOf(null); if (i < 0) return;
        const want = cur.letters[i];
        const norm = (c) => ({ "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" }[c] || c);
        if (norm(ch) === norm(want)) {
          cur.filled[i] = want; if (tile) tile.classList.add("used"); api.sound.flip(); draw();
          if (!cur.filled.includes(null)) solved();
        } else { cur.errors++; tile && tile.classList.add("nope"); T.later(() => tile && tile.classList.remove("nope"), 400); api.sound.bad(); api.msg("לא האות הזאת – נסו אחרת", "soft"); }
      }
      function solved() {
        const c = cur; cur = { ...c, done: true };
        sum += Math.max(0.3, 1 - 0.15 * c.errors - 0.25 * c.helps); errs += c.errors; helps += c.helps; times.push((Date.now() - c.t0) / 1000);
        ansEl.classList.add("ok"); api.sound.good(); api.msg(praise() + " " + c.word, "good");
        T.later(() => { ansEl.classList.remove("ok"); next(); }, 1300);
      }
      tilesEl.addEventListener("click", (e) => {
        const t = e.target.closest(".tile"); if (!t || !cur || cur.done || t.classList.contains("used")) return;
        place(t.textContent, t);
      });
      stage.querySelector('[data-a="help"]').onclick = () => {
        if (!cur || cur.done) return;
        const i = cur.filled.indexOf(null); if (i < 0) return;
        const want = cur.letters[i];
        const tile = [...tilesEl.querySelectorAll(".tile:not(.used)")].find((t) => t.textContent === want);
        cur.helps++; place(want, tile);
      };
      function finish() {
        const acc = sum / ROUNDS, at = avg(times);
        api.finish({ score: Math.round(80 * acc + 20 * speedFactor(at, lerp(10, 20, level)) * acc), stats: [["הגדרות", ROUNDS], ["אותיות שגויות", errs], ["רמזים", helps]] });
      }
      next();
      return { stop: T.clear };
    }
  });
})();
