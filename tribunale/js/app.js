/* Il Tribunale della Chat - interfaccia. Tutto in locale: nessuna richiesta di rete con dati della chat. */
(function () {
  'use strict';
  const SITO_URL = 'https://lira-ia.github.io/tribunale/';
  const $ = s => document.querySelector(s);
  const M = window.TribunaleMotore, P = window.PagellaParser, I = window.TribunaleImmagine;
  let parsed = null, fileName = '', imputato = -1, seed = 0, esito = null;

  function schermo(id) {
    document.querySelectorAll('.schermo').forEach(e => e.classList.toggle('attivo', e.id === id));
    window.scrollTo(0, 0);
  }
  function errore(msg) { const e = $('#errore'); e.textContent = msg; e.hidden = !msg; }
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  function decode(u8) {
    if (u8.length > 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8);
    return new TextDecoder('utf-8').decode(u8);
  }
  async function leggiFile(file) {
    const u8 = new Uint8Array(await file.arrayBuffer());
    if (u8.length > 3 && u8[0] === 0x50 && u8[1] === 0x4b) { // zip
      if (!window.fflate) throw new Error('zip');
      const files = fflate.unzipSync(u8, { filter: f => /\.(txt|json)$/i.test(f.name) && !/__MACOSX/.test(f.name) });
      let best = null;
      for (const n in files) {
        if (/(^|\/)_chat\.txt$/i.test(n)) { best = n; break; }
        if (!best || files[n].length > files[best].length) best = n;
      }
      if (!best) throw new Error('zip');
      return { text: decode(files[best]), name: file.name };
    }
    return { text: decode(u8), name: file.name };
  }

  function caricaTesto(text, name) {
    errore('');
    let p;
    try { p = P.parse(text, name); } catch (e) { p = null; }
    if (!p || p.msgs.length < 20 || p.authors.length < 2) {
      errore('Non riesco a leggere questa chat: servono almeno 20 messaggi e 2 partecipanti, in un export di WhatsApp (.txt o .zip).');
      return;
    }
    parsed = p; fileName = name;
    mostraScelta();
  }

  function mostraScelta() {
    $('#chat-titolo').textContent = (parsed.title ? parsed.title + ' · ' : '') + parsed.msgs.length + ' messaggi, ' + parsed.authors.length + ' persone';
    const box = $('#lista-imputati'); box.textContent = '';
    M.autoriInfo(parsed).forEach(a => {
      const b = el('button', 'imp'); b.type = 'button';
      b.appendChild(el('b', null, a.name)); b.appendChild(el('small', null, a.n + ' messaggi'));
      b.addEventListener('click', () => avvia(a.id, 0));
      box.appendChild(b);
    });
    schermo('s-scelta');
  }

  function avvia(di, sd) {
    imputato = di; seed = sd;
    schermo('s-aula');
    $('#processo').hidden = true; $('#ingresso').hidden = false;
    setTimeout(() => {
      esito = M.processo(parsed, di, seed);
      render(esito);
      $('#ingresso').hidden = true; $('#processo').hidden = false;
      osserva();
      disegnaCanvas();
      window.scrollTo(0, 0);
    }, 1300);
  }

  function fq(p) { return p.testo; }
  function provaLi(p) {
    const li = el('li');
    if (p.prima) {
      const a = el('span', null, p.primaChi + ': '); a.appendChild(el('span', 'q', '«' + p.prima + '»'));
      li.appendChild(a); li.appendChild(document.createElement('br'));
    }
    li.appendChild(el('span', null, (p.chi || '') + ': '));
    li.appendChild(el('span', 'q', p.testo.charAt(0) === '[' ? p.testo : '«' + p.testo + '»'));
    li.appendChild(el('span', 'meta', M.fDataOra(p.quando) + (p.nota ? ' · ' + p.nota : '')));
    return li;
  }

  function render(e) {
    $('#p-num').textContent = e.numero;
    $('#p-nome').textContent = e.imputato;
    $('#p-intro').textContent = e.intro;
    $('#p-pochi').hidden = !e.pochiDati;
    const box = $('#capi'); box.textContent = '';
    e.capi.forEach(c => {
      const s = el('article', 'carta-box capo');
      const t = el('div', 'capo-testa');
      const tt = el('div'); tt.appendChild(el('div', 'art', c.art)); tt.appendChild(el('h3', null, c.titolo));
      t.appendChild(tt); t.appendChild(el('span', 'esito ' + (c.colpevole ? 'col' : 'ass'), c.colpevole ? 'Colpevole' : 'Assolto'));
      s.appendChild(t);
      s.appendChild(el('p', null, c.testo));
      if (c.nota) s.appendChild(el('p', 'nota', c.nota));
      if (c.prove.length) {
        s.appendChild(el('div', 'prove-tit', 'Prove agli atti'));
        const ul = el('ul', 'prove'); c.prove.slice(0, 3).forEach(p => ul.appendChild(provaLi(p))); s.appendChild(ul);
      }
      if (c.pena) { const d = el('div', 'pena'); d.appendChild(el('b', null, 'Pena')); d.appendChild(document.createTextNode(c.pena)); s.appendChild(d); }
      box.appendChild(s);
    });
    const dt = $('#difesa-testo'); dt.textContent = '';
    e.difesa.parti.forEach(x => dt.appendChild(el('p', null, x)));
    const dp = $('#difesa-prove'); dp.textContent = '';
    e.difesa.prove.forEach(p => dp.appendChild(provaLi(p)));
    dp.previousElementSibling && (dp.hidden = !e.difesa.prove.length);
    $('#verdetto').textContent = e.verdetto;
    const tb = $('#timbro'); tb.textContent = e.colpevole ? 'COLPEVOLE' : 'ASSOLTO'; tb.classList.toggle('assolto', !e.colpevole);
    const pu = $('#pene'); pu.textContent = '';
    if (e.colpevole && e.pene.length) e.pene.forEach(x => pu.appendChild(el('li', null, x)));
    else pu.appendChild(el('li', null, 'Nessuna pena. Si raccomanda soltanto di non dire "ci sentiamo" se non è vero.'));
    $('#chiusura').textContent = e.chiusura;
    $('#btn-wa').href = 'https://wa.me/?text=' + encodeURIComponent(testoCond());
  }

  let io = null;
  function osserva() {
    if (io) io.disconnect();
    const els = document.querySelectorAll('.capo,.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.12 });
    els.forEach(e => { e.classList.remove('in'); io.observe(e); });
  }

  const opz = () => ({ iniziale: $('#chk-iniziale').checked, url: SITO_URL, sito: 'lira-ia.github.io/tribunale' });
  const testoCond = () => I.testoCondivisione(esito, opz());
  function disegnaCanvas() { I.disegna($('#cv'), esito, opz()); $('#btn-wa').href = 'https://wa.me/?text=' + encodeURIComponent(testoCond()); }
  function blob() { return new Promise(res => $('#cv').toBlob(res, 'image/png')); }
  function nomeFile() { return 'sentenza-tribunale-chat.png'; }

  async function condividi() {
    const msg = $('#share-msg'); msg.textContent = '';
    const b = await blob();
    const f = new File([b], nomeFile(), { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f], text: testoCond(), title: 'Sentenza del Tribunale della Chat' });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    scarica(b);
    msg.textContent = 'Il tuo browser non può condividere direttamente: ho scaricato l\'immagine. Puoi allegarla tu, oppure usare "Testo su WhatsApp".';
  }
  function scarica(b) {
    const url = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = url; a.download = nomeFile(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  $('#file').addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try { const r = await leggiFile(f); caricaTesto(r.text, r.name); }
    catch (e) { errore(e && e.message === 'zip' ? 'Non riesco ad aprire lo zip. Prova a estrarre il file _chat.txt e a caricare quello.' : 'Non riesco a leggere il file.'); }
    ev.target.value = '';
  });
  $('#btn-demo').addEventListener('click', () => caricaTesto(window.TribunaleDemo.genera(), window.TribunaleDemo.nomeFile));
  $('#btn-indietro').addEventListener('click', () => schermo('s-home'));
  $('#btn-altro').addEventListener('click', () => mostraScelta());
  $('#btn-altra').addEventListener('click', () => avvia(imputato, seed + 1));
  $('#btn-share').addEventListener('click', condividi);
  $('#btn-scarica').addEventListener('click', async () => scarica(await blob()));
  $('#chk-iniziale').addEventListener('change', () => esito && disegnaCanvas());

  // drag & drop
  ['dragover', 'drop'].forEach(n => window.addEventListener(n, ev => {
    ev.preventDefault();
    if (n === 'drop' && ev.dataTransfer.files[0]) {
      leggiFile(ev.dataTransfer.files[0]).then(r => caricaTesto(r.text, r.name)).catch(() => errore('Non riesco a leggere il file.'));
    }
  }));
  // per i test: ?demo=Davide
  const q = new URLSearchParams(location.search);
  if (q.get('demo')) { caricaTesto(window.TribunaleDemo.genera(), window.TribunaleDemo.nomeFile); const i = parsed && parsed.authors.indexOf(q.get('demo')); if (i >= 0) avvia(i, 0); }
})();
