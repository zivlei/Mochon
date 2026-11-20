/* זיכרון – פנים ושמות. Meet a few people (face + name), then match names to faces.
   Levels: 3 → 8 people, less time to meet them; from level 16 some questions go the other way (name → face).
   Score = 80% correct + 20% speed. */
(function () {
  const FACES = ["👵", "👴", "👩", "👨", "👱‍♀️", "👱‍♂️", "👩‍🦰", "👨‍🦰", "👩‍🦱", "👨‍🦱", "👩‍🦳", "👨‍🦳", "🧔", "👲", "🧕", "👳‍♂️", "👧", "👦", "👮‍♀️", "👨‍🍳", "👩‍⚕️", "👨‍🌾", "👷‍♀️", "🤵"];
  const NAMES = ["רחל", "משה", "שרה", "דוד", "מרים", "יוסף", "חנה", "אברהם", "לאה", "יעקב", "רבקה", "שמואל", "אסתר", "אהרון", "רות", "בנימין",
    "תמר", "אליהו", "נעמי", "יצחק", "דבורה", "חיים", "שושנה", "מנחם", "אורה", "גדעון", "זהבה", "עמוס", "יפה", "שלמה", "ציפורה", "נחום"];
  Games.register({
    id: "faces", cat: "memory", name: "פנים ושמות", icon: "🙋",
    desc: "הכירו אנשים וזכרו את שמם",
    how: `תכירו כמה אנשים – לכל אחד פרצוף ושם. זכרו אותם! אחר כך יופיע פרצוף, ובוחרים את השם שלו. מרמה 16 לפעמים יופיע שם, ובוחרים את הפרצוף. ברמות גבוהות יש יותר אנשים ופחות זמן.`,
    start(stage, level, api) {
      const k = Math.round(lerp(3, 8, level));
      const meetMs = Math.round(k * lerp(3000, 1600, level) + 1000);
      const people = shuffle(FACES.slice()).slice(0, k).map((f) => ({ f, n: null }));
      const names = shuffle(NAMES.slice());
      people.forEach((p, i) => (p.n = names[i]));
      const T = timersKit();
      let quiz = null;
      stage.innerHTML = `<div class="board">
          <div class="b-main"><div class="grid meet"></div></div>
          <div class="timebar small"><i></i></div>
          <div class="b-row"><button class="btn slim ready">✔ הכרתי את כולם</button></div></div>`;
      const grid = $(".grid", stage);
      grid.innerHTML = people.map((p) => `<div class="person"><span>${p.f}</span><b>${p.n}</b></div>`).join("");
      const fit = () => grid.isConnected && fitIn(grid, k, 1.25); fit();
      api.onResize(fit);
      api.status("היכרות"); api.msg("זכרו את השמות", "soft");
      runBar($(".timebar i", stage), meetMs);
      const go = () => {
        if (quiz) return;
        const order = shuffle(people.slice()).concat(shuffle(people.slice())).slice(0, Math.max(6, k));
        quiz = runQuiz(stage, api, {
          rounds: order.length, targetT: 4, accW: 80, unit: "שאלה",
          make(i) {
            const p = order[i - 1];
            const reverse = level >= 16 && Math.random() < 0.4;
            const others = shuffle(people.filter((x) => x !== p)).slice(0, 3);
            if (reverse) return { html: `<div class="q-line">איך נראה/ית</div><div class="big-q">${p.n}?</div>`, ans: p.f, opts: shuffle([p, ...others].map((x) => x.f)), prompt: "בחרו את הפרצוף", optClass: "emo" };
            return { html: `<div class="face-q">${p.f}</div><div class="q-line">מה השם?</div>`, ans: p.n, opts: shuffle([p, ...others].map((x) => x.n)), prompt: "", optClass: "txt" };
          },
          label: (v) => v
        });
      };
      T.later(go, meetMs);
      $(".ready", stage).onclick = go;
      return { stop() { T.clear(); quiz && quiz.stop(); } };
    }
  });
})();
