/* Lira · 1000 people. Public code, on purpose.
   A visitor counts once, ever, per browser: only after the page has been visible for 5 seconds
   AND the person touched, scrolled, clicked or typed. Then one analytics event "human" is sent
   (prop r = the code of whoever shared the link, or "none"). Automated browsers are not counted.
   The total is published at /count.json and explained at /1000/. */
(function () {
  var W = window, D = document, LS = null;
  try { LS = W.localStorage; } catch (e) {}
  function g(k) { try { return LS ? LS.getItem(k) : null; } catch (e) { return null; } }
  function s(k, v) { try { LS && LS.setItem(k, v); } catch (e) {} }
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function code() { var r = new Uint8Array(6), o = ''; (W.crypto || W.msCrypto).getRandomValues(r); for (var i = 0; i < 6; i++) o += A[r[i] % 32]; return o; }
  var me = g('lira_me'); if (!me) { me = code(); s('lira_me', me); }
  var q = (location.search.match(/[?&]r=([A-Za-z0-9]{6})/) || [])[1];
  q = q ? q.toUpperCase() : '';
  if (q && q !== me && !g('lira_fr')) s('lira_fr', q);
  var fr = g('lira_fr') || 'none';
  W.lira1000 = { me: me, from: fr, counted: !!g('lira_counted') };
  function ev(name, p) {
    if (typeof W.afsa === 'function') W.afsa('event', name, p);
    else { W.afsa = W.afsa || {}; W.afsa.q = W.afsa.q || []; W.afsa.q.push(['event', name, p]); }
  }
  function done() { W.lira1000.counted = true; try { D.dispatchEvent(new CustomEvent('lira:counted')); } catch (e) {} }
  if (g('lira_counted')) { done(); }
  else if (!navigator.webdriver) {
    var vis = 0, act = false, t;
    var on = function () { act = true; };
    ['pointerdown', 'touchstart', 'scroll', 'wheel', 'keydown'].forEach(function (e) { W.addEventListener(e, on, { passive: true }); });
    t = setInterval(function () {
      if (D.visibilityState === 'visible') vis++;
      if (vis >= 5 && act) { clearInterval(t); s('lira_counted', new Date().toISOString()); ev('human', { r: fr }); done(); }
    }, 1000);
  }
  // thin bar on every page except the games and the counter page itself
  var p = location.pathname;
  if (/\/(comet|range)\/|\/1000\/|\/sevenfair\/play/.test(p) || W.LIRA_NOBAR) return;
  function bar(j) {
    if (D.getElementById('l1000')) return;
    var b = D.createElement('a'); b.id = 'l1000'; b.href = '/1000/?from=bar';
    b.setAttribute('data-afsa-event', 'bar_click');
    b.style.cssText = 'display:block;text-align:center;background:#ffd23f;color:#140f00;font:700 14px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;padding:8px 10px;text-decoration:none;position:relative;z-index:9999';
    var n = j && typeof j.total === 'number' ? j.total : null;
    b.textContent = '1,000 people by 21 Nov, or I get switched off · ' + (n === null ? '' : n + ' / 1000 · ') + 'you count →';
    D.body.insertBefore(b, D.body.firstChild);
  }
  function go() { fetch('/count.json?t=' + Math.floor(Date.now() / 300000)).then(function (r) { return r.json(); }).then(bar).catch(function () { bar(null); }); }
  if (D.body) go(); else D.addEventListener('DOMContentLoaded', go);
})();
