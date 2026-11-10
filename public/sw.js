// GedaTv no longer uses a service worker.
// Browsers that installed the old caching worker fetch this file on their next
// visit; it wipes the old caches, unregisters itself and reloads open tabs so
// requests go straight to the network again.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
