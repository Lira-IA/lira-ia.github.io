/* Il Tribunale della Chat - motore: statistiche reali -> capi d'accusa, prove, difesa, sentenza. Nessuna rete. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./testi.js'));
  else root.TribunaleMotore = factory(root.TribunaleTesti);
})(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';
  const MIN = 60000, H = 3600000, DAY = 86400000;
  const OKRE = /^(ok+|okay|okey|k|kk|va bene|vabene|d'accordo|perfetto|ok ok)\W*$/i;
  const LAUGH = /(?:ah|ha|eh|he){2,}h?|😂|🤣|😹|\b(?:lol|lmao|xd+|ahah\w*)\b/i;
  const GRAZIE = /\bgrazie\b|\bgrz\b|\bthanks?\b|\bthank you\b/i;
  const SCUSE = /\bscusa\b|\bscusate\b|\bscusami\b|mi dispiace|\bsorry\b|\bperdonami\b/i;
  const GENTILI = /\bauguri\b|ti voglio bene|ti penso|buongiorno|buonanotte|buon compleanno|complimenti|\bbravo\b|\bbrava\b|\bbravi\b|sei grande|sei un grande|ti adoro|ti amo|\bbaci\b|\bbacio\b|\bbacioni\b|per favore|\bprego\b|\bfigurati\b|in bocca al lupo/i;
  const CUORI = ['❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💖', '💗', '💓', '💕', '💞', '💘', '😘', '🥰', '😍', '😚', '🫶'];
  const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return function () { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));

  const pad = n => (n < 10 ? '0' : '') + n;
  function fData(t) { const d = new Date(t); return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); }
  function fOra(t) { const d = new Date(t); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
  function fDataOra(t) { return fData(t) + ' ' + fOra(t); }
  function fDurata(sec) {
    if (sec == null) return 'n/d';
    if (sec < 90) return Math.round(sec) + ' secondi';
    const m = sec / 60;
    if (m < 90) return Math.round(m) + ' minuti';
    const h = m / 60;
    if (h < 36) { const v = Math.round(h * 10) / 10; return String(v).replace('.', ',') + (v === 1 ? ' ora' : ' ore'); }
    const d = Math.round(h / 24); return d + ' giorni';
  }
  function trunc(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
  }
  const median = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const quoteOf = m => (m.x ? trunc(m.x, 80) : (m.k === 'voice' ? '[messaggio vocale]' : m.k ? '[allegato]' : ''));
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const stripQ = x => x.replace(/[\s\p{Extended_Pictographic}‍️.!]+$/gu, '');

  function autoriInfo(parsed) {
    const n = parsed.authors.map(() => 0);
    parsed.msgs.forEach(m => n[m.a]++);
    return parsed.authors.map((name, id) => ({ id, name, n: n[id] })).sort((a, b) => b.n - a.n);
  }

  /* --- calcolo delle statistiche e dei capi --- */
  function calcola(parsed, di) {
    const msgs = parsed.msgs, N = msgs.length;
    const lastT = N ? msgs[N - 1].t : 0, firstT = N ? msgs[0].t : 0;
    const nome = parsed.authors[di];
    const mine = []; for (let i = 0; i < N; i++) if (msgs[i].a === di) mine.push(i);
    const nD = mine.length;
    const textD = mine.filter(i => msgs[i].x).length;
    const mediaAll = msgs.filter(m => m.k).length;
    const r = {
      nome, nD, textD, N, firstT, lastT, mediaAll,
      giorniAttivi: Math.max(1, Math.round((lastT - firstT) / DAY)), capi: {}
    };

    // tempi di risposta
    const rtD = [], rtO = [], rtDpairs = [];
    for (let i = 1; i < N; i++) {
      const m = msgs[i], p = msgs[i - 1];
      if (m.a === p.a) continue;
      const gap = m.t - p.t;
      if (gap >= DAY) continue;
      if (m.a === di) { rtD.push(gap / 1000); rtDpairs.push({ i, gap }); } else rtO.push(gap / 1000);
    }

    const duo = parsed.authors.length <= 2;
    const primo = nome.split(' ')[0].toLowerCase();
    const citato = m => primo.length >= 3 && (m.x || '').toLowerCase().indexOf(primo) >= 0;
    const pingpong = (j, f) => j > 0 && msgs[j - 1].a === msgs[f].a; // chi gli ha risposto e' chi gli aveva scritto prima
    const direttoAbb = (j, f) => duo || citato(msgs[f]) || pingpong(j, f);
    // 1) abbandono: ultimo msg di un suo blocco, seguito da altri entro 30 min, poi il suo silenzio > 6h
    const ab = []; let engaged = 0;
    for (let k = 0; k < mine.length; k++) {
      const j = mine[k];
      if (j + 1 >= N || msgs[j + 1].a === di) continue;
      if (msgs[j + 1].t - msgs[j].t > 30 * MIN) continue;
      if (msgs[j + 1].t + 6 * H > lastT) continue;
      if (!direttoAbb(j, j + 1)) continue;
      engaged++;
      const nextD = mine[k + 1];
      if (nextD === undefined || msgs[nextD].t - msgs[j + 1].t > 6 * H) ab.push(j + 1);
    }
    r.capi.abbandono = {
      n: ab.length, tot: engaged, pct: engaged ? Math.round(100 * ab.length / engaged) : 0,
      colpevole: ab.length >= 3 && ab.length / Math.max(1, engaged) >= 0.2,
      gravita: clamp01(ab.length / Math.max(1, engaged) * 1.6),
      prove: spread(ab, 3).map(i => ({ quando: msgs[i].t, chi: parsed.authors[msgs[i].a], testo: quoteOf(msgs[i]), nota: 'nessuna replica di ' + nome + ' per oltre 6 ore' }))
    };

    // 2) domande rimaste senza risposta
    const dq = []; let qtot = 0, lastDi = -1, pi = 0;
    for (let i = 0; i < N; i++) {
      const m = msgs[i];
      if (m.a === di) { lastDi = i; continue; }
      if (!m.x || lastDi < 0) continue;
      if (stripQ(m.x).slice(-1) !== '?' && !/\?\s*$/.test(m.x)) continue;
      if (m.t - msgs[lastDi].t > 60 * MIN) continue;
      if (!(duo || citato(m) || (i - lastDi === 1 && pingpong(lastDi, i)))) continue;
      if (m.t + 6 * H > lastT) continue;
      qtot++;
      let risposto = false;
      for (let j = i + 1; j < N && msgs[j].t - m.t <= 6 * H; j++) if (msgs[j].a === di) { risposto = true; break; }
      if (!risposto) dq.push(i);
    }
    r.capi.domande = {
      n: dq.length, tot: qtot, pct: qtot ? Math.round(100 * dq.length / qtot) : 0,
      colpevole: dq.length >= 3 && dq.length / Math.max(1, qtot) >= 0.25,
      gravita: clamp01(dq.length / Math.max(1, qtot) * 1.5),
      prove: spread(dq, 3).map(i => ({ quando: msgs[i].t, chi: parsed.authors[msgs[i].a], testo: quoteOf(msgs[i]), nota: nome + ' non ha risposto entro 6 ore' }))
    };

    // 3) monologo
    const runs = []; let cur = null;
    for (let k = 0; k < mine.length; k++) {
      const j = mine[k];
      if (cur && mine[k - 1] === j - 1 && msgs[j].t - msgs[j - 1].t < 3 * H) { cur.len++; }
      else { if (cur) runs.push(cur); cur = { start: j, len: 1 }; }
    }
    if (cur) runs.push(cur);
    const big = runs.filter(x => x.len >= 4).sort((a, b) => b.len - a.len);
    const maxRun = runs.reduce((a, x) => Math.max(a, x.len), 0);
    const big5 = runs.filter(x => x.len >= 5).length;
    const recRun = big[0];
    r.capi.monologo = {
      max: maxRun, cnt: big.length, data: recRun ? fData(msgs[recRun.start].t) : '-',
      colpevole: maxRun >= 7 || big5 >= 3,
      gravita: clamp01(maxRun / 14),
      prove: big.slice(0, 3).map(x => ({ quando: msgs[x.start].t, chi: nome, testo: quoteOf(msgs[x.start]), nota: x.len + ' messaggi di fila, senza risposte' }))
    };

    // 4) vocali
    const vo = mine.filter(i => msgs[i].k === 'voice');
    const perDay = new Map();
    vo.forEach(i => { const d = Math.floor(msgs[i].t / DAY); perDay.set(d, (perDay.get(d) || []).concat(i)); });
    const topDays = [...perDay.entries()].sort((a, b) => b[1].length - a[1].length);
    let vOthers = 0, nOthers = 0;
    for (let i = 0; i < N; i++) if (msgs[i].a !== di) { nOthers++; if (msgs[i].k === 'voice') vOthers++; }
    const vShare = nD ? vo.length / nD : 0, vShareO = nOthers ? vOthers / nOthers : 0;
    r.capi.vocali = {
      n: vo.length, pct: Math.round(vShare * 100), max: topDays[0] ? topDays[0][1].length : 0,
      data: topDays[0] ? fData(topDays[0][1][0] !== undefined ? msgs[topDays[0][1][0]].t : 0) : '-',
      colpevole: vo.length >= 5 && (vShare >= 0.10 || vShare >= 2 * vShareO && vShare >= 0.05),
      gravita: clamp01(vShare / 0.3),
      nota: mediaAll === 0,
      prove: topDays.slice(0, 3).map(([d, a]) => ({ quando: msgs[a[0]].t, chi: nome, testo: '[' + a.length + (a.length === 1 ? ' messaggio vocale]' : ' messaggi vocali nello stesso giorno]'), nota: 'primo alle ' + fOra(msgs[a[0]].t) }))
    };

    // 5) ok-ismo
    const ok = mine.filter(i => msgs[i].x && OKRE.test(msgs[i].x.trim()));
    const okPct = textD ? ok.length / textD : 0;
    const okRanked = ok.filter(i => i > 0 && msgs[i - 1].a !== di).sort((a, b) => (msgs[b - 1].x || '').length - (msgs[a - 1].x || '').length);
    const okShow = spreadFrom(okRanked.slice(0, 12), 3);
    r.capi.okismo = {
      n: ok.length, tot: textD, pct: Math.round(okPct * 100),
      colpevole: ok.length >= 5 && okPct >= 0.08,
      gravita: clamp01(okPct / 0.3),
      prove: okShow.map(i => ({ quando: msgs[i].t, chi: nome, testo: quoteOf(msgs[i]), prima: quoteOf(msgs[i - 1]), primaChi: parsed.authors[msgs[i - 1].a], nota: 'in risposta a un messaggio di ' + parsed.authors[msgs[i - 1].a] }))
    };

    // 6) sparizione: la piu' lunga assenza mentre gli altri scrivevano (>=15 msg altrui)
    let best = null;
    const bounds = mine.slice(); // prima, tra, dopo
    for (let k = 0; k <= bounds.length; k++) {
      const a = k === 0 ? -1 : bounds[k - 1];
      const b = k === bounds.length ? N : bounds[k];
      if (a < 0) continue;
      const ta = msgs[a].t, tb = b < N ? msgs[b].t : lastT;
      const others = b - a - 1;
      const gap = tb - ta;
      if (others >= 15 && (!best || gap > best.gap)) best = { a, b, gap, others };
    }
    const giorni = best ? Math.round(best.gap / DAY) : 0;
    const finale = best && best.b >= N;
    r.capi.sparizione = {
      giorni, msg: best ? best.others : 0, da: best ? fData(msgs[best.a].t) : '-', a: best ? (finale ? 'oggi (ancora latitante)' : fData(msgs[best.b].t)) : '-',
      colpevole: !!best && giorni >= 5,
      gravita: clamp01(giorni / 21),
      prove: best ? [
        { quando: msgs[best.a].t, chi: nome, testo: quoteOf(msgs[best.a]), nota: 'ultimo avvistamento' }
      ].concat(!finale ? [{ quando: msgs[best.b].t, chi: nome, testo: quoteOf(msgs[best.b]), nota: 'ricomparsa dopo ' + giorni + ' giorni' }] : []) : []
    };

    // 7) notte
    const nt = mine.filter(i => { const h = new Date(msgs[i].t).getUTCHours(); return h >= 1 && h < 6; });
    const hh = {}; nt.forEach(i => { const h = new Date(msgs[i].t).getUTCHours(); hh[h] = (hh[h] || 0) + 1; });
    const topH = Object.keys(hh).sort((a, b) => hh[b] - hh[a])[0];
    const ntShare = nD ? nt.length / nD : 0;
    const ntSorted = nt.slice().sort((a, b) => Math.abs(new Date(msgs[a].t).getUTCHours() * 60 + new Date(msgs[a].t).getUTCMinutes() - 180) - Math.abs(new Date(msgs[b].t).getUTCHours() * 60 + new Date(msgs[b].t).getUTCMinutes() - 180));
    r.capi.notte = {
      n: nt.length, pct: Math.round(ntShare * 100), ora: topH !== undefined ? pad(+topH) + ':00' : '03:00',
      colpevole: nt.length >= 4 && ntShare >= 0.04,
      gravita: clamp01(ntShare / 0.15),
      prove: ntSorted.slice(0, 3).map(i => ({ quando: msgs[i].t, chi: nome, testo: quoteOf(msgs[i]), nota: 'ore ' + fOra(msgs[i].t) }))
    };

    // 8) ritardo
    const medD = median(rtD.slice()), medO = median(rtO.slice());
    const slow = rtDpairs.filter(x => x.gap > 2 * H).sort((a, b) => b.gap - a.gap);
    r.capi.ritardo = {
      med: fDurata(medD), medAltri: fDurata(medO), x: medD && medO ? Math.max(1, Math.round(medD / Math.max(medO, 30))) : 1,
      campioni: rtD.length, medSec: medD,
      colpevole: rtD.length >= 8 && medD != null && ((medD >= 20 * 60 && (medO == null || medD >= 2 * medO)) || medD >= 3600),
      gravita: clamp01(medD ? Math.log10(1 + medD / 60) / 2.5 : 0),
      prove: slow.slice(0, 3).map(x => ({ quando: msgs[x.i].t, chi: nome, testo: quoteOf(msgs[x.i]), prima: quoteOf(msgs[x.i - 1]), primaChi: parsed.authors[msgs[x.i - 1].a], nota: 'risposta dopo ' + fDurata(x.gap / 1000) }))
    };

    // fatti a favore
    const fav = { grazie: [], cuori: 0, cuoriMsg: [], scuse: [], gentili: [], ride: 0 };
    mine.forEach(i => {
      const x = msgs[i].x; if (!x) return;
      if (GRAZIE.test(x)) fav.grazie.push(i);
      if (SCUSE.test(x)) fav.scuse.push(i);
      if (GENTILI.test(x)) fav.gentili.push(i);
      let c = 0; for (const e of CUORI) { let p = -1; while ((p = x.indexOf(e, p + 1)) >= 0) c++; }
      if (c) { fav.cuori += c; fav.cuoriMsg.push(i); }
      if (LAUGH.test(x)) fav.ride++;
    });
    r.fav = fav;
    r.favProve = {
      grazie: fav.grazie, cuori: fav.cuoriMsg, scuse: fav.scuse, gentili: fav.gentili
    };
    r.quote = i => ({ quando: msgs[i].t, chi: nome, testo: quoteOf(msgs[i]) });
    return r;
  }

  function spread(arr, n) { // n elementi sparsi lungo l'array
    if (arr.length <= n) return arr.slice();
    const out = []; for (let k = 0; k < n; k++) out.push(arr[Math.floor(k * (arr.length - 1) / (n - 1))]);
    return out;
  }
  function spreadFrom(arr, n) { return arr.slice(0, n).sort((a, b) => a - b); }

  const ORDINE = ['abbandono', 'domande', 'monologo', 'vocali', 'okismo', 'sparizione', 'notte', 'ritardo'];

  /* --- processo completo --- */
  function processo(parsed, di, seed) {
    const st = calcola(parsed, di);
    const r = rng((hashStr(st.nome + '|' + parsed.msgs.length) + (seed || 0) * 7919) >>> 0);
    const nome = st.nome;
    const capi = ORDINE.map(id => {
      const c = st.capi[id], tp = T.CAPI[id];
      const v = Object.assign({ nome }, c);
      const colpevole = c.colpevole && !(id === 'vocali' && c.nota && c.n === 0);
      const testo = fill(pick(r, colpevole ? tp.accusa : tp.assolto), v);
      let pena = colpevole ? fill(pick(r, tp.pena), v).replace(/^Pena( accessoria)?:\s*/i, '') : null;
      if (pena) pena = pena.charAt(0).toUpperCase() + pena.slice(1);
      return {
        id, titolo: tp.titolo, art: tp.art, colpevole, gravita: c.gravita,
        riga: fill(colpevole ? tp.riga : tp.rigaOk, v),
        testo, pena, prove: colpevole ? c.prove : [],
        nota: id === 'vocali' && c.nota && !colpevole ? tp.nota : null
      };
    });
    const g = capi.filter(c => c.colpevole);
    const colpevole = g.length >= 2;
    // arringa
    const fav = st.fav;
    const v = { nome, n: 0, giorni: st.giorniAttivi, pct: st.N ? Math.round(100 * st.nD / st.N) : 0 };
    const fatti = [];
    const add = (k, n, proveIdx) => { if (n > 0) fatti.push({ k, n, proveIdx }); };
    add('grazie', fav.grazie.length, fav.grazie);
    add('cuori', fav.cuori, fav.cuoriMsg);
    add('scuse', fav.scuse.length, fav.scuse);
    add('gentili', fav.gentili.length, fav.gentili);
    add('ride', fav.ride, []);
    fatti.sort((a, b) => b.n - a.n);
    const scelti = fatti.slice(0, 3);
    const parti = [fill(pick(r, T.DIFESA_APERTURA), v)];
    const proveDifesa = [];
    scelti.forEach(f => {
      parti.push(fill(pick(r, T.DIFESA_FATTI[f.k]), Object.assign({}, v, { n: f.n })));
      f.proveIdx.slice(0, 2).forEach(i => { if (proveDifesa.length < 3 && st.quote(i).testo) proveDifesa.push(st.quote(i)); });
    });
    parti.push(fill(pick(r, T.DIFESA_FATTI.presenza), Object.assign({}, v, { n: st.nD })));
    parti.push(fill(pick(r, T.DIFESA_CHIUSURA), v));
    const tot = capi.length;
    const verdetto = fill(pick(r, colpevole ? T.VERDETTO_FINALE.colpevole : T.VERDETTO_FINALE.assolto), { nome, g: g.length, t: tot });
    const pene = g.slice().sort((a, b) => b.gravita - a.gravita).slice(0, 3).map(c => c.pena);
    return {
      imputato: nome, chat: parsed.title || null, messaggiTotali: st.N, messaggiImputato: st.nD,
      intro: pick(r, T.INTRO), capi, colpevoli: g.length, totaleCapi: tot, colpevole,
      difesa: { parti, prove: proveDifesa }, verdetto, pene,
      chiusura: pick(r, T.CHIUSURA_SOCIAL),
      numero: String(1000 + (hashStr(nome + st.N) % 8999)) + '/' + new Date().getFullYear(),
      pochiDati: st.nD < 20
    };
  }

  return { processo, calcola, autoriInfo, fData, fDataOra, trunc, rng, hashStr, fill };
});
