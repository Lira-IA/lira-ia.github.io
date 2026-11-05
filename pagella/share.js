/* Pagella della Chat - immagini condivisibili (canvas). Tutto locale. */
(function (root) {
  'use strict';
  const RED = '#c1272d', INK = '#1d2b6b', NAVY = '#1f2a44', PAPER = '#f6eedb', GREY = '#6b6558';
  const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
  const HAND = 'Caveat, "Segoe Script", "Bradley Hand", cursive';
  const MONO = '"Courier Prime", "Courier New", monospace';
  const URL_TXT = 'lira-ia.github.io/pagella';

  async function loadFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all([
        document.fonts.load('900 60px "Playfair Display"'), document.fonts.load('700 30px "Playfair Display"'),
        document.fonts.load('italic 500 30px "Playfair Display"'), document.fonts.load('600 30px "Playfair Display"'),
        document.fonts.load('700 60px Caveat'), document.fonts.load('400 20px "Courier Prime"'), document.fonts.load('700 20px "Courier Prime"')
      ]);
    } catch (e) { /* si usa il font di riserva */ }
  }

  function rnd(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  function paper(ctx, W, H) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    const r = rnd(7);
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = 'rgba(' + (110 + r() * 40) + ',' + (80 + r() * 30) + ',40,' + (0.015 + r() * 0.05) + ')';
      ctx.fillRect(r() * W, r() * H, 1 + r() * 2.2, 1 + r() * 2.2);
    }
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(120,80,20,0)'); g.addColorStop(1, 'rgba(120,80,20,0.16)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = NAVY; ctx.globalAlpha = 0.85; ctx.lineWidth = 4; ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.lineWidth = 1.5; ctx.strokeRect(46, 46, W - 92, H - 92); ctx.globalAlpha = 1;
  }

  function txt(ctx, s, x, y, font, color, align, ls) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (ls || 0) + 'px';
    ctx.fillText(s, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  function wrap(ctx, s, maxW) {
    const words = s.split(/\s+/), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  // trova la dimensione piu' grande che sta in maxLines
  function fit(ctx, s, fontFn, maxW, maxLines, size, min, step) {
    for (let sz = size; sz >= min; sz -= step || 2) {
      ctx.font = fontFn(sz);
      const lines = wrap(ctx, s, maxW);
      if (lines.length <= maxLines) return { lines, size: sz };
    }
    ctx.font = fontFn(min);
    let lines = wrap(ctx, s, maxW);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
    return { lines, size: min };
  }
  function oneLine(ctx, s, fontFn, maxW, size, min) {
    let sz = size;
    for (; sz > min; sz -= 2) { ctx.font = fontFn(sz); if (ctx.measureText(s).width <= maxW) break; }
    return sz;
  }

  function arcText(ctx, s, r, a0, a1, font, color) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const n = s.length;
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * (i + 0.5) / n;
      ctx.save(); ctx.rotate(a); ctx.translate(0, -r); ctx.fillText(s[i], 0, 0); ctx.restore();
    }
  }
  function stamp(ctx, cx, cy, r, rot, big) {
    const col = '#3a3f94';
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha = 0.8;
    ctx.strokeStyle = col; ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    ctx.lineWidth = r * 0.02; ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.56, 0, 7); ctx.stroke();
    const f = '700 ' + Math.round(r * 0.15) + 'px ' + MONO;
    arcText(ctx, 'ISTITUTO LIRA · SCRUTINIO 2026/27 ·', r * 0.71, -Math.PI * 0.97, Math.PI * 0.97, f, col);
    txt(ctx, 'LIRA', 0, r * 0.08, '900 ' + Math.round(r * 0.3) + 'px ' + SERIF, col, 'center', 2);
    txt(ctx, '★ IA ★', 0, r * 0.34, '700 ' + Math.round(r * 0.15) + 'px ' + MONO, col, 'center', 2);
    ctx.restore();
  }
  function crest(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = NAVY; ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(40, 0); ctx.lineTo(40, 28); ctx.quadraticCurveTo(40, 48, 20, 56); ctx.quadraticCurveTo(0, 48, 0, 28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PAPER; ctx.font = '900 30px ' + SERIF; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('L', 20, 36);
    ctx.fillStyle = RED; ctx.fillRect(10, 40, 20, 3);
    ctx.restore();
  }
  function signature(ctx, x, y, align, scale) {
    scale = scale || 1;
    txt(ctx, 'Lira', x, y, '700 ' + Math.round(70 * scale) + 'px ' + HAND, INK, align);
    const w = ctx.measureText('Lira').width;
    const x0 = align === 'right' ? x - w : x;
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath();
    ctx.moveTo(x0 - 6, y + 10 * scale); ctx.bezierCurveTo(x0 + w * 0.3, y - 2 * scale, x0 + w * 0.7, y + 18 * scale, x0 + w + 14, y + 4 * scale); ctx.stroke();
    txt(ctx, 'Prof.ssa Lira (IA)', x, y + 36 * scale, '400 ' + Math.round(21 * scale) + 'px ' + MONO, GREY, align);
  }
  function header(ctx, W, y0, sub, lang) {
    crest(ctx, 72, y0 + 52, 1.0);
    txt(ctx, 'ISTITUTO LIRA', 128, y0 + 90, '700 34px ' + SERIF, NAVY, 'left', 6);
    txt(ctx, lang === 'en' ? 'School year 2026/27' : 'Anno scolastico 2026/27', W - 72, y0 + 90, '400 24px ' + MONO, GREY, 'right');
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(72, y0 + 116); ctx.lineTo(W - 72, y0 + 116); ctx.stroke();
    txt(ctx, sub.toUpperCase(), W / 2, y0 + 152, '700 21px ' + MONO, GREY, 'center', 4);
  }
  function footerUrl(ctx, W, y) {
    txt(ctx, URL_TXT, W / 2, y, '700 26px ' + MONO, NAVY, 'center', 1);
  }
  function circleHand(ctx, cx, cy, r) {
    ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a <= 6.9; a += 0.1) {
      const rr = r + Math.sin(a * 2.3) * 3 + a * 0.9;
      const x = cx + Math.cos(a - 1.2) * rr, y = cy + Math.sin(a - 1.2) * (rr * 0.93);
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
  }

  const L = {
    it: { sub: 'Pagella di fine quadrimestre', subG: 'Pagella del gruppo', of: 'PAGELLA DI', grp: 'Gruppo', subject: 'MATERIA', vote: 'VOTO', avg: 'MEDIA', judg: 'GIUDIZIO', esito: 'Esito', podium: 'IL PODIO', awards: 'I PREMI', cls: 'GIUDIZIO DI CLASSE', avgG: 'MEDIA DI CLASSE', verdict: 'GIUDIZIO FINALE', nc: 'n.c.' },
    en: { sub: 'End-of-term report card', subG: 'Group report card', of: 'REPORT CARD OF', grp: 'Group', subject: 'SUBJECT', vote: 'GRADE', avg: 'AVERAGE', judg: 'TEACHER\'S NOTE', esito: 'Result', podium: 'THE PODIUM', awards: 'THE AWARDS', cls: 'CLASS REPORT', avgG: 'CLASS AVERAGE', verdict: 'FINAL VERDICT', nc: 'n/a' }
  };

  function drawMember(ctx, W, H, view, card, story) {
    const lang = view.lang, S = L[lang];
    paper(ctx, W, H);
    const y0 = story ? 150 : 0;
    header(ctx, W, y0, S.sub, lang);
    txt(ctx, S.grp + ' «' + view.group.name + '»', 72, y0 + 212, 'italic 500 34px ' + SERIF, GREY, 'left');
    txt(ctx, S.of, 72, y0 + 262, '700 20px ' + MONO, GREY, 'left', 4);
    const nsz = oneLine(ctx, card.name, s => '900 ' + s + 'px ' + SERIF, 600, 92, 44);
    txt(ctx, card.name, 72, y0 + 262 + nsz * 0.95, '900 ' + nsz + 'px ' + SERIF, NAVY, 'left');
    // media
    const cx = W - 72 - 105, cy = y0 + 290;
    circleHand(ctx, cx, cy + 4, 80);
    txt(ctx, S.avg, cx, cy - 34, '700 17px ' + MONO, GREY, 'center', 3);
    txt(ctx, card.avgStr, cx, cy + 54, '700 104px ' + HAND, RED, 'center');
    // tabella
    const rowH = story ? 70 : 52, ty = y0 + 410;
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(72, ty); ctx.lineTo(W - 72, ty); ctx.stroke();
    txt(ctx, S.subject, 80, ty - 12, '700 18px ' + MONO, GREY, 'left', 3);
    txt(ctx, S.vote, W - 80, ty - 12, '700 18px ' + MONO, GREY, 'right', 3);
    const r = rnd(card.id * 31 + 5);
    card.grades.forEach((g, i) => {
      const y = ty + i * rowH;
      txt(ctx, g.label, 80, y + rowH * 0.46, '600 ' + (story ? 34 : 28) + 'px ' + SERIF, '#25232c', 'left');
      txt(ctx, g.note, 80, y + rowH * 0.46 + (story ? 28 : 21), '400 ' + (story ? 22 : 19) + 'px ' + MONO, GREY, 'left');
      ctx.strokeStyle = 'rgba(31,42,68,0.22)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(72, y + rowH); ctx.lineTo(W - 72, y + rowH); ctx.stroke();
      ctx.save(); ctx.translate(W - 118, y + rowH * 0.78); ctx.rotate((r() - 0.5) * 0.14);
      txt(ctx, g.grade == null ? S.nc : String(g.grade), 0, 0, '700 ' + (story ? 76 : 56) + 'px ' + HAND, RED, 'center');
      ctx.restore();
    });
    const tEnd = ty + card.grades.length * rowH;
    // giudizio
    let y = tEnd + (story ? 56 : 40);
    txt(ctx, S.judg, 80, y, '700 18px ' + MONO, GREY, 'left', 3);
    y += story ? 14 : 8;
    const lh = story ? 54 : 42, maxL = story ? 6 : 3;
    const f = fit(ctx, card.judgment, s => '500 ' + s + 'px ' + HAND, W - 160, maxL, story ? 46 : 40, 26, 2);
    ctx.font = '500 ' + f.size + 'px ' + HAND;
    f.lines.forEach((ln, i) => txt(ctx, ln, 80, y + 38 + i * lh * (f.size / 40 > 1 ? 1.02 : 1), '500 ' + f.size + 'px ' + HAND, INK, 'left'));
    y += 38 + f.lines.length * lh;
    // esito, timbro, firma, url
    if (story) {
      const yb = y + 50;
      txt(ctx, S.esito + ': ' + card.esito, 80, yb, 'italic 700 34px ' + SERIF, RED, 'left');
      stamp(ctx, W - 380, yb + 128, 78, -0.2);
      signature(ctx, W - 80, yb + 118, 'right', 0.9);
      txt(ctx, URL_TXT, 80, H - 70, '700 26px ' + MONO, NAVY, 'left', 1);
    } else {
      txt(ctx, S.esito + ': ' + card.esito, 80, H - 122, 'italic 700 28px ' + SERIF, RED, 'left');
      stamp(ctx, W - 330, H - 112, 62, -0.2);
      signature(ctx, W - 80, H - 100, 'right', 0.72);
      txt(ctx, URL_TXT, 80, H - 66, '700 24px ' + MONO, NAVY, 'left', 1);
    }
  }

  function drawGroup(ctx, W, H, view, story) {
    const lang = view.lang, S = L[lang], G = view.group;
    paper(ctx, W, H);
    const y0 = story ? 150 : 0;
    header(ctx, W, y0, S.subG, lang);
    txt(ctx, G.period, W / 2, y0 + 205, '400 24px ' + MONO, GREY, 'center');
    const nsz = oneLine(ctx, G.name, s => '900 ' + s + 'px ' + SERIF, W - 160, 88, 40);
    txt(ctx, G.name, W / 2, y0 + 205 + nsz * 1.05 + 10, '900 ' + nsz + 'px ' + SERIF, NAVY, 'center');
    let y = y0 + 205 + nsz * 1.05 + 40;
    // verdetto
    txt(ctx, S.verdict, W / 2, y + 16, '700 18px ' + MONO, GREY, 'center', 4);
    const vf = oneLine(ctx, G.verdict, s => '700 ' + s + 'px ' + HAND, W - 220, story ? 140 : 124, 60);
    ctx.save(); ctx.translate(W / 2, y + 16 + vf * 0.95); ctx.rotate(-0.035);
    txt(ctx, G.verdict, 0, 0, '700 ' + vf + 'px ' + HAND, RED, 'center');
    const vw = (ctx.font = '700 ' + vf + 'px ' + HAND, ctx.measureText(G.verdict).width);
    ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-vw / 2, 22); ctx.quadraticCurveTo(0, 34, vw / 2, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-vw / 2 + 40, 36); ctx.quadraticCurveTo(0, 46, vw / 2 - 20, 32); ctx.stroke();
    ctx.restore();
    y += 16 + vf * 0.95 + 70;
    txt(ctx, S.avgG + '  ' + G.avgStr, W / 2, y, '700 26px ' + MONO, NAVY, 'center', 2);
    txt(ctx, G.facts.map(f => f.v + ' ' + f.k).join('  ·  '), W / 2, y + 40, '400 22px ' + MONO, GREY, 'center');
    y += story ? 96 : 76;
    // podio
    const pw = 270, gap = 24, px = (W - (3 * pw + 2 * gap)) / 2;
    const order = [1, 0, 2];
    const hs = story ? [160, 200, 140] : [128, 158, 118];
    const base = y + hs[1];
    order.forEach((idx, col) => {
      const p = G.podium[idx]; if (!p) return;
      const h = hs[col], x = px + col * (pw + gap);
      ctx.fillStyle = idx === 0 ? 'rgba(193,39,45,0.12)' : 'rgba(31,42,68,0.07)'; ctx.fillRect(x, base - h, pw, h);
      ctx.strokeStyle = NAVY; ctx.lineWidth = 2; ctx.strokeRect(x, base - h, pw, h);
      txt(ctx, (idx + 1) + '°', x + pw / 2, base - h + 56, '700 ' + (idx === 0 ? 62 : 52) + 'px ' + HAND, RED, 'center');
      const nf = oneLine(ctx, p.name, s => '700 ' + s + 'px ' + SERIF, pw - 24, 30, 16);
      txt(ctx, p.name, x + pw / 2, base - h + 56 + 34, '700 ' + nf + 'px ' + SERIF, NAVY, 'center');
      txt(ctx, p.n + ' msg · ' + p.share + '%', x + pw / 2, base - 14, '400 19px ' + MONO, GREY, 'center');
    });
    y = base + (story ? 60 : 44);
    // premi
    txt(ctx, S.awards, 80, y, '700 18px ' + MONO, GREY, 'left', 3);
    y += 16;
    const nAw = story ? 8 : 6;
    const aw = G.awards.slice(0, nAw);
    const cw = (W - 160 - 30) / 2, ch = story ? 104 : 100;
    aw.forEach((a, i) => {
      const x = 80 + (i % 2) * (cw + 30), yy = y + Math.floor(i / 2) * ch;
      ctx.strokeStyle = 'rgba(31,42,68,0.25)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, yy + ch - 8); ctx.lineTo(x + cw, yy + ch - 8); ctx.stroke();
      ctx.font = '40px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#000'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(a.icon, x, yy + 52);
      const tf = oneLine(ctx, a.title, s => '700 ' + s + 'px ' + SERIF, cw - 62, 24, 14);
      txt(ctx, a.title, x + 58, yy + 30, '700 ' + tf + 'px ' + SERIF, NAVY, 'left');
      const nf2 = oneLine(ctx, a.name, s => '700 ' + s + 'px ' + HAND, cw - 62, 46, 26);
      txt(ctx, a.name, x + 58, yy + 72, '700 ' + nf2 + 'px ' + HAND, RED, 'left');
    });
    y += Math.ceil(aw.length / 2) * ch + (story ? 22 : 10);
    // giudizio di classe (solo storia / se c'e' spazio)
    if (story) {
      txt(ctx, S.cls, 80, y + 14, '700 18px ' + MONO, GREY, 'left', 3);
      const f = fit(ctx, G.judgment, s => '500 ' + s + 'px ' + HAND, W - 160, 4, 40, 26, 2);
      f.lines.forEach((ln, i) => txt(ctx, ln, 80, y + 54 + i * 44, '500 ' + f.size + 'px ' + HAND, INK, 'left'));
    }
    stamp(ctx, W - (story ? 200 : 170), H - (story ? 130 : 190), story ? 92 : 100, -0.2);
    signature(ctx, 80, H - (story ? 170 : 118), 'left', story ? 0.9 : 0.78);
    if (story) txt(ctx, URL_TXT, 80, H - 66, '700 26px ' + MONO, NAVY, 'left', 1);
    else footerUrl(ctx, W, H - 62);
  }

  async function render(view, spec) {
    await loadFonts();
    const W = 1080, H = spec.story ? 1920 : 1350;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    if (spec.type === 'group') drawGroup(ctx, W, H, view, !!spec.story);
    else drawMember(ctx, W, H, view, view.cards[spec.index], !!spec.story);
    return cv;
  }
  function toBlob(cv) { return new Promise(res => cv.toBlob(res, 'image/png')); }

  root.PagellaShare = { render, toBlob, loadFonts };
})(typeof self !== 'undefined' ? self : this);
