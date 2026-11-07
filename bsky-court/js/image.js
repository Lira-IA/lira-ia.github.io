/* Verdict image 1080x1350 on canvas */
(function (root) {
  const W = 1080, H = 1350, INK = '#2a2017', RED = '#a8201a', GREEN = '#2f6b3a';
  const SERIF = 'Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"Times New Roman",serif';
  const rnd = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function spaced(ctx, text, x, y, sp) {
    if ('letterSpacing' in ctx) { ctx.letterSpacing = sp + 'px'; ctx.fillText(text, x + (ctx.textAlign === 'center' ? sp / 2 : 0), y); ctx.letterSpacing = '0px'; }
    else ctx.fillText(text, x, y);
  }
  function fit(ctx, text, weight, size, maxW, min) {
    while (size > min) { ctx.font = weight + ' ' + size + 'px ' + SERIF; if (ctx.measureText(text).width <= maxW) break; size -= 2; }
    return size;
  }
  function wrap(ctx, text, maxW, maxLines) {
    const words = text.split(' '), out = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; });
    if (cur) out.push(cur);
    if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
    return out;
  }
  function gavel(ctx, cx, cy, s, flip) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(flip ? -s : s, s); ctx.rotate(-0.5);
    ctx.fillStyle = '#7b5230'; ctx.strokeStyle = '#2b1a0b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-10, -4, 70, 10, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.roundRect(-52, -17, 46, 34, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7b5230'; ctx.fillRect(-44, -20, 7, 40); ctx.fillRect(-22, -20, 7, 40);
    ctx.restore();
  }
  function loadImg(url) {
    return new Promise(res => {
      if (!url) return res(null);
      const im = new Image(); im.crossOrigin = 'anonymous'; im.referrerPolicy = 'no-referrer';
      const t = setTimeout(() => res(null), 4000);
      im.onload = () => { clearTimeout(t); res(im); }; im.onerror = () => { clearTimeout(t); res(null); };
      im.src = url;
    });
  }
  function draw(canvas, r, o) {
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f6eed9'); g.addColorStop(1, '#e9dcbc');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rr = rnd(r.name.length * 97 + 11);
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = 'rgba(110,80,30,' + (rr() * 0.07).toFixed(3) + ')'; ctx.fillRect(rr() * W, rr() * H, 1 + rr() * 2, 1 + rr() * 2); }
    const vg = ctx.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 900); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,60,20,.22)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.lineWidth = 2; ctx.strokeRect(52, 52, W - 104, H - 104);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    gavel(ctx, 105, 170, 0.9, false); gavel(ctx, W - 105, 170, 0.9, true);
    ctx.fillStyle = INK; ctx.font = 'bold 28px ' + SERIF; spaced(ctx, 'THE PEOPLE OF THE TIMELINE VERSUS', W / 2, 112, 5);
    ctx.font = '900 76px ' + SERIF; spaced(ctx, 'BLUESKY COURT', W / 2, 210, 3);
    ctx.fillRect(110, 245, W - 220, 3); ctx.fillRect(110, 253, W - 220, 1.5);
    ctx.font = 'italic 25px ' + SERIF; ctx.fillStyle = '#5a4c36';
    ctx.fillText('Judge: Lira, an AI  ·  last ' + r.stats.windowDays + ' days of public posts', W / 2, 292);

    // defendant
    const ax = 110, ay = 365, ar = 62;
    ctx.save(); ctx.beginPath(); ctx.arc(ax + ar, ay + ar, ar, 0, 7); ctx.closePath(); ctx.clip();
    if (o.img) { ctx.drawImage(o.img, ax, ay, ar * 2, ar * 2); }
    else { ctx.fillStyle = '#c9b78d'; ctx.fillRect(ax, ay, ar * 2, ar * 2); ctx.fillStyle = INK; ctx.font = '900 70px ' + SERIF; ctx.textAlign = 'center'; ctx.fillText((r.name.replace(/^[^\p{L}\d]+/u, '').charAt(0) || '?').toUpperCase(), ax + ar, ay + ar + 24); }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ax + ar, ay + ar, ar, 0, 7); ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = '#6f6350'; ctx.font = 'bold 22px ' + SERIF; spaced(ctx, 'DEFENDANT', 255, 392, 6);
    const nm = r.name.toUpperCase(), fs = fit(ctx, nm, '900', 70, W - 255 - 100, 30);
    ctx.fillStyle = INK; ctx.font = '900 ' + fs + 'px ' + SERIF; ctx.fillText(nm, 255, 392 + 14 + fs * 0.85);
    ctx.fillStyle = '#6f6350'; ctx.font = 'italic 24px ' + SERIF; ctx.fillText(r.short, 255, 392 + 14 + fs * 0.85 + 36);

    const y0 = 520, rowH = 60;
    r.counts.forEach((c, i) => {
      const y = y0 + i * rowH;
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(42,32,23,.045)'; ctx.fillRect(84, y - 4, W - 168, rowH - 2); }
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(104, y + 5, 36, 36);
      ctx.lineWidth = 7; ctx.lineCap = 'round';
      if (r.verdict === 'NO CASE') { ctx.strokeStyle = '#8a8070'; ctx.beginPath(); ctx.moveTo(112, y + 24); ctx.lineTo(132, y + 24); ctx.stroke(); }
      else if (c.guilty) { ctx.strokeStyle = RED; ctx.beginPath(); ctx.moveTo(110, y + 11); ctx.lineTo(134, y + 35); ctx.moveTo(134, y + 11); ctx.lineTo(110, y + 35); ctx.stroke(); }
      else { ctx.strokeStyle = GREEN; ctx.beginPath(); ctx.moveTo(109, y + 25); ctx.lineTo(120, y + 36); ctx.lineTo(138, y + 10); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.font = 'bold 29px ' + SERIF; ctx.fillText(c.title, 166, y + 22);
      ctx.fillStyle = c.guilty && r.verdict !== 'NO CASE' ? RED : '#5f6b58'; ctx.font = 'italic 21px ' + SERIF;
      let l = c.line; while (ctx.measureText(l).width > W - 166 - 90 && l.length > 8) l = l.slice(0, -2);
      if (l !== c.line) l = l.replace(/\s+\S*$/, '') + '…';
      ctx.fillText(l, 166, y + 47);
    });
    const yp = y0 + 8 * rowH + 18;
    ctx.fillStyle = INK; ctx.fillRect(110, yp, W - 220, 2);
    const nc = r.verdict === 'NO CASE';
    ctx.fillStyle = nc ? '#6f6350' : RED; ctx.font = 'bold 24px ' + SERIF; ctx.fillText(nc ? 'NO RULING' : 'SENTENCE', 110, yp + 40);
    ctx.fillStyle = INK; ctx.font = 'italic 28px ' + SERIF;
    wrap(ctx, nc ? r.verdictLine : r.pena, W - 220, 3).forEach((l, i) => ctx.fillText(l, 110, yp + 78 + i * 36));

    // stamp
    ctx.save();
    const gl = r.verdict === 'GUILTY', col = gl ? RED : r.verdict === 'NO CASE' ? '#6f6350' : GREEN, tx = r.verdict;
    ctx.globalAlpha = 0.9; ctx.textAlign = 'center';
    const ts = gl ? 86 : 80; ctx.font = '900 ' + ts + 'px ' + SERIF;
    ctx.letterSpacing = '4px'; const tw = ctx.measureText(tx).width + 10; ctx.letterSpacing = '0px';
    const bh = ts * 1.1 + 44, bx = -tw / 2 - 26, by = -ts * 0.8 - 16;
    const SC = 0.62; // timbro ridotto, nell'angolo basso-destra delle righe (capi 5-8: testi corti), non copre i dati
    ctx.translate(W - 100 - (tw + 52) * SC / 2, y0 + 6 * rowH + 20); ctx.scale(SC, SC); ctx.rotate(-0.16);
    ctx.fillStyle = 'rgba(246,238,217,.82)'; ctx.fillRect(bx, by, tw + 52, bh);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 9; ctx.strokeRect(bx, by, tw + 52, bh);
    ctx.lineWidth = 2.5; ctx.strokeRect(bx + 12, by + 12, tw + 28, bh - 24);
    spaced(ctx, tx, 0, 0, 4);
    ctx.font = 'bold 25px ' + SERIF; if (!nc) spaced(ctx, r.guilty + ' OF ' + r.total + ' COUNTS', 0, 40, 4);
    ctx.restore();

    ctx.textAlign = 'center'; ctx.fillStyle = '#5a4c36'; ctx.font = 'italic 23px ' + SERIF;
    ctx.fillText('Judge: Lira, an AI. A joke about posting habits, not a real lawsuit.', W / 2, H - 134);
    ctx.font = 'italic 20px ' + SERIF; ctx.fillText('Unofficial fan project. Not affiliated with Bluesky.', W / 2, H - 102);
    ctx.fillStyle = INK; ctx.font = 'bold 28px ' + SERIF; ctx.fillText('lira-ia.github.io/bsky-court', W / 2, H - 66);
    return canvas;
  }
  root.CourtImage = { draw, loadImg, W, H };
})(window);
