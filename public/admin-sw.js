/*
 * Service worker for the Admin SS Infra app (scope: /admin).
 *
 * Caching policy: NOTHING private is cached. Admin pages and data always
 * come from the network. The only cached file is a static offline page,
 * shown when a navigation fails without a connection.
 */

const VERSION = "v1";
const OFFLINE_CACHE = `ssi-admin-offline-${VERSION}`;
const OFFLINE_URL = "/admin-offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith("ssi-admin-") && k !== OFFLINE_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only page navigations get a fallback; everything else goes straight to the network.
  if (req.mode !== "navigate") return;
  event.respondWith(
    fetch(req).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      return cached || new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } });
    }),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "New SS Infratech Enquiry";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Open Admin SS Infra to review the details.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag || "ssi-lead",
      data: { url: typeof data.url === "string" && data.url.startsWith("/admin") ? data.url : "/admin/leads" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin/leads", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.startsWith(self.location.origin + "/admin") && "focus" in win) {
          return win.navigate(target).then((w) => (w || win).focus());
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
