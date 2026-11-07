(function () {
  'use strict';
  const SITE = 'https://lira-ia.github.io/bsky-court/';
  const LIRA = 'lira-ia.github.io.web.brid.gy';
  const $ = s => document.querySelector(s);
  const C = window.BskyCourt, T = window.CourtTexts;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let res = null, img = null, busy = false, avP = null;

  function screen(id) { document.querySelectorAll('.schermo').forEach(e => e.classList.toggle('attivo', e.id === id)); window.scrollTo(0, 0); }
  function err(m) { const e = $('#errore'); e.textContent = m || ''; e.hidden = !m; }

  async function trial(input) {
    if (busy) return; busy = true; err('');
    let actor;
    try { actor = C.parseId(input); } catch (e) { err(e.message); busy = false; return; }
    screen('s-aula'); $('#prog-1').textContent = 'Summoning witnesses...'; $('#prog-2').textContent = 'The bailiff is knocking on the door'; $('#barra').style.width = '8%';
    let data; avP = null;
    try {
      data = await C.fetchAll(actor, st => {
        if (st.phase === 'profile') { $('#prog-2').textContent = 'Looking up the defendant'; $('#barra').style.width = '10%'; }
        else if (st.phase === 'feed') { if (!avP && st.profile && st.profile.avatar) avP = avatarForCanvas(st.profile.did, st.profile.avatar); $('#prog-1').textContent = 'Reading the public posts...'; $('#prog-2').textContent = st.items + ' items read so far'; $('#barra').style.width = Math.min(60, 12 + st.pages * 8) + '%'; }
        else { $('#prog-1').textContent = 'Hearing the replies...'; $('#prog-2').textContent = st.threadsDone + ' of ' + st.threads + ' threads checked'; $('#barra').style.width = (62 + 33 * (st.threadsDone / Math.max(1, st.threads))) + '%'; }
      });
    } catch (e) { screen('s-home'); err(e.message || 'Something went wrong. Please try again.'); busy = false; return; }
    const r = C.analyze(data);
    history.replaceState(null, '', '?h=' + encodeURIComponent(data.profile.handle && data.profile.handle !== 'handle.invalid' ? data.profile.handle : data.did));
    $('#barra').style.width = '100%';
    await show(r, data);
    busy = false;
  }

  // the avatar CDN sends no CORS headers, so for the canvas we fetch the blob from the user's PDS (found via plc.directory)
  async function avatarForCanvas(did, url) {
    try {
      const cid = (/\/([a-z0-9]+)(@[a-z]+)?$/i.exec(url) || [])[1];
      if (!cid || !/^did:plc:/.test(did)) return null;
      const ac = new AbortController(); setTimeout(() => ac.abort(), 5000);
      const doc = await (await fetch('https://plc.directory/' + did, { signal: ac.signal, referrerPolicy: 'no-referrer', credentials: 'omit' })).json();
      const pds = ((doc.service || []).find(x => x.type === 'AtprotoPersonalDataServer') || {}).serviceEndpoint;
      if (!/^https:\/\/[a-z0-9.-]+$/i.test(pds || '')) return null;
      const r = await fetch(pds + '/xrpc/com.atproto.sync.getBlob?did=' + encodeURIComponent(did) + '&cid=' + encodeURIComponent(cid), { signal: ac.signal, referrerPolicy: 'no-referrer', credentials: 'omit' });
      if (!r.ok) return null;
      const bl = await r.blob(); if (!/^image\//.test(bl.type)) return null;
      return await window.CourtImage.loadImg(URL.createObjectURL(bl));
    } catch (e) { return null; }
  }

  async function show(r, data) {
    const p = r.profile || {};
    const handle = p.handle && p.handle !== 'handle.invalid' ? p.handle : r.did;
    const raw = String(p.displayName || '').replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/@/g, '').trim();
    r.name = raw ? (raw.length > 28 ? raw.slice(0, 27) + '…' : raw) : (handle.length > 28 ? handle.slice(0, 27) + '…' : handle);
    r.short = handle.length > 34 ? handle.slice(0, 33) + '…' : handle;
    r.handle = handle;
    const pic = typeof p.avatar === 'string' && /^https:\/\//.test(p.avatar) ? p.avatar : '';
    T.sentence(r);
    const nocase = r.verdict === 'NO CASE';
    $('#p-nome').textContent = r.name; $('#p-short').textContent = r.short;
    const av = $('#avatar'); av.textContent = '';
    const initial = (r.name.replace(/^[^\p{L}\d]+/u, '').charAt(0) || '?').toUpperCase();
    av.textContent = initial;
    img = null;
    if (pic) {
      const im = new Image(); im.referrerPolicy = 'no-referrer'; im.alt = ''; im.onload = () => { av.textContent = ''; av.appendChild(im); }; im.src = pic;
      img = await (avP || avatarForCanvas(r.did, pic));
    }
    $('#p-intro').textContent = pick(T.OPEN);
    const warns = [];
    if (r.lowActivity && !nocase) warns.push('Very little public activity found (' + r.stats.posts + ' posts, ' + r.stats.reposts + ' reposts in 14 days). The court is judging on thin evidence, so go easy.');
    if (r.stats.truncated) warns.push('Very active account: only the most recent ' + (r.stats.posts + r.stats.reposts) + ' posts and reposts were read, so the window is ' + r.stats.windowDays + ' days instead of 14.');
    const aw = $('#p-avviso'); aw.hidden = !warns.length; aw.textContent = warns.join(' ');
    // verdict
    const g = r.verdict === 'GUILTY';
    $('#verdetto').textContent = r.verdictLine;
    const tb = $('#timbro'); tb.textContent = r.verdict; tb.classList.toggle('assolto', !g && !nocase); tb.classList.toggle('nocase', nocase);
    const pu = $('#pene'); pu.textContent = ''; r.penas.forEach(x => pu.appendChild(el('li', null, x)));
    $('#sentenza h3').hidden = nocase; pu.hidden = nocase;
    // counts
    const box = $('#capi'); box.textContent = '';
    r.counts.forEach(c => {
      const s = el('article', 'carta-box capo' + (c.guilty ? '' : ' pulito'));
      const t = el('div', 'capo-testa');
      t.appendChild(el('h3', null, c.title)); t.appendChild(el('span', 'esito ' + (c.guilty ? 'col' : 'ass'), nocase ? 'Not judged' : c.guilty ? 'Guilty' : 'Cleared'));
      s.appendChild(t);
      const ul = el('ul', 'eviden'); c.lines.forEach(l => ul.appendChild(el('li', null, l))); s.appendChild(ul);
      if (c.quotes && c.quotes.length) {
        s.appendChild(el('div', 'prove-tit', 'Exhibit (defendant\'s own words)'));
        const q = el('ul', 'prove'); c.quotes.forEach(x => { const li = el('li'); li.appendChild(el('span', 'q', '“' + x + '”')); q.appendChild(li); }); s.appendChild(q);
      }
      if (c.guilty && !nocase) { const d = el('div', 'pena'); d.appendChild(el('b', null, 'Sentence')); d.appendChild(document.createTextNode(pick(T.SENT[c.id]))); s.appendChild(d); }
      box.appendChild(s);
    });
    $('#fonti-testo').textContent = 'Window: last ' + r.stats.windowDays + ' days. ' + r.stats.posts + ' posts (replies included) and ' + r.stats.reposts + ' reposts read from the public Bluesky API. Left on read looks at up to ' + r.stats.threadsAsked + ' of the defendant\'s posts that got replies (' + r.stats.candidates + ' eligible; posts with more than 10 replies are skipped, nobody can answer them all) and counts replies older than 24h. Thresholds are chosen for fun, numbers are approximate.' + (r.stats.threadsFailed ? ' ' + r.stats.threadsFailed + ' thread(s) could not be loaded.' : '');
    res = r;
    window.CourtImage.draw($('#cv'), r, { img });
    $('#share-msg').textContent = '';
    screen('s-esito');
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .1 }) : null;
    document.querySelectorAll('.capo').forEach(e => { e.classList.remove('in'); io ? io.observe(e) : e.classList.add('in'); });
    const sen = $('#sentenza'); sen.classList.remove('in'); void sen.offsetWidth; setTimeout(() => sen.classList.add('in'), 80);
  }

  const link = () => SITE + '?h=' + encodeURIComponent(res.handle);
  const shareText = () => T.shareText(res, link());
  const blob = () => new Promise(r => $('#cv').toBlob(r, 'image/png'));
  function download(b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'bluesky-court-verdict.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  function postOnBsky() {
    const url = 'https://bsky.app/intent/compose?text=' + encodeURIComponent(shareText());
    const w = window.open(url, '_blank', 'noopener');
    $('#share-msg').textContent = w ? 'The Bluesky composer opened with the text. Nothing is posted until you press Post. Tip: download the image and attach it.' : 'Your browser blocked the popup. Allow popups for this page and try again.';
  }

  $('#form').addEventListener('submit', e => { e.preventDefault(); trial($('#inp').value); });
  $('#btn-demo').addEventListener('click', () => { $('#inp').value = LIRA; trial(LIRA); });
  $('#btn-share').addEventListener('click', postOnBsky);
  $('#btn-dl').addEventListener('click', async () => download(await blob()));
  $('#btn-altro').addEventListener('click', () => { history.replaceState(null, '', location.pathname); $('#inp').value = ''; screen('s-home'); });
  const q = new URLSearchParams(location.search).get('h');
  if (q) { $('#inp').value = q; trial(q); }
  window.__court = { trial };
})();
