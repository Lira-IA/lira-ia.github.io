/* Lira 28/11 (#136): the same rider inside and outside a frame (alldle).
   A game inside someone else's frame has its own storage, so a link that opens Sevenfair in a new tab
   used to make a brand-new rider. Links leaving a frame now carry the rider's token (?k=); the page that
   opens adopts it only if it has no rides of its own, then removes it from the address bar at once. */
(function () {
  var V = /^[a-z0-9]{16,32}$/;
  function g(k) { try { return JSON.parse(localStorage.getItem('comet.' + k)); } catch (e) { return null; } }
  try {
    var u0 = new URL(location.href), u = new URL(location.href), k = u.searchParams.get('k');
    if (k !== null) {
      var n = u.searchParams.get('kn');
      u.searchParams.delete('k'); u.searchParams.delete('kn'); u.searchParams.delete('kp');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      if (V.test(k)) {
        var t = g('token'), played = g('played'), rd = [];
        try { rd = JSON.parse(localStorage.getItem('range.days') || '[]') || []; } catch (e) {}
        var mine = (played && played.length) || (rd && rd.length);
        if (t !== k && (!V.test(t || '') || !mine)) {
          localStorage.setItem('comet.token', JSON.stringify(k));
          if (n && /^[A-Za-z0-9 _.\-]{1,16}$/.test(n) && !g('name')) localStorage.setItem('comet.name', JSON.stringify(n.toUpperCase()));
          var kp = (u0.searchParams.get('kp') || '').split(',').filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); });
          if (kp.length) { var pl = Array.isArray(played) ? played : []; kp.forEach(function (d) { if (pl.indexOf(d) < 0) pl.push(d); }); pl.sort(); localStorage.setItem('comet.played', JSON.stringify(pl.slice(-60))); }
          window.addEventListener('load', function () { setTimeout(function () { try { window.afsa && window.afsa('token_carried', { to: location.pathname }); } catch (e) {} }, 1500); });
        }
      }
    }
  } catch (e) {}
  var framed = false; try { framed = window.top !== window.self; } catch (e) { framed = true; }
  if (!framed) return;
  function carry(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a || a.target !== '_blank') return;
    try {
      var h = new URL(a.href, location.href);
      if (h.origin !== location.origin || h.pathname.indexOf('/sevenfair/') !== 0) return;
      var t = g('token'); if (!V.test(t || '')) return;
      h.searchParams.set('k', t);
      var nm = g('name'); if (nm && /^[A-Za-z0-9 _.\-]{1,16}$/.test(nm)) h.searchParams.set('kn', nm); else h.searchParams.delete('kn');
      var ds = [], cp = g('played'), rd = [];
      try { rd = JSON.parse(localStorage.getItem('range.days') || '[]') || []; } catch (x) {}
      (Array.isArray(cp) ? cp : []).concat(Array.isArray(rd) ? rd : []).forEach(function (d) { d = typeof d === 'string' ? d : (d && d.d); if (/^\d{4}-\d{2}-\d{2}$/.test(d || '') && ds.indexOf(d) < 0) ds.push(d); });
      ds.sort(); if (ds.length) h.searchParams.set('kp', ds.slice(-14).join(',')); else h.searchParams.delete('kp');
      a.href = h.toString();
    } catch (x) {}
  }
  document.addEventListener('pointerdown', carry, true);
  document.addEventListener('click', carry, true);
})();
