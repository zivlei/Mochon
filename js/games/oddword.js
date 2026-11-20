/* שפה – מה לא שייך? Pick the word that doesn't belong. Levels: distant groups → close groups (fruit vs vegetables), 4 → 5 words. */
(function () {
  const G = {
    fruit: ["תפוח", "בננה", "תפוז", "ענבים", "אבטיח", "אגס", "שזיף", "אפרסק", "תות", "לימון", "מנגו", "רימון"],
    veg: ["עגבנייה", "מלפפון", "גזר", "חסה", "בצל", "פלפל", "חציל", "כרוב", "קישוא", "תירס", "דלעת", "סלק"],
    mammal: ["כלב", "חתול", "סוס", "פרה", "אריה", "פיל", "קוף", "ארנב", "דוב", "זאב", "שועל", "גמל"],
    bird: ["יונה", "תוכי", "נשר", "ינשוף", "ברווז", "חסידה", "עורב", "דרור", "תרנגול", "פינגווין"],
    vehicle: ["מכונית", "אוטובוס", "רכבת", "מטוס", "ספינה", "אופניים", "משאית", "מסוק", "אופנוע", "מונית"],
    clothes: ["חולצה", "מכנסיים", "שמלה", "חצאית", "מעיל", "כובע", "גרביים", "צעיף", "סוודר", "פיג'מה"],
    music: ["גיטרה", "פסנתר", "כינור", "תוף", "חליל", "חצוצרה", "נבל", "אקורדיון"],
    color: ["אדום", "כחול", "ירוק", "צהוב", "כתום", "סגול", "ורוד", "חום", "שחור", "לבן"],
    furniture: ["כיסא", "שולחן", "מיטה", "ארון", "ספה", "מדף", "כורסה", "שידה"],
    kitchen: ["סיר", "מחבת", "צלחת", "כוס", "מזלג", "כף", "סכין", "קומקום", "מצקת"],
    job: ["רופא", "מורה", "נהג", "טבח", "שוטר", "נגר", "חשמלאי", "אחות", "טייס", "אופה", "דוור"],
    city: ["ירושלים", "חיפה", "תל אביב", "באר שבע", "נתניה", "אילת", "טבריה", "צפת", "עכו", "אשדוד"]
  };
  const CLOSE = [["fruit", "veg"], ["mammal", "bird"], ["furniture", "kitchen"], ["vehicle", "furniture"], ["clothes", "furniture"], ["music", "kitchen"]];
  const ROUNDS = 8;
  Games.register({
    id: "oddword", cat: "language", name: "מה לא שייך?", icon: "🧺",
    desc: "מצאו את המילה שלא שייכת לקבוצה",
    how: `${ROUNDS} שאלות. כל המילים שייכות לאותה קבוצה – חוץ מאחת. בחרו אותה. ברמות גבוהות הקבוצות קרובות יותר (למשל פירות וירקות) ויש יותר מילים.`,
    start(stage, level, api) {
      const n = level >= 16 ? 5 : 4;
      const keys = Object.keys(G);
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(7, 12, level), optClass: "txt", accW: 80,
        make() {
          let main, other;
          if (level >= 21 || (level >= 11 && Math.random() < 0.5)) { [main, other] = shuffle(pick(CLOSE).slice()); }
          else { main = pick(keys); other = pick(keys.filter((k) => k !== main)); }
          const words = shuffle(G[main].slice()).slice(0, n - 1);
          const odd = pick(G[other]);
          return { html: '<div class="q-line big">איזו מילה לא שייכת?</div>', ans: odd, opts: shuffle([...words, odd]) };
        }
      });
    }
  });
})();
