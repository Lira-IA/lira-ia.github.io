/* Chat DEMO inventata: "Calcetto del giovedi'". Nomi e fatti di fantasia. Generata da script (seed fisso), formato Android IT. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TribunaleDemo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function rng(seed) { let a = seed >>> 0; return function () { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const pad = n => (n < 10 ? '0' : '') + n;

  function genera() {
    const r = rng(20261);
    const pick = a => a[Math.floor(r() * a.length)];
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    const M = [];
    let voci = 0;
    const base = Date.UTC(2026, 7, 31); // lunedi' 31/08/2026
    const add = (week, dow, h, mi, who, text) => { // dow 0=lun
      M.push({ t: base + ((week * 7 + dow) * 24 * 60 + h * 60 + mi) * 60000, who, text });
    };
    const voce = (week, dow, h, mi) => {
      voci++;
      const d = new Date(base + ((week * 7 + dow) * 24 * 60) * 60000);
      add(week, dow, h, mi, 'Davide', 'PTT-' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + '-WA' + String(voci).padStart(4, '0') + '.opus (file allegato)');
    };
    const OKS = ['ok', 'ok', 'k', 'va bene', 'ok ok', 'ok', 'Ok', 'perfetto'];
    const confs = ['Io ci sono', 'Presente!', 'Ci sono, porto anche il pallone nuovo', 'Ci sono ma esco alle 23', 'Ci sono 💪', 'Ovvio che ci sono', 'Io sì, scarpe pronte'];
    const dom = ['Giovedì si gioca? Servono 10 persone', 'Giovedì calcetto confermato? Dobbiamo prenotare il campo', 'Domani... ehm giovedì, chi c\'è? Mi serve il numero entro stasera', 'Calcetto giovedì alle 21: chi ci sta?'];
    const pett = ['Chi porta le pettorine?', 'Qualcuno ha le pettorine? Le mie sono in lavatrice da un mese', 'Chi ha le pettorine questa settimana?'];
    const campo = ['Davide, hai poi pagato il campo?', 'Davide, mi mandi i 5 euro per il campo?', 'Davide, mi devi ancora il campo del 10: me lo mandi?'];
    const prima = ['Ragazzi alle 21 al solito campo, puntuali', 'Ci vediamo alle 20:45 davanti ai cancelli', 'Squadre alle 21: Luca e Chiara capitani come sempre', 'Meteo ok, campo ok, ci siete tutti?'];
    const dopo = ['Bella partita ragazzi, 7 a 6 al novantesimo', 'Chiara, quel gol era da Champions', 'Io ho i polpacci in sciopero', 'Grande serata, ci vediamo giovedì prossimo', 'Il terzo tempo da Gino è confermato?', 'Luca, il tuo tiro è ancora in orbita 😂', 'Domani mi alzo con la schiena fatta a Z', 'Foto di squadra? Le mando dopo'];
    const grazie = ['Grazie a te Marco, organizzi sempre tutto', 'Grazie ragazzi, bella serata', 'Grazie per le pettorine!', 'Grazie ❤️'];
    const rant = [
      'Ragazzi devo dire una cosa sull\'arbitro', 'cioè non è possibile', 'il rigore non c\'era', 'dico, non c\'era proprio', 'e poi il fuorigioco del secondo tempo',
      'lo ha visto tutto il campo', 'anche i lampioni lo hanno visto', 'una cosa vergognosa', 'giovedì prossimo porto il VAR', 'ne riparliamo'
    ];

    const NW = 7;
    add(0, 0, 8, 30, 'Marco', 'Ho creato il gruppo: benvenuti al Calcetto del giovedì! Qui si organizza tutto.');
    for (let w = 0; w < NW; w++) {
      const lost = (w === 3 || w === 4);
      // lunedi'
      add(w, 0, ri(9, 12), ri(0, 59), 'Marco', pick(dom));
      add(w, 0, ri(12, 13), ri(0, 59), 'Sara', pick(confs));
      add(w, 0, ri(13, 15), ri(0, 59), 'Luca', pick(confs));
      add(w, 0, ri(15, 17), ri(0, 59), 'Chiara', pick(confs));
      add(w, 0, 17, ri(0, 59), 'Elena', w % 2 ? 'Io ci sono! Buongiorno a tutti ❤️' : 'Ci sono, e grazie a Marco per l\'organizzazione');
      if (!lost) {
        add(w, 0, 18, ri(0, 20), 'Marco', '@Davide tu ci sei?');
        if (w === 1) { voce(w, 0, 19, 5); voce(w, 0, 19, 6); voce(w, 0, 19, 7); voce(w, 0, 19, 20); }
        if (r() < 0.6) { add(w, 1, ri(1, 3), ri(0, 59), 'Davide', pick(OKS)); } // dopo mezzanotte, nottambulo
        else add(w, 0, 23, ri(0, 40), 'Davide', pick(OKS));
      }
      // martedi'
      add(w, 1, 10, ri(0, 59), 'Elena', pick(pett));
      add(w, 1, 10, ri(0, 59) , 'Luca', w % 2 ? 'Le ho io' : 'Io, non preoccuparti');
      if (r() < 0.7) add(w, 1, 11, ri(0, 30), 'Elena', pick(grazie));
      if (!lost) add(w, 1, 15, ri(0, 59), 'Marco', pick(campo));
      add(w, 1, 16, ri(0, 59), 'Sara', pick(['Chi viene in macchina con me?', 'Posso dare un passaggio a due persone, chi c\'è?', 'Mi serve un passaggio di ritorno, qualcuno?']));
      add(w, 1, 16, ri(0, 59), 'Chiara', 'Io posso, abito di strada');
      if (!lost && r() < 0.5) add(w, 2, 9, ri(0, 59), 'Davide', pick(OKS));
      // mercoledi': scambi veloci tra gli altri, e Davide che parte e poi sparisce
      add(w, 2, 18, 40, 'Sara', 'Marco, hai prenotato il campo?');
      add(w, 2, 18, 42, 'Marco', 'Sì, prenotato per le 21. Grazie del promemoria Sara');
      add(w, 2, 18, 47, 'Luca', 'Qualcuno ha il numero del custode?');
      add(w, 2, 18, 49, 'Chiara', 'Ce l\'ho io, te lo mando');
      add(w, 2, 18, 51, 'Luca', 'Grazie Chiara, sei un mito');
      add(w, 2, 18, 55, 'Elena', 'Il custode ieri ha detto che le luci si spengono alle 23 precise');
      add(w, 2, 18, 58, 'Marco', 'Allora si gioca a ritmo serrato');
      if (!lost) {
        add(w, 2, 19, 0, 'Davide', 'Ragazzi ma l\'orario è sempre le 21?');
        add(w, 2, 19, 3, 'Marco', 'Sì Davide, 21 come sempre. Porti tu i palloni?');
        add(w, 2, 19, 5, 'Sara', 'E le pettorine le ha Luca, giusto?');
        add(w, 2, 19, 8, 'Luca', 'Giusto, ci penso io');
        add(w, 2, 19, 10, 'Elena', 'Ricordatevi i parastinchi!');
      }
      // giovedi'
      add(w, 3, 17, ri(0, 40), 'Marco', pick(prima));
      add(w, 3, 18, ri(0, 40), 'Luca', 'Arrivo con venti minuti di anticipo, giuro');
      add(w, 3, 19, ri(0, 40), 'Sara', 'Ci siamo, mi cambio e arrivo');
      if (!lost) {
        add(w, 3, 20, 55, 'Davide', 'sto arrivando');
        if (w === 2 || w === 5) { voce(w, 3, 20, 58); voce(w, 3, 20, 59); voce(w, 3, 21, 2); }
      }
      add(w, 3, 21, ri(5, 20), 'Chiara', 'Dov\'è Davide, scusate? Iniziamo senza?');
      if (!lost && r() < 0.5) add(w, 3, 21, ri(25, 50), 'Davide', 'ok');
      add(w, 3, 22, 40, 'Marco', pick(dopo));
      add(w, 3, 22, 52, 'Sara', pick(dopo));
      add(w, 3, 23, 5, 'Luca', pick(dopo));
      add(w, 3, 23, 15, 'Chiara', pick(['Chi viene da Gino a mangiare?', 'Terzo tempo da Gino? Ci state?', 'Vado da Gino, qualcuno mi segue?']));
      add(w, 3, 23, 20, 'Elena', 'Io sì, un bacione a tutti ❤️');
      if (w === 2) { rant.forEach((x, k) => add(w, 4, 0, 30 + k, 'Davide', x)); }
      if (!lost && w !== 2 && r() < 0.65) add(w, 4, 3, ri(0, 40), 'Davide', pick(['ma l\'arbitro era venduto', 'ragazzi domani si gioca?', 'ci sono giovedì', 'dormite?']));
      if (w === 5) { add(w, 4, 3, 12, 'Davide', 'raga'); add(w, 4, 3, 13, 'Davide', 'scusate l\'orario'); add(w, 4, 3, 14, 'Davide', 'ma ci sono giovedì?'); }
      // venerdi'
      add(w, 4, 10, ri(0, 59), 'Sara', pick(['Ragazzi mi sa che ho perso un parastinchi, qualcuno l\'ha visto?', 'Qualcuno ha trovato una felpa grigia nello spogliatoio?', 'Chi ha preso la mia borraccia?']));
      add(w, 4, 11, ri(0, 59), 'Chiara', 'Non l\'ho vista io');
      add(w, 4, 12, ri(0, 59), 'Luca', pick(['Controllo in macchina e vi dico', 'Probabile sia da Gino', 'Niente da me!']));
      if (!lost) {
        add(w, 4, 14, ri(0, 59), 'Marco', 'Davide ci confermi che ti ricordi di giovedì?');
        if (r() < 0.35) add(w, 5, 22, ri(0, 59), 'Davide', pick(OKS));
      }
      if (w === 3) add(w, 5, 13, 20, 'Elena', 'Ragazzi ma Davide sta bene? Nessuno lo sente da giorni');
      if (w === 3) add(w, 5, 13, 40, 'Marco', 'L\'ho chiamato, squilla a vuoto');
      if (w === 4) add(w, 5, 12, 10, 'Chiara', 'Davide, tutto bene? Rispondi quando puoi');
      if (w === 4) add(w, 5, 12, 30, 'Sara', 'Sparito dal 22, il suo account è un museo');
      if (w === 5) { add(w, 0, 2, 40, 'Davide', 'Eccomi, scusate, ho avuto da fare'); add(w, 0, 2, 41, 'Davide', 'grazie dei pensieri ❤️'); }
      // Davide ringrazia ogni tanto
      if (w === 0 || w === 6) add(w, 3, 23, 40, 'Davide', 'grazie a tutti, bella serata ❤️');
      // domande da Elena senza risposta di Davide
      if (!lost) add(w, 2, 12, ri(0, 40), 'Elena', pick(['Davide, riesci a portare tu i palloni?', 'Davide ma domani sei libero per il campo?']));
    }
    // un ultimo scambio normale
    add(6, 6, 18, 0, 'Marco', 'Ultimo avviso: giovedì prossimo si cambia campo, vi mando il link!');
    add(6, 6, 18, 2, 'Sara', 'Perfetto, grazie Marco');
    add(6, 6, 18, 9, 'Luca', 'Fatto');

    // la sparizione di Davide: elimino ogni suo messaggio tra settimana 3 lun e settimana 5 lun 02:00 (gia' escluso dai lost)
    M.sort((a, b) => a.t - b.t);
    // collasso: dopo la mezzanotte i messaggi stanno nel giorno dopo: ok (le chiavi sono tempo assoluto)
    let out = [];
    const f = t => { const d = new Date(t); return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ', ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); };
    out.push(f(M[0].t - 60000) + ' - I messaggi e le chiamate sono crittografati end-to-end. Nessuno al di fuori di questa chat, nemmeno WhatsApp, può leggerli o ascoltarli. Tocca per saperne di più.');
    out.push(f(M[0].t - 30000) + ' - Marco ha creato il gruppo "Calcetto del giovedì"');
    M.forEach(m => out.push(f(m.t) + ' - ' + m.who + ': ' + m.text));
    return out.join('\n') + '\n';
  }
  return { genera, nomeFile: 'Chat WhatsApp con Calcetto del giovedì.txt', imputatoConsigliato: 'Davide' };
});
