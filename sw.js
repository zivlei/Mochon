// מוחון – offline cache. Network first (revalidated) so updates arrive when online; cache as fallback offline.
const CACHE = "mochon-v14";
const FILES = [
  "./", "index.html", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png",
  "css/style.css", "js/core.js", "js/cloud.js", "js/app.js",
  "js/games/match.js", "js/games/simon.js", "js/games/missing.js",
  "js/games/math.js", "js/games/change.js",
  "js/games/oddone.js", "js/games/schulte.js",
  "js/games/targets.js", "js/games/traffic.js",
  "js/games/scramble.js", "js/games/oddword.js",
  "js/games/series.js", "js/games/clock.js",
  "js/games/stroop.js", "js/games/fish.js",
  "js/games/shopping.js", "js/games/places.js", "js/games/faces.js", "js/games/order.js",
  "js/games/diff.js", "js/games/quickcount.js", "js/games/gatekeeper.js", "js/games/register.js",
  "js/games/timetable.js", "js/games/proverb.js", "js/games/synonyms.js",
  "js/games/crossword.js", "js/games/maze.js", "js/games/sudoku.js",
  "js/games/pattern.js", "js/games/trace.js", "js/games/catch.js", "js/games/mirror.js",
  "js/games/pills.js", "js/games/errands.js", "js/games/sign.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith("version.json")) return; // always straight from the server
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
