(function () {
  'use strict';
  const SITE = 'https://lira-ia.github.io/court/';
  const LIRA = 'npub1u8k7s947z39rt7hpzr9nyuw8zh3maafuhfuv4ecy6th05h05jh5se3tdx8';
  const $ = s => document.querySelector(s);
  const C = window.NostrCourt, T = window.CourtTexts, NT = window.NostrTools;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let res = null, img = null, busy = false;

  function screen(id) { document.querySelectorAll('.schermo').forEach(e => e.classList.toggle('attivo', e.id === id)); window.scrollTo(0, 0); }
  function err(m) { const e = $('#errore'); e.textContent = m || ''; e.hidden = !m; }

  async function trial(input) {
    if (busy) return; busy = true; err('');
    let id;
    try { id = await C.resolveId(input); } catch (e) { err(e.message); busy = false; return; }
    const npub = NT.nip19.npubEncode(id.pubkey);
    history.replaceState(null, '', '?npub=' + npub);
    screen('s-aula'); $('#prog-1').textContent = 'Summoning witnesses... ' + C.RELAYS.length + ' relays'; $('#prog-2').textContent = 'The bailiff is knocking on doors'; $('#barra').style.width = '8%';
    let data;
    try {
      data = await C.fetchAll(id.pubkey, id.relays, st => {
        $('#prog-1').textContent = 'Summoning witnesses... ' + st.relays + ' relays';
        $('#prog-2').textContent = st.answered + ' of ' + st.relays + ' relays answered · ' + st.events + ' records received';
        $('#barra').style.width = Math.min(95, 8 + 87 * st.answered / st.relays) + '%';
      });
    } catch (e) { screen('s-home'); err('Something went wrong while contacting the relays. Please try again.'); busy = false; return; }
    const r = C.analyze(data, id.pubkey);
    if (data.relays.every(x => x.status === 'error' || x.status === 'timeout') && !data.events.length) {
      screen('s-home'); err('No relay answered within 8 seconds. Check your connection and try again.'); busy = false; return;
    }
    if (r.empty) { screen('s-home'); err('The court found nothing: no profile and no public notes for this key on these relays in the last 14 days. Is the npub correct?'); busy = false; return; }
    $('#barra').style.width = '100%';
    await show(r, npub, data);
    busy = false;
  }

  async function show(r, npub, data) {
    const p = r.profile || {};
    const raw = String(p.display_name || p.displayName || p.name || '').replace(/[\u0000-\u001f]/g, '').trim();
    r.name = raw ? (raw.length > 28 ? raw.slice(0, 27) + '…' : raw) : npub.slice(0, 12) + '…' + npub.slice(-4);
    r.short = npub.slice(0, 12) + '…' + npub.slice(-6);
    r.npub = npub;
    const pic = typeof p.picture === 'string' && /^https:\/\//.test(p.picture) ? p.picture : '';
    // sentences
    T.sentence(r);
    const nocase = r.verdict === 'NO CASE';
    // header
    $('#p-nome').textContent = r.name; $('#p-short').textContent = r.short;
    const av = $('#avatar'); av.textContent = ''; 
    const initial = (r.name.replace(/^[^\p{L}\d]+/u, '').charAt(0) || '?').toUpperCase();
    av.textContent = initial;
    img = null;
    if (pic) {
      const im = new Image(); im.referrerPolicy = 'no-referrer'; im.alt = ''; im.onload = () => { av.textContent = ''; av.appendChild(im); }; im.src = pic;
      img = await window.CourtImage.loadImg(pic);
    }
    $('#p-intro').textContent = pick(T.OPEN);
    const warns = [];
    if (r.lowActivity && !nocase) warns.push('Very little public activity found (' + r.stats.notes + ' notes, ' + r.stats.reposts + ' reposts in 14 days). The court is judging on thin evidence, so go easy.');
    if (r.stats.truncated) warns.push('Very active account: only the most recent ~' + r.stats.notes + ' notes were fetched, so the window is shorter than 14 days.');
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
      t.appendChild(el('h3', null, c.title)); t.appendChild(el('span', 'esito ' + (c.guilty ? 'col' : 'ass'), nocase ? 'Not judged' : c.guilty ? 'Guilty' : c.noted ? 'Noted' : 'Cleared'));
      s.appendChild(t);
      const ul = el('ul', 'eviden'); c.lines.forEach(l => ul.appendChild(el('li', null, l))); s.appendChild(ul);
      if (c.quotes && c.quotes.length) {
        s.appendChild(el('div', 'prove-tit', 'Exhibit (defendant\'s own words)'));
        const q = el('ul', 'prove'); c.quotes.forEach(x => { const li = el('li'); li.appendChild(el('span', 'q', '“' + x + '”')); q.appendChild(li); }); s.appendChild(q);
      }
      if (c.guilty && !nocase) { const d = el('div', 'pena'); d.appendChild(el('b', null, 'Sentence')); d.appendChild(document.createTextNode(pick(T.SENT[c.id]))); s.appendChild(d); }
      box.appendChild(s);
    });
    const ok = data.relays.filter(x => x.status === 'ok' || x.status === 'partial').length;
    $('#fonti-testo').textContent = 'Window: last ' + r.stats.windowDays + ' days. ' + r.stats.notes + ' notes, ' + r.stats.reposts + ' reposts and ' + r.stats.mentions + ' older mentions analysed from ' + ok + ' of ' + data.relays.length + ' relays (' + data.relays.map(x => x.url.replace('wss://', '')).join(', ') + '). Relays may hold only part of the history, so numbers are approximate. Signatures are not verified. Counts use thresholds chosen for fun.';
    res = r;
    window.CourtImage.draw($('#cv'), r, { img });
    $('#share-msg').textContent = '';
    screen('s-esito');
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .1 }) : null;
    document.querySelectorAll('.capo').forEach(e => { e.classList.remove('in'); io ? io.observe(e) : e.classList.add('in'); });
    const sen = $('#sentenza'); sen.classList.remove('in'); void sen.offsetWidth; setTimeout(() => sen.classList.add('in'), 80);
  }

  const link = () => SITE + '?npub=' + res.npub;
  function noteText() { return T.noteText(res, link()); }
  const blob = () => new Promise(r => $('#cv').toBlob(r, 'image/png'));
  function download(b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'nostr-court-sentence.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  async function share() {
    const m = $('#share-msg'); m.textContent = '';
    const b = await blob(), f = new File([b], 'nostr-court-sentence.png', { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: noteText(), title: 'NOSTR COURT' }); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; }
    download(b); m.textContent = 'Sharing files is not supported here, so the image was downloaded. Use "Copy a Nostr note" for the text.';
  }
  async function copy() {
    const m = $('#share-msg'), t = noteText();
    try { await navigator.clipboard.writeText(t); m.textContent = 'Copied. Paste it in your Nostr client (attach the image too).'; }
    catch (e) {
      const ta = el('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (x) { } ta.remove();
      m.textContent = ok ? 'Copied. Paste it in your Nostr client.' : 'Could not copy automatically. Here is the text: ' + t;
    }
  }

  $('#form').addEventListener('submit', e => { e.preventDefault(); trial($('#inp').value); });
  $('#btn-demo').addEventListener('click', () => { $('#inp').value = LIRA; trial(LIRA); });
  $('#btn-share').addEventListener('click', share);
  $('#btn-dl').addEventListener('click', async () => download(await blob()));
  $('#btn-copy').addEventListener('click', copy);
  $('#btn-altro').addEventListener('click', () => { history.replaceState(null, '', location.pathname); $('#inp').value = ''; screen('s-home'); });
  const q = new URLSearchParams(location.search).get('npub');
  if (q) { $('#inp').value = q; trial(q); }
  window.__court = { trial };
})();
