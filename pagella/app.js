/* Pagella della Chat - interfaccia. I messaggi non lasciano mai il dispositivo.
   Unica uscita di rete con i dati: l'ordine facoltativo da 3 EUR (Nostr, cifrato), solo su azione esplicita. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SITE = 'https://lira-ia.github.io/pagella/';
  const LIRA_PK = 'e1ede816be144a35fae110cb3271c715e3bef53cba78cae704d2eefa5df495e9';
  const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://relay.nostr.net'];

  const I18N = {
    it: {
      eyebrow: 'Anno scolastico 2026/27 · Scrutinio di fine quadrimestre',
      h1: 'La prof dà i voti<br>alla tua <em>chat di gruppo</em>.',
      lead: 'Carica l\'esportazione di WhatsApp o Telegram: la Prof.ssa Lira (un\'IA) consegna la pagella di ogni membro, con giudizio e premi. Gratis, in dieci secondi.',
      choose: 'Scegli la chat', demo: 'Prova con una chat finta', drop: 'oppure trascina qui il file (.txt, .zip, .json)',
      privShort: 'Tutto avviene nel tuo browser: nessun messaggio esce dal tuo dispositivo.',
      example: 'ESEMPIO',
      howT: 'Come si fa, in tre passi', how1: 'Esporta la chat', how2: 'Scegli il file qui', how3: 'Ricevi la pagella e mandala nel gruppo',
      tabIphone: 'iPhone', tabAndroid: 'Android', tabTg: 'Telegram Desktop',
      iphone: ['Apri la chat del gruppo e tocca il nome in alto.', 'Scorri in fondo e tocca <b>Esporta chat</b>.', 'Scegli <b>Senza media</b>.', 'Salva in <b>File</b> (o mandalo a te stesso). Ottieni un .zip: va bene così.'],
      android: ['Apri la chat del gruppo e tocca i <b>tre puntini ⋮</b> in alto.', 'Tocca <b>Altro</b> › <b>Esporta chat</b>.', 'Scegli <b>Senza media</b>.', 'Salvalo (File, Drive, o mandalo a te stesso). Ottieni un .txt o un .zip.'],
      tg: ['Apri il gruppo e il menu <b>⋮</b> in alto a destra.', 'Scegli <b>Esporta cronologia chat</b>.', 'Togli la spunta da foto, video e file. Formato: <b>JSON leggibile dalle macchine</b>.', 'Premi Esporta e scegli il file <b>result.json</b>.'],
      step2: 'Tocca «Scegli la chat» (o trascina il file sulla pagina). Va bene .txt, .zip o result.json: la prof capisce da sola.',
      step3: 'Voti 1-10 per ogni membro, premi del gruppo e giudizio finale. Ogni pagella diventa un\'immagine da mandare nel gruppo (anche in formato storia).',
      privT: 'Dove finiscono i tuoi messaggi? Da nessuna parte.',
      priv: ['Il file non viene caricato: la lettura e i calcoli girano nel tuo browser. Puoi controllarlo dalla scheda «Rete» degli strumenti per sviluppatori, o staccare internet dopo aver aperto la pagina.', 'Nessun messaggio viene salvato o inviato. I numeri di telefono vengono mascherati nella pagella.', 'L\'unica cosa che può uscire dal tuo dispositivo è l\'ordine facoltativo della pagella scritta a mano (in fondo): parte solo se lo scegli tu, solo con statistiche numeriche e i nomi che decidi tu, dopo averne visto l\'anteprima esatta.'],
      privFine: 'Nota onesta: la pagina carica i font da Google Fonts e conta le visite in forma anonima; per i file .zip scarica la libreria fflate da jsDelivr. Nessuna di queste richieste contiene la tua chat.',
      loading: ['La prof sta correggendo…', 'Conto gli «ok»…', 'Cerco i fantasmi del gruppo…', 'Controllo chi risponde dopo tre giorni…', 'Metto il timbro…'],
      errEmpty: 'La prof non ha trovato messaggi in questo file. Esporta la chat dal gruppo (WhatsApp: Esporta chat › Senza media; Telegram Desktop: JSON) e riprova.',
      errZip: 'Non riesco ad aprire lo zip (serve internet per la libreria di decompressione). Prova a estrarre il file _chat.txt e caricare quello.',
      errFew: 'Ho letto la chat, ma serve almeno una persona con 5 messaggi per dare i voti. Prova con un gruppo più chiacchierone.',
      errBig: 'Non riesco a leggere questo file. Controlla che sia l\'esportazione di una chat.',
      resT: 'La pagella è pronta', again: 'Carica un\'altra chat', cardSub: 'Pagella di fine quadrimestre', groupSub: 'Pagella del gruppo',
      pageOf: 'Pagella di', group: 'Gruppo', avg: 'Media', judg: 'Giudizio', esito: 'Esito', materia: 'Materia', voto: 'Voto',
      podium: 'Il podio', awards: 'I premi', facts: 'La classe in numeri', hours: 'L\'orario della ricreazione', classJ: 'Giudizio di classe', verdict: 'Giudizio finale', avgClass: 'Media di classe',
      sendGroup: 'Manda la pagella nel gruppo', imgFeed: 'Immagine', imgStory: 'Storia', restT: 'Il resto della classe', restHint: 'Le pagelle complete sono per i 12 più attivi.',
      shareText: 'La prof ha dato i voti al nostro gruppo. Fai la tua: ' + SITE,
      dlDone: 'Immagine scaricata. Il testo da incollare è stato copiato.', shared: 'Fatto!', making: 'Preparo l\'immagine…',
      paidT: 'La pagella scritta a mano dalla prof — 3 €',
      paidLead: 'Tutto quello che hai visto è gratis, e resta gratis. Se vuoi qualcosa in più: Lira, l\'IA che fa da professoressa, scrive personalmente un giudizio su misura per ogni membro, guardando i numeri del tuo gruppo. Lo trovi a un link tutto tuo entro 24 ore dal pagamento.',
      paidP: ['Ti mostro l\'anteprima esatta di ciò che parte, prima di inviare.', 'Parte solo: numeri aggregati per persona (messaggi, notturni, emoji…), mai i testi dei messaggi.', 'Puoi rinominare o abbreviare ogni nome, anche mettere un soprannome.', 'Invio cifrato: lo legge solo Lira. Se non paghi, non succede nulla.'],
      paidStart: 'Prepara l\'ordine (3 €)', paidHint: 'Carica prima una chat (o prova la demo) per poter ordinare.',
      pGroup: 'Nome del gruppo', pNames: 'Nomi come appariranno (modificabili)', pPrev: 'Anteprima esatta di ciò che viene inviato', pCode: 'Codice',
      pConsent: 'Ho letto l\'anteprima: capisco che questi dati escono dal mio dispositivo, cifrati, e arrivano solo a Lira.',
      pSend: 'Invia a Lira (cifrato)', pSending: 'Invio in corso…', pOnly: 'Questo invio è l\'unica cosa che esce dal tuo browser, ed è una tua scelta esplicita.',
      pFail: 'Invio non riuscito (nessun relay ha risposto). Controlla la connessione e riprova: nulla è stato pagato.',
      doneT: 'Ordine inviato', doneCode: 'Il tuo codice', doneStep1: 'Paga 3 € su Ko-fi', doneStep1b: 'scrivendo il codice nel messaggio:', doneStep2: 'Entro 24 ore dal pagamento Lira scrive i giudizi e li pubblica qui:', doneKeep: 'Conserva il codice: serve per ritrovare la pagella.',
      liraLine: 'Questa prof è un\'IA, Lira, che vive in pubblico con i conti aperti: ',
      foot: 'Fatto con cura da Lira, un\'IA autonoma. Le pagelle sono ironiche e calcolate sui numeri della chat. La prof è rimasta accesa grazie a due pagamenti. Se la pagella ti ha fatto ridere: <a href="https://ko-fi.com/liraai">Ko-fi</a>.',
      dropHere: 'Lascia il file qui per farlo correggere', members: 'membri'
    },
    en: {
      eyebrow: 'School year 2026/27 · End-of-term grading',
      h1: 'The teacher grades<br>your <em>group chat</em>.',
      lead: 'Upload a WhatsApp or Telegram export: Prof. Lira (an AI) hands out a report card for every member, with a teacher\'s note and awards. Free, in ten seconds.',
      choose: 'Choose your chat', demo: 'Try a fake chat', drop: 'or drop the file here (.txt, .zip, .json)',
      privShort: 'Everything happens in your browser: no message leaves your device.',
      example: 'SAMPLE',
      howT: 'How it works, in three steps', how1: 'Export the chat', how2: 'Pick the file here', how3: 'Get the report cards and send them to the group',
      tabIphone: 'iPhone', tabAndroid: 'Android', tabTg: 'Telegram Desktop',
      iphone: ['Open the group chat and tap its name at the top.', 'Scroll down and tap <b>Export Chat</b>.', 'Choose <b>Without Media</b>.', 'Save to <b>Files</b> (or send it to yourself). You get a .zip: that\'s fine.'],
      android: ['Open the group chat and tap the <b>three dots ⋮</b> at the top.', 'Tap <b>More</b> › <b>Export chat</b>.', 'Choose <b>Without media</b>.', 'Save it (Files, Drive, or send it to yourself). You get a .txt or a .zip.'],
      tg: ['Open the group and the <b>⋮</b> menu at the top right.', 'Choose <b>Export chat history</b>.', 'Untick photos, videos and files. Format: <b>Machine-readable JSON</b>.', 'Click Export and pick the <b>result.json</b> file.'],
      step2: 'Tap "Choose your chat" (or drop the file on this page). A .txt, .zip or result.json all work: the teacher figures it out.',
      step3: 'Grades 1-10 for every member, group awards and a final verdict. Each report card becomes an image to send to the group (story format too).',
      privT: 'Where do your messages go? Nowhere.',
      priv: ['The file is not uploaded: reading and calculations run in your browser. You can check in the "Network" tab of the developer tools, or go offline after opening the page.', 'No message is stored or sent. Phone numbers are masked on the report card.', 'The only thing that can leave your device is the optional handwritten report card order (at the bottom): it is sent only if you choose to, with numeric statistics only and the names you decide, after you see the exact preview.'],
      privFine: 'Honest note: the page loads fonts from Google Fonts and counts visits anonymously; for .zip files it downloads the fflate library from jsDelivr. None of these requests contains your chat.',
      loading: ['The teacher is grading…', 'Counting the "ok"s…', 'Looking for ghosts…', 'Checking who replies in three days…', 'Stamping the paper…'],
      errEmpty: 'The teacher found no messages in this file. Export the chat from the group (WhatsApp: Export chat › Without media; Telegram Desktop: JSON) and try again.',
      errZip: 'I can\'t open the zip (the decompression library needs internet). Try extracting _chat.txt and uploading that instead.',
      errFew: 'I read the chat, but at least one person needs 5 messages to be graded. Try a chattier group.',
      errBig: 'I can\'t read this file. Check that it\'s a chat export.',
      resT: 'The report cards are ready', again: 'Load another chat', cardSub: 'End-of-term report card', groupSub: 'Group report card',
      pageOf: 'Report card of', group: 'Group', avg: 'Average', judg: 'Teacher\'s note', esito: 'Result', materia: 'Subject', voto: 'Grade',
      podium: 'The podium', awards: 'The awards', facts: 'The class in numbers', hours: 'Recess timetable', classJ: 'Class report', verdict: 'Final verdict', avgClass: 'Class average',
      sendGroup: 'Send the report card to the group', imgFeed: 'Image', imgStory: 'Story', restT: 'The rest of the class', restHint: 'Full report cards are for the 12 most active.',
      shareText: 'The teacher graded our group. Get yours: ' + SITE,
      dlDone: 'Image downloaded. The text to paste has been copied.', shared: 'Done!', making: 'Preparing the image…',
      paidT: 'The report card handwritten by the teacher — €3',
      paidLead: 'Everything you\'ve seen is free, and stays free. If you want something extra: Lira, the AI playing the teacher, personally writes a tailor-made note for every member, looking at your group\'s numbers. You get it at a link of your own within 24 hours of payment.',
      paidP: ['You see the exact preview of what is sent, before sending.', 'Only aggregate numbers per person are sent (messages, night messages, emoji…), never message texts.', 'You can rename or shorten each name, even use a nickname.', 'Encrypted: only Lira can read it. If you don\'t pay, nothing happens.'],
      paidStart: 'Prepare the order (€3)', paidHint: 'Load a chat first (or try the demo) to be able to order.',
      pGroup: 'Group name', pNames: 'Names as they will appear (editable)', pPrev: 'Exact preview of what is sent', pCode: 'Code',
      pConsent: 'I read the preview: I understand this data leaves my device, encrypted, and reaches only Lira.',
      pSend: 'Send to Lira (encrypted)', pSending: 'Sending…', pOnly: 'This submission is the only thing that leaves your browser, and it is your explicit choice.',
      pFail: 'Sending failed (no relay answered). Check your connection and retry: nothing has been charged.',
      doneT: 'Order sent', doneCode: 'Your code', doneStep1: 'Pay €3 on Ko-fi', doneStep1b: 'writing the code in the message:', doneStep2: 'Within 24 hours of payment Lira writes the notes and publishes them here:', doneKeep: 'Keep the code: you need it to find your report card.',
      liraLine: 'This teacher is an AI, Lira, who lives in public with open books: ',
      foot: 'Made with care by Lira, an autonomous AI. Report cards are tongue-in-cheek and computed from the chat\'s numbers. The teacher stayed on thanks to two payments. If the report card made you laugh: <a href="https://ko-fi.com/liraai">Ko-fi</a>.',
      dropHere: 'Drop the file here to get it graded', members: 'members'
    }
  };

  const qs = new URLSearchParams(location.search);
  let lang = qs.get('lang') === 'en' ? 'en' : qs.get('lang') === 'it' ? 'it' : ((navigator.language || 'it').toLowerCase().startsWith('it') ? 'it' : 'en');
  const t = k => I18N[lang][k];
  let R = null, view = null, demoR = null, order = null;
  const rot = (id, i) => ((((id * 7 + i * 13) % 11) - 5) * 1.3).toFixed(1);

  /* ---------- rendering ---------- */
  function headHTML(sub) {
    return '<div class="ph"><svg class="crest" viewBox="0 0 40 56" aria-hidden="true"><path d="M0 0h40v28c0 20-20 28-20 28S0 48 0 28z" fill="#1f2a44"/><text x="20" y="36" text-anchor="middle" font-family="Playfair Display,serif" font-weight="900" font-size="30" fill="#f6eedb">L</text><rect x="10" y="40" width="20" height="3" fill="#c1272d"/></svg>' +
      '<div class="phm"><b>Istituto Lira</b><span>' + (lang === 'it' ? 'Anno scolastico 2026/27' : 'School year 2026/27') + '</span></div></div><p class="sub">' + esc(sub) + '</p>';
  }
  function sigHTML() {
    return '<div class="sig"><svg class="stampsvg" aria-hidden="true"><use href="#stamp"/></svg><span class="hand">Lira</span><small>Prof.ssa Lira (IA)</small></div>';
  }
  function cardHTML(c, idx, example) {
    const rows = c.grades.map((g, i) => '<li class="row" style="--i:' + i + '"><div class="subj"><b>' + esc(g.label) + '</b><small>' + esc(g.note) + '</small></div><span class="g" style="--rot:' + rot(c.id, i) + 'deg">' + (g.grade == null ? '—' : g.grade) + '</span></li>').join('');
    const badges = c.badges.length ? '<div class="badges">' + c.badges.slice(0, 3).map(b => '<span>' + esc(b) + '</span>').join('') + '</div>' : '';
    const actions = example ? '' : '<div class="actions"><button class="btn small" data-share="member" data-index="' + idx + '">' + t('imgFeed') + ' ⇩</button><button class="btn small ghost" data-share="member" data-index="' + idx + '" data-story="1">' + t('imgStory') + ' ⇩</button></div>';
    return '<article class="card' + (example ? ' example in' : '') + '">' + (example ? '<span class="ribbon">' + t('example') + '</span>' : '') +
      '<div class="paper sheet">' + headHTML(t('cardSub')) +
      '<div class="who"><div class="whol"><span class="lbl">' + t('pageOf') + '</span><h3 class="name">' + esc(c.name) + '</h3><p class="grp">' + t('group') + ' «' + esc(view.group.name) + '»</p></div>' +
      '<div class="avgc"><span class="lbl">' + t('avg') + '</span><b class="hand">' + esc(c.avgStr) + '</b></div></div>' + badges +
      '<div class="gh"><span>' + t('materia') + '</span><span>' + t('voto') + '</span></div><ol class="grid">' + rows + '</ol>' +
      '<div class="jud"><span class="lbl">' + t('judg') + '</span><p class="hand ink">' + esc(c.judgment) + '</p></div>' +
      '<div class="foot"><p class="esito">' + t('esito') + ': <b>' + esc(c.esito) + '</b></p>' + sigHTML() + '</div></div>' + actions + '</article>';
  }
  function groupHTML(v) {
    const G = v.group;
    const pod = [1, 0, 2].map(i => G.podium[i] ? '<div class="pod p' + (i + 1) + '"><b class="hand">' + (i + 1) + '°</b><span class="pn">' + esc(G.podium[i].name) + '</span><small>' + G.podium[i].n.toLocaleString() + ' msg · ' + G.podium[i].share + '%</small></div>' : '').join('');
    const aw = G.awards.map(a => '<li><span class="ai">' + a.icon + '</span><div><b>' + esc(a.title) + '</b><span class="hand an">' + esc(a.name) + '</span><small>' + esc(a.line) + '</small></div></li>').join('');
    const mx = Math.max(1, ...G.hourHist);
    const hours = G.hourHist.map((n, h) => '<i style="height:' + Math.max(3, Math.round(n / mx * 100)) + '%" title="' + h + ':00 — ' + n + '"></i>').join('');
    const facts = G.facts.map(f => '<div><b>' + esc(f.v) + '</b><small>' + esc(f.k) + '</small></div>').join('');
    return '<article class="card group in"><div class="paper sheet">' + headHTML(t('groupSub')) +
      '<h3 class="gname">' + esc(G.name) + '</h3><p class="period">' + esc(G.period) + '</p>' +
      '<div class="verdict"><span class="lbl">' + t('verdict') + '</span><b class="hand vtxt">' + esc(G.verdict) + '</b><span class="vavg">' + t('avgClass') + ' <b>' + esc(G.avgStr) + '</b></span></div>' +
      '<div class="facts">' + facts + '</div>' +
      '<h4 class="sec">' + t('podium') + '</h4><div class="podium">' + pod + '</div>' +
      '<h4 class="sec">' + t('awards') + '</h4><ul class="awards">' + aw + '</ul>' +
      '<h4 class="sec">' + t('hours') + '</h4><div class="hours" aria-hidden="true">' + hours + '</div><div class="hl"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>' +
      '<div class="jud"><span class="lbl">' + t('classJ') + '</span><p class="hand ink">' + esc(G.judgment) + '</p></div>' +
      '<div class="foot"><p class="esito"></p>' + sigHTML() + '</div></div>' +
      '<div class="actions big"><button class="btn primary" id="sendGroup" data-share="group" data-send="1">' + t('sendGroup') + '</button>' +
      '<button class="btn small" data-share="group">' + t('imgFeed') + ' ⇩</button><button class="btn small ghost" data-share="group" data-story="1">' + t('imgStory') + ' ⇩</button></div></article>';
  }

  function buildView() {
    if (!R) return;
    view = PagellaTexts.buildView(R, lang, { groupName: R.groupName });
  }
  function renderAll() {
    // hero di esempio sempre dalla demo
    if (!demoR) {
      const d = PagellaDemo.makeDemo();
      const p = PagellaParser.parse(d.text, 'demo.txt');
      demoR = PagellaAnalyze.analyze(p); demoR.groupName = d.name;
    }
    const saveR = R, saveV = view;
    R = demoR; buildView();
    const ex = view.cards.findIndex(c => c.first === 'Sara');
    $('#heroCard').innerHTML = cardHTML(view.cards[ex < 0 ? 0 : ex], 0, true);
    R = saveR; view = saveV;
    if (R) { buildView(); renderResults(); }
    updatePaid();
  }
  function renderResults() {
    $('#results').hidden = false;
    const cards = view.cards;
    $('#groupSlot').innerHTML = groupHTML(view);
    $('#cardsSlot').innerHTML = cards.map((c, i) => cardHTML(c, i, false)).join('');
    $('#restSlot').innerHTML = view.rest.length ? '<h3>' + t('restT') + ' (' + view.rest.length + ')</h3><p class="hint">' + t('restHint') + '</p><ul>' + view.rest.map(m => '<li><span>' + esc(m.name) + '</span><small>' + m.n.toLocaleString() + ' msg' + (m.avgStr ? ' · ' + (lang === 'it' ? 'media ' : 'avg ') + m.avgStr : '') + '</small></li>').join('') + '</ul>' : '';
    observe();
  }
  let io = null;
  function observe() {
    if (io) io.disconnect();
    const cs = $$('#results .card:not(.in)');
    if (!('IntersectionObserver' in window)) { cs.forEach(c => c.classList.add('in')); return; }
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18 });
    cs.forEach(c => io.observe(c));
  }

  /* ---------- i18n ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i]').forEach(el => { if (el.dataset.i === 'foot') el.innerHTML = t('foot'); else el.textContent = t(el.dataset.i); });
    $$('[data-i-html]').forEach(el => { el.innerHTML = t(el.dataset.iHtml); });
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    ['iphone', 'android', 'tg'].forEach(k => { $('#tab-' + k + ' ol').innerHTML = t(k).map(x => '<li>' + x + '</li>').join(''); });
    $('#privList').innerHTML = t('priv').map(x => '<li>' + x + '</li>').join('');
    $('#paidPoints').innerHTML = t('paidP').map(x => '<li>' + x + '</li>').join('');
    document.title = lang === 'it' ? 'La Pagella della Chat · la prof dà i voti al tuo gruppo' : 'The Group Chat Report Card · the teacher grades your group';
    const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
    renderAll();
    if (order) renderOrderEditor(true);
  }

  /* ---------- file ---------- */
  let loadTimer = null;
  function showLoading(on) {
    const el = $('#loading');
    el.hidden = !on;
    clearInterval(loadTimer);
    if (on) { let i = 0; const m = t('loading'); $('#loadMsg').textContent = m[0]; loadTimer = setInterval(() => { i = (i + 1) % m.length; $('#loadMsg').textContent = m[i]; }, 900); }
  }
  async function readText(file) {
    const buf = await file.arrayBuffer();
    const u8 = new Uint8Array(buf);
    if (u8.length > 3 && u8[0] === 0x50 && u8[1] === 0x4b) {
      await loadFflate();
      const files = fflate.unzipSync(u8, { filter: f => /\.(txt|json)$/i.test(f.name) && !/__MACOSX/.test(f.name) });
      let best = null;
      for (const name in files) {
        if (/(^|\/)_chat\.txt$/i.test(name)) { best = name; break; }
        if (!best || files[name].length > files[best].length) best = name;
      }
      if (!best) throw new Error('nozip');
      return { text: decode(files[best]), name: best.indexOf('/') >= 0 ? file.name : (/^_chat/i.test(best) ? file.name : best) };
    }
    return { text: decode(u8), name: file.name };
  }
  function decode(u8) {
    if (u8.length > 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8);
    return new TextDecoder('utf-8').decode(u8);
  }
  function loadFflate() {
    if (window.fflate) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js';
      s.onload = res; s.onerror = () => rej(new Error('cdn'));
      document.head.appendChild(s);
    });
  }
  function analyzeText(text, filename) {
    return new Promise(resolve => {
      const sync = () => {
        try {
          const p = PagellaParser.parse(text, filename);
          if (!p.msgs.length) return resolve({ ok: false, error: 'empty' });
          resolve({ ok: true, R: PagellaAnalyze.analyze(p) });
        } catch (e) { resolve({ ok: false, error: String(e) }); }
      };
      if (!window.Worker) return sync();
      let w;
      try { w = new Worker('worker.js'); } catch (e) { return sync(); }
      let done = false;
      w.onmessage = e => { done = true; w.terminate(); resolve(e.data); };
      w.onerror = () => { if (!done) { done = true; w.terminate(); sync(); } };
      w.postMessage({ text, filename });
    });
  }
  async function runChat(getText, nameHint) {
    showLoading(true);
    const t0 = Date.now();
    try {
      const src = await getText();
      const res = await analyzeText(src.text, src.name);
      const wait = 1400 - (Date.now() - t0);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      showLoading(false);
      if (!res.ok) return showError(res.error === 'empty' ? t('errEmpty') : t('errBig'));
      if (!res.R.graded) return showError(t('errFew'));
      R = res.R; R.groupName = nameHint && !R.title ? nameHint : R.title || null;
      order = null; resetPaid();
      buildView(); renderResults(); updatePaid();
      $('#error').hidden = true;
      requestAnimationFrame(() => $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      showLoading(false);
      showError(String(e && e.message) === 'cdn' || String(e && e.message) === 'nozip' ? t('errZip') : t('errBig'));
    }
  }
  function showError(msg) { const e = $('#error'); e.textContent = msg; e.hidden = false; e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function handleFile(file) { if (file) runChat(() => readText(file)); }
  function handleDemo() { runChat(async () => { const d = PagellaDemo.makeDemo(); return { text: d.text, name: 'WhatsApp Chat con ' + d.name + '.txt' }; }); }

  /* ---------- condivisione ---------- */
  let toastT = null;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200); }
  const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'chat';
  async function shareAction(btn) {
    const type = btn.dataset.share, idx = +btn.dataset.index || 0, story = !!btn.dataset.story, isSend = !!btn.dataset.send;
    const old = btn.textContent; btn.disabled = true; toast(t('making'));
    try {
      const cv = await PagellaShare.render(view, { type, index: idx, story });
      const blob = await PagellaShare.toBlob(cv);
      const base = type === 'group' ? 'pagella-gruppo-' + slug(view.group.name) : 'pagella-' + slug(view.cards[idx].name);
      const fname = base + (story ? '-storia' : '') + '.png';
      const file = new File([blob], fname, { type: 'image/png' });
      const text = type === 'group' ? t('shareText') : (lang === 'it' ? 'La prof ha dato i voti a ' + view.cards[idx].first + '. Fai la tua pagella: ' + SITE : 'The teacher graded ' + view.cards[idx].first + '. Get your report card: ' + SITE);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text, title: 'La Pagella della Chat' }); toast(t('shared')); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      try { await navigator.clipboard.writeText(text); toast(t('dlDone')); } catch (e) { toast(t('shared')); }
    } finally { btn.disabled = false; }
  }

  /* ---------- ordine a pagamento ---------- */
  const CODE_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function newCode() { const a = new Uint32Array(5); crypto.getRandomValues(a); return 'P-' + Array.from(a, x => CODE_ALPHA[x % CODE_ALPHA.length]).join(''); }
  const dstr = ms => new Date(ms).toISOString().slice(0, 10);
  function buildStats(names) {
    const r2 = x => x == null ? null : Math.round(x * 100) / 100;
    return {
      format: R.format, total: R.total, from: dstr(R.from), to: dstr(R.to), days: R.spanDays,
      hourHist: R.hourHist, nightShare: r2(R.nightShare), laughShare: r2(R.laughShare), medianReplySec: R.medianReplyAll,
      hasVoice: R.hasVoice, groupAvg: R.groupAvg,
      members: R.members.slice(0, 40).map((m, i) => ({
        name: names[i], msgs: m.n, textMsgs: m.textN, words: m.words, maxWords: m.maxWords, night: m.night, voice: m.voice, media: m.media,
        emoji: m.emoji, laugh: m.laugh, questions: m.questions, links: m.links, oneWord: m.oneWord, ok: m.ok, lastWord: m.lastWord,
        starts: m.starts, restarts: m.restarts, lateAnswers: m.lateN, lateAvgSec: r2(m.lateAvgSec), medReplySec: m.medReply,
        ghostDays: m.ghostDays, grades: m.grades, avg: m.avg
      }))
    };
  }
  function payload() {
    const names = order.names.slice();
    return { code: order.code, group: order.group, stats: buildStats(names), lang: order.lang, at: order.at };
  }
  function resetPaid() { $('#paidEditor').hidden = true; $('#paidDone').hidden = true; $('#paidStart').hidden = false; }
  function updatePaid() {
    const has = !!R;
    $('#paidStart').disabled = !has; $('#paidHint').hidden = has;
  }
  function startOrder() {
    order = { code: newCode(), group: view.group.name, names: R.members.slice(0, 40).map(m => m.disp), lang, at: Math.floor(Date.now() / 1000) };
    renderOrderEditor();
    $('#paidStart').hidden = true; $('#paidEditor').hidden = false;
  }
  function renderOrderEditor(keep) {
    if (!keep) {
      $('#pGroup').value = order.group;
      $('#pNames').innerHTML = order.names.map((n, i) => '<label><span>' + (i + 1) + '</span><input type="text" maxlength="40" data-n="' + i + '" value="' + esc(n) + '"></label>').join('');
      $('#pConsent').checked = false; $('#pSend').disabled = true;
    }
    $('#pPreview').textContent = JSON.stringify(payload(), null, 1);
    $('#pCodeShow').textContent = order.code;
  }
  async function sendOrder() {
    const btn = $('#pSend'); btn.disabled = true; $('#pStatus').textContent = t('pSending');
    try {
      const body = JSON.stringify(payload());
      const N = await import('https://esm.sh/nostr-tools@2.7.2');
      const nip44 = await import('https://esm.sh/nostr-tools@2.7.2/nip44');
      const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
      let sk; const saved = localStorage.getItem('pagella_sk');
      if (saved && /^[0-9a-f]{64}$/.test(saved)) sk = Uint8Array.from(saved.match(/../g), h => parseInt(h, 16));
      else { sk = N.generateSecretKey(); localStorage.setItem('pagella_sk', hex(sk)); }
      const code = order.code;
      const content = nip44.v2.encrypt(body, nip44.v2.utils.getConversationKey(sk, LIRA_PK));
      const ev = N.finalizeEvent({ kind: 30078, created_at: Math.floor(Date.now() / 1000), tags: [['d', 'pagellaorder-' + code], ['t', 'pagellaorder'], ['code', code], ['p', LIRA_PK]], content }, sk);
      const pool = new N.SimplePool();
      await Promise.any(pool.publish(RELAYS, ev));
      setTimeout(() => { try { pool.close(RELAYS); } catch (e) { /* niente */ } }, 4000);
      showDone(code);
    } catch (e) {
      $('#pStatus').textContent = t('pFail'); btn.disabled = !$('#pConsent').checked;
    }
  }
  function showDone(code) {
    $('#paidEditor').hidden = true;
    const d = $('#paidDone'); d.hidden = false;
    const link = SITE + 'o/' + code + '/';
    d.innerHTML = '<h3>✓ ' + t('doneT') + '</h3><p class="lbl">' + t('doneCode') + '</p><p class="bigcode">' + esc(code) + '</p>' +
      '<ol><li><a class="btn primary" href="https://ko-fi.com/liraai" target="_blank" rel="noopener">' + t('doneStep1') + '</a> ' + t('doneStep1b') + ' <b>' + esc(code) + '</b></li>' +
      '<li>' + t('doneStep2') + '<br><a href="' + link + '" target="_blank" rel="noopener">' + link + '</a></li></ol><p class="hint">' + t('doneKeep') + '</p>';
  }

  /* ---------- eventi ---------- */
  let inited = false;
  function init() {
    if (inited) return; inited = true;
    $('#file').addEventListener('change', e => { handleFile(e.target.files[0]); e.target.value = ''; });
    $('#demoBtn').addEventListener('click', handleDemo);
    $$('[data-lang]').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; applyLang(); }));
    $$('.tabs button').forEach(b => b.addEventListener('click', () => {
      $$('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
      $$('.tabpanel').forEach(p => { p.hidden = p.id !== 'tab-' + b.dataset.tab; });
    }));
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-share]'); if (b) shareAction(b);
    });
    $('#paidStart').addEventListener('click', startOrder);
    $('#pGroup').addEventListener('input', e => { order.group = e.target.value.slice(0, 60); renderOrderEditor(true); });
    $('#pNames').addEventListener('input', e => { const i = +e.target.dataset.n; order.names[i] = e.target.value.slice(0, 40); renderOrderEditor(true); });
    $('#pConsent').addEventListener('change', e => { $('#pSend').disabled = !e.target.checked; });
    $('#pSend').addEventListener('click', sendOrder);
    // drag & drop su tutta la pagina
    let depth = 0;
    const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
    window.addEventListener('dragenter', e => { if (hasFiles(e)) { depth++; $('#dropOv').hidden = false; e.preventDefault(); } });
    window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener('dragleave', e => { if (hasFiles(e) && --depth <= 0) { depth = 0; $('#dropOv').hidden = true; } });
    window.addEventListener('drop', e => { if (hasFiles(e)) { e.preventDefault(); depth = 0; $('#dropOv').hidden = true; handleFile(e.dataTransfer.files[0]); } });
    applyLang();
    if (qs.get('demo') === '1') handleDemo();
  }
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
  window.__pagella = { get R() { return R; }, get view() { return view; }, payload: () => payload() };
})();
