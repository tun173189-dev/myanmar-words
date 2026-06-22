const CACHE_NAME = "daily-myanmar-words-v38";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./words.js",
  "./words-extra.js",
  "./words-generated.js",
  "./stories.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-512.png",
  "./home-hero-bg.png",
  "./complete-bg.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

