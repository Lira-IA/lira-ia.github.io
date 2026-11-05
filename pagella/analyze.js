/* Pagella della Chat - analisi e voti (indipendenti dalla lingua). Nessuna rete. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PagellaAnalyze = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const H = 3600000, DAY = 86400000;
  const SESSION = 4 * H, LONG = 24 * H;
  const EMOJI = /\p{Extended_Pictographic}/gu;
  const LAUGH = /(?:ah|ha|eh|he){2,}h?|😂|🤣|😹|\b(?:lol|lmao|lmfao|xd+|rofl|ahah\w*)\b/i;
  const OKRE = /^(ok+|okay|okey|k|kk|va bene|vabene|d'accordo|perfetto|ok ok)\W*$/i;
  const URLRE = /https?:\/\/\S+/g;
  const WORD = /[\p{L}']{4,}/gu;
  const STOP = new Set(('anche allora ancora altro altri avete avevo avuto bene benissimo cosa come così cioè dopo dove delle degli dalla dello eravamo essere fatto fare farlo forse fuori già hanno invece insieme loro molto nella nelle nello negli nostro nulla oggi ogni oltre ormai però perché perche perchè poco prima proprio quale quali quando quanto quasi quella quelle quelli quello questa queste questi questo sempre siamo sono solo sopra stai stanno stasera stata state stato stesso stiamo sulla sulle tanto tipo troppo tutta tutte tutti tutto ultimo vado vedi volta vostro vuoi vorrei sarà siete qua ecco ciao dire dice detto dici miei tuoi buongiorno buonanotte sera giorno mica alle allo agli dalle dagli dell della nelle sulla verso quindi senza stessa mentre durante circa contro sotto dentro dietro prima ahah ahahah haha hahaha').split(' ').filter(Boolean));
  ('that this with have from they your what when where which there their about would could should because just like will been were then them than into some more also only very over what dont cant know yeah okay thats going gonna come good time need want back still much even well here make made take got get see say said one two how who why its im ive youre ill hes shes').split(' ').forEach(w => STOP.add(w));

  function countWords(x) {
    let n = 0, inw = false;
    for (let i = 0; i < x.length; i++) {
      const c = x.charCodeAt(i);
      if (c > 32) { if (!inw) { n++; inw = true; } } else inw = false;
    }
    return n;
  }
  function median(arr) {
    if (!arr.length) return null;
    arr.sort((a, b) => a - b);
    const m = arr.length >> 1;
    return arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rel = (v, max, pw) => max > 1e-8 ? 2 + 8 * Math.pow(Math.min(1, v / max), pw || 0.5) : 5;
  const relInv = (v, max) => max > 1e-8 ? 1 + 9 * Math.pow(Math.max(0, 1 - v / (max * 1.3)), 0.7) : 10;
  const PTS = [[30, 10], [60, 9], [180, 8], [600, 7], [1800, 6], [3600, 5], [10800, 4], [28800, 3], [57600, 2], [86400, 1]];
  function gPunct(sec) {
    if (sec == null) return null;
    if (sec <= PTS[0][0]) return 10;
    for (let i = 1; i < PTS.length; i++) {
      if (sec <= PTS[i][0]) {
        const [s0, g0] = PTS[i - 1], [s1, g1] = PTS[i];
        const f = (Math.log(sec) - Math.log(s0)) / (Math.log(s1) - Math.log(s0));
        return g0 + (g1 - g0) * f;
      }
    }
    return 1;
  }
  const gNight = share => 10 - 9 * Math.min(1, share / 0.2);
  const gBrevity = w => w <= 3 ? 10 : clamp(10 - 9 * Math.log(w / 3) / Math.log(10), 1, 10);
  const gVoice = share => 10 - 9 * Math.min(1, share / 0.12);
  const gGhost = (days, span) => 10 - 9 * Math.pow(Math.min(1, days / clamp(span / 3, 3, 30)), 1.4);
  const r1 = x => Math.round(x * 10) / 10;

  function analyze(parsed) {
    const msgs = parsed.msgs, N = msgs.length, A = parsed.authors.length;
    const S = parsed.authors.map((name, id) => ({
      id, name, n: 0, textN: 0, words: 0, maxWords: 0, night: 0, voice: 0, media: 0, emoji: 0, laugh: 0,
      questions: 0, links: 0, oneWord: 0, ok: 0, lastWord: 0, starts: 0, restarts: 0, lateN: 0, lateSum: 0,
      rt: [], lastT: 0, lastIdx: -1, ghostMs: 0, firstT: 0, longMsgs: 0
    }));
    const hourHist = new Array(24).fill(0), wdHist = new Array(7).fill(0);
    const dayCount = new Map(), wordCount = new Map(), emojiCount = new Map();
    const allRt = [];
    let nightAll = 0, laughAll = 0, voiceAll = 0, mediaAll = 0, bigSilence = 0, bigSilenceEnd = 0;
    let sessFirst = -1, sessLen = 0, sessMulti = false;
    const closeSess = last => { if (sessLen >= 3 && sessMulti) S[last].lastWord++; };

    for (let i = 0; i < N; i++) {
      const m = msgs[i], a = m.a, s = S[a], t = m.t;
      s.n++;
      const hour = Math.floor(t / H) % 24, day = Math.floor(t / DAY);
      hourHist[hour]++; wdHist[(day + 4) % 7]++;
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
      if (hour < 6) { s.night++; nightAll++; }
      if (m.k) {
        if (m.k === 'voice') { s.voice++; voiceAll++; }
        s.media++; mediaAll++;
      }
      const x = m.x;
      if (x) {
        s.textN++;
        const w = countWords(x);
        s.words += w;
        if (w > s.maxWords) s.maxWords = w;
        if (w >= 50) s.longMsgs++;
        if (w === 1 && /[\p{L}\p{N}]/u.test(x)) { s.oneWord++; if (OKRE.test(x)) s.ok++; }
        else if (OKRE.test(x)) s.ok++;
        if (x.indexOf('?') >= 0) s.questions++;
        if (x.indexOf('http') >= 0) s.links++;
        if (LAUGH.test(x)) { s.laugh++; laughAll++; }
        const em = x.match(EMOJI);
        if (em) {
          s.emoji += em.length;
          for (let j = 0; j < em.length && j < 8; j++) emojiCount.set(em[j], (emojiCount.get(em[j]) || 0) + 1);
        }
        const toks = x.toLowerCase().replace(URLRE, ' ').match(WORD);
        if (toks) for (let j = 0; j < toks.length; j++) {
          const wd = toks[j];
          if (!STOP.has(wd)) wordCount.set(wd, (wordCount.get(wd) || 0) + 1);
        }
      }
      // ghosting
      if (s.lastIdx >= 0) {
        if (i - s.lastIdx >= 10) { const g = t - s.lastT; if (g > s.ghostMs) s.ghostMs = g; }
      } else s.firstT = t;
      // sessioni, risposte
      if (i === 0) { sessFirst = a; sessLen = 1; sessMulti = false; s.starts++; }
      else {
        const p = msgs[i - 1], gap = t - p.t;
        if (gap >= SESSION) {
          closeSess(p.a);
          sessFirst = a; sessLen = 1; sessMulti = false; s.starts++;
          if (gap >= LONG) s.restarts++;
          if (gap > bigSilence) { bigSilence = gap; bigSilenceEnd = t; }
        } else { sessLen++; if (a !== sessFirst) sessMulti = true; }
        if (a !== p.a) {
          if (gap < LONG) { const sec = gap / 1000; s.rt.push(sec); allRt.push(sec); }
          else if (gap < 14 * DAY && p.x.indexOf('?') >= 0) { s.lateN++; s.lateSum += gap; }
        }
      }
      s.lastT = t; s.lastIdx = i;
    }
    if (N) closeSess(msgs[N - 1].a);

    const from = N ? msgs[0].t : 0, to = N ? msgs[N - 1].t : 0;
    const spanDays = Math.max(1, Math.round((to - from) / DAY) + 1);
    for (const s of S) {
      if (s.lastIdx >= 0 && N - 1 - s.lastIdx >= 10) { const g = to - s.lastT; if (g > s.ghostMs) { s.ghostMs = g; s.ghostTail = true; } }
    }
    let busiest = null;
    dayCount.forEach((n, d) => { if (!busiest || n > busiest.n) busiest = { day: d * DAY, n }; });
    const top = (map) => { let b = null, bn = 0; map.forEach((n, k) => { if (n > bn) { bn = n; b = k; } }); return b ? { w: b, n: bn } : null; };

    const members = S.filter(s => s.n > 0).map(s => ({
      id: s.id, name: s.name, n: s.n, share: N ? s.n / N : 0, textN: s.textN, words: s.words,
      avgWords: s.textN ? s.words / s.textN : 0, maxWords: s.maxWords, longMsgs: s.longMsgs,
      night: s.night, nightShare: s.night / s.n, voice: s.voice, media: s.media,
      emoji: s.emoji, laugh: s.laugh, questions: s.questions, links: s.links,
      oneWord: s.oneWord, oneWordShare: s.textN ? s.oneWord / s.textN : 0, ok: s.ok,
      lastWord: s.lastWord, starts: s.starts, restarts: s.restarts,
      lateN: s.lateN, lateAvgSec: s.lateN ? s.lateSum / s.lateN / 1000 : null,
      replies: s.rt.length, medReply: s.rt.length >= 5 ? median(s.rt) : null,
      ghostDays: Math.round(s.ghostMs / DAY * 10) / 10, ghostTail: !!s.ghostTail,
      grades: {}, avg: null
    })).sort((a, b) => b.n - a.n).slice(0, 300);

    const hasVoice = voiceAll >= 3;
    const result = {
      title: parsed.title || null, format: parsed.format, total: N, from, to, spanDays,
      perDay: N / spanDays, hourHist, wdHist, busiest,
      topWord: top(wordCount), topEmoji: top(emojiCount),
      longestSilence: { days: bigSilence / DAY, end: bigSilenceEnd },
      hasVoice, voiceAll, mediaAll, nightShare: N ? nightAll / N : 0, laughShare: N ? laughAll / N : 0,
      medianReplyAll: median(allRt), members, authorsCount: A, awards: [], cards: 0
    };
    grade(result);
    return result;
  }

  function grade(R) {
    const G = R.members.filter(m => m.n >= 5);
    R.graded = G.length;
    R.cards = Math.min(12, G.length);
    if (!G.length) return;
    const ref0 = G.filter(m => m.n >= 10), ref = ref0.length ? ref0 : G;
    const mx = f => Math.max(1e-9, ...ref.map(f));
    const mShare = mx(m => m.share), mEmoji = mx(m => m.emoji / m.n), mLast = mx(m => m.lastWord),
      mStart = mx(m => m.starts), mOne = mx(m => m.oneWordShare), mLaugh = mx(m => m.laugh / m.n);
    for (const m of G) {
      const g = m.grades;
      g.presence = rel(m.share, mShare, 0.5);
      g.punctuality = gPunct(m.medReply);
      g.night = gNight(m.nightShare);
      g.brevity = m.textN >= 3 ? gBrevity(m.avgWords) : null;
      const vs = R.hasVoice ? m.voice / m.n : m.media / m.n;
      g.voice = gVoice(vs);
      g.emoji = rel(m.emoji / m.n, mEmoji, 0.5);
      g.lastword = rel(m.lastWord, mLast, 0.55);
      g.initiative = rel(m.starts, mStart, 0.55);
      g.ghost = gGhost(m.ghostDays, R.spanDays);
      g.oneword = m.textN >= 3 ? relInv(m.oneWordShare, mOne) : null;
      g.laugh = rel(m.laugh / m.n, mLaugh, 0.5);
      let sum = 0, c = 0;
      for (const k in g) if (g[k] != null) { g[k] = clamp(Math.round(g[k]), 1, 10); sum += g[k]; c++; }
      m.avg = c ? r1(sum / c) : null;
    }
    R.groupAvg = r1(G.slice(0, 12).reduce((s, m) => s + (m.avg || 0), 0) / R.cards);
    // premi
    const best = (arr, f, min) => {
      let b = null, bv = -Infinity;
      for (const m of arr) { const v = f(m); if (v != null && v > bv) { bv = v; b = m; } }
      return b && bv >= (min == null ? -Infinity : min) ? { m: b, v: bv } : null;
    };
    const aw = [];
    const add = (id, r, extra) => { if (r) aw.push(Object.assign({ id, who: r.m.id, v: r.v }, extra || {})); };
    add('chatter', best(G, m => m.n));
    add('ghost', best(G, m => m.ghostDays, 3), null);
    add('night', best(G, m => m.night, 3));
    add('novelist', best(ref, m => m.avgWords, 8));
    const late = best(G, m => m.lateN >= 2 ? m.lateAvgSec : null, 0);
    if (late && late.v / 86400 >= 2) add('late3', late);
    else add('slow', best(G.filter(m => m.medReply != null), m => m.medReply, 0));
    add('restart', best(G, m => m.restarts, 1) || best(G, m => m.starts, 1));
    add('lightning', best(G.filter(m => m.medReply != null), m => -m.medReply, -Infinity));
    add('lastword', best(G, m => m.lastWord, 2));
    if (R.hasVoice) add('voice', best(G, m => m.voice, 3));
    else add('media', best(G, m => m.media, 3));
    add('emoji', best(G, m => m.emoji, 10));
    add('laugh', best(G, m => m.laugh, 5));
    add('telegraph', best(ref, m => m.oneWordShare, 0.15));
    // un solo premio "ritardatario/lampo" non coincidano sulla stessa persona
    R.awards = aw.filter(a => !(a.id === 'lightning' && aw.some(b => (b.id === 'slow' || b.id === 'late3') && b.who === a.who)));
  }

  return { analyze, grade, median, countWords };
});
