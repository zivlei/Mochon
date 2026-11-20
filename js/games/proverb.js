/* שפה – השלמת פתגם. Finish a well-known Hebrew saying.
   Levels: choose the ending from 3 → 4 options; from level 21 find the single missing word.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 8;
  // [beginning, ending] – the missing word for the hard levels is marked with *
  const P = [
    ["אל תסתכל בקנקן", "אלא *במה שיש בו"], ["אין עשן", "בלי *אש"], ["טוב שכן קרוב", "מאח *רחוק"], ["כל ההתחלות", "*קשות"],
    ["מרוב עצים", "לא רואים את *היער"], ["ואהבת", "לרעך *כמוך"], ["דרך ארץ", "קדמה *לתורה"], ["אם אין אני לי", "*מי לי"],
    ["סוף מעשה", "*במחשבה תחילה"], ["יגעת ומצאת", "*תאמין"], ["כל המוסיף", "*גורע"], ["לא המדרש עיקר", "אלא *המעשה"],
    ["שתיקה", "*כהודאה"], ["אין חכם", "כבעל *ניסיון"], ["אל תדון את חברך", "עד שתגיע *למקומו"], ["מה ששנוא עליך", "*לחברך לא תעשה"],
    ["תפסת מרובה", "לא *תפסת"], ["מילה בסלע", "*משתוקא בתרין"], ["השכם", "*והערב"], ["גם זו", "*לטובה"],
    ["חכמה בגויים", "*תאמין"], ["אין לך אדם", "שאין לו *שעה"], ["לא דובים", "ולא *יער"], ["כבדהו", "*וחשדהו"],
    ["דברי חכמים", "*בנחת נשמעים"], ["אחרי מות", "*קדושים אמור"], ["עין תחת", "*עין"], ["אבן שמאסו הבונים", "הייתה *לראש פינה"],
    ["אין דבר העומד", "בפני *הרצון"], ["הגיעו מים", "עד *נפש"], ["כל ישראל", "ערבים *זה לזה"], ["לכל זמן", "ועת לכל *חפץ"],
    ["כל הפותח בברכה", "*מעיד על עצמו"], ["בשורות", "*טובות"], ["עד מאה", "*ועשרים"], ["כל העולם כולו", "גשר צר *מאוד"],
    ["אל תעשה לאחרים", "מה שלא היית רוצה *שיעשו לך"], ["מים גנובים", "*ימתקו"], ["בגלל מסמר", "*אבדה פרסה"], ["הכסף", "יענה את *הכל"]
  ];
  const ending = (p) => p[1].replace("*", "");
  const missing = (p) => p[1].split("*")[1].split(" ")[0];
  Games.register({
    id: "proverb", cat: "language", name: "השלמת פתגם", icon: "📜",
    desc: "השלימו את הפתגם המוכר",
    how: `מופיעה תחילתו של פתגם או ביטוי מוכר. בחרו את ההמשך הנכון. ${ROUNDS} שאלות.<br>ברמות הראשונות יש 3 אפשרויות, אחר כך 4, ומרמה 21 חסרה מילה אחת בלבד – בחרו אותה.`,
    start(stage, level, api) {
      const nOpt = level <= 8 ? 3 : 4;
      const order = shuffle(P.slice()).slice(0, ROUNDS);
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(7, 10, level), accW: 80, optClass: "txt",
        make(i) {
          const p = order[i - 1];
          const wordMode = level >= 21 || (level >= 15 && Math.random() < 0.4);
          if (wordMode) {
            const w = missing(p);
            const shown = p[0] + " " + p[1].replace("*" + w, "<span class='qmark'>____</span>").replace("*", "");
            const others = shuffle([...new Set(P.map(missing))].filter((x) => x !== w)).slice(0, nOpt - 1);
            return { html: `<div class="q-line">איזו מילה חסרה?</div><div class="q-line big">${shown}</div>`, ans: w, opts: shuffle([w, ...others]) };
          }
          const others = shuffle([...new Set(P.map(ending))].filter((x) => x !== ending(p))).slice(0, nOpt - 1);
          return { html: `<div class="q-line">השלימו את הפתגם:</div><div class="q-line big">${p[0]} <span class="qmark">...</span></div>`, ans: ending(p), opts: shuffle([ending(p), ...others]) };
        }
      });
    }
  });
})();
