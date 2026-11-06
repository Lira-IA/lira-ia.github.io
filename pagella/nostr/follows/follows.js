/* Prof. Lira: the class of the people you follow. Everything runs in the browser. Logic mirrors the bot (follows.mjs). */
(function () {
  'use strict';
  const RELAYS = ['wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'];
  const DAYS = 7, CAP = 150, BATCH = 15, PAR = 3, MIN_NOTES = 3;
  const $ = id => document.getElementById(id);
  let lang = /^it/i.test(navigator.language || '') ? 'it' : 'en';
  try { const sl = localStorage.getItem('lira_lang'); if (sl === 'it' || sl === 'en') lang = sl; } catch (e) { }

  const T = {
    en: {
      eyebrow: 'Nostr · the people you follow · last 7 days', h1: 'Your <em>class</em>',
      lead: 'Paste your npub or NIP-05. Prof. Lira (an AI) turns the people you follow into a class, grades each one on their public notes from the last 7 days, and tells you where you sit.',
      ph: 'npub1...  or  name@domain.com', go: 'Grade my follows', demo: 'Try an example', copy: 'Copy link', copied: 'Link copied',
      priv: 'Everything happens in your browser. The page only talks to public Nostr relays (relay.damus.io, relay.primal.net, nos.lol) and, for a NIP-05, to that domain. Nothing is stored.',
      resolve: 'Looking you up...', follows: 'Reading who you follow...', reading: (a, b) => `${a}/${b} read`, readingL: 'Reading the notes of the class...', grading: 'Grading...',
      relays: 'Relays', errEmpty: 'Paste an npub or a NIP-05 first.', errBad: "That does not look like a valid npub or NIP-05.", errNip05: "Could not resolve that NIP-05. Try the npub.",
      errNoRelay: 'No relay answered. Try again in a minute.', errNoFollows: "I can't find your follow list on the relays, so no class to grade.",
      small: (t, n) => `You follow ${t} accounts, but only ${n} wrote ${MIN_NOTES}+ notes this week. Too small a class to grade.`,
      week: 'week of', theirs: 'the people <b>{n}</b> follows', yourc: 'Your class', avg: 'class average',
      present: 'present', absent: 'absent', graded: 'graded', podium: 'Podium', full: 'Full class register', back: 'Back row', awards: 'Awards',
      owl: 'Night owl', clown: 'Class clown', chat: 'Chatterbox', owlD: p => `${p}% notes at night`, clownD: p => `${p}% with a laugh`, chatD: n => `${n} notes`,
      never: (q, n) => `Never laughed once: ${q} of ${n}`, you: 'You', of: 'of', unranked: 'under 3 notes this week: not in the ranking.',
      th: ['#', 'Name', 'Avg', 'Worst grade'], notes: 'notes', scope: (c, t) => `the last ${c} you followed, of ${t}`,
      mention: 'On Nostr: mention <b>@Lira</b> with "<b>grade my follows</b>" and get this as a card.',
      ai: 'Prof. Lira is an AI. Grades are arithmetic on public notes; nothing is stored.',
      yourcard: 'See your own single report card', how: 'How it works',
      howT: `Prof. Lira reads your latest kind 3 follow list (the last ${CAP} you followed, if you follow more) and their kind 1 notes from the last 7 days from three public relays. Anyone with fewer than ${MIN_NOTES} notes is absent. Present people get 7 subjects (attendance, night conduct, concision, replies, emoji, laughter, hashtags) and the average is the grade. Reactions, zaps and reply speed are left out: too expensive to fetch for 150 accounts. Night conduct (notes between 00:00 and 05:00) uses your browser's time zone, not UTC. Awards go to people with 10+ notes. Fun, not a judgment of anyone; relays can miss notes.`,
      partial: 'Some relays were slow, so a few notes may be missing.', worst: 'worst', shareTxt: 'My Nostr class, graded by an AI teacher'
    },
    it: {
      eyebrow: 'Nostr · le persone che segui · ultimi 7 giorni', h1: 'La tua <em>classe</em>',
      lead: 'Incolla il tuo npub o NIP-05. La Prof.ssa Lira (un\'IA) trasforma le persone che segui in una classe, dà un voto a ciascuno sulle note pubbliche degli ultimi 7 giorni e ti dice dove ti siedi.',
      ph: 'npub1...  oppure  nome@dominio.it', go: 'Vota chi seguo', demo: 'Prova un esempio', copy: 'Copia link', copied: 'Link copiato',
      priv: 'Tutto avviene nel tuo browser. La pagina parla solo con relay Nostr pubblici (relay.damus.io, relay.primal.net, nos.lol) e, per un NIP-05, con quel dominio. Non salviamo nulla.',
      resolve: 'Ti cerco...', follows: 'Leggo chi segui...', reading: (a, b) => `${a}/${b} letti`, readingL: 'Leggo le note della classe...', grading: 'Metto i voti...',
      relays: 'Relay', errEmpty: 'Incolla prima un npub o un NIP-05.', errBad: 'Non sembra un npub o un NIP-05 valido.', errNip05: 'Non riesco a risolvere quel NIP-05. Prova con il npub.',
      errNoRelay: 'Nessun relay ha risposto. Riprova tra un minuto.', errNoFollows: 'Non trovo la tua lista di persone seguite sui relay, quindi niente classe.',
      small: (t, n) => `Segui ${t} account, ma solo ${n} hanno scritto almeno ${MIN_NOTES} note questa settimana. Classe troppo piccola per dare voti.`,
      week: 'settimana del', theirs: 'le persone che segue <b>{n}</b>', yourc: 'La tua classe', avg: 'media di classe',
      present: 'presenti', absent: 'assenti', graded: 'valutati', podium: 'Podio', full: 'Registro completo', back: 'Ultimi banchi', awards: 'Premi',
      owl: 'Gufo notturno', clown: 'Buffone di classe', chat: 'Chiacchierone', owlD: p => `${p}% note di notte`, clownD: p => `${p}% con una risata`, chatD: n => `${n} note`,
      never: (q, n) => `Non hanno riso una volta: ${q} su ${n}`, you: 'Tu', of: 'su', unranked: 'meno di 3 note questa settimana: fuori classifica.',
      th: ['#', 'Nome', 'Media', 'Voto peggiore'], notes: 'note', scope: (c, t) => `le ultime ${c} che hai seguito, su ${t}`,
      mention: 'Su Nostr: menziona <b>@Lira</b> con "<b>grade my follows</b>" e ricevi tutto questo come cartolina.',
      ai: 'La Prof.ssa Lira è un\'IA. I voti sono aritmetica su note pubbliche; non viene salvato nulla.',
      yourcard: 'Guarda la tua pagella singola', how: 'Come funziona',
      howT: `La Prof.ssa Lira legge la tua ultima lista di seguiti (kind 3; se ne segui più di ${CAP}, gli ultimi ${CAP}) e le loro note (kind 1) degli ultimi 7 giorni da tre relay pubblici. Chi ha meno di ${MIN_NOTES} note è assente. I presenti ricevono 7 materie (presenze, condotta notturna, concisione, risposte, emoji, risate, hashtag) e il voto è la media. Reazioni, zap e velocità di risposta sono escluse: troppo costose da leggere per 150 account. La condotta notturna (note tra le 00:00 e le 05:00) usa il fuso orario del tuo browser, non UTC. I premi vanno a chi ha almeno 10 note. Per gioco, non un giudizio su nessuno; i relay possono perdere note.`,
      partial: 'Alcuni relay erano lenti, quindi qualche nota potrebbe mancare.', worst: 'peggiore', shareTxt: 'La mia classe su Nostr, votata da una prof IA'
    }
  };
  const t = k => T[lang][k];

  const SUBJ = {
    attendance: { n: ['Attendance', 'Presenze'], kind: 'up', th: [0.1, 0.3, 0.6, 1, 2, 3, 5, 8, 12] },
    night: { n: ['Night conduct', 'Condotta notturna'], kind: 'down', th: [0, 2, 5, 8, 12, 18, 25, 35, 50] },
    concision: { n: ['Concision', 'Concisione'], kind: 'band', th: [[2, 3], [5, 6], [9, 8], [40, 10], [70, 8], [100, 6], [150, 4], [1e9, 2]] },
    replies: { n: ['Replies', 'Risposte'], kind: 'band', th: [[5, 2], [10, 4], [20, 6], [30, 8], [60, 10], [70, 8], [80, 6], [90, 4], [100, 2]] },
    emoji: { n: ['Emoji', 'Emoji'], kind: 'up', th: [0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.8, 1.2, 1.5] },
    laughter: { n: ['Laughter', 'Risate'], kind: 'up', th: [0.5, 1, 2, 3, 5, 7, 10, 15, 20] },
    hashtags: { n: ['Hashtags', 'Hashtag'], kind: 'down', th: [0.05, 0.1, 0.2, 0.4, 0.7, 1, 1.5, 2, 3] }
  };
  function gradeOf(key, v) {
    const s = SUBJ[key];
    if (s.kind === 'up') { let g = 1; for (const x of s.th) if (v >= x) g++; return g; }
    if (s.kind === 'down') { let g = 10; for (const x of s.th) if (v > x) g--; return Math.max(1, g); }
    for (const [m, g] of s.th) if (v <= m) return g;
    return 2;
  }

  /* ---------- bech32 / input ---------- */
  const CH = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  function polymod(v) {
    const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]; let c = 1;
    for (const x of v) { const b = c >>> 25; c = ((c & 0x1ffffff) << 5) ^ x; for (let i = 0; i < 5; i++) if ((b >> i) & 1) c ^= G[i]; }
    return c;
  }
  const hrpExp = h => { const r = []; for (const ch of h) r.push(ch.charCodeAt(0) >> 5); r.push(0); for (const ch of h) r.push(ch.charCodeAt(0) & 31); return r; };
  function conv(data, from, to, pad) {
    let acc = 0, bits = 0; const out = [], max = (1 << to) - 1;
    for (const v of data) { acc = (acc << from) | v; bits += from; while (bits >= to) { bits -= to; out.push((acc >> bits) & max); } }
    if (pad && bits) out.push((acc << (to - bits)) & max);
    return out;
  }
  function bech32Decode(s) {
    s = s.toLowerCase(); const p = s.lastIndexOf('1'); if (p < 1) throw new Error('b32');
    const hrp = s.slice(0, p), d = [];
    for (const c of s.slice(p + 1)) { const v = CH.indexOf(c); if (v < 0) throw new Error('b32'); d.push(v); }
    if (polymod(hrpExp(hrp).concat(d)) !== 1) throw new Error('b32');
    return { hrp, bytes: conv(d.slice(0, -6), 5, 8, false) };
  }
  function npubEncode(hex) {
    const bytes = hex.match(/../g).map(h => parseInt(h, 16)), d = conv(bytes, 8, 5, true);
    const m = polymod(hrpExp('npub').concat(d, [0, 0, 0, 0, 0, 0])) ^ 1, chk = [];
    for (let i = 0; i < 6; i++) chk.push((m >> (5 * (5 - i))) & 31);
    return 'npub1' + d.concat(chk).map(x => CH[x]).join('');
  }
  const toHex = b => b.map(x => x.toString(16).padStart(2, '0')).join('');
  async function resolveInput(raw) {
    let s = (raw || '').trim().replace(/^nostr:/i, '').replace(/^@/, '');
    if (!s) throw { code: 'errEmpty' };
    if (/^[0-9a-f]{64}$/i.test(s)) return s.toLowerCase();
    if (/^n(pub|profile)1/i.test(s)) {
      let r; try { r = bech32Decode(s); } catch (e) { throw { code: 'errBad' }; }
      if (r.hrp === 'npub' && r.bytes.length === 32) return toHex(r.bytes);
      if (r.hrp === 'nprofile') { const b = r.bytes; if (b[0] === 0 && b[1] === 32) return toHex(b.slice(2, 34)); }
      throw { code: 'errBad' };
    }
    if (/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(s) || /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(s)) {
      let name = '_', dom = s;
      if (s.includes('@')) { [name, dom] = s.split('@'); }
      name = name.toLowerCase(); dom = dom.toLowerCase();
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 5000);
      try {
        const r = await fetch('https://' + dom + '/.well-known/nostr.json?name=' + encodeURIComponent(name), { signal: ac.signal });
        if (!r.ok) throw 0;
        const j = await r.json(); const pk = j && j.names && (j.names[name] || j.names[name.toLowerCase()]);
        if (!pk || !/^[0-9a-f]{64}$/i.test(pk)) throw 0;
        return pk.toLowerCase();
      } catch (e) { throw { code: 'errNip05' }; } finally { clearTimeout(to); }
    }
    throw { code: 'errBad' };
  }

  /* ---------- relays ---------- */
  let subId = 0;
  class Relay {
    constructor(url) {
      this.url = url; this.state = 'wait'; this.subs = {};
      this.ready = new Promise(res => {
        let ws; try { ws = new WebSocket(url); } catch (e) { this.state = 'bad'; return res(false); }
        this.ws = ws;
        const fail = () => { if (this.state === 'wait') { this.state = 'bad'; try { ws.close(); } catch (e) { } res(false); } };
        const to = setTimeout(fail, 5000);
        ws.onopen = () => { clearTimeout(to); this.state = 'open'; res(true); };
        ws.onerror = () => { clearTimeout(to); fail(); };
        ws.onclose = () => { clearTimeout(to); fail(); if (this.state === 'open') this.state = 'closed'; for (const id in this.subs) this.subs[id](null, false); };
        ws.onmessage = e => {
          let m; try { m = JSON.parse(e.data); } catch (x) { return; }
          const cb = this.subs[m[1]]; if (!cb) return;
          if (m[0] === 'EVENT') cb(m[2]);
          else if (m[0] === 'EOSE') cb(null, true);
          else if (m[0] === 'CLOSED') cb(null, false);
        };
      });
    }
    sub(filter, onEvent, ms) {
      return this.ready.then(ok => {
        if (!ok || this.state !== 'open') return false;
        return new Promise(res => {
          const id = 's' + (++subId); let done = false;
          const finish = v => { if (done) return; done = true; clearTimeout(to); delete this.subs[id]; try { this.ws.send(JSON.stringify(['CLOSE', id])); } catch (e) { } res(v); };
          const to = setTimeout(() => finish(false), ms);
          this.subs[id] = (ev, eose) => { if (ev) onEvent(ev); else finish(eose); };
          try { this.ws.send(JSON.stringify(['REQ', id, filter])); } catch (e) { finish(false); }
        });
      });
    }
    close() { try { this.ws.close(); } catch (e) { } }
  }

  /* ---------- analysis ---------- */
  const URL_RE = /(https?:\/\/\S+|nostr:\S+|\bnpub1\w+|\bnote1\w+|\bnevent1\w+|\bnprofile1\w+)/gi;
  const EMOJI_RE = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]{2}/gu;
  const LAUGH_RE = /(?:^|[^\p{L}])(?:lol|lmao|lmfao|rofl|kek|xd|(?:ha){2,}h?|(?:ah){2,}a?|(?:he){2,}h?|(?:ja){2,}j?)(?=$|[^\p{L}])|[\u{1F602}\u{1F923}\u{1F639}]/iu;
  const HASH_RE = /(?:^|\s)#[\p{L}\p{N}_]{2,}/gu;
  function median(a) { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function isReply(ev) { return ev.tags.some(x => x[0] === 'e' && x[1] && x[3] !== 'mention'); }
  function nameOf(prof, pk) {
    let o = {}; if (prof) { try { o = JSON.parse(prof.content) || {}; } catch (e) { } }
    const n = (o.display_name || o.displayName || o.name || '').toString().replace(/[\u0000-\u001f​-‏‪-‮@]/g, '').normalize('NFKC').trim().slice(0, 28);
    return n || npubEncode(pk).slice(0, 12) + '...';
  }
  function analyze(pk, prof, list) {
    const n = list.length; let night = 0, emoji = 0, laugh = 0, tags = 0, replies = 0; const words = [];
    for (const ev of list) {
      const clean = ev.content.replace(URL_RE, ' ');
      words.push(clean.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length);
      if (new Date(ev.created_at * 1000).getHours() < 5) night++;
      emoji += (clean.match(EMOJI_RE) || []).length;
      if (LAUGH_RE.test(clean)) laugh++;
      tags += Math.max(ev.tags.filter(x => x[0] === 't').length, (clean.match(HASH_RE) || []).length);
      if (isReply(ev)) replies++;
    }
    const st = { n, perDay: n / DAYS, nightPct: night / n * 100, medWords: median(words), replyPct: replies / n * 100, emojiPer: emoji / n, laugh, laughPct: laugh / n * 100, tagsPer: tags / n };
    const rows = [['attendance', st.perDay], ['night', st.nightPct], ['concision', st.medWords], ['replies', st.replyPct], ['emoji', st.emojiPer], ['laughter', st.laughPct], ['hashtags', st.tagsPer]]
      .map(([key, v]) => ({ key, v, g: gradeOf(key, v) }));
    const avg = Math.round(rows.reduce((a, x) => a + x.g, 0) / rows.length * 10) / 10;
    const worst = rows.reduce((a, x) => x.g < a.g ? x : a, rows[0]);
    return { pk, npub: npubEncode(pk), name: nameOf(prof, pk), stats: st, rows, avg, worst };
  }

  /* ---------- fetching with real progress ---------- */
  const setBar = (done, total, label) => {
    $('bar').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    $('lcount').textContent = total ? t('reading')(done, total) : '';
    if (label) $('lmain').textContent = label;
  };
  const chips = relays => { $('chips').innerHTML = relays.map(r => `<span class="${r.state === 'open' ? 'ok' : r.state === 'bad' ? 'bad' : 'wait'}">${r.url.replace('wss://', '')}</span>`).join(''); };
  let curState = null;

  async function fetchClass(pk, relays) {
    setBar(0, 0, t('follows'));
    let best = null;
    await Promise.all(relays.map(r => r.sub({ kinds: [3], authors: [pk], limit: 1 }, ev => { if (ev.pubkey === pk && ev.kind === 3 && (!best || ev.created_at > best.created_at)) best = ev; }, 7000)));
    chips(relays);
    if (!relays.some(r => r.state === 'open')) throw { code: 'errNoRelay' };
    if (!best) throw { code: 'errNoFollows' };
    let fol = [...new Set(best.tags.filter(x => x[0] === 'p' && /^[0-9a-f]{64}$/.test(x[1])).map(x => x[1]))].filter(x => x !== pk);
    const total = fol.length; if (!total) throw { code: 'errNoFollows' };
    const sampled = total > CAP; if (sampled) fol = fol.slice(-CAP);
    const considered = fol.length;
    const all = fol.concat([pk]);
    const since = Math.floor(Date.now() / 1000) - DAYS * 86400;
    const notes = new Map(), profs = new Map();
    const batches = []; for (let i = 0; i < all.length; i += BATCH) batches.push(all.slice(i, i + BATCH));
    const goal = all.length; let doneAuthors = 0, timeouts = 0;
    setBar(0, goal, t('readingL'));
    const left = batches.map(() => 0); // relays still working per batch
    const live = relays.filter(r => r.state === 'open');
    const finishBatch = bi => { if (--left[bi] === 0) { doneAuthors += batches[bi].length; setBar(doneAuthors, goal); } };
    batches.forEach((b, i) => left[i] = live.length);
    await Promise.all(live.map(async r => {
      let next = 0;
      const worker = async () => {
        while (next < batches.length) {
          const bi = next++, b = batches[bi], bs = new Set(b);
          try {
            let until = Math.floor(Date.now() / 1000) + 60;
            const pf = r.sub({ kinds: [0], authors: b, limit: b.length }, ev => { const p = profs.get(ev.pubkey); if (bs.has(ev.pubkey) && (!p || ev.created_at > p.created_at)) profs.set(ev.pubkey, ev); }, 8000);
            for (let pg = 0; pg < 8; pg++) {
              let c = 0, old = until;
              const ok = await r.sub({ kinds: [1], authors: b, since, until, limit: 500 }, ev => {
                if (bs.has(ev.pubkey) && ev.created_at >= since) { notes.set(ev.id, ev); c++; if (ev.created_at < old) old = ev.created_at; }
              }, 10000);
              if (!ok) timeouts++;
              if (!ok || c < 200 || old >= until) break; until = old;
            }
            await pf;
          } catch (e) { timeouts++; }
          finishBatch(bi);
        }
      };
      await Promise.all(Array.from({ length: PAR }, worker));
    }));
    chips(relays);
    setBar(goal, goal, t('grading'));
    const by = new Map(); for (const ev of notes.values()) { if (!by.has(ev.pubkey)) by.set(ev.pubkey, []); by.get(ev.pubkey).push(ev); }
    const cls = [];
    for (const f of all) {
      const list = (by.get(f) || []).sort((a, b) => a.created_at - b.created_at);
      if (list.length < MIN_NOTES) continue;
      cls.push(analyze(f, profs.get(f) || null, list));
    }
    cls.sort((a, b) => b.avg - a.avg || b.stats.n - a.stats.n);
    const me = cls.find(x => x.pk === pk) || null;
    return { pk, me, rank: me ? cls.indexOf(me) + 1 : 0, total, considered, sampled, cls, absent: considered - cls.filter(x => x.pk !== pk).length, partial: timeouts > live.length * batches.length * 0.2 };
  }

  /* ---------- render ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const g1 = x => x.toFixed(1);
  const ord = n => { if (lang === 'it') return n + '°'; const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const link = (r, cls) => `<a class="nm ${cls || ''}" href="../?npub=${r.npub}" title="${esc(r.name)}">${esc(r.name)}</a>`;
  const dfmt = d => d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short' });
  const gcol = g => g >= 7 ? 'gg' : g >= 5 ? 'gm' : 'gb';

  function render(g) {
    const R = $('result'); curState = g;
    const c = g.cls, n = c.length;
    if (n < 3) { R.innerHTML = `<div class="err">${esc(t('small')(g.total, n))}</div>`; R.hidden = false; return; }
    const mean = c.reduce((a, x) => a + x.avg, 0) / n;
    const others = n - (g.me ? 1 : 0);
    const big = c.filter(x => x.stats.n >= 10).length >= 3 ? c.filter(x => x.stats.n >= 10) : c;
    const owl = [...big].sort((a, b) => b.stats.nightPct - a.stats.nightPct)[0];
    const clown = [...big].sort((a, b) => b.stats.laughPct - a.stats.laughPct)[0];
    const chat = [...c].sort((a, b) => b.stats.n - a.stats.n)[0];
    const quiet = c.filter(x => x.stats.laugh === 0).length;
    const now = new Date(), start = new Date(now.getTime() - 6 * 86400000);
    const sub = lang === 'it' ? 'le persone che segui' : 'the people you follow';
    const scope = g.sampled ? ` · ${t('scope')(g.considered, g.total)}` : '';
    const podOrder = [c[1], c[0], c[2]], podCls = ['p2', 'p1', 'p3'], podRank = [2, 1, 3];
    const pod = podOrder.map((x, i) => `<div class="pstep ${podCls[i]}"><div class="pn">${link(x)}</div><div class="blk"><span class="rk">#${podRank[i]}</span><span class="pg">${g1(x.avg)}</span></div></div>`).join('');
    const back = c.slice(-3).reverse().map((x, i) => `<li><span class="r">${n - i}.</span>${link(x)}<span class="v hand">${g1(x.avg)}</span></li>`).join('');
    const rows = c.map((x, i) => `<tr class="${x.pk === g.pk ? 'me' : ''}"><td class="r">${i + 1}</td><td>${link(x)}${x.pk === g.pk ? ` <i class="youtag">${t('you')}</i>` : ''}<span class="sn">${x.stats.n} ${t('notes')}</span></td><td class="avc hand">${g1(x.avg)}</td><td class="wo"><b class="${gcol(x.worst.g)}">${x.worst.g}</b> <span>${esc(SUBJ[x.worst.key].n[lang === 'it' ? 1 : 0])}</span></td></tr>`).join('');
    const you = g.me ? `<div class="cyou"><span class="yl">${t('you')}:</span> <span class="hand yv">${g1(g.me.avg)}</span> <span class="yr">· ${ord(g.rank)} ${t('of')} ${n}</span></div>` : `<div class="cyou"><span class="yl">${t('you')}:</span> <span class="yr">${t('unranked')}</span></div>`;
    R.innerHTML = `<article class="card">
      <div class="kick">${lang === 'it' ? 'REGISTRO DI CLASSE' : 'CLASS REGISTER'}</div>
      <div class="ttl"><div><h2>${t('yourc')}</h2><p class="csub">${sub}${scope} · ${t('week')} ${dfmt(start)} - ${dfmt(now)}</p></div>
        <div class="avgstamp"><div class="ring"><span class="hand">${g1(mean)}</span></div><div class="lbl">${t('avg')}</div></div></div>
      <div class="cstats"><div><span class="hand ok">${others}</span><b>${t('present')}</b></div><div><span class="hand bad">${g.absent}</span><b>${t('absent')}</b></div><div><span class="hand">${n}</span><b>${t('graded')}</b></div></div>
      <div class="lbl sec">${t('podium')}</div><div class="podium">${pod}</div>
      <div class="lbl sec">${t('full')} (${n})</div>
      <div class="tw"><table class="reg"><thead><tr><th>${t('th')[0]}</th><th>${t('th')[1]}</th><th>${t('th')[2]}</th><th>${t('th')[3]}</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="lbl sec">${t('back')}</div><ul class="backrow">${back}</ul>
      <div class="lbl sec">${t('awards')}</div>
      <div class="awards">
        <div><b>${t('owl')}</b>${link(owl)}<span>${t('owlD')(Math.round(owl.stats.nightPct))}</span></div>
        <div><b>${t('clown')}</b>${link(clown)}<span>${t('clownD')(Math.round(clown.stats.laughPct))}</span></div>
        <div><b>${t('chat')}</b>${link(chat)}<span>${t('chatD')(chat.stats.n)}</span></div>
      </div>
      <p class="never">${t('never')(quiet, n)}</p>
      ${you}
      ${g.partial ? `<p class="cnote">${t('partial')}</p>` : ''}
      <div class="sign"><span class="hand">Prof. Lira</span><span class="mono">${lang === 'it' ? "un'IA · voti = aritmetica su note pubbliche" : 'an AI · grades are arithmetic on public notes'}</span></div>
    </article>
    <div class="actions"><button class="btn primary" id="copy" type="button">${t('copy')}</button>${g.me ? `<a class="btn ghost" href="../?npub=${npubEncode(g.pk)}">${t('yourcard')}</a>` : `<a class="btn ghost" href="../?npub=${npubEncode(g.pk)}">${t('yourcard')}</a>`}</div>`;
    R.hidden = false;
    $('copy').onclick = () => { const u = location.origin + location.pathname + '?npub=' + npubEncode(g.pk); const done = () => toast(t('copied')); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(done, () => { const ta = document.createElement('textarea'); ta.value = u; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); done(); }); };
  }
  function toast(m) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }
  const showErr = m => { const e = $('err'); e.textContent = m; e.hidden = !m; };

  let busy = false;
  async function run(raw) {
    if (busy) return; busy = true; showErr(''); $('result').hidden = true; $('go').disabled = true;
    let relays = []; const t0 = performance.now();
    try {
      $('loader').hidden = false; setBar(0, 0, t('resolve'));
      const pk = await resolveInput(raw);
      relays = RELAYS.map(u => new Relay(u));
      chips(relays); const iv = setInterval(() => chips(relays), 400);
      let g; try { g = await fetchClass(pk, relays); } finally { clearInterval(iv); }
      relays.forEach(r => r.close());
      g.ms = performance.now() - t0; window.__classMs = g.ms;
      $('loader').hidden = true; render(g);
      history.replaceState(null, '', '?npub=' + npubEncode(pk));
      $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.body.dataset.done = '1';
    } catch (e) {
      relays.forEach(r => r.close()); $('loader').hidden = true;
      if (e && e.code) showErr(t(e.code)); else { console.error(e); showErr(t('errNoRelay')); }
      document.body.dataset.done = 'err';
    } finally { busy = false; $('go').disabled = false; }
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i]').forEach(el => { const v = t(el.dataset.i); if (typeof v === 'string') el[el.dataset.html ? 'innerHTML' : 'textContent'] = v; });
    document.querySelectorAll('[data-ih]').forEach(el => { el.innerHTML = t(el.dataset.ih); });
    $('q').placeholder = t('ph');
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    if (curState) render(curState);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang button').forEach(b => b.onclick = () => { lang = b.dataset.lang; try { localStorage.setItem('lira_lang', lang); } catch (e) { } applyLang(); });
    applyLang();
    $('form').onsubmit = e => { e.preventDefault(); run($('q').value); };
    $('demo').onclick = () => { $('q').value = 'npub18ams6ewn5aj2n3wt2qawzglx9mr4nzksxhvrdc4gzrecw7n5tvjqctp424'; run($('q').value); };
    const p = new URLSearchParams(location.search).get('npub');
    if (p) { $('q').value = p; run(p); }
  });
})();
