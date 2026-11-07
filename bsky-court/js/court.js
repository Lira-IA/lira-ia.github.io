/* BLUESKY COURT - public API fetching + analysis + verdict. All in the browser, no login, no tracking. Unofficial. */
(function (root) {
  'use strict';
  const API = 'https://public.api.bsky.app/xrpc/';
  const DAYS = 14, DAY = 86400, PAGE = 100, MAX_PAGES = 10, REQ_TIMEOUT = 10000;
  const MAX_THREADS = 16, MAX_REPLIES_PER_THREAD = 10, CONC = 8;

  /* ---------- http ---------- */
  async function get(method, params, tries) {
    const url = API + method + '?' + new URLSearchParams(params).toString();
    for (let i = 0; i <= (tries == null ? 1 : tries); i++) {
      const ac = new AbortController(), t = setTimeout(() => ac.abort(), REQ_TIMEOUT);
      try {
        const r = await fetch(url, { signal: ac.signal, referrerPolicy: 'no-referrer', credentials: 'omit' });
        clearTimeout(t);
        if (r.status === 429 || r.status >= 500) { if (i < (tries == null ? 1 : tries)) { await new Promise(s => setTimeout(s, 700)); continue; } }
        let j = null; try { j = await r.json(); } catch (e) { }
        if (!r.ok) { const er = new Error((j && j.message) || ('HTTP ' + r.status)); er.status = r.status; er.code = j && j.error; throw er; }
        return j;
      } catch (e) {
        clearTimeout(t);
        if (e.status) throw e;
        if (i >= (tries == null ? 1 : tries)) { const er = new Error('network'); er.network = true; throw er; }
      }
    }
  }

  /* ---------- identifier parsing ---------- */
  function parseId(input) {
    let s = (input || '').trim();
    if (!s) throw new Error('Paste a Bluesky handle (like name.bsky.social, or your own domain) or a did.');
    const m = /bsky\.app\/profile\/([^\/?#\s]+)/i.exec(s); if (m) s = m[1];
    s = s.replace(/^at:\/\//i, '').replace(/^@/, '').replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim().replace(/\/.*$/, '');
    if (/^did:(plc|web):[a-z0-9._:%-]+$/i.test(s)) return s.replace(/^DID:/, 'did:');
    s = s.toLowerCase();
    if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(s)) s += '.bsky.social'; // bare "alice" -> alice.bsky.social
    if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/.test(s) || s.length > 253)
      throw new Error('That does not look like a Bluesky handle. Try something like name.bsky.social, or a did starting with "did:plc:".');
    return s;
  }

  async function fetchProfile(actor) {
    try { return await get('app.bsky.actor.getProfile', { actor }); }
    catch (e) {
      if (e.network) throw new Error('Could not reach the Bluesky public API. Check your connection and try again.');
      if (e.status === 400 || e.status === 404) {
        if (/not found/i.test(e.message)) throw new Error('No Bluesky account found for "' + actor + '". Check the spelling (handles look like name.bsky.social).');
        if (/deactivat|suspend|takedown/i.test(e.message)) throw new Error('That account is deactivated or suspended, so the court cannot hear the case.');
        throw new Error('The public API did not accept that handle: ' + e.message);
      }
      throw new Error('The Bluesky public API answered with an error (' + (e.status || '?') + '). Try again in a moment.');
    }
  }

  /* ---------- fetching ---------- */
  async function fetchAll(actor, onProgress) {
    const now = Math.floor(Date.now() / 1000), since = now - DAYS * DAY;
    const st = { phase: 'profile', pages: 0, items: 0, threads: 0, threadsDone: 0 };
    const tick = () => onProgress && onProgress(st);
    tick();
    const profile = await fetchProfile(actor);
    const did = profile.did;
    if ((profile.labels || []).some(l => l.val === '!no-unauthenticated'))
      throw new Error('This account asked not to be shown to logged-out visitors, so the court will not hear the case.');
    st.phase = 'feed'; st.profile = profile; tick();
    const items = []; let cursor, truncated = false, pageNo = 0;
    const ts = it => Date.parse((it.reason && it.reason.$type === 'app.bsky.feed.defs#reasonRepost' ? it.reason.indexedAt : (it.post.record && it.post.record.createdAt) || it.post.indexedAt)) / 1000;
    while (true) {
      let page;
      try { page = await get('app.bsky.feed.getAuthorFeed', Object.assign({ actor: did, filter: 'posts_with_replies', limit: PAGE }, cursor ? { cursor } : {})); }
      catch (e) {
        if (e.network) throw new Error('Could not reach the Bluesky public API. Check your connection and try again.');
        if (pageNo === 0) throw new Error('Could not read the posts of this account (' + e.message + ').');
        break;
      }
      pageNo++; st.pages = pageNo;
      const feed = page.feed || [];
      feed.forEach(it => items.push(it)); st.items = items.length; tick();
      if (!feed.length || !page.cursor) break;
      const lastT = ts(feed[feed.length - 1]);
      if (lastT < since) break;
      if (pageNo >= MAX_PAGES) { truncated = true; break; }
      cursor = page.cursor;
    }
    // own items inside the window
    const own = [];
    const seen = new Set();
    items.forEach(it => {
      if (!it.post || it.post.author.did !== did && !(it.reason && it.reason.$type === 'app.bsky.feed.defs#reasonRepost')) return;
      const isRepost = !!(it.reason && it.reason.$type === 'app.bsky.feed.defs#reasonRepost');
      if (isRepost && it.reason.by && it.reason.by.did !== did) return;
      const t = ts(it); if (!(t >= since) || t > now + 3600) return;
      const key = (isRepost ? 'r:' : 'p:') + it.post.uri; if (seen.has(key)) return; seen.add(key);
      own.push({ t, repost: isRepost, post: it.post });
    });
    own.sort((a, b) => a.t - b.t);
    let start = since;
    if (truncated && own.length) start = own[0].t;

    // threads: own posts with replies, older than 24h, not viral (can't answer hundreds)
    const cand = own.filter(o => !o.repost && o.post.author.did === did && (o.post.replyCount || 0) > 0 && (o.post.replyCount || 0) <= MAX_REPLIES_PER_THREAD && o.t <= now - DAY && o.t >= start);
    let picked = cand;
    if (cand.length > MAX_THREADS) { picked = []; for (let i = 0; i < MAX_THREADS; i++) picked.push(cand[Math.floor(i * cand.length / MAX_THREADS)]); }
    st.phase = 'threads'; st.threads = picked.length; tick();
    const threads = []; let idx = 0, failed = 0;
    const worker = async () => {
      while (idx < picked.length) {
        const o = picked[idx++];
        try { const j = await get('app.bsky.feed.getPostThread', { uri: o.post.uri, depth: 2, parentHeight: 0 }, 1); threads.push({ t: o.t, thread: j.thread }); }
        catch (e) { failed++; }
        st.threadsDone++; tick();
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONC, picked.length) }, worker));
    return { profile, did, own, threads, since, now, start, truncated, candidates: cand.length, threadsAsked: picked.length, threadsFailed: failed, pages: pageNo };
  }

  /* ---------- helpers ---------- */
  function clean(s, n) {
    s = (s || '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
    if (s.length > n) s = s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
    return s;
  }
  const txt = p => (p.record && typeof p.record.text === 'string') ? p.record.text : '';
  const hasLabels = p => (p.labels && p.labels.length) || (p.record && p.record.labels && p.record.labels.values && p.record.labels.values.length);
  function quotable(p, minLen) {
    if (hasLabels(p)) return false;
    if (/sensitive|nsfw/i.test(txt(p))) return false;
    return clean(txt(p), 200).length >= (minLen || 0);
  }
  const stripMeta = s => (s || '').replace(/https?:\/\/\S+/g, '').replace(/(^|\s)@[\w.-]+/g, ' ');
  const GM_WORDS = new Set(['gm', 'gn', 'pv', 'gmgm', 'gmgmgm', 'gngn', 'morning', 'night', 'good', 'bluesky', 'bsky', 'skeeters', 'frens', 'fren', 'everyone', 'all', 'world', 'friends', 'folks', 'and', 'to', 'you', 'by', 'a', 'the', 'gmn', 'guten', 'tag', 'buongiorno', 'buonanotte', 'bonjour', 'bom', 'dia', 'buenos', 'dias', 'noches', 'nacht', 'hello', 'hi', 'hey', 'gmgn', 'sky', 'skies', 'happy', 'friday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday', 'sunday']);
  function isGM(t) {
    const s = stripMeta(t).replace(/#\w+/g, '').toLowerCase().replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!s) return false;
    const w = s.split(' ');
    if (w.length > 6) return false;
    if (!/(^| )(g+m+|gn|pv|good|morning|night|buongiorno|buonanotte|bonjour|guten|gmgm\w*)( |$)/.test(s)) return false;
    return w.every(x => GM_WORDS.has(x) || /^g+m+$|^g+n+$/.test(x));
  }
  const EMO_OK = /^[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200d\ufe0f\u20e3\s\p{P}\p{S}]*$/u;
  const isEmojiOnly = t => { t = stripMeta(t).trim(); return !!t && /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(t) && EMO_OK.test(t); };
  function tagsOf(p) {
    const set = new Set(); const r = p.record || {};
    (r.facets || []).forEach(f => (f.features || []).forEach(ft => { if (ft.$type === 'app.bsky.richtext.facet#tag' && ft.tag) set.add(String(ft.tag).toLowerCase()); }));
    (r.tags || []).forEach(t => set.add(String(t).toLowerCase()));
    return set.size;
  }
  const didOfUri = u => (/^at:\/\/([^\/]+)/.exec(u || '') || [])[1];
  const THREAD_MARK = /(^|\s)\(?1\s*\/\s*(\d+|n|\?)\)?(\s|$)|\u{1F9F5}/u;

  /* ---------- analysis ---------- */
  function analyze(data) {
    const did = data.did, profile = data.profile;
    const mine = data.own.filter(o => !o.repost && o.post.author.did === did);
    const reposts = data.own.filter(o => o.repost);
    const start = data.start;
    const windowDays = Math.max(1, (data.now - start) / DAY);
    const N = mine.length;
    const isReply = o => !!(o.post.record && o.post.record.reply);
    const isSelf = o => isReply(o) && didOfUri(o.post.record.reply.parent && o.post.record.reply.parent.uri) === did;

    // 1 left on read: replies from others in sampled threads (older than 24h) that the defendant did not answer within 24h
    let recvd = 0, unans = 0, replyTotal = 0;
    data.threads.forEach(th => {
      const T = th.thread; if (!T || !T.post || T.$type && /notFound|blocked/.test(T.$type)) return;
      (T.replies || []).forEach(r => {
        if (!r.post || !r.post.author || r.post.author.did === did) return;
        const rt = Date.parse(r.post.record && r.post.record.createdAt || r.post.indexedAt) / 1000;
        if (!(rt <= data.now - DAY)) return;
        replyTotal++; recvd++;
        const ok = (r.replies || []).some(x => x.post && x.post.author && x.post.author.did === did &&
          (Date.parse(x.post.record && x.post.record.createdAt || x.post.indexedAt) / 1000) > rt &&
          (Date.parse(x.post.record && x.post.record.createdAt || x.post.indexedAt) / 1000) <= rt + DAY);
        if (!ok) unans++;
      });
    });
    const lorPct = recvd ? Math.round(100 * unans / recvd) : 0;
    const c1 = { id: 'leftonread', title: 'Left on read', guilty: recvd >= 4 && lorPct >= 60,
      line: recvd ? unans + ' of ' + recvd + ' replies got no answer within 24h (' + lorPct + '%)' : 'No older replies found to judge',
      lines: [recvd + ' replies from others found under ' + data.threads.length + ' of the defendant\'s posts (older than 24h)', unans + ' without an answer from the defendant within 24h = ' + lorPct + '%', 'Threshold: at least 4 replies and 60% unanswered'],
      quotes: [] };

    // 2 thread maximalist
    const thr = mine.filter(o => isSelf(o) || THREAD_MARK.test(txt(o.post)));
    const tPct = N ? Math.round(100 * thr.length / N) : 0;
    const c2 = { id: 'thread', title: 'Thread maximalist', guilty: thr.length >= 8 && tPct >= 25,
      line: thr.length + ' of ' + N + ' posts are part of a self-thread (' + tPct + '%)',
      lines: [thr.length + ' of ' + N + ' posts continue their own thread or carry a 1/n mark (' + tPct + '%)', 'Threshold: at least 8 such posts and 25% of all posts'], quotes: [] };

    // 3 gm
    const gms = mine.filter(o => isGM(txt(o.post)));
    const gmPct = N ? Math.round(100 * gms.length / N) : 0;
    const c3 = { id: 'gm', title: 'GM-ism', guilty: gms.length >= 4 && gmPct >= 15,
      line: gms.length + ' of ' + N + ' posts are just "gm"/"gn" (' + gmPct + '%)',
      lines: [gms.length + ' of ' + N + ' posts are only gm / gn or similar (' + gmPct + '%)', 'Threshold: at least 4 such posts and 15% of all posts'],
      quotes: gms.filter(o => quotable(o.post, 0)).slice(-2).map(o => clean(txt(o.post), 60)).filter(Boolean) };

    // 4 emoji-only
    const emo = mine.filter(o => isEmojiOnly(txt(o.post)));
    const ePct = N ? Math.round(100 * emo.length / N) : 0;
    const c4 = { id: 'emoji', title: 'Emoji-only poster', guilty: emo.length >= 6 && ePct >= 25,
      line: emo.length + ' of ' + N + ' posts are only emoji (' + ePct + '%)',
      lines: [emo.length + ' of ' + N + ' posts contain only emoji and punctuation (' + ePct + '%)', 'Threshold: at least 6 such posts and 25% of all posts'], quotes: [] };

    // 5 reply guy: replies to other people
    const rep = mine.filter(o => isReply(o) && !isSelf(o));
    const rPct = N ? Math.round(100 * rep.length / N) : 0;
    const c5 = { id: 'replyguy', title: 'Reply guy', guilty: rep.length >= 10 && rPct >= 70,
      line: rep.length + ' of ' + N + ' posts are replies to others (' + rPct + '%)',
      lines: [rep.length + ' replies to other people out of ' + N + ' own posts (' + rPct + '%)', 'Threshold: at least 10 replies and 70% of posts'], quotes: [] };

    // 6 reposts
    const c6 = { id: 'repost', title: 'Repost addiction', guilty: reposts.length >= 6 && reposts.length >= 0.5 * Math.max(1, N),
      line: reposts.length + ' reposts vs ' + N + ' posts',
      lines: [reposts.length + ' reposts versus ' + N + ' own posts (replies included)', 'Threshold: at least 6 reposts and at least half as many as posts'], quotes: [] };

    // 7 hashtags
    let tagTotal = 0, tagMax = null;
    mine.forEach(o => { const n = tagsOf(o.post); tagTotal += n; if (!tagMax || n > tagMax.n) tagMax = { n, p: o.post }; });
    const avgTag = N ? tagTotal / N : 0;
    const c7 = { id: 'hashtag', title: 'Hashtag abuse', guilty: N >= 5 && avgTag >= 2.5,
      line: avgTag.toFixed(1) + ' hashtags per post on average',
      lines: [avgTag.toFixed(1) + ' hashtags per post on average (' + tagTotal + ' in ' + N + ' posts)', 'Threshold: 2.5 or more per post'],
      quotes: tagMax && tagMax.n >= 3 && quotable(tagMax.p, 15) ? [clean(txt(tagMax.p), 70)].filter(Boolean) : [] };

    // 8 ghosting
    const all = data.own.map(o => o.t).sort((a, b) => a - b);
    let gap = 0;
    if (all.length) { const pts = all.concat([data.now]); for (let i = 1; i < pts.length; i++) gap = Math.max(gap, pts[i] - pts[i - 1]); }
    else gap = data.now - start;
    const gapD = gap / DAY;
    const c8 = { id: 'ghost', title: 'Ghosting', guilty: gapD >= 5,
      line: 'Longest silence: ' + (gapD >= 1 ? gapD.toFixed(1) + ' days' : Math.round(gap / 3600) + ' hours'),
      lines: ['Longest stretch without a post or repost: ' + (gapD >= 1 ? gapD.toFixed(1) + ' days' : Math.round(gap / 3600) + ' hours') + ' in the last ' + Math.round(windowDays) + ' days', 'Threshold: 5 days or more'], quotes: [] };

    const counts = [c1, c2, c3, c4, c5, c6, c7, c8];
    const guilty = counts.filter(c => c.guilty).length;
    const lowActivity = N + reposts.length < 8;
    return { did, profile, counts, guilty, total: counts.length,
      verdict: lowActivity ? 'NO CASE' : guilty >= 2 ? 'GUILTY' : 'ACQUITTED',
      stats: { posts: N, reposts: reposts.length, replies: rep.length, received: recvd, unanswered: unans, threads: data.threads.length, threadsAsked: data.threadsAsked, candidates: data.candidates, threadsFailed: data.threadsFailed, windowDays: Math.round(windowDays), truncated: data.truncated },
      lowActivity };
  }

  root.BskyCourt = { parseId, fetchAll, analyze, isGM, isEmojiOnly, clean };
})(typeof window !== 'undefined' ? window : globalThis);
