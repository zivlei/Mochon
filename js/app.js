/* מוחון – screens, navigation and in-app updates */
"use strict";
(function () {
  const view = $("#view");
  const AVATARS = ["👵", "👴", "🧓", "👩‍🦳", "👨‍🦳", "👩", "👨", "🌸", "🌻", "🐱", "🐶", "⭐"];
  let running = null, newAvatar = AVATARS[0];

  function stopGame() {
    if (running) { try { running.handle && running.handle.stop && running.handle.stop(); } catch (e) {} running = null; }
    view.classList.remove("playing"); document.body.classList.remove("in-game");
  }
  function go(html, inGame) {
    stopGame();
    const bar = $("#update-bar"); if (bar && inGame) bar.remove();
    view.innerHTML = html;
    view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter");
    window.scrollTo(0, 0);
    if (!inGame) Updater.maybeShow();
  }

  const backBtn = (act, arg, label) => `<button class="backbtn" data-act="${act}" ${arg ? `data-arg="${arg}"` : ""}>→ ${label || "חזרה"}</button>`;
  const stars = (s) => (s >= 90 ? 3 : s >= 70 ? 2 : s >= PASS_SCORE ? 1 : 0);
  const starStr = (s) => "★".repeat(stars(s)) + "☆".repeat(3 - stars(s));

  // ---------- Profiles ----------
  function showProfiles() {
    const us = Store.data.users;
    go(`
      <h1 class="title">מוחון 🧠</h1>
      <p class="sub">אימון יומי למוח – בכיף ובנחת</p>
      <h2 class="h2 center">מי משחק היום?</h2>
      <div class="profiles">
        ${us.map((u) => `<button class="profile" data-act="pickUser" data-arg="${u.id}"><span class="av">${u.avatar}</span><span class="pname">${esc(u.name)}</span></button>`).join("")}
        <button class="profile add" data-act="newUser"><span class="av">➕</span><span class="pname">שחקן חדש</span></button>
      </div>
      <p class="foot">טיפ: באייפד או באייפון – פתחו ב-Safari, לחצו "שיתוף" ואז "הוסף למסך הבית".<br><span class="ver">גרסה ${APP_VERSION}</span></p>`);
  }

  function showNewUser() {
    newAvatar = AVATARS[0];
    go(`
      <div class="narrow">
      ${Store.data.users.length ? backBtn("profiles") : ""}
      <h1 class="title">ברוכים הבאים למוחון 🧠</h1>
      <label class="lbl" for="nu-name">מה השם?</label>
      <input id="nu-name" class="input" maxlength="20" autocomplete="off" enterkeyhint="done" placeholder="לדוגמה: סבתא רחל">
      <p class="lbl">בחרו תמונה:</p>
      <div class="avatars">${AVATARS.map((a, i) => `<button class="avatar ${i === 0 ? "sel" : ""}" data-act="avatar" data-arg="${a}">${a}</button>`).join("")}</div>
      <p class="err" id="nu-err"></p>
      <button class="btn" data-act="saveUser">✔ שמירה והתחלה</button>
      </div>`);
  }

  // ---------- Home ----------
  function showHome() {
    const u = Store.user(); if (!u) return showProfiles();
    const d = Daily.ensure(u); Store.save();
    const doneN = d.tasks.filter((t) => t.done).length;
    const streak = Stats.streak(u);
    go(`
      <div class="hello">
        <span class="av big">${u.avatar}</span>
        <div><div class="hname">שלום, ${esc(u.name)}!</div>
        <div class="hsub">${streak ? `🔥 ${streak} ${streak === 1 ? "יום" : "ימים"} ברצף · ` : ""}${Stats.gamesToday(u) ? `🎮 היום שיחקתם ${Stats.gamesToday(u)} משחקים` : "בואו נתחיל לשחק היום"}</div></div>
        <button class="chip" data-act="profiles">החלפת שחקן</button>
      </div>
      <div class="home-grid">
        <section class="panel">
          <div class="panel-h"><h2 class="h2">📅 המשימות של היום${d.round > 1 ? ` <small class="muted">(סבב ${d.round})</small>` : ""}</h2><span class="badge">${doneN}/${d.tasks.length}</span></div>
          <div class="tasks">
            ${d.tasks.map((t, i) => `
              <button class="task ${t.done ? "done" : ""}" data-act="task" data-arg="${i}" style="--c:${CATS[t.cat].color}">
                <span class="task-ic">${t.done ? "✅" : CATS[t.cat].icon}</span>
                <span class="task-tx">${t.focus ? '<span class="tag">💪 לחיזוק</span>' : ""}<span class="task-cat">${CATS[t.cat].name}</span>${esc(t.text)}</span>
                ${t.done ? "" : '<span class="task-go">◀</span>'}
              </button>`).join("")}
          </div>
          ${d.bonus ? '<p class="allgood">🏆 כל המשימות הושלמו – כל הכבוד!</p><button class="btn good" data-act="moreTasks">🎯 עוד משימות להיום</button>' : ""}
          <button class="btn ${d.bonus ? "secondary" : ""}" data-act="progress">📈 ההתקדמות שלי</button>
        </section>
        <section>
          <h2 class="h2">בחרו תחום</h2>
          <div class="cats">
            ${Object.entries(CATS).map(([k, c]) => {
              const games = Games.inCat(k).length, passed = Stats.catPassed(u, k);
              return `<button class="cat" style="--c:${c.color}" data-act="cat" data-arg="${k}">
                <span class="cat-ic">${c.icon}</span><span class="cat-name">${c.name}</span>
                <span class="cat-sc">${passed ? `${passed}/${games * MAX_LEVEL} רמות` : `${games} משחקים`}</span></button>`;
            }).join("")}
          </div>
        </section>
      </div>
      <button class="btn secondary" data-act="sound">${Store.data.sound ? "🔊 צלילים: פועלים" : "🔇 צלילים: כבויים"}</button>`);
  }

  // ---------- Category ----------
  function showCat(c) {
    const u = Store.user(), cat = CATS[c];
    go(`
      ${backBtn("home", "", "לדף הבית")}
      <h1 class="title" style="color:${cat.color}">${cat.icon} ${cat.name}</h1>
      <div class="games">
        ${Games.inCat(c).map((g) => {
          const p = Levels.passed(u, g.id);
          return `<button class="game" style="--c:${cat.color}" data-act="game" data-arg="${g.id}">
            <span class="g-ic">${g.icon}</span>
            <span class="g-tx"><span class="g-name">${g.name}</span><span class="g-desc">${g.desc}</span>
              <span class="g-prog"><i style="width:${(100 * p) / MAX_LEVEL}%"></i></span></span>
            <span class="g-best">רמה<br><b>${Levels.unlocked(u, g.id)}</b></span></button>`;
        }).join("")}
      </div>`);
  }

  // ---------- Level select ----------
  function showGame(id) {
    const u = Store.user(), g = Games.byId[id], b = Levels.bests(u, id);
    const unl = Levels.unlocked(u, id, b), passed = Levels.passed(u, id, b);
    go(`
      ${backBtn("cat", g.cat, CATS[g.cat].name)}
      <h1 class="title">${g.icon} ${g.name}</h1>
      <div class="game-top">
        <p class="how">${g.how}</p>
        <div>
          <button class="btn big-play" data-act="play" data-arg="${id}:${unl}">▶ ${passed ? "המשך לרמה" : "התחלה ברמה"} ${unl}</button>
          <p class="sub small">עברתם ${passed} מתוך ${MAX_LEVEL} רמות · כדי לפתוח רמה חדשה צריך ${PASS_SCORE} נקודות</p>
        </div>
      </div>
      <h2 class="h2">כל הרמות</h2>
      <div class="levels">
        ${Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => l > unl
          ? `<button class="lvl locked" disabled aria-label="רמה ${l} נעולה"><b>${l}</b><small>🔒</small></button>`
          : `<button class="lvl ${l === unl ? "cur" : ""} ${b[l] !== null && b[l] >= PASS_SCORE ? "passed" : ""}" data-act="play" data-arg="${id}:${l}"><b>${l}</b><small>${b[l] === null ? "&nbsp;" : starStr(b[l])}</small></button>`).join("")}
      </div>`);
  }

  // ---------- Play ----------
  function startGame(id, level) {
    const g = Games.byId[id];
    go(`
      <div class="playbar">
        <button class="icon-btn" data-act="quit" aria-label="יציאה">✖ <span>יציאה</span></button>
        <div class="play-title">${g.icon} ${g.name} · רמה ${level}</div>
        <div class="play-status" id="status"></div>
      </div>
      <div class="msg" id="msg" aria-live="polite"></div>
      <div class="stage" id="stage"></div>`, true);
    view.classList.add("playing"); document.body.classList.add("in-game");
    const stage = $("#stage"), t0 = Date.now();
    let resizeFn = null, finished = false;
    const api = {
      status: (t) => { const s = $("#status"); if (s) s.textContent = t; },
      msg: (t, kind) => { const m = $("#msg"); if (m) { m.textContent = t; m.className = "msg " + (kind || ""); } },
      onResize: (f) => { resizeFn = f; },
      sound: Sound,
      finish: (res) => {
        if (finished) return; finished = true;
        setTimeout(() => onFinish(g, level, res, (Date.now() - t0) / 1000), 0);
      }
    };
    running = { handle: g.start(stage, level, api), resize: () => resizeFn && resizeFn() };
  }

  function onFinish(g, level, res, timeSec) {
    const u = Store.user();
    const prevBest = Stats.best(u, g.id, level);
    const unlBefore = Levels.unlocked(u, g.id);
    const score = clamp(Math.round(res.score), 0, 100);
    const r = { g: g.id, c: g.cat, l: level, s: score, p: Math.round(score * levelMult(level)), t: Math.round(timeSec), d: today(), ts: Date.now() };
    Store.addResult(u, r);
    const unlAfter = Levels.unlocked(u, g.id);
    const { newly, allDone } = Daily.check(u, r);
    Store.save();
    Sound.win();
    showResult(g, level, r, res.stats || [], prevBest, newly, allDone, unlAfter > unlBefore ? unlAfter : 0);
  }

  function showResult(g, level, r, stats, prevBest, newly, allDone, opened) {
    const passed = r.s >= PASS_SCORE;
    const head = r.s >= 90 ? "מדהים! 🎉" : r.s >= 70 ? "כל הכבוד! 👏" : passed ? "יפה מאוד! 😊" : "התחלה טובה! 🌱";
    let levelNote = "";
    if (passed && level === MAX_LEVEL) levelNote = '<p class="record">🏆 עברתם את הרמה האחרונה!</p>';
    else if (opened) levelNote = `<p class="record">🔓 נפתחה רמה ${opened}!</p>`;
    else if (!passed) levelNote = `<p class="sub">כדי לעבור לרמה הבאה צריך ${PASS_SCORE} נקודות. כל משחק הוא אימון – נסו שוב!</p>`;
    const nextBtn = passed && level < MAX_LEVEL ? `<button class="btn" data-act="play" data-arg="${g.id}:${level + 1}">▶ לרמה ${level + 1}</button>` : "";
    go(`
      <h1 class="title">${head}</h1>
      <div class="result-grid">
        <div>
          <div class="score-ring" style="--p:${r.s};--c:${CATS[g.cat].color}"><div><b>${r.s}</b><span>מתוך 100</span></div></div>
          <div class="stars" aria-label="${stars(r.s)} כוכבים">${starStr(r.s)}</div>
          <p class="center muted">${g.icon} ${g.name} · רמה ${level}</p>
          ${levelNote}
          ${prevBest !== null && r.s > prevBest ? '<p class="record">🏅 שיא אישי חדש ברמה הזו!</p>' : ""}
        </div>
        <div>
          <div class="statlist">
            ${stats.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}
            <div><span>זמן</span><b>${fmtTime(r.t)}</b></div>
            <div><span>נקודות שנצברו (×${levelMult(level)})</span><b>+${r.p}</b></div>
          </div>
          ${newly.map((t) => `<p class="taskdone">✅ משימה יומית הושלמה: ${esc(t.text)}</p>`).join("")}
          ${allDone ? '<p class="allgood">🏆 השלמתם את כל המשימות של היום!</p><button class="btn good" data-act="moreTasks">🎯 עוד משימות להיום</button>' : ""}
          ${nextBtn}
          <button class="btn ${nextBtn ? "secondary" : ""}" data-act="play" data-arg="${g.id}:${level}">🔄 ${passed ? "שוב" : "נסו שוב"}</button>
          <div class="row2">
            <button class="btn secondary" data-act="game" data-arg="${g.id}">כל הרמות</button>
            <button class="btn secondary" data-act="home">🏠 בית</button>
          </div>
        </div>
      </div>`);
  }

  // ---------- Progress ----------
  function spark(vals, color) {
    if (vals.length < 2) return "";
    const W = 160, H = 44, step = W / (vals.length - 1);
    const pts = vals.map((v, i) => `${(i * step).toFixed(1)},${(H - 4 - (v / 100) * (H - 8)).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function dayChart(days) {
    const max = Math.max(3, ...days.map((x) => x.n));
    const dn = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
    return `<div class="daychart" dir="ltr">${days.map((x) => {
      const dt = new Date(x.d + "T12:00:00"), isToday = x.d === today();
      return `<div class="dc ${isToday ? "today" : ""}"><span class="dc-n">${x.n || ""}</span><span class="dc-bar"><i style="height:${(100 * x.n) / max}%"></i></span><span class="dc-d">${isToday ? "היום" : dn[dt.getDay()]}</span></div>`;
    }).join("")}</div>`;
  }
  function showProgress() {
    const u = Store.user(); if (!u) return showProfiles();
    const rs = u.results;
    const recent10 = avg(rs.slice(-10).map((r) => r.s));
    const totalPassed = Games.list.reduce((s, g) => s + Levels.passed(u, g.id), 0);
    const catInfo = Object.entries(CATS).map(([k, c]) => {
      const cr = Stats.catResults(u, k);
      return { k, c, n: cr.length, a: Stats.catAvg(u, k), tr: Stats.trend(u, k), vals: cr.slice(-15).map((r) => r.s), passed: Stats.catPassed(u, k), max: Games.inCat(k).length * MAX_LEVEL };
    });
    const played = catInfo.filter((x) => x.a !== null).sort((a, b) => b.a - a.a);
    const unplayed = catInfo.filter((x) => x.a === null);
    let insight = "";
    if (played.length >= 2) insight = `<p class="insight">💚 החוזקה שלך: <b>${played[0].c.name}</b><br>💪 כדאי לתרגל: <b>${(unplayed[0] || played[played.length - 1]).c.name}</b></p>`;
    else if (unplayed.length) insight = `<p class="insight">💡 נסו גם: <b>${unplayed.map((x) => x.c.name).join(", ")}</b></p>`;
    const trendTx = (t) => (t > 4 ? '<span class="up">⬆ משתפר</span>' : t < -4 ? '<span class="down">⬇ ירידה קלה</span>' : '<span class="flat">⬅ יציב</span>');

    go(`
      ${backBtn("home", "", "לדף הבית")}
      <h1 class="title">📈 ההתקדמות של ${esc(u.name)}</h1>
      <div class="kpis">
        <div class="kpi"><b>${rs.length}</b><span>משחקים</span></div>
        <div class="kpi"><b>${Stats.totalPoints(u)}</b><span>נקודות</span></div>
        <div class="kpi"><b>${totalPassed}</b><span>רמות שעברתם</span></div>
        <div class="kpi"><b>${Stats.streak(u)}</b><span>ימים ברצף</span></div>
        <div class="kpi"><b>${recent10 === null ? "—" : Math.round(recent10)}</b><span>ממוצע אחרון</span></div>
        <div class="kpi"><b>${u.taskDays.length}</b><span>ימים עם כל המשימות</span></div>
      </div>
      ${insight}
      <h2 class="h2">🎮 משחקים ביום</h2>
      <div class="panel daychart-wrap">
        <div class="day-sum"><span>היום: <b>${Stats.gamesToday(u)}</b></span><span>ממוצע ביום משחק: <b>${Stats.avgPerActiveDay(u).toFixed(1)}</b></span><span>ימי משחק: <b>${Stats.days(u).size}</b></span></div>
        ${dayChart(Stats.gamesPerDay(u, 14))}
      </div>
      <h2 class="h2">לפי תחום</h2>
      <div class="catprog">
        ${catInfo.map((x) => `
          <div class="cp" style="--c:${x.c.color}">
            <div class="cp-h"><span>${x.c.icon} ${x.c.name}</span><b>${x.a === null ? "—" : Math.round(x.a)}</b></div>
            <div class="bar"><i style="width:${x.a === null ? 0 : Math.round(x.a)}%"></i></div>
            <div class="cp-f"><span>${x.n} משחקים · ${x.passed}/${x.max} רמות</span>${x.n >= 4 ? trendTx(x.tr) : ""}</div>
            ${spark(x.vals, x.c.color)}
          </div>`).join("")}
      </div>
      <h2 class="h2">משחקים אחרונים</h2>
      ${rs.length ? `<div class="recent">${rs.slice(-10).reverse().map((r) => {
        const g = Games.byId[r.g];
        return `<div class="rr"><span>${fmtDate(r.d)}</span><span>${g ? g.icon + " " + g.name : r.g} · רמה ${r.l}</span><b>${r.s}</b></div>`;
      }).join("")}</div>` : '<p class="sub">עוד לא שוחקו משחקים.</p>'}
      <div class="settings">
        <button class="btn secondary" data-act="checkUpdate">🔄 בדיקת עדכונים</button>
        <p class="center muted ver">גרסה ${APP_VERSION}</p>
        <button class="btn danger" data-act="deleteUser">🗑 מחיקת השחקן ${esc(u.name)}</button>
      </div>`);
  }

  // ---------- In-app updates ----------
  const Updater = {
    available: null, dismissed: false, checking: false,
    async check(manual) {
      if (this.checking) return;
      this.checking = true;
      try {
        const res = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
        const info = await res.json();
        if (info.version && info.version !== APP_VERSION) { this.available = info; if (manual) this.dismissed = false; this.maybeShow(); }
        else if (manual) toast("✅ יש לכם את הגרסה האחרונה (" + APP_VERSION + ")");
      } catch (e) { if (manual) toast("לא הצלחנו לבדוק – אין חיבור לאינטרנט"); }
      this.checking = false;
    },
    maybeShow() {
      if (!this.available || this.dismissed || running || $("#update-bar")) return;
      const bar = document.createElement("div");
      bar.id = "update-bar"; bar.setAttribute("role", "alert");
      bar.innerHTML = `<div class="ub-tx"><b>✨ יש גרסה חדשה של מוחון</b>${this.available.notes ? `<span>${esc(this.available.notes)}</span>` : ""}</div>
        <button class="ub-go">עדכון עכשיו</button><button class="ub-later" aria-label="אחר כך">אחר כך</button>`;
      document.body.appendChild(bar);
      bar.querySelector(".ub-go").onclick = () => this.apply();
      bar.querySelector(".ub-later").onclick = () => { this.dismissed = true; bar.remove(); };
    },
    async apply() {
      const bar = $("#update-bar"); if (bar) bar.querySelector(".ub-tx").innerHTML = "<b>⏳ מעדכן...</b>";
      try {
        if ("serviceWorker" in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map((r) => r.update().catch(() => {}))); }
        if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
      } catch (e) {}
      location.reload();
    }
  };
  function toast(t) {
    const el = document.createElement("div"); el.className = "toast"; el.textContent = t;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3500);
  }

  // ---------- Actions ----------
  const Actions = {
    profiles: showProfiles,
    newUser: showNewUser,
    home: showHome,
    progress: showProgress,
    cat: (c) => showCat(c),
    game: (id) => showGame(id),
    pickUser(id) { Store.data.currentId = id; Store.save(); showHome(); },
    avatar(a, b) { newAvatar = a; view.querySelectorAll(".avatar").forEach((x) => x.classList.toggle("sel", x === b)); },
    saveUser() {
      const name = $("#nu-name").value.trim();
      if (!name) { $("#nu-err").textContent = "נא לכתוב שם"; $("#nu-name").focus(); return; }
      Store.addUser(name, newAvatar); showHome();
    },
    task(i) { showGame(Daily.ensure(Store.user()).tasks[Number(i)].game); },
    play(arg) { const [id, l] = arg.split(":"); startGame(id, Number(l)); },
    quit() { if (confirm("לצאת מהמשחק? התוצאה של המשחק הזה לא תישמר.")) showHome(); },
    sound() { Store.data.sound = !Store.data.sound; Store.save(); Sound.flip(); showHome(); },
    checkUpdate() { Updater.check(true); },
    moreTasks() { Daily.more(Store.user()); Store.save(); showHome(); },
    deleteUser() {
      const u = Store.user();
      if (confirm(`למחוק את ${u.name} וכל ההתקדמות? אי אפשר לבטל את זה.`)) { Store.removeUser(u.id); showProfiles(); }
    }
  };
  view.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const fn = Actions[b.dataset.act]; if (fn) fn(b.dataset.arg, b);
  });
  view.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "nu-name") Actions.saveUser(); });
  window.addEventListener("resize", () => { if (running) running.resize(); });

  // native feel: no pinch / double-tap zoom, no long-press menus
  ["gesturestart", "gesturechange"].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  let lastTouch = 0;
  document.addEventListener("touchend", (e) => { const n = Date.now(); if (n - lastTouch < 350 && !e.target.closest("input")) e.preventDefault(); lastTouch = n; }, { passive: false });
  document.addEventListener("contextmenu", (e) => { if (!e.target.closest("input")) e.preventDefault(); });

  // ---------- Boot ----------
  Store.load();
  if (Store.user()) showHome();
  else if (Store.data.users.length) showProfiles();
  else showNewUser();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  // check for updates on start, when the app comes back to the foreground, and every 30 minutes
  setTimeout(() => Updater.check(false), 3000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") Updater.check(false); });
  setInterval(() => Updater.check(false), 30 * 60 * 1000);
})();
