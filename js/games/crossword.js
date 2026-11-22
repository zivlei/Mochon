/* שפה – תשבץ. A crossword-style clue; some letters are given, tap the missing ones in order.
   Levels: general-knowledge clues; longer words, few → no given letters, more extra letters to choose from.
   Score = 80% words solved without help + 20% speed. */
(function () {
  const ROUNDS = 6;
  const CLUES = `כוכב הלכת האדום|מאדים
בירת צרפת|פריז
ההר שבו ניתנה התורה|סיני
המלך שבנה את בית המקדש הראשון|שלמה
החודש העברי שבו מתחיל חנוכה|כסלו
החודש העברי של פסח|ניסן
החודש העברי שלפני תשרי|אלול
המגילה שקוראים בפורים|אסתר
הנהר הגדול של מצרים|נילוס
בירת איטליה|רומא
בירת יוון|אתונה
בירת בריטניה|לונדון
בירת רוסיה|מוסקבה
בירת אוסטריה|וינה
בירת ספרד|מדריד
בירת הונגריה|בודפשט
חוזה המדינה|הרצל
כתב את מילות "התקווה"|אימבר
המשורר הלאומי|ביאליק
מחייה השפה העברית: אליעזר בן־...|יהודה
מכשיר למדידת חום|מדחום
מכשיר שמראה איפה הצפון|מצפן
האבן היקרה הקשה מכולן|יהלום
מתכת שהיא נוזל בטמפרטורת החדר|כספית
הגז שהגוף צריך מהאוויר|חמצן
הגז הקל ביותר|מימן
היונק הגדול בעולם|לווייתן
עוף גדול שלא עף, ורץ מהר|יען
האי שבירתו ניקוסיה|קפריסין
תבלין צהוב ויקר מאוד|זעפרן
לפי המסורת יש בו תרי״ג גרעינים|רימון
פורחת בט״ו בשבט|שקדייה
עומד מול התזמורת עם שרביט|מנצח
כותב יצירות מוזיקליות|מלחין
ספר שמסביר מילים|מילון
חוקר את הכוכבים|אסטרונום
אחיו של משה|אהרון
אחותו של משה|מרים
הנביא שנבלע בבטן הדג|יונה
הגיבור שכוחו בשערו|שמשון
הענק שדוד הכריע בקלע|גוליית
חלם על סולם ומלאכים|יעקב
משחק עם צריחים, רצים ופרשים|שחמט
הקו הדמיוני סביב אמצע כדור הארץ|משווה
כסף ששומרים לעת צורך|חיסכון
ההר המושלג בצפון הארץ|חרמון
מבצר הורדוס מול ים המלח|מצדה
עיר הנמל בדרום, על הים האדום|אילת
העיר שעל הכרמל|חיפה
ראשת הממשלה במלחמת יום הכיפורים|גולדה`.split("\n").map((l) => l.trim().split("|"));
  const ABC = "אבגדהוזחטיכלמנסעפצקרשת".split("");
  Games.register({
    id: "crossword", cat: "language", name: "תשבץ", icon: "✏️",
    desc: "פתרו הגדרה והשלימו את האותיות",
    how: `מופיעה הגדרה, כמו בתשבץ, וחלק מהאותיות כבר כתובות. געו באותיות החסרות לפי הסדר (מימין לשמאל). אות לא נכונה לא תיכנס. ${ROUNDS} הגדרות.<br>ברמות גבוהות המילים ארוכות יותר, יש פחות אותיות גלויות ויותר אותיות לבחירה.`,
    start(stage, level, api) {
      const reveal = lerp(0.3, 0, level);
      const extra = Math.round(lerp(3, 7, level));
      const maxLen = level <= 8 ? 5 : level <= 18 ? 6 : 9;
      const minLen = level <= 8 ? 3 : level <= 18 ? 4 : 5;
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
