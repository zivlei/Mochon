/* מוחון – screens, tab navigation and in-app updates.
   Layout rule: every screen fits one screen without scrolling, except Stats (and profile lists when there are many players). */
"use strict";
(function () {
  const view = $("#view");
  const tabbar = $("#tabbar");
  const AVATARS = ["👵", "👴", "🧓", "👩‍🦳", "👨‍🦳", "👩", "👨", "🌸", "🌻", "🐱", "🐶", "⭐"];
  let running = null, newAvatar = AVATARS[0];

  function stopGame() {
    if (running) { try { running.handle && running.handle.stop && running.handle.stop(); } catch (e) {} running = null; }
    view.classList.remove("playing");
  }
  /** opts: { tab, scroll, noTabs, inGame } */
  function go(html, opts) {
    opts = opts || {};
    stopGame();
    closeModal();
    const bar = $("#update-bar"); if (bar && opts.inGame) bar.remove();
    document.body.classList.toggle("no-tabs", !!(opts.noTabs || opts.inGame));
    document.body.classList.toggle("in-game", !!opts.inGame);
    view.classList.toggle("scroll", !!opts.scroll);
    view.innerHTML = html;
    view.scrollTop = 0;
    view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter");
    tabbar.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === opts.tab));
    updateBadge();
    if (!opts.inGame) Updater.maybeShow();
  }
  function updateBadge() {
    const u = Store.user(), el = $("#taskBadge");
    if (!u) { el.hidden = true; return; }
    const left = Daily.ensure(u).tasks.filter((t) => !t.done).length;
    el.hidden = !left; el.textContent = left;
  }

  const backBtn = (act, arg, label) => `<button class="backbtn" data-act="${act}" ${arg ? `data-arg="${arg}"` : ""}>→ ${label || "חזרה"}</button>`;
  const stars = (s) => (s >= 90 ? 3 : s >= 70 ? 2 : s >= PASS_SCORE ? 1 : 0);
  const starStr = (s) => "★".repeat(stars(s)) + "☆".repeat(3 - stars(s));
  const taskBtn = (t, i) => `
    <button class="task ${t.done ? "done" : ""}" data-act="task" data-arg="${i}" style="--c:${CATS[t.cat].color}">
      <span class="task-ic">${t.done ? "✅" : CATS[t.cat].icon}</span>
      <span class="task-tx">${t.focus ? '<span class="tag">💪 לחיזוק</span>' : ""}<span class="task-cat">${CATS[t.cat].name}</span>${esc(t.text)}</span>
      ${t.done ? "" : '<span class="task-go">◀</span>'}
    </button>`;

  // ---------- modal ----------
  function openModal(html) {
    closeModal();
    const m = document.createElement("div");
    m.className = "modal"; m.id = "modal";
    m.innerHTML = `<div class="modal-box" role="dialog">${html}<button class="btn" data-close>הבנתי 👍</button></div>`;
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) closeModal(); });
    document.body.appendChild(m);
  }
  function closeModal() { const m = $("#modal"); if (m) m.remove(); }

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
      <p class="foot">טיפ: באייפד או באייפון – פתחו ב-Safari, לחצו "שיתוף" ואז "הוסף למסך הבית".<br><span class="ver">גרסה ${APP_VERSION}</span></p>`,
      { noTabs: true, scroll: true });
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
      </div>`, { noTabs: true, scroll: true });
  }

  // ---------- Home (one screen) ----------
  function showHome() {
    const u = Store.user(); if (!u) return showProfiles();
    const d = Daily.ensure(u); Store.save();
    const doneN = d.tasks.filter((t) => t.done).length;
    const nextIdx = d.tasks.findIndex((t) => !t.done);
    const todayPts = u.results.filter((r) => r.d === today()).reduce((s, r) => s + r.p, 0);
    const last = u.results.length ? u.results[u.results.length - 1] : null;
    const lastGame = last && Games.byId[last.g];
    const weak = Object.keys(CATS).sort((a, b) => Daily.weakness(u, b) - Daily.weakness(u, a))[0];

    const taskCard = nextIdx >= 0
      ? `<div class="card-h"><span class="t-one">📅 המשימה הבאה</span><span class="t-all">📅 המשימות של היום</span><span class="badge">${doneN}/${d.tasks.length}</span></div>${d.tasks.map((t, i) => i === nextIdx ? taskBtn(t, i) : taskBtn(t, i).replace("class=\"task ", "class=\"task t-extra ")).join("")}`
      : `<div class="card-h"><span>📅 המשימות של היום</span><span class="badge good">${doneN}/${d.tasks.length}</span></div>
         <p class="allgood">🏆 כל המשימות הושלמו!</p><button class="btn good" data-act="moreTasks">🎯 עוד משימות להיום</button>`;

    go(`
      <div class="hello">
        <span class="av big">${u.avatar}</span>
        <div class="hello-tx"><div class="hname">שלום, ${esc(u.name)}!</div></div>
        <button class="chip" data-act="profiles">החלפת שחקן</button>
      </div>
      <div class="chips">
        <div class="chipstat"><span>🔥</span><b>${Stats.streak(u)}</b><small>ימים ברצף</small></div>
        <div class="chipstat"><span>🎮</span><b>${Stats.gamesToday(u)}</b><small>משחקים היום</small></div>
        <div class="chipstat"><span>⭐</span><b>${todayPts}</b><small>נקודות היום</small></div>
      </div>
      <div class="home-main">
        <section class="hcard task-card">${taskCard}</section>
        ${lastGame
          ? `<button class="bigtile" style="--c:${CATS[lastGame.cat].color}" data-act="play" data-arg="${lastGame.id}:${Levels.unlocked(u, lastGame.id)}">
               <span class="bt-ic">${lastGame.icon}</span><span class="bt-tx"><small>להמשיך לשחק</small><b>${lastGame.name} · רמה ${Levels.unlocked(u, lastGame.id)}</b></span><span class="bt-go">▶</span></button>`
          : `<button class="bigtile" style="--c:var(--good)" data-act="tab" data-arg="games">
               <span class="bt-ic">🎮</span><span class="bt-tx"><small>בואו נתחיל</small><b>בחרו משחק</b></span><span class="bt-go">▶</span></button>`}
        <button class="bigtile" style="--c:${CATS[weak].color}" data-act="cat" data-arg="${weak}">
          <span class="bt-ic">${CATS[weak].icon}</span><span class="bt-tx"><small>💪 כדאי לתרגל</small><b>${CATS[weak].name}</b></span><span class="bt-go">▶</span></button>
      </div>`, { tab: "home" });
  }

  // ---------- Games tab: categories → games ----------
  function showGames() {
    const u = Store.user(); if (!u) return showProfiles();
    go(`
      <h1 class="title sm">🎮 בחרו תחום</h1>
      <div class="cats-fill">
        ${Object.entries(CATS).map(([k, c]) => {
          const games = Games.inCat(k).length, passed = Stats.catPassed(u, k);
          return `<button class="cat" style="--c:${c.color}" data-act="cat" data-arg="${k}">
            <span class="cat-ic">${c.icon}</span><span class="cat-name">${c.name}</span>
            <span class="cat-sc">${passed ? `${passed}/${games * MAX_LEVEL} רמות` : `${games} משחקים`}</span></button>`;
        }).join("")}
      </div>`, { tab: "games" });
  }

  function showCat(c) {
    const u = Store.user(), cat = CATS[c], games = Games.inCat(c);
    go(`
      <div class="topline">${backBtn("tab", "games", "תחומים")}<h1 class="title sm" style="color:${cat.color}">${cat.icon} ${cat.name}</h1><span class="topline-pad"></span></div>
      <div class="games-fill ${games.length > 4 ? "many" : ""}" style="--n:${games.length}">
        ${games.map((g) => {
          const p = Levels.passed(u, g.id);
          const cs = Cloud.summary(), cr = cs && cs.games[g.id];
          return `<button class="game" style="--c:${cat.color}" data-act="game" data-arg="${g.id}">
            <span class="g-ic">${g.icon}</span>
            <span class="g-tx"><span class="g-name">${g.name}${cr && cr.avg ? ` <small class="g-rate">⭐${cr.avg}</small>` : ""}</span><span class="g-desc">${g.desc}</span>
              <span class="g-prog"><i style="width:${(100 * p) / MAX_LEVEL}%"></i></span></span>
            <span class="g-best">רמה<br><b>${Levels.unlocked(u, g.id)}</b></span></button>`;
        }).join("")}
      </div>`, { tab: "games" });
  }

  // ---------- Level select (one screen) ----------
  function showGame(id) {
    const u = Store.user(), g = Games.byId[id], b = Levels.bests(u, id);
    const unl = Levels.unlocked(u, id, b), passed = Levels.passed(u, id, b);
    go(`
      <div class="topline">${backBtn("cat", g.cat, CATS[g.cat].name)}<h1 class="title sm">${g.icon} ${g.name}</h1><button class="infobtn" data-act="info" data-arg="${id}" aria-label="איך משחקים">ℹ️ <span>איך משחקים</span></button></div>
      <button class="btn big-play" data-act="play" data-arg="${id}:${unl}">▶ ${passed ? "המשך לרמה" : "התחלה ברמה"} ${unl}</button>
      <p class="sub small">עברתם ${passed} מתוך ${MAX_LEVEL} רמות · רמה חדשה נפתחת ב-${PASS_SCORE} נקודות</p>
      <div class="levels-fill">
        ${Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => l > unl
          ? `<button class="lvl locked" disabled aria-label="רמה ${l} נעולה"><b>${l}</b><small>🔒</small></button>`
          : `<button class="lvl ${l === unl ? "cur" : ""} ${b[l] !== null && b[l] >= PASS_SCORE ? "passed" : ""}" data-act="play" data-arg="${id}:${l}"><b>${l}</b><small>${b[l] === null ? "&nbsp;" : starStr(b[l])}</small></button>`).join("")}
      </div>`, { tab: "games" });
    u.seen = u.seen || {};
    if (!u.seen[id]) { u.seen[id] = 1; Store.save(); Actions.info(id); }
  }

  // ---------- Play (no tabs, no scroll) ----------
  function startGame(id, level) {
    const g = Games.byId[id];
    go(`
      <div class="playbar">
        <button class="icon-btn" data-act="quit" aria-label="יציאה">✖ <span>יציאה</span></button>
        <div class="play-title">${g.icon} ${g.name} · רמה ${level}</div>
        <div class="play-status" id="status"></div>
      </div>
      <div class="msg" id="msg" aria-live="polite"></div>
      <div class="stage" id="stage"></div>`, { inGame: true });
    view.classList.add("playing");
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
    api.playerLevel = level;
    running = { handle: g.start(stage, diffLevel(level), api), resize: () => resizeFn && resizeFn() };
  }

  function onFinish(g, level, res, timeSec) {
    const u = Store.user();
    const prevBest = Stats.best(u, g.id, level);
    const unlBefore = Levels.unlocked(u, g.id);
    const score = clamp(Math.round(res.score), 0, 100);
    const r = { g: g.id, c: g.cat, l: level, s: score, p: Math.round(score * levelMult(level)), t: Math.round(timeSec), d: today(), ts: Date.now() };
    Store.addResult(u, r);
    Cloud.play(r);
    const unlAfter = Levels.unlocked(u, g.id);
    const { newly, allDone } = Daily.check(u, r);
    Store.save();
    Sound.win();
    showResult(g, level, r, res.stats || [], prevBest, newly, allDone, unlAfter > unlBefore ? unlAfter : 0);
  }

  // ---------- Result (one screen) ----------
  function showResult(g, level, r, stats, prevBest, newly, allDone, opened) {
    const passed = r.s >= PASS_SCORE;
    const head = r.s >= 90 ? "מדהים! 🎉" : r.s >= 70 ? "כל הכבוד! 👏" : passed ? "יפה מאוד! 😊" : "התחלה טובה! 🌱";
    let note = "";
    if (passed && level === MAX_LEVEL) note = '<p class="record">🏆 עברתם את הרמה האחרונה!</p>';
    else if (opened) note = `<p class="record">🔓 נפתחה רמה ${opened}!</p>`;
    else if (!passed) note = `<p class="note">צריך ${PASS_SCORE} נקודות כדי לעבור – נסו שוב!</p>`;
    else if (prevBest !== null && r.s > prevBest) note = '<p class="record">🏅 שיא אישי חדש!</p>';
    const chips = [...stats.slice(0, 3), ["זמן", fmtTime(r.t)], [`נקודות (×${levelMult(level)})`, "+" + r.p]];
    const taskLine = allDone
      ? '<p class="taskdone">🏆 השלמתם את כל המשימות של היום!</p>'
      : newly.length ? `<p class="taskdone">✅ משימה הושלמה: ${esc(newly[0].text)}</p>` : "";
    const canNext = passed && level < MAX_LEVEL;
    go(`
      <div class="result">
        <div class="res-score">
          <h1 class="title sm">${head}</h1>
          <div class="score-ring" style="--p:${r.s};--c:${CATS[g.cat].color}"><div><b>${r.s}</b><span>מתוך 100</span></div></div>
          <div class="stars" aria-label="${stars(r.s)} כוכבים">${starStr(r.s)}</div>
          <p class="res-game">${g.icon} ${g.name} · רמה ${level}</p>
          ${note}
        </div>
        <div class="res-info">
          <div class="stat-chips">${chips.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div>
          ${taskLine}
          ${rateRow(g.id)}
          <div class="res-btns ${canNext ? "three" : ""}">
            ${canNext ? `<button class="btn good" data-act="play" data-arg="${g.id}:${level + 1}">▶ לרמה ${level + 1}</button>` : ""}
            <button class="btn ${canNext ? "secondary" : ""}" data-act="play" data-arg="${g.id}:${level}">🔄 ${passed ? "שוב" : "נסו שוב"}</button>
            <button class="btn secondary" data-act="game" data-arg="${g.id}">כל הרמות</button>
          </div>
          ${allDone ? '<button class="btn good slim" data-act="moreTasks">🎯 עוד משימות להיום</button>' : ""}
        </div>
      </div>`, { tab: "games" });
  }

  function rateRow(id) {
    const u = Store.user(), mine = (u.ratings || {})[id] || 0;
    return `<div class="rate-row" data-game="${id}"><span>${mine ? "הדירוג שלכם:" : "איך היה המשחק?"}</span>
      <span class="rate-stars">${[1, 2, 3, 4, 5].map((n) => `<button class="rstar ${n <= mine ? "on" : ""}" data-act="rate" data-arg="${id}:${n}" aria-label="${n} כוכבים">★</button>`).join("")}</span></div>`;
  }

  // ---------- Tasks tab (one screen) ----------
  function showTasks() {
    const u = Store.user(); if (!u) return showProfiles();
    const d = Daily.ensure(u); Store.save();
    const doneN = d.tasks.filter((t) => t.done).length;
    const roundsDone = (d.round || 1) - 1 + (d.bonus ? 1 : 0);
    go(`
      <h1 class="title sm">📅 המשימות של היום</h1>
      <p class="sub small">${d.round > 1 ? `סבב ${d.round} · ` : ""}הושלמו ${doneN} מתוך ${d.tasks.length} · המשימה הראשונה מהתחום שכדאי לחזק</p>
      <div class="tasks-fill">${d.tasks.map(taskBtn).join("")}</div>
      ${d.bonus ? '<p class="allgood">🏆 כל המשימות הושלמו – כל הכבוד!</p><button class="btn good" data-act="moreTasks">🎯 עוד משימות להיום</button>' : ""}
      <div class="chips">
        <div class="chipstat"><span>🎮</span><b>${Stats.gamesToday(u)}</b><small>משחקים היום</small></div>
        <div class="chipstat"><span>✅</span><b>${roundsDone}</b><small>סבבים הושלמו היום</small></div>
        <div class="chipstat"><span>🏆</span><b>${u.taskDays.length}</b><small>ימים עם כל המשימות</small></div>
      </div>`, { tab: "tasks" });
  }

  // ---------- Stats tab (scroll allowed) ----------
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
  function popularHtml(u) {
    const mine = {};
    u.results.forEach((r) => (mine[r.g] = (mine[r.g] || 0) + 1));
    const top = Object.entries(mine).filter(([g]) => Games.byId[g]).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const cs = Cloud.summary();
    const ctop = cs ? Object.entries(cs.games).filter(([g]) => Games.byId[g]).sort((a, b) => b[1].plays - a[1].plays).slice(0, 5) : [];
    const row = (g, right) => `<div class="rr"><span>${Games.byId[g].icon}</span><span>${Games.byId[g].name}</span><b>${right}</b></div>`;
    return `<h2 class="h2">🏅 המשחקים שלי הכי הרבה</h2>
      ${top.length ? `<div class="recent">${top.map(([g, n]) => row(g, n + " פעמים" + ((u.ratings || {})[g] ? " · " + "★".repeat(u.ratings[g]) : ""))).join("")}</div>` : '<p class="sub">עוד לא שוחקו משחקים.</p>'}
      ${ctop.length ? `<h2 class="h2">🌍 הכי פופולריים אצל כולם</h2><p class="sub small">${cs.players} שחקנים · ${cs.totalPlays} משחקים</p>
        <div class="recent">${ctop.map(([g, x]) => row(g, `${x.plays} משחקים${x.avg ? " · ⭐" + x.avg : ""}`)).join("")}</div>` : ""}`;
  }
  function showStats() {
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
      <h1 class="title sm">📈 ההתקדמות של ${esc(u.name)}</h1>
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
      ${popularHtml(u)}
      <h2 class="h2">משחקים אחרונים</h2>
      ${rs.length ? `<div class="recent">${rs.slice(-10).reverse().map((r) => {
        const g = Games.byId[r.g];
        return `<div class="rr"><span>${fmtDate(r.d)}</span><span>${g ? g.icon + " " + g.name : r.g} · רמה ${r.l}</span><b>${r.s}</b></div>`;
      }).join("")}</div>` : '<p class="sub">עוד לא שוחקו משחקים.</p>'}
      <h2 class="h2">⚙️ הגדרות</h2>
      <div class="settings">
        <button class="btn secondary" data-act="sound">${Store.data.sound ? "🔊 צלילים: פועלים" : "🔇 צלילים: כבויים"}</button>
        <button class="btn secondary" data-act="profiles">👥 החלפת שחקן</button>
        <button class="btn secondary" data-act="checkUpdate">🔄 בדיקת עדכונים</button>
        <button class="btn secondary" data-act="share">${Store.data.share === false ? "📡 שיתוף נתונים אנונימיים: כבוי" : "📡 שיתוף נתונים אנונימיים: פועל"}</button>
        <p class="center muted small-note">השיתוף שולח רק שם משחק, רמה, ציון, זמן ודירוג, עם קוד מכשיר אקראי – בלי שמות. כך אפשר לדעת אילו משחקים אהובים ושימושיים.</p>
        <p class="center muted ver">גרסה ${APP_VERSION}</p>
        <button class="btn danger" data-act="deleteUser">🗑 מחיקת השחקן ${esc(u.name)}</button>
      </div>`, { tab: "stats", scroll: true });
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
  const TABS = { home: showHome, games: showGames, tasks: showTasks, stats: showStats };
  const Actions = {
    profiles: showProfiles,
    newUser: showNewUser,
    home: showHome,
    progress: showStats,
    tab: (t) => (TABS[t] || showHome)(),
    cat: (c) => showCat(c),
    game: (id) => showGame(id),
    info(id) {
      const g = Games.byId[id];
      openModal(`<div class="modal-ic">${g.icon}</div><h2 class="h2 center">${g.name} – איך משחקים?</h2><p class="how">${howText(g.how)}</p>`);
    },
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
    sound() { Store.data.sound = !Store.data.sound; Store.save(); Sound.flip(); showStats(); },
    checkUpdate() { Updater.check(true); },
    share() { Store.data.share = Store.data.share === false; Store.save(); if (Store.data.share) Cloud.flush(); showStats(); },
    rate(arg) {
      const [id, n] = arg.split(":"), u = Store.user();
      u.ratings = u.ratings || {}; u.ratings[id] = Number(n); Store.save();
      Cloud.rate(id, Number(n)); Sound.flip();
      const row = view.querySelector(`.rate-row[data-game="${id}"]`);
      if (row) row.outerHTML = rateRow(id).replace('class="rate-row"', 'class="rate-row thanks"');
      toast("תודה על הדירוג! ⭐");
    },
    moreTasks() { Daily.more(Store.user()); Store.save(); showTasks(); },
    deleteUser() {
      const u = Store.user();
      if (confirm(`למחוק את ${u.name} וכל ההתקדמות? אי אפשר לבטל את זה.`)) { Store.removeUser(u.id); showProfiles(); }
    }
  };
  view.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const fn = Actions[b.dataset.act]; if (fn) fn(b.dataset.arg, b);
  });
  tabbar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    Sound.flip(); Actions.tab(b.dataset.tab);
  });
  view.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "nu-name") Actions.saveUser(); });
  window.addEventListener("resize", () => { if (running) running.resize(); });

  // native feel: no pinch / double-tap zoom, no long-press menus, no page scrolling outside scroll areas
  ["gesturestart", "gesturechange"].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  let lastTouch = 0;
  document.addEventListener("touchend", (e) => { const n = Date.now(); if (n - lastTouch < 350 && !e.target.closest("input")) e.preventDefault(); lastTouch = n; }, { passive: false });
  document.addEventListener("contextmenu", (e) => { if (!e.target.closest("input")) e.preventDefault(); });
  document.addEventListener("touchmove", (e) => {
    if (e.touches.length > 1) { e.preventDefault(); return; }
    const sc = e.target.closest("#view.scroll, .modal-box");
    if (!sc || document.body.classList.contains("in-game")) e.preventDefault();
  }, { passive: false });

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
  setTimeout(() => { Cloud.flush(); Cloud.refresh(); }, 2000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") Updater.check(false); });
  setInterval(() => Updater.check(false), 30 * 60 * 1000);
})();
