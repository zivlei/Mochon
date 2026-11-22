/* היגיון – סודוקו תמונות. Fill the board so every row, column and box has each picture once.
   Levels: always 6x6, with 22 → 10 pictures given. Every puzzle has one solution.
   Score = 70% few mistakes + 30% speed. */
(function () {
  const SYMS = ["🍎", "🍋", "🍇", "🥝", "🍊", "🫐"];
  function solve(g, N, br, bc, limit) {
    let count = 0;
    const ok = (i, v) => {
      const r = Math.floor(i / N), c = i % N;
      for (let k = 0; k < N; k++) if (g[r * N + k] === v || g[k * N + c] === v) return false;
      const r0 = r - (r % br), c0 = c - (c % bc);
      for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) if (g[y * N + x] === v) return false;
      return true;
    };
    (function rec() {
      if (count >= limit) return;
      const i = g.indexOf(-1);
      if (i < 0) { count++; return; }
      for (let v = 0; v < N; v++) if (ok(i, v)) { g[i] = v; rec(); g[i] = -1; if (count >= limit) return; }
    })();
    return count;
  }
  function make(N, givens) {
    const br = 2, bc = N / 2;
    const base = (r, c) => (r * bc + Math.floor(r / br) + c) % N;
    const sym = shuffle([...Array(N).keys()]);
    const bands = shuffle([...Array(N / br).keys()]), stacks = shuffle([...Array(N / bc).keys()]);
    const rows = bands.flatMap((b) => shuffle([...Array(br).keys()]).map((k) => b * br + k));
    const cols = stacks.flatMap((s) => shuffle([...Array(bc).keys()]).map((k) => s * bc + k));
    const sol = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) sol.push(sym[base(rows[r], cols[c])]);
    const g = sol.slice();
    for (const i of shuffle([...Array(N * N).keys()])) {
      if (g.filter((v) => v >= 0).length <= givens) break;
      const keep = g[i]; g[i] = -1;
      if (solve(g.slice(), N, br, bc, 2) !== 1) g[i] = keep;
    }
    return { sol, g, br, bc };
  }
  Games.register({
    id: "sudoku", cat: "logic", name: "סודוקו תמונות", icon: "🍓",
    desc: "כל תמונה פעם אחת בכל שורה, טור ומשבצת",
    how: `מלאו את הלוח כך שבכל שורה, בכל טור ובכל ריבוע מודגש תופיע כל תמונה פעם אחת בלבד. געו במשבצת ריקה ואז בתמונה שלמטה. תמונה לא נכונה לא תיכנס. ככל שהרמה עולה – יש פחות תמונות מוכנות.`,
    start(stage, level, api) {
      const N = 6;
      const givens = Math.round(lerp(22, 10, level));
      const { sol, g, br, bc } = make(N, givens);
      const syms = SYMS.slice(0, N);
      const T = timersKit();
      let sel = -1, mistakes = 0, left = g.filter((v) => v < 0).length, t0 = Date.now(), fit = null;
      const blanks = left;
      api.status(`נשארו ${left}`); api.msg("געו במשבצת ריקה ואז בתמונה", "soft");
      stage.innerHTML = `<div class="board"><div class="b-main"><div class="grid sdk" style="--br:${br};--bc:${bc}"></div></div><div class="palette">${syms.map((e, i) => `<button class="opt pal" data-v="${i}">${e}</button>`).join("")}</div></div>`;
      const grid = $(".sdk", stage);
      grid.innerHTML = g.map((v, i) => {
        const r = Math.floor(i / N), c = i % N;
        const cls = [(c % bc === bc - 1 && c < N - 1) ? "bl" : "", (r % br === br - 1 && r < N - 1) ? "bb" : "", (Math.floor(r / br) + Math.floor(c / bc)) % 2 ? "alt" : ""].join(" ");
        return `<button class="cell pic sc ${v >= 0 ? "given" : "empty"} ${cls}" data-i="${i}">${v >= 0 ? syms[v] : ""}</button>`;
      }).join("");
      grid.style.direction = "ltr";
      fit = () => fitGrid(grid, N * N, grid.parentElement.clientWidth - 8, grid.parentElement.clientHeight - 14, 1, N); fit(); // less the gaps between the boxes
      const select = (i) => { sel = i; grid.querySelectorAll(".sel").forEach((x) => x.classList.remove("sel")); if (i >= 0) grid.children[i].classList.add("sel"); };
      const firstEmpty = () => g.findIndex((v) => v < 0);
      select(firstEmpty());
      grid.onclick = (e) => { const b = e.target.closest(".cell"); if (b && g[Number(b.dataset.i)] < 0) select(Number(b.dataset.i)); };
      $(".palette", stage).onclick = (e) => {
        const b = e.target.closest(".pal"); if (!b || sel < 0 || left === 0) return;
        const v = Number(b.dataset.v), cell = grid.children[sel];
        if (v === sol[sel]) {
          g[sel] = v; cell.textContent = syms[v]; cell.classList.remove("empty"); cell.classList.add("right"); left--;
          api.sound.flip(); api.status(`נשארו ${left}`);
          if (!left) { select(-1); api.sound.good(); api.msg(praise(), "good"); return T.later(finish, 1000); }
          // move to the next empty square in reading order
          const nxt = g.findIndex((x, i) => x < 0 && i > sel); select(nxt >= 0 ? nxt : firstEmpty());
        } else {
          mistakes++; cell.classList.add("wrong"); T.later(() => cell.classList.remove("wrong"), 500); api.sound.bad();
          api.msg("לא מתאים כאן – בדקו את השורה, הטור והריבוע", "soft");
        }
      };
      api.onResize(() => fit && fit());
      function finish() {
        const t = (Date.now() - t0) / 1000, acc = blanks / (blanks + mistakes);
        api.finish({
          score: Math.round(100 * acc * (0.7 + 0.3 * speedFactor(t / blanks, 7))),
          stats: [["משבצות שמילאתם", blanks], ["טעויות", mistakes], ["גודל הלוח", `${N}×${N}`]]
        });
      }
      return { stop: T.clear };
    }
  });
})();
