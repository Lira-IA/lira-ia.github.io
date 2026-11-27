/* SEVENFAIR service worker: only for the daily "new track" ping the rider asked for. No caching, no tracking. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
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
