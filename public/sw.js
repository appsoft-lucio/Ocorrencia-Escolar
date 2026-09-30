// Build replaces these markers with all emitted files and their content revision.
const REVISION = "__BUILD_REVISION__";
const FILES = /* __PRECACHE_FILES__ */ ["./"];
const CACHE_NAME = `eduregistro-offline-${REVISION}`;
const scope = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) =>
    cache.addAll(FILES.map((file) => new Request(new URL(file, scope), { cache: "reload" }))),
  ));
  // Updates wait for user action so open forms are not lost.
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Keep the previous cache for assets still used by another open tab.
    const keys = (await caches.keys()).filter((key) => key.startsWith("eduregistro-"));
    const old = keys.filter((key) => key !== CACHE_NAME);
    await Promise.all(old.slice(0, -1).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(scope)) return;
  if (event.request.mode === "navigate") {
    // HTML and assets always belong to the same installed release.
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
      (await cache.match(new URL("index.html", scope))) || fetch(event.request),
    ));
    return;
  }
  if (!FILES.some((file) => new URL(file, scope).href === url.href)) {
    if (url.pathname.startsWith(new URL("assets/", scope).pathname)) {
      event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    }
    return;
  }
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
    (await cache.match(event.request)) || fetch(event.request),
  ));
});
