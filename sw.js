const CACHE_NAME = "naf-runtime-v1";
const CACHEABLE_ASSET = /\.(?:css|js|webp|jpe?g|png|svg|woff2?)$/i;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("naf-runtime-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || !CACHEABLE_ASSET.test(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      const networkResponse = fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          cache.put(request, response.clone());
        }

        return response;
      });

      if (cachedResponse) {
        event.waitUntil(networkResponse.catch(() => undefined));
        return cachedResponse;
      }

      return networkResponse;
    }),
  );
});
