/* Chat finta per la demo: persone e fatti inventati. Genera testo in formato WhatsApp Android IT. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PagellaDemo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const OPEN = [
    'Giovedì si gioca?', 'Chi c\'è giovedì sera?', 'Ragazzi il campo è prenotato per le 21', 'Siamo in 7, ne servono 10',
    'Chi porta le pettorine?', 'Qualcuno ha le chiavi dello spogliatoio?', 'Ieri avete visto la partita?',
    'Ho anticipato io i 50 euro del campo, mandatemi 5 a testa', 'Qualcuno ha visto il mio zaino?', 'Buongiorno gruppo',
    'Sabato è il compleanno di Beppe, cosa gli regaliamo?', 'Ricordatevi i parastinchi, questa volta l\'arbitro li controlla',
    'Pizza dopo la partita?', 'Ho trovato un campo nuovo vicino alla stazione', 'Domani piove, che si fa?'
  ];
  const MID = [
    'Io ci sono', 'Anche io', 'Io no, ho il lavoro', 'Forse, vi dico domani', 'Porto io i palloni', 'Alle 20:45 al campo, non alle 21:15 come l\'altra volta',
    'Il rigore c\'era, non mi convincete', 'L\'arbitro era vergognoso', 'Che gol, ragazzi', 'Teo hai visto che gol?', 'Non ci credo, di nuovo in ritardo',
    'Ma il campo ha l\'illuminazione?', 'Pizzeria da Gennaro, prenoto io', 'Chi mi dà un passaggio?', 'Ho male a un polpaccio da martedì',
    'Squadre uguali all\'altra volta?', 'Io sto in porta, stavolta niente discussioni', 'Dai che stasera vinciamo', 'Mandate la posizione del campo',
    'Metto io le magliette, le ho lavate', 'Ma qualcuno ha la pompa per i palloni?', 'Ho letto il regolamento, il fallo laterale si fa con le mani',
    'https://example.com/campo-calcetto', 'Che schifo di partita', 'Grandi ragazzi, bella serata', 'Sabato torneo a Ostia, chi viene?'
  ];
  const CLOSE = ['Ok a giovedì', 'Perfetto, ci vediamo lì', 'Grazie a tutti', 'Buonanotte', 'A domani', 'Ci sentiamo', 'Ottimo, allora è deciso', 'Ciao ciao', 'Vi voglio bene, anche se non passate mai'];
  const RANT = [
    'Allora, io la penso così: se giochiamo alle 21 finiamo alle 22 e alle 22:15 siamo nello spogliatoio senza acqua calda',
    'Ricordo ancora la partita di marzo, quella in cui abbiamo perso 9 a 8 e nessuno ha voluto ammettere che il portiere era distratto',
    'Poi non dite che non vi avevo avvisato, perché io l\'avevo scritto già lunedì e nessuno mi ha dato retta',
    'Comunque la questione del rimborso del campo andrebbe messa per iscritto, con una tabella, perché si perde il conto',
    'Per me bisogna fare squadre fisse almeno per un mese, altrimenti non si capisce mai chi è che vince e chi è che sbaglia',
    'Faccio una proposta seria: ogni giovedì uno porta le arance a metà partita, come ai vecchi tempi, e chi dimentica paga il caffè',
    'Io il calcio lo vivo come una forma di meditazione, solo che la meditazione di solito non prevede l\'arbitro che urla'
  ];
  const NIGHT = ['Non riesco a dormire', 'Dormite?', 'Ho appena finito di rivedere gli highlights', 'Domani gioco con le scarpe nuove', 'Ma perché giochiamo sempre di giovedì', 'Mi è venuta fame', 'Chi è sveglio?', 'Ho sognato il rigore di ieri', 'Notte a tutti (ma non ho sonno)'];
  const EMO = ['😂', '❤️', '⚽', '🔥', '😅', '🙌', '🤣', '👏', '😍'];

  const PEOPLE = [
    { n: 'Marco', w: 5, d: [8, 40] },
    { n: 'Sara', w: 3.5, d: [20, 120] },
    { n: 'Beppe', w: 2.6, d: [40, 240] },
    { n: 'Teo', w: 2.4, d: [30, 200] },
    { n: 'Ale', w: 2.4, d: [60, 600] },
    { n: 'Luca', w: 2, d: [30, 300] },
    { n: 'Nico', w: 1.5, d: [1200, 5400] },
    { n: 'Gigi', w: 1.1, d: [30, 300] },
    { n: 'Fabio', w: 0.12, d: [60, 400] }
  ];

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function makeDemo() {
    const R = rng(20261105);
    const pick = a => a[Math.floor(R() * a.length)];
    const between = (a, b) => a + R() * (b - a);
    const start = Date.UTC(2026, 8, 7);
    const DAY = 86400000;
    const out = [];
    const deadStretches = [[12, 15], [30, 33], [41, 42], [50, 51], [55, 56]];
    const isDead = d => deadStretches.some(r => d >= r[0] && d <= r[1]);
    const forced = { 16: 'Nico', 34: 'Gigi', 43: 'Nico', 52: 'Gigi', 57: 'Gigi' };
    const forcedText = {
      16: 'Scusate, ho visto solo ora il messaggio. Io ci sono!',
      34: 'Ragazzi ma siete vivi?', 43: 'Ah ma si giocava? Non avevo visto niente',
      52: 'Ehi, qualcuno ancora in vita? Giovedì ci siamo?', 57: 'Rullo di tamburi: giovedì si gioca o sciopero?'
    };

    function line(person, text) {
      const p = person.n;
      if (p === 'Ale') {
        const r = R();
        if (r < 0.8) return pick(['ok', 'boh', 'dai', 'si', 'no', 'ok ok', 'mah', 'ok']);
        return pick(['Ci sono', 'va bene', 'Vengo']);
      }
      if (p === 'Beppe') {
        const r = R();
        if (r < 0.2) return '<audio omesso>';
        if (r < 0.75) {
          const k = 2 + Math.floor(R() * 3);
          const parts = [];
          for (let i = 0; i < k; i++) parts.push(pick(RANT));
          return R() < 0.5 ? parts.join('. ') + '.' : parts.join('.\n') + '.';
        }
        return text;
      }
      if (p === 'Sara') {
        let t = text;
        const r = R();
        if (r < 0.4) t += ' ' + pick(['ahahah', 'AHAHAH', 'ahah', 'hahaha']);
        if (R() < 0.7) t += ' ' + pick(EMO) + (R() < 0.4 ? pick(EMO) : '');
        return t;
      }
      if (p === 'Marco') {
        if (R() < 0.08) return text.toUpperCase() + '!!!';
        if (R() < 0.05) return '<Media omessi>';
        return text;
      }
      if (p === 'Teo') return text.toLowerCase();
      if (p === 'Fabio') return pick(['Ci sono', 'ok', 'Arrivo tardi']);
      return text;
    }

    function session(day, startMs, parts, opener) {
      let t = startMs;
      const n = 12 + Math.floor(R() * 38);
      let prev = null;
      const seq = [];
      for (let i = 0; i < n; i++) {
        let sp;
        if (i === 0 && opener) sp = opener;
        else {
          let tries = 0;
          do { const tot = parts.reduce((s, p) => s + p.w, 0); let x = R() * tot; sp = parts[0]; for (const p of parts) { x -= p.w; if (x <= 0) { sp = p; break; } } tries++; }
          while (sp === prev && R() < 0.85 && tries < 6);
        }
        const text = i === 0 ? (opener && forcedText[day] ? forcedText[day] : pick(OPEN)) : (i === n - 1 ? pick(CLOSE) : pick(MID));
        let d = between(sp.d[0], sp.d[1]);
        if (sp.n === 'Nico' && R() < 0.35) d = between(20, 200);
        if (i > 0) t += d * 1000;
        seq.push({ t, who: sp.n, x: line(sp, text) });
        prev = sp;
      }
      return seq;
    }

    const all = [];
    const person = Object.fromEntries(PEOPLE.map(p => [p.n, p]));
    for (let d = 0; d < 60; d++) {
      const wd = (new Date(start + d * DAY).getUTCDay());
      const base = start + d * DAY;
      if (forced[d]) {
        const present = PEOPLE.filter(p => p.n !== 'Luca' || d < 18 || d > 46);
        const op = person[forced[d]];
        const s = session(d, base + between(9 * 3600, 20 * 3600) * 1000, present.filter(p => p.w > 0.5), op);
        all.push(...s);
        continue;
      }
      if (isDead(d)) continue;
      const ns = wd === 4 ? 4 : (wd === 3 || wd === 5) ? 3 : (R() < 0.35 ? 0 : (R() < 0.6 ? 1 : 2));
      for (let k = 0; k < ns; k++) {
        const hr = k === 0 ? between(8, 13) : (k === 1 ? between(17, 20) : between(20, 23.3));
        const luca = d < 18 || d > 46 || (d === 47 && k === 0);
        const present = PEOPLE.filter(p => (p.n !== 'Luca' || luca) && (p.n !== 'Fabio' || R() < 0.12));
        const np = 2 + Math.floor(R() * 4);
        const chosen = [];
        const pool = present.slice();
        while (chosen.length < Math.min(np, pool.length)) {
          const tot = pool.reduce((s, p) => s + p.w, 0); let x = R() * tot; let idx = 0;
          for (let i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) { idx = i; break; } }
          chosen.push(pool.splice(idx, 1)[0]);
        }
        if (chosen.length < 2) chosen.push(person.Marco);
        all.push(...session(d, base + hr * 3600 * 1000, chosen, null));
      }
      if (R() < 0.42) { // Teo di notte
        let t = base + between(0.2, 3.3) * 3600 * 1000;
        const k = 3 + Math.floor(R() * 6);
        for (let i = 0; i < k; i++) { t += between(20, 240) * 1000; all.push({ t, who: 'Teo', x: pick(NIGHT).toLowerCase() }); }
        if (R() < 0.3) { t += between(60, 400) * 1000; all.push({ t, who: pick(['Sara', 'Marco']), x: pick(['Dormi!', 'Teo è l\'una e mezza', 'Vai a letto', 'ahahah']) }); }
      }
      if (d === 47) all.push({ t: base + 10 * 3600 * 1000, who: 'Luca', x: 'Scusate ragazzi, sono sparito per gli esami. Giovedì ci sono!' });
    }
    [[9, 'Ci sono', 19.2], [22, 'Arrivo tardi', 20.1], [38, 'ok', 18.4]].forEach(f => all.push({ t: start + f[0] * DAY + f[2] * 3600000, who: 'Fabio', x: f[1] }));
    all.sort((a, b) => a.t - b.t);
    [12, 41].forEach(sd => {
      const lim = start + sd * DAY; let i = all.length - 1;
      while (i > 0 && all[i].t >= lim) i--;
      all.splice(i + 1, 0, { t: all[i].t + 60000, who: 'Marco', x: 'Allora, giovedì si gioca? Confermate entro domani, per favore' });
    });
    // Ghost Luca: dopo il giorno 46 resta
    const head = [
      '07/09/26, 18:02 - I messaggi e le chiamate sono crittografati end-to-end. Nessuno al di fuori di questa chat, nemmeno WhatsApp, può leggerli o ascoltarli. Tocca per saperne di più.',
      '07/09/26, 18:02 - Marco ha creato il gruppo “Calcetto del giovedì”',
      '07/09/26, 18:03 - Marco ha aggiunto Sara, Beppe, Teo, Ale, Luca, Nico, Gigi'
    ];
    const lines = head.slice();
    for (const m of all) {
      const d = new Date(m.t);
      const lns = m.x.split('\n');
      lines.push(pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + String(d.getUTCFullYear()).slice(2) + ', ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ' - ' + m.who + ': ' + lns[0]);
      for (let i = 1; i < lns.length; i++) lines.push(lns[i]);
    }
    return { name: 'Calcetto del giovedì', text: lines.join('\n') + '\n' };
  }
  return { makeDemo };
});
