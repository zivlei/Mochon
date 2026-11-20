/* חשבון – מה משתלם? Two offers of the same product – which is cheaper per unit?
   Levels: same amount, different price → different amounts (easy ratios) → grams vs kilos, harder ratios.
   Score = 80% correct + 20% speed. */
(function () {
  const ROUNDS = 8;
  // emoji, name, unit, units, weight kind, typical price per unit (per kilo for weighed products)
  const PRODUCTS = [["🥛", "חלב", "קרטון", "קרטונים", "ליטר", 7], ["🍞", "לחם", "כיכר", "כיכרות", null, 9], ["🥚", "ביצים", "ביצה", "ביצים", null, 1.5],
    ["🧀", "גבינה", "גביע", "גביעים", "גרם", 6], ["☕", "קפה", "חבילה", "חבילות", "גרם", 18], ["🍫", "שוקולד", "חפיסה", "חפיסות", "גרם", 8],
    ["🍎", "תפוחים", null, null, "קילו", 10], ["🍅", "עגבניות", null, null, "קילו", 8], ["🍪", "עוגיות", "חבילה", "חבילות", "גרם", 12], ["🧻", "נייר טואלט", "גליל", "גלילים", null, 3]];
  const money = (v) => (Number.isInteger(v) ? v : v.toFixed(1)) + " ₪";
  Games.register({
    id: "cheaper", cat: "math", name: "מה משתלם?", icon: "⚖️",
    desc: "איזו הצעה זולה יותר באמת?",
    how: `שתי הצעות לאותו מוצר. בחרו את ההצעה המשתלמת יותר – הזולה יותר ליחידה (או לקילו). ${ROUNDS} שאלות.<br>ברמות הראשונות הכמות שווה. אחר כך הכמויות שונות, ומרמה 21 משווים גרמים לקילו.`,
    start(stage, level, api) {
      return runQuiz(stage, api, {
        rounds: ROUNDS, targetT: lerp(6, 12, level), accW: 80, optClass: "txt offers",
        make() {
          const p = pick(PRODUCTS);
          let A, B, ta, tb;
          const base = Math.max(1, Math.round(p[5] * (0.8 + Math.random() * 0.4) * 10) / 10);
          const gap = lerp(0.35, 0.1, level);           // how different the unit prices are
          const cheapU = base, dearU = Math.round(base * (1 + gap) * 10) / 10;
          if (level <= 7 || !p[2]) {
            const q = p[2] ? rand(1, 4) : 1;
            const unitTx = p[2] ? (q === 1 ? p[2] : `${q} ${p[3]}`) : "קילו";
            A = { price: Math.round(cheapU * q * 10) / 10 }; B = { price: Math.round(dearU * q * 10) / 10 };
            ta = tb = unitTx;
          } else if (level <= 20 || !p[4] || p[4] === "ליטר") {
            const qa = rand(2, 6); let qb = rand(2, 8); if (qb === qa) qb++;
            A = { price: Math.round(cheapU * qa * 10) / 10 }; B = { price: Math.round(dearU * qb * 10) / 10 };
            ta = `${qa} ${p[3]}`; tb = `${qb} ${p[3]}`;
          } else {
            const ga = pick([200, 250, 400, 500]), gb = pick([750, 1000, 1500]);
            const perKgCheap = Math.round(base * 5), perKgDear = Math.round(base * 5 * (1 + gap) * 10) / 10;
            const swap = Math.random() < 0.5;
            const [ka, kb] = swap ? [perKgDear, perKgCheap] : [perKgCheap, perKgDear];
            A = { price: Math.round((ka * ga) / 100) / 10 }; B = { price: Math.round((kb * gb) / 100) / 10 };
            ta = `${ga} גרם`; tb = `${gb / 1000} ק״ג`;
            if (swap) { const t = A; A = B; B = t; const x = ta; ta = tb; tb = x; }
          }
          const optA = `${ta}<br><b>${money(A.price)}</b>`, optB = `${tb}<br><b>${money(B.price)}</b>`;
          const opts = shuffle([optA, optB]);
          return { html: `<div class="face-q">${p[0]}</div><div class="q-line big">${p[1]} – מה משתלם יותר?</div>`, ans: optA, opts, prompt: "בחרו את ההצעה הזולה יותר ליחידה" };
        }
      });
    }
  });
})();
