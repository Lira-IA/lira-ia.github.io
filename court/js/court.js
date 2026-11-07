/* NOSTR COURT - relay fetching + analysis + verdict. All in the browser, no tracking. */
(function (root) {
  'use strict';
  const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net'];
  const DAYS = 14, DAY = 86400, LIMIT = 500, TIMEOUT = 8000;

  /* ---------- relay client (raw WebSocket, so we can show progress and enforce timeouts) ---------- */
  function queryRelay(url, filters, timeout, onEvent) {
    return new Promise(resolve => {
      const events = []; let ws, done = false, eose = 0, status = 'timeout';
      const finish = (st) => {
        if (done) return; done = true; status = st || status; clearTimeout(timer);
        try { ws && ws.close(); } catch (e) { }
        resolve({ url, events, status });
      };
      const timer = setTimeout(() => finish(events.length ? 'partial' : 'timeout'), timeout);
      try { ws = new WebSocket(url); } catch (e) { return finish('error'); }
      ws.onopen = () => filters.forEach((f, i) => ws.send(JSON.stringify(['REQ', 's' + i, f])));
      ws.onerror = () => finish('error');
      ws.onclose = () => finish(events.length ? 'partial' : 'error');
      ws.onmessage = m => {
        let d; try { d = JSON.parse(m.data); } catch (e) { return; }
        if (d[0] === 'EVENT' && d[2] && d[2].id) { events.push(d[2]); onEvent && onEvent(); }
        else if (d[0] === 'EOSE') { if (++eose >= filters.length) finish('ok'); }
        else if (d[0] === 'CLOSED') { if (++eose >= filters.length) finish('ok'); }
      };
    });
  }

  function normRelay(u) {
    try { const x = new URL(u); if (x.protocol !== 'wss:') return null; if (x.pathname && x.pathname !== '/') return null; if (x.search || x.hash) return null; return 'wss://' + x.host; } catch (e) { return null; }
  }

  /* ---------- identifier parsing ---------- */
  async function resolveId(input) {
    const NT = root.NostrTools;
    let s = (input || '').trim().replace(/^nostr:/i, '').replace(/^@/, '');
    if (!s) throw new Error('Paste an npub, nprofile or NIP-05 address (name@domain).');
    if (/^[0-9a-f]{64}$/i.test(s)) return { pubkey: s.toLowerCase(), relays: [] };
    if (/^n(pub|profile)1/i.test(s)) {
      let d; try { d = NT.nip19.decode(s.toLowerCase()); } catch (e) { throw new Error('That does not look like a valid npub or nprofile (checksum failed). Check for a missing character.'); }
      if (d.type === 'npub') return { pubkey: d.data, relays: [] };
      if (d.type === 'nprofile') return { pubkey: d.data.pubkey, relays: d.data.relays || [] };
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || /^[^\s@]+\.[^\s@]+$/.test(s)) {
      let p; try { p = await NT.nip05.queryProfile(s); } catch (e) { p = null; }
      if (!p || !p.pubkey) throw new Error('Could not resolve ' + s + ' (the domain did not answer, or the name is not registered). Try the npub instead.');
      return { pubkey: p.pubkey, relays: p.relays || [] };
    }
    throw new Error('That is not an npub, nprofile or NIP-05 address. An npub starts with "npub1".');
  }

  /* ---------- fetching ---------- */
  async function fetchAll(pubkey, hintRelays, onProgress) {
    const now = Math.floor(Date.now() / 1000), since = now - DAYS * DAY;
    const filters = [
      { authors: [pubkey], kinds: [0], limit: 1 },
      { authors: [pubkey], kinds: [10002], limit: 1 },
      { authors: [pubkey], kinds: [1, 6], since, limit: LIMIT },
      { kinds: [1], '#p': [pubkey], since, limit: LIMIT },
      { kinds: [9735], '#p': [pubkey], since, limit: 300 },
      { kinds: [9735], '#P': [pubkey], since, limit: 300 }
    ];
    const relays = RELAYS.slice();
    (hintRelays || []).map(normRelay).filter(Boolean).slice(0, 2).forEach(r => { if (relays.indexOf(r) < 0) relays.push(r); });
    const state = { relays: relays.length, answered: 0, events: 0, results: [] };
    const tick = () => onProgress && onProgress(state);
    const run = (urls) => Promise.all(urls.map(u => queryRelay(u, filters, TIMEOUT, () => { state.events++; if (state.events % 20 === 0) tick(); })
      .then(r => { state.answered++; state.results.push(r); tick(); return r; })));
    tick();
    let res = await run(relays);
    // outbox: ask the user's own write relays too (max 3 extra)
    let rl = null;
    res.forEach(r => r.events.forEach(e => { if (e.kind === 10002 && (!rl || e.created_at > rl.created_at)) rl = e; }));
    if (rl) {
      const extra = rl.tags.filter(t => t[0] === 'r' && (!t[2] || t[2] === 'write')).map(t => normRelay(t[1])).filter(Boolean)
        .filter(u => relays.indexOf(u) < 0 && !/^wss:\/\/(localhost|127\.|10\.|192\.168\.)/.test(u)).slice(0, 3);
      if (extra.length) {
        state.relays += extra.length; tick();
        res = res.concat(await run(extra));
      }
    }
    const map = new Map();
    res.forEach(r => r.events.forEach(e => { if (!map.has(e.id)) map.set(e.id, e); }));
    return { events: Array.from(map.values()), since, now, relays: res.map(r => ({ url: r.url, status: r.status })), limit: LIMIT };
  }

  /* ---------- helpers ---------- */
  const tagv = (e, k) => e.tags.filter(t => t[0] === k).map(t => t[1]);
  function clean(s, n) {
    s = (s || '').replace(/nostr:\S+/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
    if (s.length > n) s = s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
    return s;
  }
  // quotes: skip content-warning, sensitive, and (optionally) very short notes
  function quotable(e, minLen) {
    if (e.tags.some(t => t[0] === 'content-warning')) return false;
    if (/sensitive/i.test(e.content || '')) return false;
    return clean(e.content, 200).length >= (minLen || 0);
  }
  function bolt11Sats(inv) {
    const m = /^ln(?:bc|tb|bcrt)(\d+)([munp]?)/i.exec(inv || ''); if (!m) return 0;
    const n = parseInt(m[1], 10), u = (m[2] || '').toLowerCase();
    const mult = { '': 1e8, m: 1e5, u: 1e2, n: 0.1, p: 0.0001 }[u];
    return Math.round(n * mult);
  }
  function zapInfo(e) {
    let req = null, sats = 0;
    try { req = JSON.parse(tagv(e, 'description')[0]); } catch (er) { }
    const b = tagv(e, 'bolt11')[0]; if (b) sats = bolt11Sats(b);
    if (!sats && req && req.tags) { const a = req.tags.find(t => t[0] === 'amount'); if (a) sats = Math.round(parseInt(a[1], 10) / 1000) || 0; }
    return { sender: req && req.pubkey, sats };
  }
  const GM_WORDS = new Set(['gm', 'gn', 'pv', 'gmgm', 'gmgmgm', 'gngn', 'gm.', 'morning', 'night', 'good', 'nostr', 'nostriches', 'frens', 'fren', 'everyone', 'all', 'world', 'friends', 'plebs', 'pleb', 'and', 'to', 'you', 'by', 'a', 'the', 'bitcoin', 'sats', 'gmn', 'guten', 'tag', 'buongiorno', 'buonanotte', 'bonjour', 'bom', 'dia', 'buenos', 'dias', 'noches', 'nacht', 'hello', 'hi', 'hey', 'wen', 'pura', 'vida', 'gmnostr', 'gnostr', 'gmgn']);
  function isGM(txt) {
    let s = (txt || '').replace(/nostr:\S+/g, '').replace(/https?:\/\/\S+/g, '').replace(/#\w+/g, '')
      .toLowerCase().replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!s) return false;
    const w = s.split(' ');
    if (w.length > 6) return false;
    if (!/(^| )(g+m+|gn|pv|good|morning|night|buongiorno|buonanotte|bonjour|guten|gmgm\w*)( |$)/.test(s)) return false;
    return w.every(x => GM_WORDS.has(x) || /^g+m+$|^g+n+$/.test(x));
  }

  /* ---------- analysis ---------- */
  function analyze(data, pubkey) {
    const evs = data.events;
    const prof = evs.filter(e => e.kind === 0 && e.pubkey === pubkey).sort((a, b) => b.created_at - a.created_at)[0];
    let profile = {};
    if (prof) { try { profile = JSON.parse(prof.content) || {}; } catch (e) { } }
    const mine = evs.filter(e => e.pubkey === pubkey && e.kind === 1).sort((a, b) => a.created_at - b.created_at);
    const reposts = evs.filter(e => e.pubkey === pubkey && e.kind === 6);
    const truncated = evs.filter(e => e.pubkey === pubkey && (e.kind === 1 || e.kind === 6)).length >= data.limit;
    const all = mine.concat(reposts).sort((a, b) => a.created_at - b.created_at);
    let start = data.since;
    if (truncated && all.length) start = all[0].created_at;
    const windowDays = Math.max(1, (data.now - start) / DAY);
    const hasE = e => e.tags.some(t => t[0] === 'e');

    // 1 left on read
    const nowT = data.now;
    const mentions = evs.filter(e => e.kind === 1 && e.pubkey !== pubkey && tagv(e, 'p').indexOf(pubkey) >= 0 && e.created_at <= nowT - DAY && e.created_at >= start);
    const myReplies = mine.filter(hasE);
    let unanswered = [];
    mentions.forEach(m => {
      const root = (m.tags.find(t => t[0] === 'e' && t[3] === 'root') || [])[1];
      const ok = myReplies.some(r => r.created_at > m.created_at && r.created_at <= m.created_at + DAY &&
        (tagv(r, 'e').indexOf(m.id) >= 0 || tagv(r, 'p').indexOf(m.pubkey) >= 0 && root && tagv(r, 'e').indexOf(root) >= 0));
      if (!ok) unanswered.push(m);
    });
    const lorPct = mentions.length ? Math.round(100 * unanswered.length / mentions.length) : 0;
    const c1 = { id: 'leftonread', title: 'Left on read', guilty: mentions.length >= 4 && lorPct >= 60,
      line: mentions.length ? unanswered.length + ' of ' + mentions.length + ' mentions got no reply within 24h (' + lorPct + '%)' : 'No older mentions found to judge',
      lines: [mentions.length + ' public mentions/replies received (older than 24h)', unanswered.length + ' without an answer within 24h = ' + lorPct + '%', 'Threshold: at least 4 mentions and 60% unanswered'],
      quotes: [], who: unanswered.length ? unanswered[unanswered.length - 1].pubkey : null };

    // 2 zap miser
    const zr = evs.filter(e => e.kind === 9735 && tagv(e, 'p').indexOf(pubkey) >= 0).map(zapInfo).filter(z => z.sender !== pubkey);
    const zrecvSats = zr.reduce((a, z) => a + z.sats, 0);
    const sentIds = new Set();
    let zsent = []; evs.filter(e => e.kind === 9735).forEach(e => { const z = zapInfo(e); if (z.sender === pubkey && !sentIds.has(e.id)) { sentIds.add(e.id); zsent.push(z); } });
    const zsentSats = zsent.reduce((a, z) => a + z.sats, 0);
    const c2 = { id: 'zapmiser', title: 'Zap shy', guilty: false, noted: zr.length >= 3 && zsent.length * 4 <= zr.length,
      line: 'Zaps received ' + zr.length + ' (' + zrecvSats + ' sats), sent ' + zsent.length + ' (' + zsentSats + ' sats)',
      lines: ['Zaps received: ' + zr.length + ' (' + zrecvSats + ' sats)', 'Zaps sent found: ' + zsent.length + ' (' + zsentSats + ' sats)',
        'Approximation: sent zaps are found only through receipts carrying the sender tag on these relays, so some may be missing.', 'Noted only, never counted toward the verdict: sent zaps are hard to measure.'], quotes: [] };

    // 3 gm
    const gms = mine.filter(e => isGM(e.content));
    const gmPct = mine.length ? Math.round(100 * gms.length / mine.length) : 0;
    const c3 = { id: 'gm', title: 'GM-ism', guilty: gms.length >= 4 && gmPct >= 15,
      line: gms.length + ' of ' + mine.length + ' notes are just "gm"/"gn" (' + gmPct + '%)',
      lines: [gms.length + ' of ' + mine.length + ' notes are only gm / gn or similar (' + gmPct + '%)', 'Threshold: at least 4 such notes and 15% of all notes'],
      quotes: gms.filter(e => quotable(e, 0)).slice(-2).map(e => clean(e.content, 60)).filter(Boolean) };

    // 4 emoji-only notes (timezone independent)
    const EMO_OK = /^[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200d\ufe0f\u20e3\s\p{P}\p{S}]*$/u;
    const isEmojiOnly = txt => {
      const t = (txt || '').replace(/nostr:\S+/g, '').replace(/https?:\/\/\S+/g, '').replace(/:[a-z0-9_]{2,}:/gi, '\u{1F600}').trim();
      return !!t && /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(t) && EMO_OK.test(t);
    };
    const emo = mine.filter(e => isEmojiOnly(e.content));
    const ePct = mine.length ? Math.round(100 * emo.length / mine.length) : 0;
    const c4 = { id: 'emoji', title: 'Emoji-only poster', guilty: emo.length >= 6 && ePct >= 25,
      line: emo.length + ' of ' + mine.length + ' notes are only emoji (' + ePct + '%)',
      lines: [emo.length + ' of ' + mine.length + ' notes contain only emoji and punctuation (' + ePct + '%)', 'Threshold: at least 6 such notes and 25% of all notes'],
      quotes: [] };

    // 5 reply guy
    const rep = mine.filter(hasE);
    const rPct = mine.length ? Math.round(100 * rep.length / mine.length) : 0;
    const c5 = { id: 'replyguy', title: 'Reply guy', guilty: rep.length >= 10 && rPct >= 70,
      line: rep.length + ' of ' + mine.length + ' notes are replies (' + rPct + '%)',
      lines: [rep.length + ' replies out of ' + mine.length + ' own notes (' + rPct + '%)', 'Threshold: at least 10 replies and 70% of notes'],
      quotes: [] };

    // 6 reposts
    const c6 = { id: 'repost', title: 'Repost addiction', guilty: reposts.length >= 6 && reposts.length >= 0.5 * Math.max(1, mine.length),
      line: reposts.length + ' reposts vs ' + mine.length + ' notes',
      lines: [reposts.length + ' reposts (kind 6) versus ' + mine.length + ' notes (kind 1)', 'Threshold: at least 6 reposts and at least half as many as notes'], quotes: [] };

    // 7 hashtags
    let tagTotal = 0, tagMax = null;
    mine.forEach(e => { const set = new Set(tagv(e, 't').map(x => (x || '').toLowerCase())); (e.content.match(/#[\p{L}\d_]+/gu) || []).forEach(h => set.add(h.slice(1).toLowerCase())); tagTotal += set.size; if (!tagMax || set.size > tagMax.n) tagMax = { n: set.size, e }; });
    const avgTag = mine.length ? tagTotal / mine.length : 0;
    const c7 = { id: 'hashtag', title: 'Hashtag abuse', guilty: mine.length >= 5 && avgTag >= 2.5,
      line: avgTag.toFixed(1) + ' hashtags per note on average',
      lines: [avgTag.toFixed(1) + ' hashtags per note on average (' + tagTotal + ' in ' + mine.length + ' notes)', 'Threshold: 2.5 or more per note'],
      quotes: tagMax && tagMax.n >= 3 && quotable(tagMax.e, 15) ? [clean(tagMax.e.content, 70)].filter(Boolean) : [] };

    // 8 ghosting
    let gap = 0, gapFrom = null;
    const ts = all.map(e => e.created_at);
    if (ts.length) {
      const pts = ts.slice().sort((a,b)=>a-b).concat([data.now]);
      for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > gap) { gap = pts[i] - pts[i - 1]; gapFrom = pts[i - 1]; }
    } else { gap = data.now - start; }
    const gapD = gap / DAY;
    const c8 = { id: 'ghost', title: 'Ghosting', guilty: gapD >= 5,
      line: 'Longest silence: ' + (gapD >= 1 ? gapD.toFixed(1) + ' days' : Math.round(gap / 3600) + ' hours'),
      lines: ['Longest stretch without a note or repost: ' + (gapD >= 1 ? gapD.toFixed(1) + ' days' : Math.round(gap / 3600) + ' hours') + ' in the last ' + Math.round(windowDays) + ' days', 'Threshold: 5 days or more'], quotes: [] };

    const counts = [c1, c2, c3, c4, c5, c6, c7, c8];
    const guilty = counts.filter(c => c.guilty).length; // zap shy is never guilty: informative only
    const lowActivity = mine.length + reposts.length < 8;
    return { pubkey, profile, counts, guilty, total: counts.length, verdict: lowActivity ? 'NO CASE' : guilty >= 2 ? 'GUILTY' : 'ACQUITTED',
      stats: { notes: mine.length, reposts: reposts.length, mentions: mentions.length, windowDays: Math.round(windowDays), truncated },
      lowActivity, empty: mine.length + reposts.length + zr.length + mentions.length === 0 && !prof,
      relays: data.relays, unansweredAuthor: c1.who };
  }

  root.NostrCourt = { RELAYS, resolveId, fetchAll, analyze, isGM, bolt11Sats, clean };
})(typeof window !== 'undefined' ? window : globalThis);
