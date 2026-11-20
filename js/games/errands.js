/* יום־יום – סידורים. Plan the shortest walk from home through all the errands and back home.
   Levels: 2 → 6 places on a growing street map. Score = 80% how close to the shortest route + 20% speed. */
(function () {
  const ROUNDS = 3;
  const PLACES = [["🏦", "בנק"], ["📮", "דואר"], ["🛒", "מכולת"], ["💊", "בית מרקחת"], ["🏥", "מרפאה"], ["📚", "ספרייה"], ["🥖", "מאפייה"], ["💇", "מספרה"], ["🌳", "פארק"], ["☕", "בית קפה"]];
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  function perms(a) { if (a.length <= 1) return [a]; return a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])); }
  const routeLen = (home, order) => { let d = 0, cur = home; order.forEach((p) => { d += dist(cur, p); cur = p; }); return d + dist(cur, home); };
  Games.register({
    id: "errands", cat: "daily", name: "סידורים", icon: "🗺️",
    desc: "תכננו את הדרך הקצרה ביותר",
    how: `על המפה יש את הבית 🏠 וכמה מקומות שצריך להגיע אליהם. געו במקומות לפי הסדר שבו תלכו – ובסוף חוזרים הביתה. נסו למצוא את הדרך הקצרה ביותר! ${ROUNDS} מפות. טעיתם בסדר? לחצו "מהתחלה". ברמות גבוהות יש יותר מקומות.`,
    start(stage, level, api) {
      const k = Math.round(lerp(2, 6, level));
      const G = k <= 3 ? 4 : k <= 5 ? 5 : 6;
      const T = timersKit();
      let round = 0, effSum = 0, times = [], fit = null;
      function play() {
        round++; api.status(`מפה ${round}/${ROUNDS}`); api.msg("געו במקומות לפי הסדר", "soft");
        const spots = shuffle([...Array(G * G).keys()]).slice(0, k + 1).map((s) => ({ x: s % G, y: Math.floor(s / G) }));
        const home = { ...spots[0], e: "🏠", n: "בית" };
        const places = shuffle(PLACES.slice()).slice(0, k).map((p, i) => ({ ...spots[i + 1], e: p[0], n: p[1] }));
        const best = Math.min(...perms(places).map((o) => routeLen(home, o)));
        stage.innerHTML = `<div class="board"><div class="b-main"><div class="map" style="--g:${G}"><svg class="route"></svg></div></div>
          <div class="b-row"><span class="counter">אורך הדרך: <b>0</b></span><button class="btn secondary slim reset">↺ מהתחלה</button></div></div>`;
        const map = $(".map", stage), svg = $(".route", stage), cnt = $(".counter b", stage);
        [home, ...places].forEach((p, i) => {
          const b = document.createElement("button");
          b.className = "spot" + (i === 0 ? " home" : ""); b.dataset.i = i - 1;
          b.innerHTML = `<span>${p.e}</span><small>${p.n}</small>`;
          b.style.left = `${((p.x + 0.5) / G) * 100}%`; b.style.top = `${((p.y + 0.5) / G) * 100}%`;
          map.appendChild(b);
        });
        fit = () => { const pr = map.parentElement; const s = Math.min(pr.clientWidth, pr.clientHeight); map.style.width = map.style.height = s + "px"; };
        fit();
        let order = [], t0 = Date.now(), over = false;
        const draw = () => {
          const pts = [home, ...order, ...(order.length === k ? [home] : [])];
          let d = "";
          pts.forEach((p, i) => { const X = ((p.x + 0.5) / G) * 100, Y = ((p.y + 0.5) / G) * 100; if (!i) d += `M${X} ${Y}`; else { const q = pts[i - 1]; d += ` L${X} ${((q.y + 0.5) / G) * 100} L${X} ${Y}`; } });
          svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("preserveAspectRatio", "none");
          svg.innerHTML = `<path d="${d}"/>`;
          let len = 0; for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
          cnt.textContent = len;
          map.querySelectorAll(".spot").forEach((b) => { const j = Number(b.dataset.i); b.querySelector("i")?.remove(); const n = order.indexOf(places[j]); if (j >= 0 && n >= 0) { b.classList.add("visited"); b.insertAdjacentHTML("beforeend", `<i>${n + 1}</i>`); } else b.classList.remove("visited"); });
        };
        draw();
        map.onclick = (e) => {
          const b = e.target.closest(".spot"); if (!b || over) return;
          const j = Number(b.dataset.i); if (j < 0) return;
          const p = places[j]; if (order.includes(p)) return;
          order.push(p); api.sound.flip(); draw();
          if (order.length === k) {
            over = true;
            const len = routeLen(home, order), eff = best / len;
            effSum += eff; times.push((Date.now() - t0) / 1000);
            if (len === best) { api.sound.good(); api.msg("מצוין – זו הדרך הקצרה ביותר!", "good"); }
            else api.msg(`הדרך שלכם: ${len} · הקצרה ביותר: ${best}`, "soft");
            T.later(round < ROUNDS ? play : finish, len === best ? 1400 : 2600);
          }
        };
        $(".reset", stage).onclick = () => { if (over) return; order = []; draw(); };
      }
      api.onResize(() => fit && fit());
      function finish() {
        const eff = effSum / ROUNDS, at = avg(times);
        api.finish({
          score: Math.round(100 * Math.pow(eff, 1.5) * (0.8 + 0.2 * speedFactor(at, k * 4))),
          stats: [["קרבה לדרך הקצרה", Math.round(eff * 100) + "%"], ["מקומות בכל מפה", k]]
        });
      }
      play();
      return { stop: T.clear };
    }
  });
})();
