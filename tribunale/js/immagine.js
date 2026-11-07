/* Il Tribunale della Chat - sentenza grafica 1080x1350 su canvas. Nessun dato lascia il browser. */
(function (root, factory) {
  root.TribunaleImmagine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", serif';
  const W = 1080, H = 1350, INK = '#2a2017', ROSSO = '#a8201a', VERDE = '#2f6b3a';

  function lines(ctx, text, maxW, maxLines) {
    const words = String(text).split(/\s+/), out = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    if (out.length > maxLines) { out.length = maxLines; let l = out[maxLines - 1]; while (ctx.measureText(l + '…').width > maxW) l = l.slice(0, -1); out[maxLines - 1] = l.replace(/[\s,.;:]+$/, '') + '…'; }
    return out;
  }
  function fit(ctx, text, weight, size, maxW, min) {
    let s = size; do { ctx.font = weight + ' ' + s + 'px ' + SERIF; s -= 2; } while (ctx.measureText(text).width > maxW && s > min);
    return s + 2;
  }
  function spaced(ctx, text, x, y, sp) { // testo centrato con spaziatura tra le lettere
    if ('letterSpacing' in ctx) {
      const al = ctx.textAlign; ctx.textAlign = 'center'; ctx.letterSpacing = sp + 'px'; ctx.fillText(text, x + sp / 2, y); ctx.letterSpacing = '0px'; ctx.textAlign = al; return;
    }
    const ws = [...text].map(c => ctx.measureText(c).width + sp); const tot = ws.reduce((p, q) => p + q, 0) - sp;
    const al = ctx.textAlign; ctx.textAlign = 'left';
    let cx = x - tot / 2; [...text].forEach((c, i) => { ctx.fillText(c, cx, y); cx += ws[i]; }); ctx.textAlign = al;
  }
  function rnd(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function martelletto(ctx, cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#7b5230'; ctx.strokeStyle = '#2b1a0b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-10, -4, 70, 10, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.roundRect(-52, -17, 46, 34, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7b5230'; ctx.fillRect(-44, -20, 7, 40); ctx.fillRect(-22, -20, 7, 40);
    ctx.restore();
  }

  function disegna(canvas, esito, opz) {
    opz = opz || {};
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    const nome = opz.iniziale ? esito.imputato.trim().charAt(0).toUpperCase() + '.' : esito.imputato;
    // carta
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f6eed9'); g.addColorStop(1, '#e9dcbc');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rnd(esito.imputato.length * 97 + 11);
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = 'rgba(110,80,30,' + (r() * 0.07).toFixed(3) + ')'; ctx.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    const vg = ctx.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 900); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,60,20,.22)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // cornici
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.lineWidth = 2; ctx.strokeRect(52, 52, W - 104, H - 104);

    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    // intestazione
    martelletto(ctx, 120, 150, 1.2);
    martelletto(ctx, W - 120, 150, 1.2);
    ctx.fillStyle = INK; ctx.font = 'bold 30px ' + SERIF; spaced(ctx, 'REPUBBLICA DELLE CHAT', W / 2, 112, 6);
    ctx.font = '900 76px ' + SERIF; spaced(ctx, 'TRIBUNALE', W / 2, 190, 8);
    ctx.font = '900 54px ' + SERIF; spaced(ctx, 'DELLA CHAT', W / 2, 252, 10);
    ctx.fillStyle = INK; ctx.fillRect(110, 276, W - 220, 3); ctx.fillRect(110, 284, W - 220, 1.5);
    ctx.font = 'italic 26px ' + SERIF; ctx.fillStyle = '#5a4c36';
    ctx.fillText('SENTENZA n. ' + esito.numero + '  ·  Giudice: Lira, un\'IA', W / 2, 326);

    // imputato
    ctx.fillStyle = '#6f6350'; ctx.font = 'bold 24px ' + SERIF; spaced(ctx, 'IMPUTATO', W / 2, 382, 8);
    const nm = nome.toUpperCase();
    const fs = fit(ctx, nm, '900', 92, W - 220, 40);
    ctx.fillStyle = INK; ctx.font = '900 ' + fs + 'px ' + SERIF; ctx.fillText(nm, W / 2, 382 + 18 + fs * 0.85);
    const yCapi = 382 + 18 + fs * 0.85 + 36;

    // capi
    const n = esito.capi.length, rowH = 66;
    ctx.textAlign = 'left';
    esito.capi.forEach((c, i) => {
      const y = yCapi + i * rowH;
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(42,32,23,.045)'; ctx.fillRect(84, y - 4, W - 168, rowH - 2); }
      // casella
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(104, y + 4, 38, 38);
      ctx.lineWidth = 7; ctx.lineCap = 'round';
      if (c.colpevole) { ctx.strokeStyle = ROSSO; ctx.beginPath(); ctx.moveTo(111, y + 11); ctx.lineTo(137, y + 37); ctx.moveTo(137, y + 11); ctx.lineTo(111, y + 37); ctx.stroke(); }
      else { ctx.strokeStyle = VERDE; ctx.beginPath(); ctx.moveTo(110, y + 26); ctx.lineTo(121, y + 37); ctx.lineTo(140, y + 9); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.font = 'bold 31px ' + SERIF; ctx.fillText(c.titolo, 166, y + 23);
      ctx.fillStyle = c.colpevole ? ROSSO : '#5f6b58'; ctx.font = 'italic 23px ' + SERIF;
      let rg = c.riga; while (ctx.measureText(rg).width > W - 166 - 110 && rg.length > 8) rg = rg.slice(0, -2); if (rg !== c.riga) rg = rg.replace(/\s+\S*$/, '') + '…';
      ctx.fillText(rg, 166, y + 51);
    });
    const yPena = yCapi + n * rowH + 14;

    // pena
    ctx.fillStyle = INK; ctx.fillRect(110, yPena, W - 220, 2);
    ctx.fillStyle = ROSSO; ctx.font = 'bold 24px ' + SERIF; ctx.fillText('PENA', 110, yPena + 40);
    ctx.fillStyle = INK; ctx.font = 'italic 27px ' + SERIF;
    const pena = esito.colpevole && esito.pene.length ? esito.pene[0].replace(/^Pena( accessoria)?:\s*/i, '') : 'Nessuna. Vada in pace e risponda ai messaggi con garbo.';
    const pena2 = pena.charAt(0).toUpperCase() + pena.slice(1);
    const pl = lines(ctx, pena2, W - 220, 3);
    pl.forEach((l, i) => ctx.fillText(l, 110, yPena + 76 + i * 35));

    // timbro
    ctx.save();
    ctx.translate(W - 315, yCapi + 3 * rowH + 24); ctx.rotate(-0.2);
    const col = esito.colpevole ? ROSSO : VERDE, tx = esito.colpevole ? 'COLPEVOLE' : 'ASSOLTO';
    ctx.globalAlpha = 0.88; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.textAlign = 'center';
    const ts = esito.colpevole ? 74 : 92; ctx.font = '900 ' + ts + 'px ' + SERIF;
    ctx.letterSpacing = '3px';
    const tw = ctx.measureText(tx).width + 10; ctx.letterSpacing = '0px';
    const bh = ts * 1.2 + 44;
    ctx.fillStyle = 'rgba(246,238,217,.72)'; ctx.fillRect(-tw / 2 - 26, -ts * 0.82 - 16, tw + 52, bh); ctx.fillStyle = col;
    ctx.lineWidth = 9; ctx.strokeRect(-tw / 2 - 26, -ts * 0.82 - 16, tw + 52, bh);
    ctx.lineWidth = 2.5; ctx.strokeRect(-tw / 2 - 14, -ts * 0.82 - 4, tw + 28, bh - 24);
    spaced(ctx, tx, 0, 0, 3);
    ctx.font = 'bold 25px ' + SERIF; spaced(ctx, esito.colpevoli + ' CAPI SU ' + esito.totaleCapi, 0, 40, 4);
    ctx.restore();

    // piè
    ctx.textAlign = 'center'; ctx.fillStyle = '#5a4c36'; ctx.font = 'italic 23px ' + SERIF;
    ctx.fillText('Condanna ironica, affetto reale. Valore legale: zero.', W / 2, H - 108);
    ctx.fillStyle = INK; ctx.font = 'bold 26px ' + SERIF;
    ctx.fillText((opz.sito || 'lira-ia.github.io/tribunale') + ' · porta in giudizio la tua chat', W / 2, H - 72);
    return canvas;
  }

  function testoCondivisione(esito, opz) {
    opz = opz || {};
    const nome = opz.iniziale ? esito.imputato.trim().charAt(0).toUpperCase() + '.' : esito.imputato;
    const url = opz.url || 'https://lira-ia.github.io/tribunale/';
    const col = esito.capi.filter(c => c.colpevole).map(c => c.titolo);
    let t = '⚖️ SENTENZA del Tribunale della Chat\n';
    t += nome + ': ' + (esito.colpevole ? 'COLPEVOLE' : 'ASSOLTO') + ' (' + esito.colpevoli + ' capi su ' + esito.totaleCapi + ')\n';
    if (col.length) t += 'Capi: ' + col.join(', ') + '\n';
    if (esito.colpevole && esito.pene[0]) t += 'Pena: ' + esito.pene[0] + '\n';
    t += '\nGiudice: Lira, un\'IA. Processa anche la tua chat (resta tutto nel tuo browser): ' + url;
    return t;
  }
  return { disegna, testoCondivisione, W, H };
});
