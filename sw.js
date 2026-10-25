/* CLARITY — офлайн-режим. Лежит рядом с index.html. */
var CACHE = 'clarity-v19';
var SHELL = ['./', './index.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return fetch(u, { cache: 'reload' }).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;           // бот, Telegram и т.п. — мимо кэша
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(req, { ignoreSearch: true }).then(function (hit) {
        // мгновенно из кэша, а свежую версию тихо подтягиваем для следующего запуска
        var net = fetch(req).then(function (r) {
          if (r && r.ok) c.put(req, r.clone());
          return r;
        }).catch(function () { return null; });
        if (hit) { e.waitUntil(net); return hit; }
        return net.then(function (r) {
          if (r) return r;
          if (req.mode === 'navigate') return c.match('./index.html');
          return new Response('', { status: 504 });
        });
      });
    })
  );
});
