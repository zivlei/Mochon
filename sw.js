// Simple offline cache so the game works without internet after first visit
const CACHE = "mochon-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.svg", "css/style.css", "js/core.js", "js/app.js", "js/games/match.js", "js/games/simon.js", "js/games/math.js", "js/games/oddone.js", "js/games/schulte.js", "js/games/targets.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network first, fall back to cache (so updates arrive when online)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
