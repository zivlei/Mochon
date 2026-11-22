/* חשבון – לוח זמנים. Everyday time sums: when will the bus arrive, when to leave, how long did it take?
   Levels: forwards, backwards and time between two clocks from the start; exact minutes; from level 8 a second stage is added.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 8;
  const hm = (m) => { m = ((m % 1440) + 1440) % 1440; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`; };
  const dur = (m) => (m < 60 ? `${m} דקות` : m % 60 ? `${Math.floor(m / 60)} ${Math.floor(m / 60) === 1 ? "שעה" : "שעות"} ו-${m % 60} דקות` : `${m / 60 === 1 ? "שעה" : m / 60 === 2 ? "שעתיים" : m / 60 + " שעות"}`);
  const TRIPS = [["🚌", "האוטובוס יוצא", "הנסיעה נמשכת"], ["🚆", "הרכבת יוצאת", "הנסיעה נמשכת"], ["🍲", "שמתם מרק על האש", "צריך לבשל"], ["🩺", "התור לרופא", "הביקור נמשך"], ["🚶", "יצאתם להליכה", "ההליכה נמשכת"], ["🎬", "הסרט מתחיל", "הסרט נמשך"]];
  Games.register({
    id: "timetable", cat: "math", name: "לוח זמנים", icon: "🚌",
    desc: "מתי מגיעים? מתי לצאת? כמה זמן?",
    how: `שאלות על זמנים מהיום־יום, למשל: "האוטובוס יוצא ב-10:40 והנסיעה 35 דקות – מתי מגיעים?". בחרו את התשובה. ${ROUNDS} שאלות.<br>מחשבים גם אחורה ("מתי לצאת?") וגם כמה זמן עבר. מרמה 4 הדקות מדויקות, ומרמה 8 יש שני שלבים שצריך לחבר.`,
    start(stage, level, api) {
      const step = level <= 3 ? 5 : 1;
      const maxD = Math.round(lerp(105, 230, level));
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(9, 16, level), accW: 80, optClass: "time",
        make() {
          const t = pick(TRIPS);
          const kind = pick(["fwd", "back", "between"]);
          let start = rand(7 * 12, 20 * 12) * 5 + (step === 1 ? rand(0, 4) : 0);
          const main = Math.max(step, Math.round(rand(25, maxD) / step) * step);
          const extra = level >= 8 && kind !== "between" ? rand(7, 40) : 0, d = main + extra;
          const more = extra ? ` ועוד <b>${dur(extra)}</b> התארגנות` : "";
          const end = start + d;
          const timeOpts = (ans) => numOptions(ans, 4, [10, 20, 30, 60]).map(hm);
          if (kind === "fwd") return { html: `<div class="face-q">${t[0]}</div><div class="q-line">${t[1]} ב-<b>${hm(start)}</b>.<br>${t[2]} <b>${dur(main)}</b>${more}.</div><div class="q-line big">מתי מסיימים?</div>`, ans: hm(end), opts: timeOpts(end) };
          if (kind === "back") return { html: `<div class="face-q">${t[0]}</div><div class="q-line">רוצים לסיים ב-<b>${hm(end)}</b>.<br>${t[2]} <b>${dur(main)}</b>${more}.</div><div class="q-line big">מתי צריך להתחיל?</div>`, ans: hm(start), opts: timeOpts(start) };
          const durs = numOptions(d, 4, [10, 20, 30, 60]).map(dur);
          return { html: `<div class="face-q">${t[0]}</div><div class="q-line">התחלה: <b>${hm(start)}</b> · סיום: <b>${hm(end)}</b></div><div class="q-line big">כמה זמן זה נמשך?</div>`, ans: dur(d), opts: durs, optClass: "txt" };
        }
      });
    }
  });
})();
