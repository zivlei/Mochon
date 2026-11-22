/* יום־יום – תרופות בזמן. Remember a daily medicine schedule, then answer: which pill now? when is this pill?
   Levels: 5 → 7 medicines, less time to read; "with food" details always; from level 11 also "which one comes next".
   Score = 80% correct + 20% speed. */
(function () {
  const MEDS = [["ויטמין D", "#f2c230"], ["לחץ דם", "#e57373"], ["סוכר", "#64b5f6"], ["כולסטרול", "#81c784"], ["דילול דם", "#ba68c8"], ["ברזל", "#8d6e63"], ["סידן", "#f5f5f5"], ["לב", "#ff8a65"], ["שינה", "#7986cb"], ["עיכול", "#4db6ac"]];
  const SLOTS = ["7:00", "8:00", "9:00", "10:00", "12:00", "13:00", "14:00", "16:00", "18:00", "19:00", "20:00", "22:00"];
  const NOTES = ["עם האוכל", "לפני האוכל", "עם כוס מים", "אחרי האוכל"];
  Games.register({
    id: "pills", cat: "daily", name: "תרופות בזמן", icon: "💊",
    desc: "זכרו איזו תרופה לוקחים ומתי",
    how: `יופיע לוח תרופות – איזו תרופה ובאיזו שעה. זכרו אותו! אחר כך יגיעו שאלות כמו "השעה 13:00 – איזו תרופה לוקחים?" או "מתי לוקחים את התרופה ללחץ דם?". ברמות גבוהות יש יותר תרופות, פחות זמן לקרוא, ושואלים גם איך לוקחים (עם האוכל, לפני האוכל...). מרמה 11 שואלים גם איזו תרופה באה אחרי תרופה אחרת.`,
    start(stage, level, api) {
      const k = Math.round(lerp(5, 7, level));
      const readMs = Math.round(k * lerp(3300, 2200, level) + 1500);

      const meds = shuffle(MEDS.slice()).slice(0, k);
      const times = shuffle(SLOTS.slice()).slice(0, k).sort((a, b) => parseInt(a) - parseInt(b));
      const plan = meds.map((m, i) => ({ name: m[0], color: m[1], time: times[i], note: pick(NOTES) }));
      const T = timersKit();
      let quiz = null;
      const pill = (p) => `<span class="pill" style="--pc:${p.color}"></span>`;
      stage.innerHTML = `<div class="board">
          <div class="b-main"><div class="medlist">${plan.map((p) => `<div class="med"><b class="mt">${p.time}</b>${pill(p)}<span class="mn">${p.name}</span><small>${p.note}</small></div>`).join("")}</div></div>
          <div class="timebar small"><i></i></div>
          <div class="b-row"><button class="btn slim ready">✔ זכרתי</button></div></div>`;
      api.status("לוח התרופות"); api.msg("זכרו את לוח התרופות", "soft");
      runBar($(".timebar i", stage), readMs);
      const go = () => {
        if (quiz) return;
        const ROUNDS = Math.max(6, k + 2);
        quiz = runQuiz(stage, api, {
          rounds: ROUNDS, targetT: 5, accW: 80, optClass: "txt",
          make() {
            const p = pick(plan);
            const kinds = ["which", "when", "how"];
            const next = plan[plan.indexOf(p) + 1];
            if (level >= 11 && next) kinds.push("next");
            // every wrong answer is on the schedule too, so just recognising a name or a time is not enough
            const from = (x, key) => shuffle([x[key], ...shuffle(plan.filter((o) => o !== x).map((o) => o[key])).slice(0, 3)]);
            const kind = pick(kinds);
            if (kind === "which") return { html: `<div class="face-q">⏰</div><div class="q-line big">השעה ${p.time}.<br>איזו תרופה לוקחים?</div>`, ans: p.name, opts: from(p, "name") };
            if (kind === "next") return { html: `<div class="face-q">⏭️</div><div class="q-line big">איזו תרופה לוקחים<br>מיד אחרי "${p.name}"?</div>`, ans: next.name, opts: shuffle([next.name, ...shuffle(plan.filter((o) => o !== p && o !== next).map((o) => o.name)).slice(0, 3)]) };
            if (kind === "when") return { html: `<div class="face-q">${pill(p)}</div><div class="q-line big">מתי לוקחים את התרופה<br>"${p.name}"?</div>`, ans: p.time, opts: from(p, "time"), optClass: "time" };
            return { html: `<div class="face-q">${pill(p)}</div><div class="q-line big">איך לוקחים את "${p.name}"?</div>`, ans: p.note, opts: shuffle(NOTES.slice()) };
          }
        });
      };
      T.later(go, readMs);
      $(".ready", stage).onclick = go;
      return { stop() { T.clear(); quiz && quiz.stop(); } };
    }
  });
})();
