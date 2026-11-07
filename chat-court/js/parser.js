/* Group Chat Court - WhatsApp parser (EN + IT). Funziona nel browser e in node. Nessuna rete. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PagellaParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const INVIS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff\u200b]/g;
  const SPC = /[\u202f\u00a0\u2009\u2007\u2002\u2003]/g;
  // data, ora, secondi opzionali, AM/PM opzionale
  const DT = '(\\d{1,4})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{1,4}),?\\s+(\\d{1,2})[:.](\\d{2})(?::(\\d{2}))?\\s?([AaPp]\\.?\\s?[Mm]\\.?)?';
  const RE_BR = new RegExp('^\\[' + DT + '\\]\\s?([\\s\\S]*)$'); // iOS
  const RE_DASH = new RegExp('^' + DT + '\\s?[-\u2013\u2014]\\s([\\s\\S]*)$'); // Android
  const SENDER = /^([^:\n]{1,80}?):(?: ([\s\S]*)|$)/;

  // messaggi di sistema (testato sul "mittente" o sulla riga intera)
  const SYS = /crittografat|end-to-end|ha aggiunto|hai aggiunto|è stato aggiunto|e' stato aggiunto|sei stato aggiunto|sei stata aggiunta|è uscit|ha lasciato|hai lasciato|ha rimosso|hai rimosso|è stato rimosso|è entrat|si è unit|ha cambiato|hai cambiato|ha creato|hai creato|ha modificato|ha eliminato il gruppo|codice di sicurezza|messaggi temporanei|ha attivato|ha disattivato|ha reso|ha impostato|ha anteposto|cambiato il numero|tramite il link|\badded\b|\bremoved\b|\bleft\b|\bjoined\b|changed (this|the|their|your)|created (this )?group|security code|you were added|disappearing messages|turned (on|off)|is now an admin|changed (their )?phone number|invite link|invitation link|eingeladen|hinzugefügt|verlassen|añadió|salió|ha salido/i;
  const SYS_BODY = /crittografat|end-to-end|ha creato (il|questo) gruppo|created (this )?group|hai creato|you created/i;
  const GROUPNAME = /(?:ha creato il gruppo|hai creato il gruppo|created group|you created group|created this group)\s*[“"«]?(.+?)[”"»]?\s*$/i;
  const DELETED = /^(questo messaggio è stato eliminato|hai eliminato questo messaggio|this message was deleted|you deleted this message|messaggio eliminato|waiting for this message.*|in attesa del messaggio.*)\.?$/i;
  const EDITED = /\s*<(questo messaggio è stato modificato|this message was edited|messaggio modificato)>\s*$/i;

  function mediaKind(t) {
    const s = t.trim();
    if (s.length > 220 || !s) return null;
    if (/^<?(allegato|attached)\s*:/i.test(s) || /\((file allegato|file attached)\)\s*$/i.test(s)) {
      if (/AUDIO|PTT|AUD-|\.opus|\.m4a|\.ogg|\.mp3/i.test(s)) return 'voice';
      if (/STICKER|STK-|\.webp/i.test(s)) return 'sticker';
      if (/VIDEO|VID-|GIF|\.mp4|\.mov/i.test(s)) return 'video';
      if (/PHOTO|IMG-|\.jpe?g|\.png|\.heic/i.test(s)) return 'image';
      return 'other';
    }
    if (/^<[^<>]*(omess[oaie]?|omitted|omitido|ausgeschlossen|omis)[^<>]*>$/i.test(s) ||
        /^(audio|immagine|video|sticker|gif|documento|contatto|image|document|contact card|voice message|vocale)\s+(omess[oaie]|omitted)$/i.test(s)) {
      if (/audio|vocale|voice/i.test(s)) return 'voice';
      if (/immagine|image|foto|photo/i.test(s)) return 'image';
      if (/sticker/i.test(s)) return 'sticker';
      if (/video|gif/i.test(s)) return 'video';
      return 'other';
    }
    return null;
  }

  function cleanName(n) {
    return n.replace(/^~\s*/, '').replace(/\s+/g, ' ').trim();
  }

  function detectOrder(recs) {
    let dm = 0, md = 0, ymd = false;
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      if (r.d1 > 31) { ymd = true; break; }
      if (r.d1 > 12) dm++; else if (r.d2 > 12) md++;
    }
    if (ymd) return 'ymd';
    if (dm !== md) return dm > md ? 'dmy' : 'mdy';
    // nessuna prova: guardo quale ordine rende le date piu' coerenti nel tempo
    const lim = Math.min(recs.length, 20000);
    let backDM = 0, backMD = 0, pdm = -1, pmd = -1, ap = false;
    for (let i = 0; i < lim; i++) {
      const r = recs[i];
      if (r.ap) ap = true;
      const y = r.d3 < 100 ? 2000 + r.d3 : r.d3;
      const kdm = (y * 100 + r.d2) * 100 + r.d1;
      const kmd = (y * 100 + r.d1) * 100 + r.d2;
      if (kdm < pdm) backDM++;
      if (kmd < pmd) backMD++;
      pdm = kdm; pmd = kmd;
    }
    if (backDM !== backMD) return backDM < backMD ? 'dmy' : 'mdy';
    return ap ? 'mdy' : 'dmy';
  }

  function parseWA(text) {
    text = text.replace(INVIS, '').replace(SPC, ' ');
    const lines = text.split(/\r\n|\n|\r/);
    const recs = [];
    let cur = null, title = null, sysCount = 0;
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const c0 = line.charCodeAt(0);
      let m = null;
      if ((c0 >= 48 && c0 <= 57) || c0 === 91) m = RE_BR.exec(line) || RE_DASH.exec(line);
      if (m) {
        const rest = m[8];
        const sm = SENDER.exec(rest);
        if (!sm) {
          if (!title) { const g = GROUPNAME.exec(rest); if (g) title = g[1]; }
          cur = null; sysCount++; continue;
        }
        const who = cleanName(sm[1]);
        const body = sm[2] || '';
        if (SYS.test(who)) { cur = null; sysCount++; continue; }
        if (body.length < 220 && SYS_BODY.test(body)) {
          // iOS: "[data] NomeGruppo: i messaggi sono crittografati..."
          if (!title && /crittografat|end-to-end/i.test(body)) title = who;
          cur = null; sysCount++; continue;
        }
        cur = { d1: +m[1], d2: +m[2], d3: +m[3], h: +m[4], mi: +m[5], s: m[6] ? +m[6] : 0,
                ap: m[7] ? m[7].toLowerCase().replace(/[^ap]/g, '')[0] : '', who, x: body };
        recs.push(cur);
      } else if (cur) {
        if (cur.x.length < 20000) cur.x += '\n' + line;
      }
    }
    const order = recs.length ? detectOrder(recs) : 'dmy';
    const authors = [], idx = new Map(), msgs = [];
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      let y, mo, d;
      if (order === 'ymd') { y = r.d1; mo = r.d2; d = r.d3; }
      else if (order === 'dmy') { d = r.d1; mo = r.d2; y = r.d3; }
      else { mo = r.d1; d = r.d2; y = r.d3; }
      if (y < 100) y += 2000;
      let h = r.h;
      if (r.ap === 'p' && h < 12) h += 12;
      if (r.ap === 'a' && h === 12) h = 0;
      if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 24 || r.mi > 59) continue;
      let x = r.x.replace(EDITED, '').trim();
      if (DELETED.test(x)) continue;
      const k = mediaKind(x);
      if (k) x = '';
      let a = idx.get(r.who);
      if (a === undefined) { a = authors.length; authors.push(r.who); idx.set(r.who, a); }
      msgs.push({ t: Date.UTC(y, mo - 1, d, h, r.mi, r.s), a, x, k });
    }
    return { format: 'whatsapp', authors, msgs, title, dateOrder: order, system: sysCount };
  }

  function tgText(t) {
    if (typeof t === 'string') return t;
    if (Array.isArray(t)) {
      let s = '';
      for (const p of t) s += typeof p === 'string' ? p : (p && typeof p.text === 'string' ? p.text : '');
      return s;
    }
    return '';
  }

  function parseTelegram(obj) {
    if (obj && obj.chats && obj.chats.list) {
      let best = null;
      for (const c of obj.chats.list) if (c && c.messages && (!best || c.messages.length > best.messages.length)) best = c;
      obj = best;
    }
    if (!obj || !Array.isArray(obj.messages)) return null;
    const authors = [], idx = new Map(), msgs = [];
    const RD = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;
    for (const m of obj.messages) {
      if (!m || m.type === 'service' || m.type === 'service_message') continue;
      const dm = RD.exec(m.date || '');
      if (!dm) continue;
      let who = m.from || m.actor || m.from_id || 'Account eliminato';
      who = cleanName(String(who));
      let k = null;
      const mt = m.media_type;
      if (mt === 'voice_message') k = 'voice';
      else if (mt === 'video_message' || mt === 'video_file' || mt === 'animation') k = 'video';
      else if (mt === 'sticker') k = 'sticker';
      else if (mt === 'audio_file') k = 'voice';
      else if (m.photo) k = 'image';
      else if (m.file || mt) k = 'other';
      const x = tgText(m.text).trim();
      if (!x && !k) continue;
      let a = idx.get(who);
      if (a === undefined) { a = authors.length; authors.push(who); idx.set(who, a); }
      msgs.push({ t: Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +dm[4], +dm[5], dm[6] ? +dm[6] : 0), a, x, k });
    }
    return { format: 'telegram', authors, msgs, title: obj.name || null, dateOrder: 'ymd', system: 0 };
  }

  function titleFromFilename(fn) {
    if (!fn) return null;
    let b = String(fn).split(/[\\/]/).pop().replace(/\.(txt|zip|json)$/i, '');
    const m = /^(?:WhatsApp Chat with|WhatsApp Chat mit|Chat WhatsApp con|Chat de WhatsApp con|Conversa do WhatsApp com|Discussion WhatsApp avec)\s+(.+?)(?:\s*\(\d+\))?$/i.exec(b);
    if (m) return m[1];
    return null;
  }

  function parse(text, filename) {
    text = text.replace(/^\ufeff/, '');
    const head = text.slice(0, 3000).trimStart();
    let res = null;
    if (head[0] === '{' || /^\[\s*\{/.test(head)) {
      try { res = parseTelegram(JSON.parse(text)); } catch (e) { res = null; }
    }
    if (!res) res = parseWA(text);
    if (!res.title) res.title = titleFromFilename(filename);
    const ms = res.msgs;
    let sorted = true;
    for (let i = 1; i < ms.length; i++) if (ms[i].t < ms[i - 1].t) { sorted = false; break; }
    if (!sorted) ms.sort((p, q) => p.t - q.t);
    return res;
  }

  return { parse, parseWA, parseTelegram, mediaKind };
});
