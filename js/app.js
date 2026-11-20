/* מוחון – screens & navigation */
"use strict";
(function () {
  const view = $("#view");
  const AVATARS = ["👵", "👴", "🧓", "👩‍🦳", "👨‍🦳", "👩", "👨", "🌸", "🌻", "🐱", "🐶", "⭐"];
  let running = null, newAvatar = AVATARS[0];

  function stopGame() {
    if (running) { try { running.handle && running.handle.stop && running.handle.stop(); } catch (e) {} running = null; }
    view.classList.remove("playing");
  }
  function go(html) { stopGame(); view.innerHTML = html; window.scrollTo(0, 0); }

  const backBtn = (act, arg, label) => `<button class="backbtn" data-act="${act}" ${arg ? `data-arg="${arg}"` : ""}>→ ${label || "חזרה"}</button>`;
  const stars = (s) => (s >= 90 ? 3 : s >= 70 ? 2 : s >= 40 ? 1 : 0);
  const starStr = (s) => "★".repeat(stars(s)) + "☆".repeat(3 - stars(s));

  // ---------- Profiles ----------
  function showProfiles() {
    const us = Store.data.users;
    go(`
      <h1 class="title">מוחון 🧠</h1>
      <p class="sub">אימון יומי למוח – בכיף ובנחת</p>
      <h2 class="h2">מי משחק היום?</h2>
      <div class="profiles">
        ${us.map((u) => `<button class="profile" data-act="pickUser" data-arg="${u.id}"><span class="av">${u.avatar}</span><span class="pname">${esc(u.name)}</span></button>`).join("")}
        <button class="profile add" data-act="newUser"><span class="av">➕</span><span class="pname">שחקן חדש</span></button>
      </div>
      <p class="foot">טיפ: באייפד או באייפון – פתחו ב-Safari, לחצו "שיתוף" ואז "הוסף למסך הבית".</p>`);
  }

  function showNewUser() {
    newAvatar = AVATARS[0];
    go(`
      ${Store.data.users.length ? backBtn("profiles") : ""}
      <h1 class="title">שחקן חדש</h1>
      <label class="lbl" for="nu-name">מה השם?</label>
      <input id="nu-name" class="input" maxlength="20" autocomplete="off" placeholder="לדוגמה: סבתא רחל">
      <p class="lbl">בחרו תמונה:</p>
      <div class="avatars">${AVATARS.map((a, i) => `<button class="avatar ${i === 0 ? "sel" : ""}" data-act="avatar" data-arg="${a}">${a}</button>`).join("")}</div>
      <p class="err" id="nu-err"></p>
      <button class="btn" data-act="saveUser">✔ שמירה והתחלה</button>`);
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
        <div class="hsub">${streak ? `🔥 ${streak} ${streak === 1 ? "יום" : "ימים"} ברצף` : "בואו נתחיל לשחק היום"}</div></div>
        <button class="chip" data-act="profiles">החלפת שחקן</button>
      </div>

      <section class="panel">
        <div class="panel-h"><h2 class="h2">📅 המשימות של היום</h2><span class="badge">${doneN}/${d.tasks.length}</span></div>
        <div class="tasks">
          ${d.tasks.map((t, i) => `
            <button class="task ${t.done ? "done" : ""}" data-act="task" data-arg="${i}" style="--c:${CATS[t.cat].color}">
              <span class="task-ic">${t.done ? "✅" : CATS[t.cat].icon}</span>
              <span class="task-tx">${t.focus ? '<span class="tag">💪 לחיזוק</span>' : ""}<span class="task-cat">${CATS[t.cat].name}</span>${esc(t.text)}</span>
              ${t.done ? "" : '<span class="task-go">◀</span>'}
            </button>`).join("")}
        </div>
        ${d.bonus ? '<p class="allgood">🏆 כל המשימות של היום הושלמו – כל הכבוד!</p>' : ""}
      </section>

      <h2 class="h2">בחרו תחום</h2>
      <div class="cats">
        ${Object.entries(CATS).map(([k, c]) => {
          const a = Stats.catAvg(u, k);
          return `<button class="cat" style="--c:${c.color}" data-act="cat" data-arg="${k}">
            <span class="cat-ic">${c.icon}</span><span class="cat-name">${c.name}</span>
            <span class="cat-sc">${a === null ? "עוד לא שוחק" : "ממוצע " + Math.round(a)}</span></button>`;
        }).join("")}
      </div>
      <button class="btn" data-act="progress">📈 ההתקדמות שלי</button>
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
          const b = Stats.best(u, g.id);
          return `<button class="game" style="--c:${cat.color}" data-act="game" data-arg="${g.id}">
            <span class="g-ic">${g.icon}</span>
            <span class="g-tx"><span class="g-name">${g.name}</span><span class="g-desc">${g.desc}</span></span>
            <span class="g-best">${b === null ? "חדש" : "שיא<br><b>" + b + "</b>"}</span></button>`;
        }).join("")}
      </div>`);
  }

  // ---------- Level select ----------
  function showGame(id) {
    const u = Store.user(), g = Games.byId[id], rec = Stats.recLevel(u, id);
    go(`
      ${backBtn("cat", g.cat, CATS[g.cat].name)}
      <h1 class="title">${g.icon} ${g.name}</h1>
      <p class="how">${g.how}</p>
      <h2 class="h2">בחרו רמה</h2>
      ${[1, 2, 3].map((l) => {
        const b = Stats.best(u, id, l);
        return `<button class="btn level ${l === rec ? "rec" : ""}" data-act="play" data-arg="${id}:${l}">
          ${LEVELS[l].name}${l === rec ? ' <span class="rec-tag">⭐ מומלץ</span>' : ""}
          <span class="hint">${b === null ? `נקודות ×${LEVELS[l].mult}` : `השיא שלך: ${b} | נקודות ×${LEVELS[l].mult}`}</span></button>`;
      }).join("")}`);
  }

  // ---------- Play ----------
  function startGame(id, level) {
    const g = Games.byId[id];
    go(`
      <div class="playbar">
        <button class="icon-btn" data-act="quit" aria-label="יציאה">✖ <span>יציאה</span></button>
        <div class="play-title">${g.icon} ${g.name} · ${LEVELS[level].name}</div>
        <div class="play-status" id="status"></div>
      </div>
      <div class="msg" id="msg" aria-live="polite"></div>
      <div class="stage" id="stage"></div>`);
    view.classList.add("playing");
    const stage = $("#stage"), t0 = Date.now();
    let resizeFn = null, finished = false;
    const api = {
      status: (t) => { $("#status").textContent = t; },
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
    const score = clamp(Math.round(res.score), 0, 100);
    const r = { g: g.id, c: g.cat, l: level, s: score, p: Math.round(score * LEVELS[level].mult), t: Math.round(timeSec), d: today(), ts: Date.now() };
    Store.addResult(u, r);
    const { newly, allDone } = Daily.check(u, r);
    Store.save();
    stopGame();
    Sound.win();
    showResult(g, level, r, res.stats || [], prevBest, newly, allDone);
  }

  function showResult(g, level, r, stats, prevBest, newly, allDone) {
    const head = r.s >= 90 ? "מדהים! 🎉" : r.s >= 70 ? "כל הכבוד! 👏" : r.s >= 40 ? "יפה מאוד! 😊" : "התחלה טובה! 🌱";
    const note = r.s < 40 ? "<p class='sub'>כל משחק הוא אימון – בפעם הבאה יהיה עוד יותר טוב.</p>" : "";
    view.innerHTML = `
      <h1 class="title">${head}</h1>
      ${note}
      <div class="score-ring" style="--p:${r.s};--c:${CATS[g.cat].color}"><div><b>${r.s}</b><span>מתוך 100</span></div></div>
      <div class="stars" aria-label="${stars(r.s)} כוכבים">${starStr(r.s)}</div>
      ${prevBest !== null && r.s > prevBest ? '<p class="record">🏅 שיא אישי חדש!</p>' : ""}
      ${prevBest === null ? '<p class="record">✨ הפעם הראשונה ברמה הזו!</p>' : ""}
      <div class="statlist">
        ${stats.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}
        <div><span>זמן</span><b>${fmtTime(r.t)}</b></div>
        <div><span>נקודות שנצברו</span><b>+${r.p}</b></div>
      </div>
      ${newly.map((t) => `<p class="taskdone">✅ משימה יומית הושלמה: ${esc(t.text)}</p>`).join("")}
      ${allDone ? '<p class="allgood">🏆 השלמתם את כל המשימות של היום!</p>' : ""}
      <button class="btn" data-act="play" data-arg="${g.id}:${level}">🔄 שוב</button>
      <button class="btn secondary" data-act="home">🏠 לדף הבית</button>
      <button class="btn secondary" data-act="cat" data-arg="${g.cat}">משחק אחר ב${CATS[g.cat].name}</button>`;
    window.scrollTo(0, 0);
  }

  // ---------- Progress ----------
  function spark(vals, color) {
    if (vals.length < 2) return "";
    const W = 160, H = 44, step = W / (vals.length - 1);
    const pts = vals.map((v, i) => `${(i * step).toFixed(1)},${(H - 4 - (v / 100) * (H - 8)).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  function showProgress() {
    const u = Store.user(); if (!u) return showProfiles();
    const rs = u.results;
    const recent10 = avg(rs.slice(-10).map((r) => r.s));
    const catInfo = Object.entries(CATS).map(([k, c]) => {
      const cr = Stats.catResults(u, k);
      return { k, c, n: cr.length, a: Stats.catAvg(u, k), tr: Stats.trend(u, k), vals: cr.slice(-15).map((r) => r.s) };
    });
    const played = catInfo.filter((x) => x.a !== null).sort((a, b) => b.a - a.a);
    const unplayed = catInfo.filter((x) => x.a === null);
    let insight = "";
    if (played.length >= 2) {
      insight = `<p class="insight">💚 החוזקה שלך: <b>${played[0].c.name}</b><br>💪 כדאי לתרגל: <b>${(unplayed[0] || played[played.length - 1]).c.name}</b></p>`;
    } else if (unplayed.length) {
      insight = `<p class="insight">💡 נסו גם: <b>${unplayed.map((x) => x.c.name).join(", ")}</b></p>`;
    }
    const trendTx = (t) => (t > 4 ? '<span class="up">⬆ משתפר</span>' : t < -4 ? '<span class="down">⬇ ירידה קלה</span>' : '<span class="flat">⬅ יציב</span>');

    go(`
      ${backBtn("home", "", "לדף הבית")}
      <h1 class="title">📈 ההתקדמות של ${esc(u.name)}</h1>
      <div class="kpis">
        <div class="kpi"><b>${rs.length}</b><span>משחקים</span></div>
        <div class="kpi"><b>${Stats.totalPoints(u)}</b><span>נקודות</span></div>
        <div class="kpi"><b>${Stats.streak(u)}</b><span>ימים ברצף</span></div>
        <div class="kpi"><b>${recent10 === null ? "—" : Math.round(recent10)}</b><span>ממוצע אחרון</span></div>
        <div class="kpi"><b>${Stats.days(u).size}</b><span>ימי משחק</span></div>
        <div class="kpi"><b>${u.taskDays.length}</b><span>ימים עם כל המשימות</span></div>
      </div>
      ${insight}
      <h2 class="h2">לפי תחום</h2>
      <div class="catprog">
        ${catInfo.map((x) => `
          <div class="cp" style="--c:${x.c.color}">
            <div class="cp-h"><span>${x.c.icon} ${x.c.name}</span><b>${x.a === null ? "—" : Math.round(x.a)}</b></div>
            <div class="bar"><i style="width:${x.a === null ? 0 : Math.round(x.a)}%"></i></div>
            <div class="cp-f"><span>${x.n} משחקים</span>${x.n >= 4 ? trendTx(x.tr) : ""}</div>
            ${spark(x.vals, x.c.color)}
          </div>`).join("")}
      </div>
      <h2 class="h2">משחקים אחרונים</h2>
      ${rs.length ? `<div class="recent">${rs.slice(-10).reverse().map((r) => {
        const g = Games.byId[r.g];
        return `<div class="rr"><span>${fmtDate(r.d)}</span><span>${g ? g.icon + " " + g.name : r.g} · ${LEVELS[r.l].name}</span><b>${r.s}</b></div>`;
      }).join("")}</div>` : '<p class="sub">עוד לא שוחקו משחקים.</p>'}
      <button class="btn danger" data-act="deleteUser">🗑 מחיקת השחקן ${esc(u.name)}</button>`);
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
    avatar(a, b) {
      newAvatar = a;
      view.querySelectorAll(".avatar").forEach((x) => x.classList.toggle("sel", x === b));
    },
    saveUser() {
      const name = $("#nu-name").value.trim();
      if (!name) { $("#nu-err").textContent = "נא לכתוב שם"; $("#nu-name").focus(); return; }
      Store.addUser(name, newAvatar); showHome();
    },
    task(i) {
      const t = Daily.ensure(Store.user()).tasks[Number(i)];
      showGame(t.game);
    },
    play(arg) { const [id, l] = arg.split(":"); startGame(id, Number(l)); },
    quit() {
      if (confirm("לצאת מהמשחק? התוצאה של המשחק הזה לא תישמר.")) showHome();
    },
    sound() { Store.data.sound = !Store.data.sound; Store.save(); Sound.flip(); showHome(); },
    deleteUser() {
      const u = Store.user();
      if (confirm(`למחוק את ${u.name} וכל ההתקדמות שלו/שלה? אי אפשר לבטל את זה.`)) { Store.removeUser(u.id); showProfiles(); }
    }
  };
  view.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const fn = Actions[b.dataset.act]; if (fn) fn(b.dataset.arg, b);
  });
  view.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "nu-name") Actions.saveUser(); });
  window.addEventListener("resize", () => { if (running) running.resize(); });

  // ---------- Boot ----------
  Store.load();
  if (Store.user()) showHome();
  else if (Store.data.users.length) showProfiles();
  else showNewUser();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
