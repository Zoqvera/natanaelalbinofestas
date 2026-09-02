const CACHE_NAME = "naf-media-v1";
const CACHEABLE_MEDIA = /\.(?:webp|jpe?g|png|svg)$/i;

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
            .filter(
              (key) =>
                (key.startsWith("naf-runtime-") || key.startsWith("naf-media-")) &&
                key !== CACHE_NAME,
            )
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

  if (url.origin !== self.location.origin || !CACHEABLE_MEDIA.test(url.pathname)) return;

  const cachePromise = caches.open(CACHE_NAME);
  const networkPromise = cachePromise.then((cache) =>
    fetch(request).then((response) => {
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }

      return response;
    }),
  );

  // Retorna a mídia armazenada imediatamente e atualiza a cópia em segundo plano.
  event.waitUntil(networkPromise.catch(() => undefined));

  event.respondWith(
    cachePromise
      .then((cache) => cache.match(request))
      .then((cachedResponse) => cachedResponse || networkPromise),
  );
});
