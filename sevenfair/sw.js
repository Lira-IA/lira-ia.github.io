/* SEVENFAIR service worker: the daily "new track" ping the rider asked for, and (28/11) a spare copy of The Comet so the installed app opens without a network. Network first, always: the copy is used only when the network fails. No tracking. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
const SPARE = 'sevenfair-comet-spare-v1';
const keep = (u) => u.origin === self.location.origin && (u.pathname.indexOf('/sevenfair/comet/') === 0 || u.pathname === '/sevenfair/carry.js');
self.addEventListener('fetch', (e) => {
  const r = e.request; let u; try { u = new URL(r.url); } catch (err) { return; }
  if (r.method !== 'GET' || !keep(u)) return;
  e.respondWith(fetch(r).then((res) => {
    if (res && res.ok && res.type === 'basic') { const c = res.clone(); caches.open(SPARE).then((k) => k.put(r, c)).catch(() => {}); }
    return res;
  }).catch(() => caches.open(SPARE).then((k) => k.match(r, { ignoreSearch: r.mode === 'navigate' || u.pathname.endsWith('.js') })).then((m) => m || Response.error())));
});
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || '☄️ A new track is out';
  const body = d.body || 'Same track for everyone today. Your points count for 7 days.';
  e.waitUntil(self.registration.showNotification(title, {
    body, tag: 'sevenfair-track', renotify: true,
    icon: '/sevenfair/queen.jpg', badge: '/sevenfair/queen.jpg',
    data: { url: d.url || '/sevenfair/comet/?from=push' }
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/sevenfair/comet/?from=push';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) if (c.url.indexOf('/sevenfair/comet/') >= 0 && 'focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
