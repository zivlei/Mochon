/* חשבון – לוח זמנים. Everyday time sums: when will the bus arrive, when to leave, how long did it take?
   Levels: round minutes, same hour → crossing the hour → going backwards → time between two clocks.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 8;
  const hm = (m) => { m = ((m % 1440) + 1440) % 1440; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`; };
  const dur = (m) => (m < 60 ? `${m} דקות` : m % 60 ? `${Math.floor(m / 60)} ${Math.floor(m / 60) === 1 ? "שעה" : "שעות"} ו-${m % 60} דקות` : `${m / 60 === 1 ? "שעה" : m / 60 === 2 ? "שעתיים" : m / 60 + " שעות"}`);
  const TRIPS = [["🚌", "האוטובוס יוצא", "הנסיעה נמשכת"], ["🚆", "הרכבת יוצאת", "הנסיעה נמשכת"], ["🍲", "שמתם מרק על האש", "צריך לבשל"], ["🩺", "התור לרופא", "הביקור נמשך"], ["🚶", "יצאתם להליכה", "ההליכה נמשכת"], ["🎬", "הסרט מתחיל", "הסרט נמשך"]];
  Games.register({
    id: "timetable", cat: "math", name: "לוח זמנים", icon: "🚌",
    desc: "מתי מגיעים? מתי לצאת? כמה זמן?",
    how: `שאלות על זמנים מהיום־יום, למשל: "האוטובוס יוצא ב-10:40 והנסיעה 35 דקות – מתי מגיעים?". בחרו את התשובה. ${ROUNDS} שאלות.<br>ברמות גבוהות עוברים שעה עגולה, מחשבים אחורה ("מתי לצאת?") ומחשבים כמה זמן עבר.`,
    start(stage, level, api) {
      const step = level <= 6 ? 15 : level <= 14 ? 5 : 1;
      const maxD = Math.round(lerp(45, 190, level));
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(7, 12, level), accW: 80, optClass: "time",
        make() {
          const t = pick(TRIPS);
          const kinds = ["fwd"]; if (level >= 9) kinds.push("back"); if (level >= 16) kinds.push("between");
          const kind = pick(kinds);
          let start = rand(7 * 4, 20 * 4) * 15 + (step < 15 ? rand(0, 11) * 5 : 0) + (step === 1 ? rand(0, 4) : 0);
          if (level <= 4) start = Math.floor(start / 60) * 60 + pick([0, 15, 30]);
          let d = Math.max(step, Math.round(rand(10, maxD) / step) * step);
          if (level <= 4) d = pick([15, 30, 45].filter((x) => x <= maxD));
          const end = start + d;
          const timeOpts = (ans) => shuffle([ans, ...shuffle([ans + 10, ans - 10, ans + 60, ans - 60, ans + 5, ans - 5, ans + 20]).filter((x) => x !== ans).slice(0, 3)].map(hm));
          if (kind === "fwd") return { html: `<div class="face-q">${t[0]}</div><div class="q-line">${t[1]} ב-<b>${hm(start)}</b>.<br>${t[2]} <b>${dur(d)}</b>.</div><div class="q-line big">מתי מסיימים?</div>`, ans: hm(end), opts: timeOpts(end) };
          if (kind === "back") return { html: `<div class="face-q">${t[0]}</div><div class="q-line">רוצים לסיים ב-<b>${hm(end)}</b>.<br>${t[2]} <b>${dur(d)}</b>.</div><div class="q-line big">מתי צריך להתחיל?</div>`, ans: hm(start), opts: timeOpts(start) };
          const ds = shuffle([d, d + 10, d - 10, d + 15, d - 5, d + 30].filter((x) => x > 0 && x !== d)).slice(0, 3);
          return { html: `<div class="face-q">${t[0]}</div><div class="q-line">התחלה: <b>${hm(start)}</b> · סיום: <b>${hm(end)}</b></div><div class="q-line big">כמה זמן זה נמשך?</div>`, ans: dur(d), opts: shuffle([d, ...ds]).map(dur), optClass: "txt" };
        }
      });
    }
  });
})();
