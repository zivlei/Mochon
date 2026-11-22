/* זיכרון – פנים ושמות. Meet a few people (face + name), then match names to faces.
   Levels: 6 → 9 people, less time to meet them. Some questions go the other way (name → face).
   Score = 80% correct + 20% speed. */
(function () {
  // women and men are kept apart so every name fits the face it belongs to
  const FACES = {
    f: ["👵", "👩", "👱‍♀️", "👩‍🦰", "👩‍🦱", "👩‍🦳", "🧕", "👮‍♀️", "👩‍⚕️", "👷‍♀️", "👩‍🍳", "👩‍🌾", "👩‍🏫"],
    m: ["👴", "👨", "👱‍♂️", "👨‍🦰", "👨‍🦱", "👨‍🦳", "🧔", "👳‍♂️", "👮‍♂️", "👨‍⚕️", "👨‍🍳", "👨‍🌾", "👨‍🏫", "🤵"]
  };
  const NAMES = {
    f: ["רחל", "שרה", "מרים", "חנה", "לאה", "רבקה", "אסתר", "רות", "תמר", "נעמי", "דבורה", "שושנה", "אורה", "זהבה", "יפה", "ציפורה"],
    m: ["משה", "דוד", "יוסף", "אברהם", "יעקב", "שמואל", "אהרון", "בנימין", "אליהו", "יצחק", "חיים", "מנחם", "גדעון", "עמוס", "שלמה", "נחום"]
  };
  Games.register({
    id: "faces", cat: "memory", name: "פנים ושמות", icon: "🙋",
    desc: "הכירו אנשים וזכרו את שמם",
    how: `תכירו כמה אנשים – לכל אחד פרצוף ושם. זכרו אותם! אחר כך יופיע פרצוף, ובוחרים את השם שלו. לפעמים יופיע שם, ובוחרים את הפרצוף. ברמות גבוהות יש יותר אנשים ופחות זמן.`,
    start(stage, level, api) {
      const k = Math.round(lerp(6, 9, level));
      const meetMs = Math.round(k * lerp(2400, 1500, level) + 1000);
      const nf = Math.random() < 0.5 ? Math.floor(k / 2) : Math.ceil(k / 2);
      const pool = { f: { faces: shuffle(FACES.f.slice()), names: shuffle(NAMES.f.slice()) }, m: { faces: shuffle(FACES.m.slice()), names: shuffle(NAMES.m.slice()) } };
      const people = shuffle(Array.from({ length: k }, (_, i) => { const g = i < nf ? "f" : "m"; return { g, f: pool[g].faces.pop(), n: pool[g].names.pop() }; }));
      // wrong answers come from the same gender – first people met in this round, then unused faces / names
      const distract = (p, key) => {
        const met = shuffle(people.filter((x) => x !== p && x.g === p.g).map((x) => x[key]));
        return met.concat(pool[p.g][key === "f" ? "faces" : "names"].slice(0, 3)).slice(0, 3);
      };
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
            const reverse = Math.random() < lerp(0.3, 0.5, level);
            if (reverse) return { html: `<div class="q-line">${p.g === "f" ? "איך נראית" : "איך נראה"}</div><div class="big-q">${p.n}?</div>`, ans: p.f, opts: shuffle([p.f, ...distract(p, "f")]), prompt: "בחרו את הפרצוף", optClass: "emo" };
            return { html: `<div class="face-q">${p.f}</div><div class="q-line">${p.g === "f" ? "מה שמה?" : "מה שמו?"}</div>`, ans: p.n, opts: shuffle([p.n, ...distract(p, "n")]), prompt: "", optClass: "txt" };
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
