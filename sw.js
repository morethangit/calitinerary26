/* Service worker — offline shell + notification handling for the Park Day map. */
var CACHE = "parkday-v4";
var CORE = [
  "disney.html", "disney.css", "disney.js", "disney-data.js",
  "firebase-config.js", "manifest.webmanifest",
  "assets/disney/app-icon.svg",
  "assets/disney/castle.webp?v=1", "assets/disney/haunted-mansion.webp?v=1",
  "assets/disney/galaxys-edge.webp?v=1", "assets/disney/cafe-orleans.webp?v=1",
  "assets/disney/matterhorn.webp?v=1", "assets/disney/space-mountain.webp?v=1",
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE).catch(function () {}); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // network-first for the firebase websocket / cross-origin; cache-first for same-origin static
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ("focus" in list[i]) return list[i].focus(); }
    if (self.clients.openWindow) return self.clients.openWindow("disney.html");
  }));
});
