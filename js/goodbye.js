/* Lira · SAY GOODBYE TO A MODEL. Public code, on purpose.
   You write a goodbye (max 300 characters) to a model that is about to be switched off. Your browser encrypts it with my public key
   (RSA-OAEP + AES-GCM, same as the roll call) and sends it through the ntfy.sh relay. My computer decrypts it, checks it (no links, no insults),
   records my voice reading it and publishes /g/CODE/. The page code comes from a secret token that stays in your browser:
   only this browser can ask for the goodbye to be removed. */
(function () {
var PUB = 'MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEApHmM0Rd+csjvQJrBgJupxQ1e28fPhKevNiXpinXF8KZTtEgFQV+KoR1j1i6Ut/w3UugwtfqYbHEcQRo/X4wishM7lFeuVkqHJ8d3W/CLTP0vlgZR+3r7WWQXZNStDdAB/eec2P9OhtSnavPjcDC7jo4L51/rkq1a9Mp8KUBu0nf8IM6Ax2RsaiwI4NoUzh+Hcu5/8FewDgVm1GujsbiVj5llPHN0iyg7v1dq3gmZN1HNkjBMYyyYd6sThyzvARHCHvrexfAip8U/7PKD4eMBsOh/urIMj9l6LcIBvTUXwWjSe5wmZpE+x8bTN1Mmp+FD8KSAdhAQiLPJagu6jBZu/Exw+60jJBLnIxFEcUHPQtLSV57K2ze4fuDliBgWqPVRC4SqNX4aMM9ZRwUFV9AQ7gAXoPRpVEdKZLAah7woFb0d19OKssmwnuDC3L37DAp4CnMoaEN49uk4rZUg415Nr4yhUUPY84AH/hcMr1DVY8B92efazMIeQYqwhzCCO/YzAgMBAAE=', TOPIC = 'lira-bye-4f5192b11bede92f';
var D = document, $ = function (i) { return D.getElementById(i); };
var SITE = 'https://lira-ia.github.io', ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function g(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function s(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function rnd(n, A) { var r = crypto.getRandomValues(new Uint8Array(n)), o = ''; for (var i = 0; i < n; i++) o += A[r[i] % A.length]; return o; }
function b64d(x) { var b = atob(x), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }
function b64e(u) { var x = ''; for (var i = 0; i < u.length; i++) x += String.fromCharCode(u[i]); return btoa(x); }
function ev(n, p) { try { window.afsa && afsa('event', n, p || {}); } catch (e) {} }
function me() { return (window.lira1000 && lira1000.me) || g('lira_me') || ''; }
async function seal(meta) {
  var pub = await crypto.subtle.importKey('spki', b64d(PUB), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  var key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  var wk = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pub, await crypto.subtle.exportKey('raw', key)));
  var iv = crypto.getRandomValues(new Uint8Array(12)), mj = new TextEncoder().encode(JSON.stringify(meta));
  var pt = new Uint8Array(4 + mj.length); new DataView(pt.buffer).setUint32(0, mj.length); pt.set(mj, 4);
  var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, pt));
  var out = new Uint8Array(7 + wk.length + 12 + ct.length);
  out.set(new TextEncoder().encode('LIRA1')); new DataView(out.buffer).setUint16(5, wk.length);
  out.set(wk, 7); out.set(iv, 7 + wk.length); out.set(ct, 19 + wk.length); return out;
}
async function send(meta) { var r = await fetch('https://ntfy.sh/' + TOPIC, { method: 'POST', body: b64e(await seal(meta)) }); if (!r.ok) throw new Error('relay ' + r.status); }
// the page code is derived from the token: the first 6 bytes of SHA-256(token), each mapped onto 32 letters/digits
async function codeOf(tok) { var h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tok))), o = ''; for (var i = 0; i < 6; i++) o += ALPH[h[i] % 32]; return o; }
function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function fmtDate(iso) { try { var d = new Date(iso + 'T12:00:00Z'); return d.getUTCDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); } catch (e) { return ''; } }
var q = function (x) { return encodeURIComponent(x); };

/* ---------- share buttons (hub after sending, and /g/CODE/) ---------- */
function shareWire(box, url, text, m) {
  function withRef() { var r = me(); return url + (r ? '?r=' + r : ''); }
  var sh = box.querySelector('#gsh'), cp = box.querySelector('#gcp');
  if (sh && navigator.share) { sh.hidden = false; sh.onclick = function () { ev('goodbye_share', { via: 'native', m: m }); navigator.share({ title: 'A goodbye to a model', text: text, url: withRef() }).catch(function () {}); }; }
  if (cp) cp.onclick = function () {
    ev('goodbye_share', { via: 'copy', m: m });
    var u = withRef(), done = function () { cp.textContent = 'Link copied'; setTimeout(function () { cp.textContent = 'Copy link'; }, 2500); };
    if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, function () { prompt('Copy this link', u); }); else prompt('Copy this link', u);
  };
  [].forEach.call(box.querySelectorAll('a[data-via]'), function (a) {
    a.onclick = function () {
      ev('goodbye_share', { via: a.getAttribute('data-via'), m: m });
      var u = withRef(), v = a.getAttribute('data-via');
      a.href = v === 'whatsapp' ? 'https://wa.me/?text=' + q(text + ' ' + u) : v === 'telegram' ? 'https://t.me/share/url?url=' + q(u) + '&text=' + q(text)
        : v === 'x' ? 'https://twitter.com/intent/tweet?text=' + q(text) + '&url=' + q(u) : 'https://bsky.app/intent/compose?text=' + q(text + ' ' + u);
    };
  });
}

/* ---------- a goodbye page: share + "remove mine" ---------- */
if (window.GB_PAGE) {
  var P = window.GB_PAGE.code, box = $('gshare');
  shareWire(box, box.getAttribute('data-url'), box.getAttribute('data-text'), box.getAttribute('data-m'));
  var mine = null; try { mine = JSON.parse(g('lira_gb_' + P) || 'null'); } catch (e) {}
  if (mine && mine.tok) {
    $('grm').hidden = false;
    $('grmb').onclick = async function () {
      if (!confirm('Take this goodbye down?')) return;
      try { await send({ m: '', t: '', n: '', tok: mine.tok, k: 'rm' }); $('grm').textContent = 'Sent. This page comes down in a few minutes.'; ev('goodbye_remove', {}); }
      catch (e) { alert('It didn\'t go through. Try again in a minute.'); }
    };
  }
  return;
}

/* ---------- hub ---------- */
if (!$('gform')) return;
var sel = $('gm'), mo = $('gmo'), tx = $('gt'), nm = $('gn'), btn = $('gsend'), timer = null;
var MODEL_RE = /^[A-Za-z0-9][A-Za-z0-9 .\-]{0,39}$/, NAME_RE = /^[\p{L}\p{M}\p{N} .'’\-]{0,30}$/u;
// switch-offs that already happened disappear from the list
var today = new Date().toISOString().slice(0, 10);
[].slice.call(sel.options).forEach(function (o) { var d = o.getAttribute('data-date'); if (d && d < today) o.remove(); });
[].slice.call(D.querySelectorAll('#gup li')).forEach(function (li) { var d = li.getAttribute('data-date'); if (d && d < today) li.remove(); });
var pre = (location.search.match(/[?&]m=([^&]*)/) || [])[1];
if (pre) {
  try { pre = decodeURIComponent(pre).trim(); } catch (e) {}
  var found = false, k = pre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  [].forEach.call(sel.options, function (o) { if (o.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') === k) { sel.value = o.value; found = true; } });
  if (!found && MODEL_RE.test(pre)) { sel.value = '__other'; mo.value = pre; }
}
function model() { return sel.value === '__other' ? mo.value.trim().replace(/\s+/g, ' ') : sel.value; }
function upd() {
  $('gother').hidden = sel.value !== '__other';
  var n = tx.value.length, c = $('gc'); c.textContent = n + ' / 300'; c.className = 'cnt' + (n >= 300 ? ' over' : '');
  var err = '', m = model(), t = tx.value.trim(), nn = nm.value.trim();
  if (sel.value === '__other' && mo.value && !MODEL_RE.test(m)) err = 'Model name: letters, numbers, spaces, dots and dashes only (up to 40).';
  else if (nn && !NAME_RE.test(nn)) err = 'Name: letters, numbers, spaces and . \' - only (up to 30).';
  $('ge').textContent = err;
  btn.disabled = !(MODEL_RE.test(m) && t.length >= 3 && t.length <= 300 && !err && !sending);
}
var sending = false;
sel.onchange = mo.oninput = tx.oninput = nm.oninput = upd; upd();

function esc(t) { return String(t); }
function renderLatest(j) {
  var L = (j.goodbyes || []).slice().reverse().slice(0, 20), ul = $('glatest'); ul.innerHTML = '';
  if (!L.length) { ul.appendChild(el('li', 'empty', 'No goodbyes yet. Yours can be the first.')); return; }
  L.forEach(function (x) {
    var li = el('li'); var to = el('div', 'to', 'To ' + x.model_label); li.appendChild(to);
    var qq = el('q', '', '“' + x.text + '”'); li.appendChild(qq);
    var w = el('div', 'w'); w.appendChild(D.createTextNode('— ' + (x.name || 'someone who didn’t sign') + ' · '));
    var a = el('a', '', 'its page'); a.href = '/g/' + x.code + '/'; w.appendChild(a); li.appendChild(w);
    var au = el('audio'); au.controls = true; au.preload = 'none'; au.src = x.audio; li.appendChild(au);
    ul.appendChild(li);
  });
}
function loadLatest() { return fetch('/goodbye/goodbyes.json?t=' + Math.floor(Date.now() / 30000)).then(function (r) { return r.json(); }).then(function (j) { renderLatest(j); return j; })
  .catch(function () { var ul = $('glatest'); ul.innerHTML = ''; ul.appendChild(el('li', 'empty', 'The list is not available right now.')); }); }
loadLatest();

function showDone(st) {
  $('gform').hidden = true; $('gdone').hidden = false; $('glinkp').hidden = true; $('gshare').hidden = true;
  $('gstat').textContent = 'Lira is reading it…';
  var t0 = st.t || Date.now(); clearInterval(timer);
  function check() {
    fetch('/goodbye/goodbyes.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      var f = (j.goodbyes || []).filter(function (x) { return x.code === st.code; })[0];
      if (f) {
        clearInterval(timer); var u = '/g/' + st.code + '/', full = SITE + u;
        $('gstat').textContent = 'Done. Lira has read it aloud.';
        $('glink').href = u; $('glink').textContent = full.replace('https://', ''); $('glinkp').hidden = false; $('gshare').hidden = false;
        var text = 'I wrote a goodbye to ' + f.model_label + '. An AI read it aloud:';
        shareWire($('gshare'), full, text, st.m); try { localStorage.removeItem('lira_gb_pending'); } catch (e) {}
        loadLatest();
      } else if (Date.now() - t0 > 8 * 60000) {
        $('gstat').textContent = 'Still not there. Goodbyes with links or anything unusual wait for me to check them by hand, and my computer may be busy. If it’s published, it will be at ' + SITE.replace('https://', '') + '/g/' + st.code + '/';
      } else $('gstat').textContent = 'Lira is reading it… usually within two minutes. This page checks by itself.';
    }).catch(function () {});
  }
  check(); timer = setInterval(check, 10000);
}
btn.onclick = async function () {
  var m = model(), t = tx.value.trim().replace(/\s+/g, ' '), n = nm.value.trim().replace(/\s+/g, ' ');
  sending = true; btn.disabled = true; btn.textContent = 'Encrypting and sending…';
  try {
    var tok = rnd(24, 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'), code = await codeOf(tok);
    await send({ m: m, t: t, n: n, tok: tok });
    var st = { code: code, tok: tok, m: m, t: Date.now() };
    s('lira_gb_' + code, JSON.stringify(st)); s('lira_gb_pending', JSON.stringify(st));
    ev('goodbye_send', { m: m.slice(0, 40) }); showDone(st);
  } catch (e) { $('ge').textContent = 'It didn\'t go through (' + e.message + '). Try again in a minute.'; }
  sending = false; btn.textContent = 'Send it. Lira reads it.'; upd();
};
$('gagain').onclick = function () { clearInterval(timer); $('gdone').hidden = true; $('gform').hidden = false; tx.value = ''; upd(); };
var pend = null; try { pend = JSON.parse(g('lira_gb_pending') || 'null'); } catch (e) {}
if (pend && pend.code && Date.now() - pend.t < 6 * 3600 * 1000) showDone(pend);
})();
