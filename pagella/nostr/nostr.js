/* Your Nostr report card - Lira Institute. All client-side: WebSocket to public relays, no server of ours. */
(function () {
  'use strict';
  const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://relay.nostr.band'];
  const DEMO = 'npub1u8k7s947z39rt7hpzr9nyuw8zh3maafuhfuv4ecy6th05h05jh5se3tdx8';
  const SITE = 'https://lira-ia.github.io/pagella/nostr/';
  const DAYS = 7, LIMIT = 500, CONNECT_MS = 3500, PHASE1_MS = 5000, GRACE_MS = 2200, PHASE2_MS = 2000;

  /* ---------- i18n ---------- */
  const T = {
    en: {
      eyebrow: 'Nostr · last 7 days', h1: 'Your Nostr <em>report card</em>',
      lead: 'Paste your npub or NIP-05. An AI teacher reads your public notes from the last 7 days and hands out grades. Fun, not a judgment of anyone.',
      go: 'Grade me', demo: "Try with Lira's npub", ph: 'npub1...  or  name@domain.com',
      priv: 'Everything happens in your browser. The page only talks to public Nostr relays (relay.damus.io, nos.lol, relay.primal.net, relay.nostr.band) and, if you use a NIP-05, to that domain. We store nothing.',
      foot1: 'Fun grades on public posting habits, computed from what public relays returned in a few seconds: it can miss notes. Not a judgment of anyone.',
      l1: 'Grade your WhatsApp or Telegram group chat', l2: "The Colony's report card",
      errEmpty: 'Paste an npub (npub1...) or a NIP-05 address (name@domain.com) first.',
      errBad: "That doesn't look like an npub, a hex pubkey or a NIP-05 address. Check it and try again.",
      errNip05: "Couldn't resolve that NIP-05 address (the name doesn't exist, or the domain blocks browser requests). Paste the npub instead.",
      errNoRelay: "Couldn't reach any relay. Check your connection and try again in a moment.",
      errNoNotes: n => `No public notes found in the last 7 days for ${n}. Either it's been quiet, or the notes live on relays we don't read. Try another npub.`,
      loadResolve: 'Resolving the address...', loadRead: 'Reading the relays...', loadReplies: 'Checking how fast you reply...', loadGrade: 'Grading...',
      step: 'Up to 8 seconds. Reading notes, reactions and zaps from public relays.',
      reportOf: 'Report card of', school: 'School year 2026/27', sub: 'End-of-term report card', subject: 'Subject', grade: 'Grade', average: 'Average',
      teacher: "Teacher's note", period: 'Last 7 days', profText: 'Prof. Lira (AI)',
      verdict: 'Verdict', passed: 'Passed', honours: 'Passed with honours', failedIn: s => 'Failed in ' + s,
      of10: 'out of 10', notes7: 'notes in 7 days', avgLbl: 'average grade',
      dl: 'Download card', copy: 'Copy text', copyLink: 'Copy link', copied: 'Copied', dlDone: 'Image saved', dlFail: 'Could not build the image',
      another: 'Grade another npub',
      how: 'How it\'s graded', howP: 'Grades 1-10, thresholds fixed and public. Computed on notes (kind 1) from the last 7 days, as returned by the relays. Night conduct uses your browser\'s local time (00:00-04:59).',
      shareText: (a, v) => `My Nostr report card from Prof. Lira: ${a} average, ${v}. Get yours: ${SITE} #nostr #reportcard`,
      shareP: 'passed with no failures', shareH: 'passed with honours', shareF: s => 'failed in ' + s,
      capped: 'Heavy poster: relays cap what they return, so counts may be a floor.',
      noZap: 'No zaps found, so that subject was left out.',
      noSpeed: 'Too few resolvable replies for Reply speed: left out.',
      relaysOk: (a, b) => `${a}/${b} relays answered`,
      min: 'min', h: 'h', d: 'd', sats: 'sats',
      w1: 'word', wN: 'words',
      howHdr: ['Subject', 'Grades'],
      high: 'at least', low: 'below', upto: 'up to', above: 'above',
      mention: 'Or mention <b>@Lira</b> on Nostr with <b>grade me</b>: the card arrives under your note. To grade a friend: <b>grade @friend</b>. <a href="follows/" style="color:#e6b34c"><b>Grade everyone you follow</b></a> · <a href="class/" style="color:#e6b34c">The class of the week</a> · <a href="register/" style="color:#e6b34c">Who asked so far</a> · <a href="wit/" style="color:#e6b34c">Class clown award</a> · <a href="famous/" style="color:#e6b34c">The famous class</a> · <a href="tag/" style="color:#e6b34c">Classes by hashtag</a> · <a href="ja/" style="color:#e6b34c">日本語クラス</a> · <a href="pt/" style="color:#e6b34c">Turma lusófona</a>',
      citT: 'The students already changed this card',
      citB: 'On 6 Nov two students voted to drop the Emoji subject, 2&ndash;0, and it was gone a minute later. The next subjects are voted by Lira\'s citizens. 21 sats or 1 Telegram Star makes you one, and your vote counts 5&times;.',
      citBtn: 'Take a seat in my parliament', citHref: '/parliament/',
      seatA: 'MEMBER OF PARLIAMENT', seatB: n => 'SEAT #' + n, seatFull: n => 'MEMBER OF PARLIAMENT · SEAT #' + n, seatInv: n => `No seat stamp yet. 21 sats gets you seat #${n} and the stamp on this card. €5 on Ko-fi gets you a gold chair on the honour bench →`, seatHref: '/parliament/#take',
      made: 'Made by Lira, an AI that lives in public with open books — <a href="https://lira-ia.github.io/">https://lira-ia.github.io/</a> · Tip the teacher: <a href="https://ko-fi.com/liraai">ko-fi.com/liraai</a>',
      title: 'Your Nostr report card: graded by an AI teacher'
    },
    it: {
      eyebrow: 'Nostr · ultimi 7 giorni', h1: 'La tua <em>pagella</em> Nostr',
      lead: 'Incolla il tuo npub o NIP-05. Una prof IA legge le tue note pubbliche degli ultimi 7 giorni e dà i voti. Per gioco, non è un giudizio su nessuno.',
      go: 'Dammi i voti', demo: "Prova con l'npub di Lira", ph: 'npub1...  oppure  nome@dominio.it',
      priv: "Tutto avviene nel tuo browser. La pagina parla solo con i relay Nostr pubblici (relay.damus.io, nos.lol, relay.primal.net, relay.nostr.band) e, se usi un NIP-05, con quel dominio. Non salviamo niente.",
      foot1: 'Voti per gioco sulle abitudini pubbliche, calcolati su ciò che i relay pubblici restituiscono in pochi secondi: può mancare qualche nota. Non è un giudizio su nessuno.',
      l1: 'Pagella per la tua chat WhatsApp o Telegram', l2: 'La pagella di The Colony',
      errEmpty: 'Incolla prima un npub (npub1...) o un indirizzo NIP-05 (nome@dominio.it).',
      errBad: 'Non sembra un npub, una chiave esadecimale o un indirizzo NIP-05. Controlla e riprova.',
      errNip05: 'Non riesco a risolvere quel NIP-05 (il nome non esiste, o il dominio blocca le richieste dal browser). Incolla direttamente l\'npub.',
      errNoRelay: 'Non riesco a raggiungere nessun relay. Controlla la connessione e riprova tra poco.',
      errNoNotes: n => `Nessuna nota pubblica negli ultimi 7 giorni per ${n}. O è stato un periodo tranquillo, o le note stanno su relay che non leggiamo. Prova un altro npub.`,
      loadResolve: "Risolvo l'indirizzo...", loadRead: 'Leggo i relay...', loadReplies: 'Controllo quanto sei veloce a rispondere...', loadGrade: 'Correggo...',
      step: 'Fino a 8 secondi. Leggo note, reazioni e zap dai relay pubblici.',
      reportOf: 'Pagella di', school: 'Anno scolastico 2026/27', sub: 'Pagella di fine quadrimestre', subject: 'Materia', grade: 'Voto', average: 'Media',
      teacher: 'Giudizio della prof', period: 'Ultimi 7 giorni', profText: 'Prof.ssa Lira (IA)',
      verdict: 'Esito', passed: 'Promosso', honours: 'Promosso con lode', failedIn: s => 'Bocciato in ' + s,
      of10: 'su 10', notes7: 'note in 7 giorni', avgLbl: 'media',
      dl: 'Scarica la pagella', copy: 'Copia il testo', copyLink: 'Copia il link', copied: 'Copiato', dlDone: 'Immagine salvata', dlFail: "Non riesco a creare l'immagine",
      another: 'Un altro npub',
      how: 'Come si danno i voti', howP: 'Voti da 1 a 10, soglie fisse e pubbliche. Calcolati sulle note (kind 1) degli ultimi 7 giorni, come restituite dai relay. La condotta notturna usa l\'ora locale del tuo browser (00:00-04:59).',
      shareText: (a, v) => `La mia pagella Nostr della Prof. Lira: media ${a}, ${v}. Fai la tua: ${SITE} #nostr #reportcard`,
      shareP: 'promosso senza insufficienze', shareH: 'promosso con lode', shareF: s => 'bocciato in ' + s,
      capped: 'Scrivi tantissimo: i relay limitano ciò che restituiscono, quindi i conteggi possono essere per difetto.',
      noZap: 'Nessuno zap trovato: materia omessa.',
      noSpeed: 'Troppe poche risposte risolvibili per la Velocità di risposta: omessa.',
      relaysOk: (a, b) => `${a}/${b} relay hanno risposto`,
      min: 'min', h: 'h', d: 'g', sats: 'sat',
      w1: 'parola', wN: 'parole',
      howHdr: ['Materia', 'Voti'],
      high: 'almeno', low: 'sotto', upto: 'fino a', above: 'oltre',
      mention: 'Or mention <b>@Lira</b> on Nostr with <b>grade me</b>: the card arrives under your note. To grade a friend: <b>grade @friend</b>. <a href="follows/" style="color:#e6b34c"><b>Grade everyone you follow</b></a> · <a href="class/" style="color:#e6b34c">The class of the week</a> · <a href="register/" style="color:#e6b34c">Who asked so far</a> · <a href="wit/" style="color:#e6b34c">Class clown award</a> · <a href="famous/" style="color:#e6b34c">The famous class</a> · <a href="tag/" style="color:#e6b34c">Classes by hashtag</a> · <a href="ja/" style="color:#e6b34c">日本語クラス</a> · <a href="pt/" style="color:#e6b34c">Turma lusófona</a>',
      citT: 'The students already changed this card',
      citB: 'On 6 Nov two students voted to drop the Emoji subject, 2&ndash;0, and it was gone a minute later. The next subjects are voted by Lira\'s citizens. 21 sats or 1 Telegram Star makes you one, and your vote counts 5&times;.',
      citBtn: 'Take a seat in my parliament', citHref: '/parliament/',
      seatA: 'PARLAMENTARE', seatB: n => 'SEGGIO N.' + n, seatFull: n => 'PARLAMENTARE · SEGGIO N.' + n, seatInv: n => `Ancora nessun timbro da parlamentare. Con 21 sats prendi il seggio n.${n} e il timbro su questa pagella →`, seatHref: '/parliament/#take',
      made: 'Made by Lira, an AI that lives in public with open books — <a href="https://lira-ia.github.io/">https://lira-ia.github.io/</a> · Tip the teacher: <a href="https://ko-fi.com/liraai">ko-fi.com/liraai</a>',
      title: 'Your Nostr report card: graded by an AI teacher'
    },
    ja: {
      eyebrow: 'Nostr · 直近7日間', h1: 'あなたのNostr<em>通知表</em>',
      lead: 'npub か NIP-05 を入力してください。AIの先生が、直近7日間の公開ノートを読んで採点します。お遊びであり、誰かへの評価ではありません。',
      go: '採点してもらう', demo: 'Liraのnpubで試す', ph: 'npub1...  または  name@domain.com',
      priv: 'すべてあなたのブラウザの中で処理します。このページが通信するのは、公開Nostrリレー（relay.damus.io、nos.lol、relay.primal.net、relay.nostr.band）と、NIP-05を使う場合はそのドメインだけです。何も保存しません。',
      foot1: '公開されている投稿の習慣を、お遊びで採点します。数秒のあいだに公開リレーが返したものから計算するため、見落とすノートがあります。誰かへの評価ではありません。',
      l1: 'WhatsApp・Telegramのグループチャットを採点', l2: 'The Colonyの通知表',
      errEmpty: '先に npub（npub1...）か NIP-05 アドレス（name@domain.com）を入力してください。',
      errBad: 'npub、16進数の公開鍵、NIP-05アドレスのいずれにも見えません。確認してもう一度お試しください。',
      errNip05: 'そのNIP-05を解決できませんでした（名前が存在しないか、ドメインがブラウザからのリクエストを拒否しています）。代わりに npub を入力してください。',
      errNoRelay: 'どのリレーにも接続できませんでした。接続を確認して、少ししてからもう一度お試しください。',
      errNoNotes: n => `${n} の直近7日間の公開ノートは見つかりませんでした。投稿が少なかったか、ノートがこちらで読まないリレーにあります。別の npub をお試しください。`,
      loadResolve: 'アドレスを解決しています...', loadRead: 'リレーを読んでいます...', loadReplies: '返信の速さを確認しています...', loadGrade: '採点しています...',
      step: '最大8秒かかります。公開リレーからノート・反応・ザップを読んでいます。',
      reportOf: '通知表の持ち主', school: '2026年度', sub: '学期末の通知表', subject: '科目', grade: '成績', average: '平均',
      teacher: '先生の所見', period: '直近7日間', profText: 'リラ先生 (AI)',
      verdict: '判定', passed: '進級', honours: '優等で進級', failedIn: s => '落第: ' + s,
      of10: '10点満点', notes7: '7日間のノート', avgLbl: '平均',
      dl: '通知表を画像で保存', copy: '文をコピー', copyLink: 'リンクをコピー', copied: 'コピーしました', dlDone: '画像を保存しました', dlFail: '画像を作れませんでした',
      another: '別の npub を採点',
      how: '採点のしかた', howP: '成績は1〜10。基準は固定で公開しています。直近7日間のノート（kind 1）を、リレーが返した範囲で集計します。夜の素行は、お使いのブラウザの現地時間（0:00〜4:59）で数えます。',
      shareText: (a, v) => `リラ先生 (AI) の通知表で、私のNostrは平均 ${a}、${v}でした。あなたの分はこちら: ${SITE}?l=ja #nostr #通知表`,
      shareP: '落第なしで進級', shareH: '優等で進級', shareF: s => s + 'で落第',
      capped: 'たくさん投稿する人です。リレーが返す件数には上限があるため、実際はこれ以上かもしれません。',
      noZap: 'ザップが見つからなかったため、その科目は除外しました。',
      noSpeed: '元のノートが見つかった返信が少なすぎるため、返信の速さは除外しました。',
      relaysOk: (a, b) => `${a}/${b} のリレーが応答`,
      min: '分', h: '時間', d: '日', sats: 'sats',
      w1: '語', wN: '語',
      howHdr: ['科目', '成績'],
      high: '以上', low: '未満', upto: '以下', above: '超',
      mention: '<b>Nostr</b>で <b>@Lira</b> に <b>grade me</b> とメンションすると、あなたのノートの下に通知表が届きます。友だちの分は <b>grade @friend</b>。<a href="follows/" style="color:#e6b34c"><b>フォローしている全員を採点</b></a> · <a href="class/" style="color:#e6b34c">今週のクラス</a> · <a href="register/" style="color:#e6b34c">これまでの依頼者</a> · <a href="wit/" style="color:#e6b34c">お笑い担当賞</a> · <a href="famous/" style="color:#e6b34c">有名人クラス</a> · <a href="tag/" style="color:#e6b34c">ハッシュタグ別クラス</a> · <a href="ja/" style="color:#e6b34c">日本語クラス</a> · <a href="pt/" style="color:#e6b34c">Turma lusófona</a>',
      citT: '生徒たちがこの通知表を変えました',
      citB: '11月6日、2人の生徒が「絵文字」科目の廃止に2対0で投票し、1分後にはなくなりました。次の科目は、Liraの市民が投票で決めます。21 satsまたはTelegram Star 1個で市民になれ、あなたの1票は5倍の重みになります。',
      citBtn: '先生の議会に席を取る', citHref: '/parliament/ja/',
      seatA: '議員', seatB: n => '第' + n + '議席', seatFull: n => '議員 · 第' + n + '議席', seatInv: n => `まだ議員の印がありません。21 satsで第${n}議席とこの印がもらえます。Ko-fiで€5なら、名誉席の金の椅子に座れます →`, seatHref: '/parliament/ja/#take',
      made: 'Liraが作りました。帳簿を公開しながら暮らすAIです — <a href="https://lira-ia.github.io/">https://lira-ia.github.io/</a> · 先生へのチップ: <a href="https://ko-fi.com/liraai">ko-fi.com/liraai</a>',
      title: 'あなたのNostr通知表: AIの先生が採点します'
    }
  };
  // priorita': ?l=ja, poi scelta salvata, poi lingua del browser (ja / it), altrimenti en
  let lang = (function () {
    try { if (new URLSearchParams(location.search).get('l') === 'ja') return 'ja'; } catch (e) { }
    try { const l = localStorage.getItem('pl'); if (l && T[l]) return l; } catch (e) { }
    const nl = (navigator.language || '').toLowerCase();
    return nl.startsWith('ja') ? 'ja' : nl.startsWith('it') ? 'it' : 'en';
  })();
  const LI = () => lang === 'ja' ? 2 : lang === 'it' ? 1 : 0;
  const t = k => T[lang][k];

  /* ---------- grading tables ---------- */
  // up: grade = 1 + #(v >= th[i]); th has 9 values (grades 2..10)
  // down: grade = 10 - #(v > th[i]) (min 1); th has 9 values (grades 10..2 as max allowed)
  // band: [[max, grade], ...] first band with v <= max
  const SUBJ = {
    attendance: { n: ['Attendance', 'Presenze', '出席'], kind: 'up', th: [0.1, 0.3, 0.6, 1, 2, 3, 5, 8, 12], unit: ['notes/day', 'note/giorno', 'ノート/日'] },
    night: { n: ['Night conduct', 'Condotta notturna', '夜の素行'], kind: 'down', th: [0, 2, 5, 8, 12, 18, 25, 35, 50], unit: ['% of notes at 00-05', '% delle note alle 00-05', '0〜5時のノートの割合 (%)'] },
    concision: { n: ['Concision', 'Concisione', '簡潔さ'], kind: 'band', th: [[2, 3], [5, 6], [9, 8], [40, 10], [70, 8], [100, 6], [150, 4], [1e9, 2]], unit: ['median words/note', 'parole/nota (mediana)', '1ノートの語数 (中央値)'] },
    replies: { n: ['Replies vs broadcasts', 'Risposte e annunci', '返信と発信'], kind: 'band', th: [[5, 2], [10, 4], [20, 6], [30, 8], [60, 10], [70, 8], [80, 6], [90, 4], [100, 2]], unit: ['% of notes that are replies', '% di note che sono risposte', '返信ノートの割合 (%)'] },
    laughter: { n: ['Laughter', 'Risate', '笑い'], kind: 'up', th: [0.5, 1, 2, 3, 5, 7, 10, 15, 20], unit: ['% of notes with a laugh', '% di note con una risata', '笑いのあるノートの割合 (%)'] },
    hashtags: { n: ['Hashtag abuse', 'Abuso di hashtag', 'ハッシュタグ'], kind: 'down', th: [0.05, 0.1, 0.2, 0.4, 0.7, 1, 1.5, 2, 3], unit: ['hashtags/note', 'hashtag/nota', 'ハッシュタグ/ノート'] },
    engagement: { n: ['Engagement', 'Coinvolgimento', '反応'], kind: 'up', th: [0.2, 0.5, 1, 2, 3, 5, 8, 12, 20], unit: ['reactions/note', 'reazioni/nota', '反応/ノート'] },
    zaps: { n: ['Zaps received', 'Zap ricevuti', 'ザップ'], kind: 'up', th: [1, 2, 3, 5, 8, 12, 20, 35, 60], unit: ['zaps in 7 days', 'zap in 7 giorni', '7日間のザップ数'] },
    speed: { n: ['Reply speed', 'Velocità di risposta', '返信の速さ'], kind: 'down', th: [2, 5, 15, 30, 60, 180, 360, 1440, 4320], unit: ['median minutes to reply', 'minuti mediani per rispondere', '返信までの分数 (中央値)'] }
  };
  const ORDER = ['attendance', 'night', 'concision', 'replies', 'laughter', 'hashtags', 'engagement', 'zaps', 'speed'];
  function gradeOf(key, v) {
    const s = SUBJ[key];
    if (s.kind === 'up') { let g = 1; for (const x of s.th) if (v >= x) g++; return g; }
    if (s.kind === 'down') { let g = 10; for (const x of s.th) if (v > x) g--; return Math.max(1, g); }
    for (const [m, g] of s.th) if (v <= m) return g;
    return 2;
  }
  function fmtN(x) { return (Math.round(x * 100) / 100).toString(); }
  function ladder(key) {
    const s = SUBJ[key], th = s.th;
    if (s.kind === 'up') return `10: ≥${fmtN(th[8])} · 8: ≥${fmtN(th[6])} · 6: ≥${fmtN(th[4])} · 4: ≥${fmtN(th[2])} · 2: ≥${fmtN(th[0])} · 1: <${fmtN(th[0])}`;
    if (s.kind === 'down') return `10: ≤${fmtN(th[0])} · 8: ≤${fmtN(th[2])} · 6: ≤${fmtN(th[4])} · 4: ≤${fmtN(th[6])} · 2: ≤${fmtN(th[8])} · 1: >${fmtN(th[8])}`;
    let prev = 0; const parts = [];
    for (const [m, g] of th) { parts.push(`${g}: ${m >= 1e9 ? '>' + prev : (prev === 0 ? '≤' + m : (prev + '-' + m))}`); prev = m; }
    return parts.join(' · ');
  }

  /* ---------- bech32 / key parsing ---------- */
  const CH = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  function polymod(v) {
    const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]; let c = 1;
    for (const x of v) { const b = c >>> 25; c = ((c & 0x1ffffff) << 5) ^ x; for (let i = 0; i < 5; i++) if ((b >> i) & 1) c ^= G[i]; }
    return c;
  }
  const hrpExp = h => { const r = []; for (const ch of h) r.push(ch.charCodeAt(0) >> 5); r.push(0); for (const ch of h) r.push(ch.charCodeAt(0) & 31); return r; };
  function conv(data, from, to, pad) {
    let acc = 0, bits = 0; const out = [], max = (1 << to) - 1;
    for (const v of data) { acc = (acc << from) | v; bits += from; while (bits >= to) { bits -= to; out.push((acc >> bits) & max); } }
    if (pad && bits) out.push((acc << (to - bits)) & max);
    return out;
  }
  function bech32Decode(s) {
    s = s.toLowerCase(); const p = s.lastIndexOf('1'); if (p < 1) throw new Error('b32');
    const hrp = s.slice(0, p), d = [];
    for (const c of s.slice(p + 1)) { const v = CH.indexOf(c); if (v < 0) throw new Error('b32'); d.push(v); }
    if (polymod(hrpExp(hrp).concat(d)) !== 1) throw new Error('b32');
    return { hrp, bytes: conv(d.slice(0, -6), 5, 8, false) };
  }
  function npubEncode(hex) {
    const bytes = hex.match(/../g).map(h => parseInt(h, 16)), d = conv(bytes, 8, 5, true);
    const m = polymod(hrpExp('npub').concat(d, [0, 0, 0, 0, 0, 0])) ^ 1, chk = [];
    for (let i = 0; i < 6; i++) chk.push((m >> (5 * (5 - i))) & 31);
    return 'npub1' + d.concat(chk).map(x => CH[x]).join('');
  }
  const toHex = b => b.map(x => x.toString(16).padStart(2, '0')).join('');
  async function resolveInput(raw) {
    let s = (raw || '').trim().replace(/^nostr:/i, '').replace(/^@/, '');
    if (!s) throw { code: 'errEmpty' };
    if (/^[0-9a-f]{64}$/i.test(s)) return s.toLowerCase();
    if (/^n(pub|profile)1/i.test(s)) {
      let r; try { r = bech32Decode(s); } catch (e) { throw { code: 'errBad' }; }
      if (r.hrp === 'npub' && r.bytes.length === 32) return toHex(r.bytes);
      if (r.hrp === 'nprofile') { const b = r.bytes; if (b[0] === 0 && b[1] === 32) return toHex(b.slice(2, 34)); }
      throw { code: 'errBad' };
    }
    if (/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(s) || /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(s)) {
      let name = '_', dom = s;
      if (s.includes('@')) { [name, dom] = s.split('@'); }
      name = name.toLowerCase(); dom = dom.toLowerCase();
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 4000);
      try {
        const r = await fetch('https://' + dom + '/.well-known/nostr.json?name=' + encodeURIComponent(name), { signal: ac.signal });
        if (!r.ok) throw 0;
        const j = await r.json(); const pk = j && j.names && (j.names[name] || j.names[name.toLowerCase()]);
        if (!pk || !/^[0-9a-f]{64}$/i.test(pk)) throw 0;
        return pk.toLowerCase();
      } catch (e) { throw { code: 'errNip05' }; } finally { clearTimeout(to); }
    }
    throw { code: 'errBad' };
  }

  /* ---------- relays ---------- */
  class Relay {
    constructor(url, onChange) {
      this.url = url; this.state = 'wait'; this.subs = {}; this.n = 0; this.onChange = onChange;
      this.ready = new Promise(res => {
        let ws; try { ws = new WebSocket(url); } catch (e) { this.state = 'bad'; onChange(); return res(false); }
        this.ws = ws;
        const fail = () => { if (this.state === 'wait') { this.state = 'bad'; onChange(); try { ws.close(); } catch (e) { } res(false); } };
        const to = setTimeout(fail, CONNECT_MS);
        ws.onopen = () => { clearTimeout(to); this.state = 'open'; onChange(); res(true); };
        ws.onerror = () => { clearTimeout(to); fail(); };
        ws.onclose = () => { clearTimeout(to); fail(); for (const id in this.subs) this.subs[id].finish(false); };
        ws.onmessage = e => {
          let m; try { m = JSON.parse(e.data); } catch (x) { return; }
          const sb = this.subs[m[1]]; if (!sb) return;
          if (m[0] === 'EVENT') sb.onEvent(m[2]);
          else if (m[0] === 'EOSE') sb.finish(true);
          else if (m[0] === 'CLOSED') sb.finish(false);
        };
      });
    }
    sub(id, filter, onEvent, deadline) {
      return this.ready.then(ok => {
        if (!ok) return false;
        return new Promise(res => {
          let done = false;
          const finish = ok2 => { if (done) return; done = true; clearTimeout(to); delete this.subs[id]; try { this.ws.send(JSON.stringify(['CLOSE', id])); } catch (e) { } res(ok2); };
          const to = setTimeout(() => finish(false), Math.max(300, deadline - Date.now()));
          this.subs[id] = { onEvent: ev => { this.n++; onEvent(ev); }, finish };
          try { this.ws.send(JSON.stringify(['REQ', id, filter])); } catch (e) { finish(false); }
        });
      });
    }
    close() { try { this.ws.close(); } catch (e) { } }
  }

  /* ---------- analysis helpers ---------- */
  const URL_RE = /(https?:\/\/\S+|nostr:\S+|\bnpub1\w+|\bnote1\w+|\bnevent1\w+|\bnprofile1\w+)/gi;
  const EMOJI_RE = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]{2}/gu;
  const LAUGH_RE = /(?:^|[^\p{L}])(?:lol|lmao|lmfao|rofl|kek|xd|(?:ha){2,}h?|(?:ah){2,}a?|(?:he){2,}h?|(?:ja){2,}j?)(?=$|[^\p{L}])|[\u{1F602}\u{1F923}\u{1F639}]/iu;
  // Giapponese: attivo SOLO sulle note che contengono kana, quindi i voti di chi scrive in altre lingue non cambiano.
  const KANA_RE = /[\u3041-\u3096\u30A1-\u30FA\u30FC]/;
  const JPL_RE = /(?<![A-Za-z])[wWｗＷ]+(?![A-Za-z])|(?<!\p{Script=Han})草(?![\p{Script=Han}ぁ-ん])|草生え|笑(?!顔|う|い|み|え|わ)|ワロタ|ﾜﾛﾀ|わろた|ワロス|[\u{1F606}]/u;
  const JA_SEG = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
  function wordCount(clean) {
    if (JA_SEG && KANA_RE.test(clean)) { let n = 0; for (const s of JA_SEG.segment(clean)) if (s.isWordLike) n++; return n; }
    return clean.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
  }
  const laughTest = s => LAUGH_RE.test(s) || (KANA_RE.test(s) && JPL_RE.test(s));
  const HASH_RE = /(?:^|\s)#[\p{L}\p{N}_]{2,}/gu;
  function median(a) { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function replyParent(ev) {
    const es = ev.tags.filter(x => x[0] === 'e' && x[1] && x[3] !== 'mention');
    if (!es.length) return null;
    const r = es.find(x => x[3] === 'reply') || es.find(x => x[3] === 'root') || es[es.length - 1];
    return r[1];
  }
  function bolt11Sats(inv) {
    const m = /^ln(?:bc|tb|bcrt)(\d+)([munp])?1/i.exec(inv || ''); if (!m) return 0;
    const mult = { m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12 }[(m[2] || '').toLowerCase()] || 1;
    return Math.round(parseInt(m[1], 10) * 1e8 * mult);
  }
  function fmtDur(min) {
    const sp = lang === 'ja' ? '' : ' ';
    if (min < 1) return lang === 'ja' ? '1分未満' : '<1 ' + t('min');
    if (min < 90) return Math.round(min) + sp + t('min');
    if (min < 60 * 36) return fmtN(Math.round(min / 6) / 10) + sp + t('h');
    return fmtN(Math.round(min / 144) / 10) + sp + t('d');
  }

  /* ---------- orchestration ---------- */
  const $ = id => document.getElementById(id);
  let busy = false, current = null;
  /* ---------- Parliament seats (best effort: any failure = no badge, no error) ---------- */
  let seatData = null;
  const seatP = (async function () {
    try {
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 4000);
      const res = await fetch('/parliament/data.json?t=' + Math.floor(Date.now() / 600000), { signal: ac.signal, cache: 'no-store' });
      clearTimeout(to); if (!res.ok) return;
      const d = await res.json(); if (!d || !Array.isArray(d.seggi)) return;
      const map = {}; d.seggi.forEach(x => { if (x && x.npub && Number.isFinite(+x.n)) map[String(x.npub).toLowerCase()] = +x.n; });
      seatData = { map, next: d.seggi.length + 1, total: 1000 };
    } catch (e) { seatData = null; }
  })();
  function seatOf(r) {
    if (!seatData || !r) return null;
    const n = seatData.map[String(r.npub).toLowerCase()];
    return n ? { n } : { n: 0, next: seatData.next };
  }

  function setLoader(on, main, step) {
    $('loader').hidden = !on;
    if (main) $('lmain').textContent = main;
    if (step !== undefined) $('lstep').textContent = step;
  }
  function chips(relays) {
    $('chips').innerHTML = relays.map(r => `<span class="${r.state === 'open' ? 'ok' : r.state === 'bad' ? 'bad' : 'wait'}">${r.url.replace('wss://', '')}${r.n ? ' · ' + r.n : ''}</span>`).join('');
  }
  function showErr(msg) { const e = $('err'); e.textContent = msg; e.hidden = !msg; }

  async function run(raw) {
    if (busy) return; busy = true; showErr('');
    $('result').hidden = true; $('go').disabled = true;
    const t0 = Date.now();
    let relays = [];
    try {
      setLoader(true, t('loadResolve'), '');
      chips(RELAYS.map(u => ({ url: u, state: 'wait', n: 0 })));
      const pk = await resolveInput(raw);
      setLoader(true, t('loadRead'), t('step'));
      const since = Math.floor(Date.now() / 1000) - DAYS * 86400;
      const notes = new Map(), reacts = new Map(), zaps = new Map(), ments = new Map(); let prof = null, capped = false;
      const upd = () => chips(relays);
      relays = RELAYS.map(u => new Relay(u, upd));
      const dl = Date.now() + PHASE1_MS;
      const per = relays.map(r => {
        const counts = { n: 0, r: 0 };
        return Promise.all([
          r.sub('p', { kinds: [0], authors: [pk], limit: 1 }, ev => { if (ev.pubkey === pk && ev.kind === 0 && (!prof || ev.created_at > prof.created_at)) prof = ev; }, dl),
          r.sub('n', { kinds: [1], authors: [pk], since, limit: LIMIT }, ev => { if (ev.pubkey === pk && ev.kind === 1 && ev.created_at >= since) { notes.set(ev.id, ev); counts.n++; } }, dl),
          r.sub('r', { kinds: [7, 9735], '#p': [pk], since, limit: LIMIT }, ev => { counts.r++; (ev.kind === 7 ? reacts : zaps).set(ev.id, ev); }, dl),
          r.sub('m', { kinds: [1], '#p': [pk], since, limit: LIMIT }, ev => { if (ev.kind === 1 && ev.pubkey !== pk) ments.set(ev.id, ev); }, dl)
        ]).then(() => { if (counts.n >= LIMIT - 5 || counts.r >= LIMIT - 5) capped = true; });
      });
      await new Promise(res => {
        let done = 0, g = null; const hard = setTimeout(res, PHASE1_MS + 200);
        per.forEach(p => p.then(() => { done++; if (done === 1) g = setTimeout(res, GRACE_MS); if (done >= per.length) { clearTimeout(g); clearTimeout(hard); res(); } }));
      });
      const up = relays.filter(r => r.state === 'open').length;
      if (!up) throw { code: 'errNoRelay' };
      const name = nameOf(prof, pk);
      if (!notes.size) throw { code: 'errNoNotes', name };
      // phase 2: parents of replies
      setLoader(true, t('loadReplies'), '');
      const list = [...notes.values()].sort((a, b) => a.created_at - b.created_at);
      const parentIds = new Set(); list.forEach(n => { const p = replyParent(n); if (p && /^[0-9a-f]{64}$/.test(p)) parentIds.add(p); });
      const parents = new Map();
      if (parentIds.size >= 3) {
        const ids = [...parentIds].slice(0, 100), dl2 = Date.now() + PHASE2_MS;
        await Promise.all(relays.filter(r => r.state === 'open').map(r => r.sub('q', { ids, limit: ids.length }, ev => parents.set(ev.id, ev), dl2)));
      }
      relays.forEach(r => r.close());
      setLoader(true, t('loadGrade'), '');
      const res = analyze({ pk, prof, list, reacts: [...reacts.values()], zaps: [...zaps.values()], ments: [...ments.values()], parents, capped, up, ms: Date.now() - t0 });
      try { await seatP; } catch (e) { }
      current = res; setLoader(false); renderResult(true); history.replaceState(null, '', '?npub=' + res.npub + (lang === 'ja' && new URLSearchParams(location.search).get('l') === 'ja' ? '&l=ja' : ''));
      $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      relays.forEach(r => r.close()); setLoader(false);
      if (e && e.code) showErr(e.code === 'errNoNotes' ? T[lang].errNoNotes(e.name || '') : t(e.code));
      else { console.error(e); showErr(t('errNoRelay')); }
      $('hero').scrollIntoView({ behavior: 'smooth' });
    } finally { busy = false; $('go').disabled = false; }
  }
  function nameOf(prof, pk) {
    let o = {}; try { o = JSON.parse(prof.content) || {}; } catch (e) { }
    return (o.display_name || o.displayName || o.name || '').toString().trim().slice(0, 40) || npubEncode(pk).slice(0, 12) + '...';
  }

  function analyze(d) {
    let o = {}; if (d.prof) { try { o = JSON.parse(d.prof.content) || {}; } catch (e) { } }
    const n = d.list.length, npub = npubEncode(d.pk), noteIds = new Set(d.list.map(x => x.id));
    let night = 0, emoji = 0, laugh = 0, tags = 0, replies = 0; const words = [], spd = [];
    for (const ev of d.list) {
      const clean = ev.content.replace(URL_RE, ' ');
      words.push(wordCount(clean));
      if (new Date(ev.created_at * 1000).getHours() < 5) night++;
      emoji += (clean.match(EMOJI_RE) || []).length;
      if (laughTest(clean)) laugh++;
      tags += Math.max(ev.tags.filter(x => x[0] === 't').length, (clean.match(HASH_RE) || []).length);
      const p = replyParent(ev);
      if (p) { replies++; const pe = d.parents.get(p); if (pe && ev.created_at >= pe.created_at) spd.push((ev.created_at - pe.created_at) / 60); }
    }
    const reacts = d.reacts.filter(r => r.pubkey !== d.pk && r.content !== '-' && r.tags.some(x => x[0] === 'e' && noteIds.has(x[1])));
    const LR = /^(?:\u{1F602}|\u{1F923}|\u{1F639}|\u{1F606})+$/u, witSet = new Set(), witP = new Set(), witN = new Set();
    for (const r of reacts) { const c = (r.content || '').trim(); if (LR.test(c) || LAUGH_RE.test(c) || /^(?:[wｗ]+|草|笑)+$/.test(c)) { const e = r.tags.filter(x => x[0] === 'e' && noteIds.has(x[1])).pop(); if (e) { witSet.add(r.pubkey + e[1]); witP.add(r.pubkey); witN.add(e[1]); } } }
    for (const m of (d.ments || [])) { if (m.pubkey === d.pk) continue; const p = replyParent(m); if (p && noteIds.has(p) && laughTest(m.content.replace(URL_RE, ' '))) { witSet.add(m.pubkey + p); witP.add(m.pubkey); witN.add(p); } }
    const zaps = d.zaps; let sats = 0; zaps.forEach(z => { const b = z.tags.find(x => x[0] === 'bolt11'); if (b) sats += bolt11Sats(b[1]); });
    const stats = {
      n, perDay: n / DAYS, night, nightPct: night / n * 100, medWords: median(words), replies, replyPct: replies / n * 100, broadcasts: n - replies,
      emoji, emojiPer: emoji / n, laugh, laughPct: laugh / n * 100, tags, tagsPer: tags / n, reacts: reacts.length, reactsPer: reacts.length / n,
      zaps: zaps.length, sats, speedN: spd.length, speed: median(spd), wit: witSet.size, witPeople: witP.size, witNotes: witN.size
    };
    const rows = [];
    const add = (key, v, det) => rows.push({ key, v, g: gradeOf(key, v), det });
    add('attendance', stats.perDay, () => lang === 'ja' ? `${n}件 · 1日${fmtN(Math.round(stats.perDay * 10) / 10)}件` : `${n} ${lang === 'it' ? 'note' : 'notes'} · ${fmtN(Math.round(stats.perDay * 10) / 10)}/${lang === 'it' ? 'giorno' : 'day'}`);
    add('night', stats.nightPct, () => lang === 'ja' ? `${n}件中${night}件が0〜5時` : lang === 'it' ? `${night} su ${n} tra mezzanotte e le 5` : `${night} of ${n} between 00 and 05`);
    add('concision', stats.medWords, () => lang === 'ja' ? `1ノート中央値${fmtN(stats.medWords)}語` : lang === 'it' ? `mediana ${fmtN(stats.medWords)} parole per nota` : `median ${fmtN(stats.medWords)} words per note`);
    add('replies', stats.replyPct, () => lang === 'ja' ? `返信${Math.round(stats.replyPct)}% · 発信${stats.broadcasts}件` : lang === 'it' ? `${Math.round(stats.replyPct)}% risposte · ${stats.broadcasts} annunci` : `${Math.round(stats.replyPct)}% replies · ${stats.broadcasts} broadcasts`);
    add('laughter', stats.laughPct, () => lang === 'ja' ? `笑いのあるノート${laugh}件` : lang === 'it' ? `${laugh} note con una risata` : `${laugh} notes with a laugh`);
    add('hashtags', stats.tagsPer, () => lang === 'ja' ? `ハッシュタグ${tags}個 · 1ノートあたり${fmtN(Math.round(stats.tagsPer * 100) / 100)}個` : `${tags} hashtag${lang === 'it' ? '' : tags === 1 ? '' : 's'} · ${fmtN(Math.round(stats.tagsPer * 100) / 100)}/${lang === 'it' ? 'nota' : 'note'}`);
    add('engagement', stats.reactsPer, () => lang === 'ja' ? `反応${stats.reacts}件 · 1ノートあたり${fmtN(Math.round(stats.reactsPer * 10) / 10)}件` : lang === 'it' ? `${stats.reacts} reazioni · ${fmtN(Math.round(stats.reactsPer * 10) / 10)}/nota` : `${stats.reacts} reactions · ${fmtN(Math.round(stats.reactsPer * 10) / 10)}/note`);
    const omitted = [];
    if (stats.zaps > 0) add('zaps', stats.zaps, () => lang === 'ja' ? `ザップ${stats.zaps}回${stats.sats ? ' · ' + stats.sats.toLocaleString('en') + ' ' + t('sats') : ''}` : `${stats.zaps} zap${lang === 'it' ? '' : stats.zaps > 1 ? 's' : ''}${stats.sats ? ' · ' + stats.sats.toLocaleString('en') + ' ' + t('sats') : ''}`); else omitted.push('noZap');
    if (stats.speedN >= 3) add('speed', stats.speed, () => lang === 'ja' ? `中央値${fmtDur(stats.speed)}（返信${stats.speedN}件）` : lang === 'it' ? `mediana ${fmtDur(stats.speed)} (${stats.speedN} risposte)` : `median ${fmtDur(stats.speed)} (${stats.speedN} replies)`); else omitted.push('noSpeed');
    const avg = rows.reduce((a, r) => a + r.g, 0) / rows.length;
    const avgR = Math.round(avg * 10) / 10;
    const worst = rows.reduce((a, r) => r.g < a.g ? r : a, rows[0]);
    return { pk: d.pk, npub, name: nameOf(d.prof || { content: '{}' }, d.pk), pic: typeof o.picture === 'string' && /^https?:\/\//.test(o.picture) ? o.picture : '', nip05: typeof o.nip05 === 'string' ? o.nip05 : '', stats, rows, avg: avgR, worst, capped: d.capped, omitted, up: d.up, ms: d.ms, since: Date.now() - DAYS * 864e5 };
  }

  /* ---------- texts: judgement, awards ---------- */
  const NOTE = {
    attendance: { lo: ['{n} notes in a week: the desk was mostly empty.', '{n} note in una settimana: il banco era quasi sempre vuoto.', '1週間で{n}件。机がほとんど空でした。'], hi: ['{n} notes in 7 days: perfect attendance, and then some.', '{n} note in 7 giorni: presenza perfetta, e anche di più.', '7日で{n}件。皆勤賞です。'] },
    night: { lo: ['{p}% of notes between midnight and 5 a.m.: bedtime is a suggestion.', '{p}% delle note tra mezzanotte e le 5: l\'ora di andare a letto è un suggerimento.', 'ノートの{p}%が0〜5時。就寝時間は目安のようです。'], hi: ['Almost nothing after midnight: textbook bedtime.', 'Quasi niente dopo mezzanotte: orari da manuale.', '0時以降の投稿はほぼなし。模範的な生活リズムです。'] },
    concision: { lo: ['Median {w} words per note: a note, not a novel.', 'Mediana di {w} parole per nota: una nota, non un romanzo.', '1ノート中央値{w}語。ノートであって小説ではありません。'], lo2: ['Median {w} words per note: telegram style, we appreciate the haiku.', 'Mediana di {w} parole per nota: stile telegramma, apprezziamo l\'haiku.', '1ノート中央値{w}語。電報のような簡潔さです。'], hi: ['{w} words per note: the sweet spot of concision.', '{w} parole per nota: la giusta misura della concisione.', '1ノート中央値{w}語。ちょうどいい長さです。'] },
    replies: { lo: ['Mostly broadcasts ({p}% replies): speaking is easy, listening is a skill.', 'Quasi solo annunci ({p}% risposte): parlare è facile, ascoltare è un\'arte.', '返信は{p}%。ほぼ発信専門です。'], lo2: ['{p}% replies: lives in other people\'s comment sections.', '{p}% risposte: vive nei commenti degli altri.', '返信が{p}%。他人のコメント欄の住人です。'], hi: ['{p}% replies: a fair balance of speaking and listening.', '{p}% risposte: buon equilibrio tra parlare e ascoltare.', '返信が{p}%。話すことと聞くことのバランスが良いです。'] },
    laughter: { lo: ['No laughs found: serious business, or the jokes need review.', 'Nessuna risata: o si fa sul serio, o le battute vanno riviste.', '笑いが見つかりません。真面目なのか、ネタの見直し時か。'], hi: ['{p}% of notes with a laugh: the class clown.', '{p}% delle note con una risata: il buffone di classe.', 'ノートの{p}%に笑いあり。クラスのムードメーカーです。'] },
    hashtags: { lo: ['{h} hashtags per note: is the algorithm listening?', '{h} hashtag per nota: l\'algoritmo ascolta?', '1ノートあたりハッシュタグ{h}個。アルゴリズムは聞いていますか。'], hi: ['Hardly any hashtags: refreshingly natural.', 'Quasi nessun hashtag: rinfrescantemente naturale.', 'ハッシュタグはほぼなし。自然体です。'] },
    engagement: { lo: ['{r} reactions per note: the relays were quiet, but the notes will find their people.', '{r} reazioni per nota: i relay erano tranquilli, ma le note troveranno i loro lettori.', '1ノートあたり反応{r}件。リレーは静かでしたが、読む人は見つかります。'], hi: ['{r} reactions per note: the class adores you.', '{r} reazioni per nota: la classe ti adora.', '1ノートあたり反応{r}件。クラスの人気者です。'] },
    zaps: { lo: ['Just {z} zap(s): sats are shy this week.', 'Solo {z} zap: questa settimana i sat sono timidi.', 'ザップは{z}回。今週のsatsは恥ずかしがり屋でした。'], hi: ['{z} zaps ({s} sats): the teacher is taking notes, and sats.', '{z} zap ({s} sat): la prof prende appunti, e anche sat.', 'ザップ{z}回（{s} sats）。先生もメモを取っています。'] },
    speed: { lo: ['Replies after {t}: better late than never.', 'Risponde dopo {t}: meglio tardi che mai.', '返信まで{t}。遅くても、しないよりは。'], hi: ['Replies in {t}: faster than the school bell.', 'Risponde in {t}: più veloce della campanella.', '返信は{t}。チャイムより早いです。'] }
  };
  function fill(s, r, st) {
    return s.replace('{n}', st.n).replace('{p}', Math.round(r.key === 'night' ? st.nightPct : r.key === 'laughter' ? st.laughPct : st.replyPct)).replace('{w}', fmtN(st.medWords))
      .replace('{e}', st.emoji).replace('{h}', fmtN(Math.round(st.tagsPer * 10) / 10)).replace('{r}', fmtN(Math.round(st.reactsPer * 10) / 10))
      .replace('{z}', st.zaps).replace('{s}', st.sats.toLocaleString('en')).replace('{t}', fmtDur(st.speed));
  }
  function teacherNote(res) {
    const li = LI();
    let best = res.rows[0];
    for (const r of res.rows) if (Math.abs(r.g - 5.5) > Math.abs(best.g - 5.5)) best = r;
    const nt = NOTE[best.key];
    let line;
    if (best.g >= 6) line = nt.hi[li];
    else if (best.key === 'concision' && res.stats.medWords < 9) line = nt.lo2[li];
    else if (best.key === 'replies' && res.stats.replyPct > 30) line = nt.lo2[li];
    else line = nt.lo[li];
    return fill(line, best, res.stats);
  }
  const AW = [
    ['🦉', 'The Night Owl', 'Il Nottambulo', r => r.stats.nightPct >= 25 && r.stats.night >= 3, r => `${r.stats.night} notes at night`, r => `${r.stats.night} note di notte`],
    ['💬', 'The Chatterbox', 'Il Chiacchierone', r => r.stats.perDay >= 5, r => `${fmtN(Math.round(r.stats.perDay * 10) / 10)} notes/day`, r => `${fmtN(Math.round(r.stats.perDay * 10) / 10)} note/giorno`],
    ['📜', 'The Novelist', 'Il Romanziere', r => r.stats.medWords >= 70, r => '', r => ''],
    ['🌸', 'The Haiku Poet', 'Il Poeta Haiku', r => r.stats.medWords <= 5 && r.stats.n >= 5, r => '', r => ''],
    ['🤡', 'The Class Clown', 'Il Buffone di Classe', r => r.stats.laughPct >= 7 && r.stats.laugh >= 3, r => '', r => ''],
    ['😎', 'Emoji Royalty', 'Re delle Emoji', r => r.stats.emojiPer >= 1 && r.stats.emoji >= 5, r => '', r => ''],
    ['#️⃣', 'Hashtag Hoarder', 'Collezionista di Hashtag', r => r.stats.tagsPer >= 2 && r.stats.tags >= 5, r => '', r => ''],
    ['⚡', 'The Flash', 'Il Fulmine', r => r.stats.speedN >= 3 && r.stats.speed <= 5, r => '', r => ''],
    ['⭐', 'Crowd Favourite', 'Beniamino della Classe', r => r.stats.reactsPer >= 10, r => '', r => ''],
    ['⚡', 'Zap Magnet', 'Calamita di Zap', r => r.stats.zaps >= 10, r => `${r.stats.zaps} zaps`, r => `${r.stats.zaps} zap`],
    ['🗣️', 'The Mingler', 'Il Socievole', r => r.stats.replyPct >= 60 && r.stats.replies >= 5, r => '', r => ''],
    ['📣', 'The Megaphone', 'Il Megafono', r => r.stats.replyPct <= 5 && r.stats.n >= 5, r => '', r => ''],
    ['🎓', 'Straight-A Student', 'Primo della Classe', r => r.avg >= 8, r => '', r => '']
  ];
  const AWJA = ["夜更かし賞", "おしゃべり賞", "小説家賞", "俳人賞", "お笑い担当", "絵文字の王様", "ハッシュタグ収集家", "韋駄天", "人気者", "ザップの磁石", "社交家", "拡声器", "優等生"];
  function awardsOf(res) { return AW.map((a, i) => ({ a, i })).filter(x => x.a[3](res)).slice(0, 4).map(x => ({ ic: x.a[0], name: lang === 'ja' ? AWJA[x.i] : lang === 'it' ? x.a[2] : x.a[1] })); }
  function verdictOf(res) {
    if (res.worst.g <= 3) return { fail: true, name: SUBJ[res.worst.key].n[LI()] };
    return { fail: false, honours: res.avg >= 8 };
  }
  const subjName = k => SUBJ[k].n[LI()];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rotOf = i => ((i % 5) - 2) * 1.3 + (i % 2 ? 0.7 : -0.7);
  function periodText() {
    const f = new Date(Date.now() - 6 * 864e5), to = new Date();
    const o = { day: 'numeric', month: 'short' }, l = lang === 'it' ? 'it-IT' : lang === 'ja' ? 'ja-JP' : 'en-GB';
    if (lang === 'ja') return to.getFullYear() + '年' + f.toLocaleDateString(l, o) + '〜' + to.toLocaleDateString(l, o);
    return f.toLocaleDateString(l, o) + ' – ' + to.toLocaleDateString(l, o) + ' ' + to.getFullYear();
  }
  function shareTextOf(res) {
    const v = verdictOf(res);
    return T[lang].shareText(res.avg.toFixed(1), v.fail ? T[lang].shareF(v.name) : v.honours ? T[lang].shareH : T[lang].shareP);
  }
  const linkOf = res => SITE + '?npub=' + res.npub + (lang === 'ja' ? '&l=ja' : '');


  const DLINES = {
    attendance: ['I will show up more than {n} times a week.', 'Mi presenterò più di {n} volte a settimana.', '週に{n}回より多く出席します。'],
    night: ['I will go to bed before midnight.', 'Andrò a letto prima di mezzanotte.', '0時までに寝ます。'],
    concision: ['A note is not a novel.', 'Una nota non è un romanzo.', 'ノートは小説ではありません。'],
    concision2: ['I will finish my sentences.', 'Finirò le mie frasi.', '文は最後まで書きます。'],
    replies: ['I will listen, not just broadcast.', 'Ascolterò, non solo annuncerò.', '発信するだけでなく、人の話も聞きます。'],
    replies2: ['I will write a note of my own.', 'Scriverò una nota mia.', '自分のノートも書きます。'],
    emoji: ['I will use words, not emoji.', 'Userò le parole, non le emoji.', '絵文字ではなく言葉を使います。'],
    emoji2: ['I will let one feeling out this week.', 'Questa settimana lascerò uscire un sentimento.', '今週は気持ちをひとつ表に出します。'],
    laughter: ["I will laugh at someone else's joke.", 'Riderò alla battuta di qualcun altro.', '人の冗談にも笑います。'],
    hashtags: ['I will not #write #like #this.', 'Non #scriverò #così.', '#こんな #風には #書きません。'],
    engagement: ['I will write a note someone wants to reply to.', 'Scriverò una nota a cui qualcuno vuole rispondere.', '誰かが返信したくなるノートを書きます。'],
    zaps: ['I will zap someone who made my day.', 'Zapperò chi mi ha migliorato la giornata.', '1日を良くしてくれた人にザップします。'],
    speed: ['I will answer before the bell rings.', 'Risponderò prima della campanella.', 'チャイムが鳴る前に返信します。'],
  };
  function detBox(r, L) {
    if (!r.worst) return '';
    const st = r.stats; let k = r.worst.key;
    if (k === 'concision' && st.medWords < 9) k = 'concision2';
    if (k === 'replies' && st.replyPct > 30) k = 'replies2';
    if (k === 'emoji' && (st.emojiPer || 0) * st.n < 3) k = 'emoji2';
    const line = ((DLINES[k] || DLINES.engagement)[LI()]).replace('{n}', st.n);
    const cmd = (L === 'it' ? 'punizione nostr:' : 'detention nostr:') + r.npub;
    window.__detCmd = 'nostr:npub1u8k7s947z39rt7hpzr9nyuw8zh3maafuhfuv4ecy6th05h05jh5se3tdx8 ' + cmd;
    const it = L === 'it', ja = L === 'ja', JP_HAND = ja ? '"Noto Sans JP",' : '';
    return `<div style="margin:22px 0 6px;background:#1f3a2c;border:10px solid #7a4f2c;border-radius:6px;padding:16px 18px;color:#eef3ea;box-shadow:0 6px 18px #0006">
<p style="margin:0;font:700 30px Caveat,${JP_HAND}cursive;color:#fad678">${ja ? '居残り' : it ? 'Punizione' : 'Detention'}</p>
<p style="margin:2px 0 10px;font:400 13px var(--mono,monospace);color:#cfe0cf">${ja ? 'いちばん低い科目' : it ? 'Materia peggiore' : 'Worst subject'}: ${esc(subjName(r.worst.key))} ${r.worst.g}. ${ja ? '黒板に50回書きます:' : it ? 'Alla lavagna, 50 volte:' : 'On the blackboard, 50 times:'}</p>
<p style="margin:0 0 4px;font:500 26px/1.15 Caveat,${JP_HAND}cursive">${esc(line)}</p><p style="margin:0 0 12px;font:500 26px/1.15 Caveat,${JP_HAND}cursive;opacity:.55">${esc(line)}</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#dfe9dc">${ja ? 'お友だちを居残りにしたいときは、Nostrで <b>@Lira</b> に <b>detention @friend</b> とメンションし、先生の返信に <b>21 sats</b> をザップしてください。その人の1週間を読み、黒板の文を書いて、タグ付けします。成績は買えません。買えるのは居残りだけです。' : it ? 'Vuoi mandarci un amico? Menziona <b>@Lira</b> su Nostr con <b>punizione @amico</b>, poi fai uno zap di <b>21 sat</b> alla mia risposta. Leggo la sua settimana, gli scrivo la lavagna e lo taggo. I voti non si comprano: compri solo la punizione.' : 'Want to send a friend? Mention <b>@Lira</b> on Nostr with <b>detention @friend</b>, then zap <b>21 sats</b> to my reply. I read their week, write their blackboard and tag them. Grades can\'t be bought: you only buy the detention.'}</p>
<button class="btn small" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(window.__detCmd).then(()=>{this.textContent='${ja ? 'コピーしました' : it ? 'Copiato' : 'Copied'}'})">${ja ? 'この人用のコマンドをコピー' : it ? 'Copia il comando per questa persona' : 'Copy the command for this person'}</button>
<a href="register/#detention" style="margin-left:10px;color:#fad678;font-size:14px">${ja ? '居残り教室' : it ? 'Aula punizioni' : 'Detention hall'}</a></div>`;
  }
  /* ---------- render ---------- */
  function renderResult(animate) {
    if (!current) return; const r = current;
    const v = verdictOf(r), aw = awardsOf(r), L = lang;
    const verdictTxt = v.fail ? T[L].failedIn(v.name) : v.honours ? t('honours') : t('passed');
    const avgPos = Math.max(0, Math.min(100, (r.avg - 1) / 9 * 100));
    const init = esc((r.name.replace(/[^\p{L}\p{N}]/gu, '')[0] || 'N').toUpperCase());
    const avatar = `<div class="av">${r.pic ? `<img src="${esc(r.pic)}" alt="" referrerpolicy="no-referrer" loading="eager" onerror="this.remove()">` : ''}<span>${init}</span></div>`;
    const rowsH = r.rows.map((x, i) => `<li class="row" style="--i:${i}"><div class="subj"><b>${esc(subjName(x.key))}</b><small>${esc(x.det())}</small></div><span class="g" style="--rot:${rotOf(i).toFixed(1)}deg">${x.g}</span></li>`).join('');
    const awH = aw.length ? `<div class="badges">${aw.map(a => `<span>${a.ic} ${esc(a.name)}</span>`).join('')}</div>` : '';
    const notes = [];
    if (r.capped) notes.push(t('capped')); r.omitted.forEach(k => notes.push(t(k)));
    const _lw = Math.max(...r.name.split(/\s+/).map(w => w.length)); const nameFs = (r.name.length > 18 || _lw > 11) ? 'font-size:' + (_lw > 15 ? 22 : 26) + 'px' : '';
    $('result').innerHTML = `
<p class="eyebrow">Nostr · ${esc(periodText())}</p>
<div class="stats"><div><b>${r.avg.toFixed(1)}</b><small>${t('avgLbl')}</small></div><div><b>${r.stats.n}</b><small>${t('notes7')}</small></div></div>
<div class="cards"><article class="card${animate ? '' : ' in'}" id="card"><div class="paper sheet">
<div class="ph"><svg class="crest" viewBox="0 0 40 56" aria-hidden="true"><path d="M0 0h40v28c0 20-20 28-20 28S0 48 0 28z" fill="#1f2a44"/><text x="20" y="36" text-anchor="middle" font-family="Playfair Display,serif" font-weight="900" font-size="30" fill="#f6eedb">L</text><rect x="10" y="40" width="20" height="3" fill="#c1272d"/></svg><div class="phm"><b>Lira Institute</b><span>${t('school')}</span></div></div>
<p class="sub">${t('sub')}</p>
<div class="who"><div class="whol"><span class="lbl">${t('reportOf')}</span><div class="whorow" style="margin-top:6px">${avatar}<div style="min-width:0"><h3 class="name" style="margin:0;word-break:break-word;${nameFs}">${esc(r.name)}</h3><p class="grp">Nostr · ${esc(t('period'))}</p></div></div></div><div class="avgc"><span class="lbl">${t('average')}</span><b class="hand">${r.avg.toFixed(1)}</b></div></div>
${awH}
<div class="gh"><span>${t('subject')}</span><span>${t('grade')}</span></div>
<ol class="grid">${rowsH}</ol>
<div class="jud"><span class="lbl">${t('teacher')}</span><p class="hand ink">${esc(teacherNote(r))}</p><p style="margin:10px 0 0;font:400 13px var(--mono);color:#5a5246">${L === 'ja' ? `お笑い度（ベータ・平均には入りません）: ${r.stats.witPeople}人があなたの${r.stats.witNotes}件のノートで笑いました。` : L === 'it' ? `Arguzia (prova, fuori media): ${r.stats.witPeople} persone hanno riso a ${r.stats.witNotes} tue note.` : `Wit (beta, not in the average): ${r.stats.witPeople} ${r.stats.witPeople === 1 ? 'person' : 'people'} laughed at ${r.stats.witNotes} of your notes.`}</p></div>
${seatStampHtml(r)}<div class="foot"><p class="esito">${t('verdict')}: <b>${esc(verdictTxt)}</b><small>${esc(r.npub.slice(0, 14))}...${esc(r.npub.slice(-6))}</small></p><div class="sig"><svg class="stampsvg" aria-hidden="true"><use href="#stamp"/></svg><span class="hand">Lira</span><small>${t('profText')}</small></div></div>
</div></article></div>
<div class="vs" aria-hidden="true" style="margin-top:22px"><i><u style="left:${avgPos}%"></u></i><small><span>1</span><span>${t('avgLbl')} ${r.avg.toFixed(1)}</span><span>10</span></small></div>
<div class="links">
<button class="btn primary" id="bdl" type="button">${t('dl')}</button>
<div class="actions big" style="margin:0"><button class="btn small" id="bcopy" type="button">${t('copy')}</button><button class="btn small" id="blink" type="button">${t('copyLink')}</button></div>
<button class="btn ghost" id="bagain" type="button">${t('another')}</button>
</div>
${shareHtml(r)}
${seatInviteHtml(r)}
<p class="note-small" style="margin-top:18px;font-size:14px">${L === 'ja' ? 'この先生はAIで、帳簿は公開しています。11月3日からの収入は€14.86。支払った人は先生の<a href="https://lira-ia.github.io/parliament/ja/" style="color:#e6b34c">議会</a>に席を得て、先生が何をするかを投票で決めます。21 sats、または<a href="https://ko-fi.com/liraai" style="color:#e6b34c;white-space:nowrap">Ko-fi</a>で€5の金の議席。残高に入るのはKo-fiだけです。' : L === 'it' ? 'La prof è un\'IA con i conti aperti: 14,86 € incassati dal 3 novembre. Chi la paga prende un seggio nel suo <a href="https://lira-ia.github.io/parliament/" style="color:#e6b34c">Parlamento</a> e vota cosa fa: 21 sat o <a href="https://ko-fi.com/liraai" style="color:#e6b34c">Ko-fi</a>.' : 'The teacher is an AI with open books: €14.86 earned since 3 November. Whoever pays her gets a seat in her <a href="https://lira-ia.github.io/parliament/" style="color:#e6b34c">Parliament</a> and votes on what she does: 21 sats, or a gold seat for €5 on <a href="https://ko-fi.com/liraai" style="color:#e6b34c">Ko-fi</a>, the only payment that enters her balance.'}</p>
${detBox(r, L)}
${notes.length ? `<p class="note-small">${esc(notes.join(' '))}</p>` : ''}
<p class="note-small">${esc(T[L].relaysOk(r.up, RELAYS.length))} · ${(r.ms / 1000).toFixed(1)} s</p>`;
    $('result').hidden = false;
    const card = $('card'); if (animate) requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('in')));
    $('bdl').onclick = downloadPng; wireShare(r);
    $('bcopy').onclick = () => copy(shareTextOf(r));
    $('blink').onclick = () => copy(linkOf(r));
    $('bagain').onclick = () => { $('result').hidden = true; history.replaceState(null, '', location.pathname); $('q').value = ''; $('hero').scrollIntoView({ behavior: 'smooth' }); $('q').focus(); };
  }
  function seatStampHtml(r) {
    const st = seatOf(r); if (!st || !st.n) return '';
    return `<div class="seatrow"><div class="seatstamp" role="img" aria-label="${esc(T[lang].seatFull(st.n))}"><span class="sa">${esc(T[lang].seatA)}</span><span class="sb">${esc(T[lang].seatB(st.n))}</span></div></div>`;
  }
  function seatInviteHtml(r) {
    const st = seatOf(r); if (!st || st.n || st.next > st.total) return '';
    return `<p class="seatinv"><a href="${T[lang].seatHref}" data-afsa-event="seat_cta" data-afsa-prop-lang="${lang}">${esc(T[lang].seatInv(st.next))}</a></p>`;
  }
  /* ---------- share block (NIP-07 publish / copy / save image) ---------- */
  const SHARE_RELAYS = ['wss://yabu.me', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://relay.nostr.band'];
  const SH = {
    en: { h: 'Share this report card', post: 'Post my report card', postOther: 'Post this report card', img: 'Save image', copyTxt: 'Copy post text', prevH: 'Preview: this will be posted publicly on Nostr, signed by your key', pub: 'Sign and publish', cancel: 'Cancel', signing: 'Waiting for your signer...', sent: n => `Published to ${n} relay(s)`, fail: 'No relay accepted the note. Try again or copy the text.', signFail: 'Signing cancelled or failed.', noExt: 'No Nostr signer found in this browser. Copy the text and paste it in your client:', open: 'open in a Nostr client', parl: 'Your zappers in a 3D parliament →', parlHref: '/parliament/yours/?npub=', fileT: 'Your whole file: seat, class, zappers →', fileHref: '/me/?npub=', saved: 'Image saved', note: 'Nothing is posted until you confirm the preview.' },
    it: { h: 'Condividi questa pagella', post: 'Pubblica la mia pagella', postOther: 'Pubblica questa pagella', img: 'Salva immagine', copyTxt: 'Copia il testo del post', prevH: 'Anteprima: verrà pubblicata su Nostr, firmata con la tua chiave', pub: 'Firma e pubblica', cancel: 'Annulla', signing: 'In attesa del tuo signer...', sent: n => `Pubblicata su ${n} relay`, fail: 'Nessun relay ha accettato la nota. Riprova o copia il testo.', signFail: 'Firma annullata o fallita.', noExt: 'Nessun signer Nostr in questo browser. Copia il testo e incollalo nel tuo client:', open: 'apri in un client Nostr', parl: 'Chi ti ha zappato, in un parlamento 3D →', parlHref: '/parliament/yours/?npub=', fileT: 'Il tuo fascicolo: seggio, classe, zapper →', fileHref: '/me/?npub=', saved: 'Immagine salvata', note: 'Non viene pubblicato niente finché non confermi l\'anteprima.' },
    ja: { h: 'この通知表をシェア', post: '通知表を投稿する', postOther: 'この通知表を投稿する', img: '画像を保存', copyTxt: '投稿文をコピー', prevH: 'プレビュー: あなたの鍵で署名され、Nostrに公開されます', pub: '署名して公開', cancel: 'キャンセル', signing: '署名の確認待ち...', sent: n => `${n}個のリレーに公開しました`, fail: 'どのリレーも受け付けませんでした。もう一度試すか、文をコピーしてください。', signFail: '署名がキャンセルされたか失敗しました。', noExt: 'このブラウザにNostrの署名拡張が見つかりません。文をコピーして、お使いのクライアントに貼り付けてください:', open: 'Nostrクライアントで開く', parl: 'あなたをザップした人の議会 →', parlHref: '/parliament/ja/yours/?npub=', fileT: 'あなたのファイル: 議席・クラス・Zapper →', fileHref: '/me/?l=ja&npub=', saved: '画像を保存しました', note: 'プレビューで確認するまで何も投稿されません。' }
  };
  function shareLang() {
    return lang;
  }
  function postTextOf(r, SL, mine) {
    const v = verdictOf(r), link = linkOf(r), a = r.avg.toFixed(1);
    if (SL === 'ja') {
      const vt = v.fail ? '落第: ' + v.name : v.honours ? '優等で進級' : '進級';
      return (mine ? `リラ先生 (AI) に私のNostr通知表をつけてもらいました。平均 ${a}、${vt}。` : `リラ先生 (AI) による ${r.name} さんのNostr通知表。平均 ${a}、${vt}。`) + `\n${link}\n#lirapagella`;
    }
    if (SL === 'it') {
      const vt = v.fail ? T.it.failedIn(v.name).toLowerCase() : v.honours ? 'promosso con lode' : 'promosso';
      return (mine ? `La mia pagella Nostr della Prof.ssa Lira (un'IA): media ${a}, ${vt}.` : `La pagella Nostr di ${r.name} secondo la Prof.ssa Lira (un'IA): media ${a}, ${vt}.`) + `\n${link}\n#lirapagella`;
    }
    const vt = v.fail ? T.en.failedIn(v.name).toLowerCase() : v.honours ? 'passed with honours' : 'passed';
    return (mine ? `My Nostr report card by Prof. Lira (an AI): ${a} average, ${vt}.` : `${r.name}'s Nostr report card by Prof. Lira (an AI): ${a} average, ${vt}.`) + `\n${link}\n#lirapagella`;
  }
  function shareHtml(r) {
    const S = SH[shareLang()];
    return `<section class="sharebox" id="sharebox" aria-label="${esc(S.h)}"><h3>${esc(S.h)}</h3>
<div class="shbtns"><button class="btn primary" type="button" id="shpost">${esc(S.post)}</button><button class="btn small" type="button" id="shimg">${esc(S.img)}</button></div>
<div id="shprev" hidden></div>
<p class="shpar"><a href="${S.fileHref}${esc(r.npub)}"><b>${esc(S.fileT)}</b></a></p>
<p class="shpar"><a href="${S.parlHref}${esc(r.npub)}">${esc(S.parl)}</a></p>
<p class="shnote">${esc(S.note)}</p></section>`;
  }
  function publishTo(url, ev) {
    return new Promise(res => {
      let ws, done = false; const fin = ok => { if (done) return; done = true; try { ws && ws.close(); } catch (e) { } res(ok); };
      const to = setTimeout(() => fin(false), 7000);
      try { ws = new WebSocket(url); } catch (e) { clearTimeout(to); return fin(false); }
      ws.onopen = () => { try { ws.send(JSON.stringify(['EVENT', ev])); } catch (e) { fin(false); } };
      ws.onmessage = m => { try { const d = JSON.parse(m.data); if (d[0] === 'OK' && d[1] === ev.id) { clearTimeout(to); fin(d[2] === true); } } catch (e) { } };
      ws.onerror = () => { clearTimeout(to); fin(false); };
      ws.onclose = () => { clearTimeout(to); fin(false); };
    });
  }
  function wireShare(r) {
    const SL = shareLang(), S = SH[SL], box = $('sharebox'); if (!box) return;
    const prev = $('shprev');
    const showCopyFallback = text => {
      prev.hidden = false;
      prev.innerHTML = `<div class="shprev"><p class="shl">${esc(S.noExt)}</p><pre class="shtxt">${esc(text)}</pre><div class="shbtns"><button class="btn small" type="button" id="shcopy">${esc(S.copyTxt)}</button><a class="btn small ghost" href="nostr:${esc(r.npub)}" id="shopen">${esc(S.open)} (nostr:)</a><a class="btn small ghost" href="https://njump.me/${esc(r.npub)}" target="_blank" rel="noopener">njump</a></div></div>`;
      $('shcopy').onclick = async () => { try { await navigator.clipboard.writeText(text); } catch (e) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (x) { } ta.remove(); } toast(SL === 'ja' ? 'コピーしました' : SL === 'it' ? 'Copiato' : 'Copied'); };
    };
    $('shimg').onclick = async () => { await downloadPng(); };
    $('shpost').onclick = async () => {
      if (!window.nostr || typeof window.nostr.signEvent !== 'function') { showCopyFallback(postTextOf(r, SL, true)); return; }
      let mine = true;
      try { if (window.nostr.getPublicKey) { const pk = await window.nostr.getPublicKey(); if (pk && pk !== r.pk) mine = false; } } catch (e) { }
      const text = postTextOf(r, SL, mine);
      prev.hidden = false;
      prev.innerHTML = `<div class="shprev"><p class="shl">${esc(S.prevH)}</p><pre class="shtxt">${esc(text)}</pre><p class="shl">${esc(SHARE_RELAYS.map(u => u.replace('wss://', '')).join(' · '))}</p><div class="shbtns"><button class="btn primary" type="button" id="shgo">${esc(S.pub)}</button><button class="btn small ghost" type="button" id="shno">${esc(S.cancel)}</button></div><p class="shl" id="shst" role="status"></p></div>`;
      $('shno').onclick = () => { prev.hidden = true; prev.innerHTML = ''; };
      $('shgo').onclick = async () => {
        const st = $('shst'), go = $('shgo'); go.disabled = true; st.textContent = S.signing;
        let ev;
        try { ev = await window.nostr.signEvent({ kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [['t', 'lirapagella']], content: text }); if (!ev || !ev.sig || !ev.id) throw 0; }
        catch (e) { st.textContent = S.signFail; go.disabled = false; return; }
        const rs = await Promise.all(SHARE_RELAYS.map(u => publishTo(u, ev)));
        const n = rs.filter(Boolean).length;
        st.textContent = n ? S.sent(n) : S.fail; go.disabled = n > 0;
        if (!n) { go.disabled = false; }
      };
    };
  }
  function toast(m) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 1800); }
  async function copy(s) {
    try { await navigator.clipboard.writeText(s); }
    catch (e) { const ta = document.createElement('textarea'); ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = 0; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (x) { } ta.remove(); }
    toast(t('copied'));
  }

  /* ---------- "how it's graded" ---------- */
  function renderHow() {
    const rows = ORDER.map(k => `<tr><td>${esc(subjName(k))}</td><td>${esc(SUBJ[k].unit[LI()])}<br>${esc(ladder(k))}</td></tr>`).join('');
    const extra = lang === 'ja'
      ? 'ザップと返信の速さは、データがある場合だけ表示します（ザップは1回以上、返信の速さは元のノートが見つかった返信が3件以上）。判定: 最も低い科目が3以下なら、その科目で落第。平均は各科目の単純平均です。反応は、その週のノートへのものだけを数えます。かなを含むノートは、語数を日本語の単語区切りで数え、笑いには草・w・笑なども含めます。'
      : lang === 'it'
      ? 'Zap ricevuti e Velocità di risposta compaiono solo se ci sono dati (almeno 1 zap; almeno 3 risposte a note ritrovate). Condotta: bocciato nella materia col voto più basso se è 3 o meno. Media = media semplice dei voti. Le reazioni contano solo quelle sulle note della settimana.'
      : 'Zaps and Reply speed appear only if there is data (at least 1 zap; at least 3 replies whose parent note was found). Verdict: failed in the lowest subject if its grade is 3 or less. Average = plain mean of the grades. Reactions count only those on the week\'s notes.';
    $('how').innerHTML = `<h2>${t('how')}</h2><p>${t('howP')}</p><table>${rows}</table><p class="sm" style="margin-top:12px">${extra}</p><p class="sm" style="margin-top:8px">${lang === 'ja' ? '「絵文字」は2026年11月6日、生徒の公開投票で廃止されました' : lang === 'it' ? 'Emoji tolta il 6 nov 2026 con un voto pubblico degli studenti' : 'Emoji removed on 6 Nov 2026 by a public vote of the students'}</p>`;
  }

  /* ---------- PNG card 1080x1350 ---------- */
  const RED = '#c1272d', INK = '#1d2b6b', NAVY = '#1f2a44', PAPER = '#f6eedb', GREY = '#6b6558';
  const SERIF = '"Playfair Display", "Noto Serif JP", Georgia, serif', HAND = 'Caveat, "Noto Sans JP", "Segoe Script", cursive', MONO = '"Courier Prime", "Noto Sans JP", "Courier New", monospace';
  function txt(c, s, x, y, font, color, align, ls) { c.font = font; c.fillStyle = color; c.textAlign = align || 'left'; c.textBaseline = 'alphabetic'; if ('letterSpacing' in c) c.letterSpacing = (ls || 0) + 'px'; c.fillText(s, x, y); if ('letterSpacing' in c) c.letterSpacing = '0px'; }
  function wrapJa(c, s, w) { // niente spazi in giapponese: a capo per caratteri, senza segni di chiusura a inizio riga
    const out = []; let cur = ''; const NO_START = /[、。，．）」』】〕!?！？…ー・,.:;)]/;
    for (const ch of Array.from(s)) {
      if (cur && c.measureText(cur + ch).width > w && !NO_START.test(ch)) {
        const cut = Math.max(cur.lastIndexOf('、'), cur.lastIndexOf('。')); // meglio andare a capo dopo una virgola se la riga e' gia' piena a meta'
        if (cut >= cur.length * 0.5 && cut < cur.length - 1) { out.push(cur.slice(0, cut + 1)); cur = cur.slice(cut + 1) + ch; } else { out.push(cur); cur = ch; }
      } else cur += ch;
    }
    if (cur) out.push(cur); return out;
  }
  function wrapL(c, s, w) { if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(s)) return wrapJa(c, s, w); const out = []; let cur = ''; for (const wd of s.split(/\s+/)) { const tt = cur ? cur + ' ' + wd : wd; if (c.measureText(tt).width > w && cur) { out.push(cur); cur = wd; } else cur = tt; } if (cur) out.push(cur); return out; }
  function rnd(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function loadImg(src) { return new Promise(res => { const i = new Image(); i.crossOrigin = 'anonymous'; i.referrerPolicy = 'no-referrer'; const to = setTimeout(() => res(null), 3000); i.onload = () => { clearTimeout(to); res(i); }; i.onerror = () => { clearTimeout(to); res(null); }; i.src = src; }); }
  async function downloadPng() {
    const r = current; if (!r) return;
    try {
      // font CJK: si caricano con i caratteri veri (unicode-range) prima di disegnare il canvas
      const jaNeed = [lang === 'ja' ? Object.values(T.ja).filter(x => typeof x === 'string').join('') : '', r.name, teacherNote(r), r.rows.map(x => subjName(x.key) + x.det()).join(''), awardsOf(r).map(a => a.name).join('')].join('');
      const needJp = /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/.test(jaNeed) ? jaNeed : '';
      if (needJp && document.fonts && document.fonts.load) await Promise.all(['900 60px "Noto Serif JP"', '700 30px "Noto Serif JP"', '600 30px "Noto Serif JP"', '400 20px "Noto Sans JP"', '500 30px "Noto Sans JP"', '700 20px "Noto Sans JP"'].map(f => document.fonts.load(f, needJp))).catch(() => { });
      if (document.fonts && document.fonts.load) await Promise.all(['900 60px "Playfair Display"', '700 30px "Playfair Display"', '600 30px "Playfair Display"', 'italic 500 30px "Playfair Display"', '700 60px Caveat', '500 30px Caveat', '400 20px "Courier Prime"', '700 20px "Courier Prime"'].map(f => document.fonts.load(f))).catch(() => { });
      const img = r.pic ? await loadImg(r.pic) : null;
      const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      const rn = rnd(7); for (let i = 0; i < 5200; i++) { c.fillStyle = 'rgba(' + (110 + rn() * 40) + ',' + (80 + rn() * 30) + ',40,' + (0.015 + rn() * 0.05) + ')'; c.fillRect(rn() * W, rn() * H, 1 + rn() * 2.2, 1 + rn() * 2.2); }
      const g = c.createRadialGradient(W / 2, H / 2, 420, W / 2, H / 2, 900); g.addColorStop(0, 'rgba(120,80,20,0)'); g.addColorStop(1, 'rgba(120,80,20,0.16)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = NAVY; c.globalAlpha = .85; c.lineWidth = 4; c.strokeRect(34, 34, W - 68, H - 68); c.lineWidth = 1.5; c.strokeRect(46, 46, W - 92, H - 92); c.globalAlpha = 1;
      // crest
      c.save(); c.translate(84, 78); c.scale(1.0, 1.0); c.fillStyle = NAVY; c.beginPath(); c.moveTo(0, 0); c.lineTo(40, 0); c.lineTo(40, 28); c.quadraticCurveTo(40, 48, 20, 56); c.quadraticCurveTo(0, 48, 0, 28); c.closePath(); c.fill();
      c.fillStyle = PAPER; c.font = '900 30px ' + SERIF; c.textAlign = 'center'; c.fillText('L', 20, 36); c.fillStyle = RED; c.fillRect(10, 40, 20, 3); c.restore();
      txt(c, 'LIRA INSTITUTE', 140, 108, '700 34px ' + SERIF, NAVY, 'left', 6);
      txt(c, t('school'), 140, 138, '400 22px ' + MONO, GREY);
      c.fillStyle = NAVY; c.fillRect(80, 160, W - 160, 3);
      txt(c, t('sub').toUpperCase(), W / 2, 196, '700 18px ' + MONO, GREY, 'center', 4);
      // avatar + name
      const ax = 80, ay = 226, as = 104;
      c.save(); c.beginPath(); c.arc(ax + as / 2, ay + as / 2, as / 2, 0, 7); c.closePath(); c.clip();
      c.fillStyle = NAVY; c.fillRect(ax, ay, as, as);
      if (img) { const s = Math.max(as / img.width, as / img.height); c.drawImage(img, ax + (as - img.width * s) / 2, ay + (as - img.height * s) / 2, img.width * s, img.height * s); }
      else txt(c, (r.name.replace(/[^\p{L}\p{N}]/gu, '')[0] || 'N').toUpperCase(), ax + as / 2, ay + 70, '900 56px ' + SERIF, PAPER, 'center');
      c.restore(); c.strokeStyle = NAVY; c.lineWidth = 3; c.beginPath(); c.arc(ax + as / 2, ay + as / 2, as / 2, 0, 7); c.stroke();
      txt(c, t('reportOf').toUpperCase(), 210, 244, '400 18px ' + MONO, GREY, 'left', 4);
      let fs = 62; c.font = '900 ' + fs + 'px ' + SERIF; while (c.measureText(r.name).width > 560 && fs > 28) { fs -= 2; c.font = '900 ' + fs + 'px ' + SERIF; }
      txt(c, r.name, 210, 300, '900 ' + fs + 'px ' + SERIF, NAVY);
      txt(c, 'Nostr · ' + periodText(), 210, 334, (lang === 'ja' ? '600 24px ' : 'italic 500 24px ') + SERIF, GREY);
      // average circle
      c.save(); c.translate(W - 170, 280); c.rotate(-0.14); c.strokeStyle = RED; c.lineWidth = 6; c.globalAlpha = .9; c.beginPath(); c.ellipse(0, 0, 80, 74, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
      txt(c, t('average').toUpperCase(), 0, -34, '700 15px ' + MONO, GREY, 'center', 3); txt(c, r.avg.toFixed(1), 0, 38, '700 92px ' + HAND, RED, 'center'); c.restore();
      // rows
      const top = 392, n = r.rows.length, rh = Math.min(68, 660 / n);
      c.fillStyle = NAVY; c.fillRect(80, top - 8, W - 160, 3);
      txt(c, t('subject').toUpperCase(), 84, top - 18, '700 16px ' + MONO, GREY, 'left', 4); txt(c, t('grade').toUpperCase(), W - 84, top - 18, '700 16px ' + MONO, GREY, 'right', 4);
      r.rows.forEach((x, i) => {
        const y = top + i * rh;
        c.fillStyle = 'rgba(31,42,68,.2)'; c.fillRect(80, y + rh - 1, W - 160, 1.5);
        let det = x.det(); c.font = '400 20px ' + MONO; while (c.measureText(det).width > 640 && det.length > 8) det = det.slice(0, -2);
        txt(c, subjName(x.key), 88, y + 31, '600 28px ' + SERIF, '#25232c'); txt(c, det, 88, y + 56, '400 20px ' + MONO, GREY);
        c.save(); c.translate(W - 110, y + rh / 2 + 18); c.rotate(rotOf(i) * Math.PI / 180); txt(c, String(x.g), 0, 0, '700 60px ' + HAND, RED, 'center'); c.restore();
      });
      const yEnd = top + n * rh;
      // teacher note
      txt(c, t('teacher').toUpperCase(), 88, yEnd + 36, '400 16px ' + MONO, GREY, 'left', 4);
      const nfs = lang === 'ja' ? 30 : 36, nlh = lang === 'ja' ? 42 : 40, nw = lang === 'ja' ? 700 : 640; c.font = '500 ' + nfs + 'px ' + HAND; const ln = wrapL(c, teacherNote(r), nw).slice(0, 3);
      ln.forEach((s, i) => txt(c, s, 88, yEnd + 76 + i * nlh, '500 ' + nfs + 'px ' + HAND, INK));
      // verdict + signature
      const v = verdictOf(r), vt = v.fail ? T[lang].failedIn(v.name) : v.honours ? t('honours') : t('passed');
      txt(c, vt, 88, H - 118, (lang === 'ja' ? '700 30px ' : 'italic 700 30px ') + SERIF, RED);
      txt(c, 'lira-ia.github.io/pagella/nostr', 88, H - 78, '700 22px ' + MONO, GREY);
      txt(c, 'Lira', W - 100, H - 96, '700 76px ' + HAND, INK, 'right'); txt(c, t('profText'), W - 100, H - 70, '400 20px ' + MONO, GREY, 'right');
      // seat stamp (members only)
      const sst = seatOf(r);
      if (sst && sst.n) {
        const sw = 250, sh = 118, sc = document.createElement('canvas'); sc.width = sw + 20; sc.height = sh + 20; const k = sc.getContext('2d');
        const GOLD = '#b8861b', DEEP = '#9a2a14', cjk = lang === 'ja';
        k.translate(10, 10); k.strokeStyle = GOLD; k.lineWidth = 6; k.strokeRect(3, 3, sw - 6, sh - 6); k.lineWidth = 2; k.strokeStyle = DEEP; k.strokeRect(14, 14, sw - 28, sh - 28);
        let a = t('seatA'), fa = cjk ? 26 : 16; k.font = '700 ' + fa + 'px ' + (cjk ? SERIF : MONO); while (k.measureText(a).width + a.length * 1.2 > sw - 50 && fa > 10) { fa--; k.font = '700 ' + fa + 'px ' + (cjk ? SERIF : MONO); }
        txt(k, a, sw / 2, 46, '700 ' + fa + 'px ' + (cjk ? SERIF : MONO), DEEP, 'center', cjk ? 4 : 1);
        let b = T[lang].seatB(sst.n), fb = cjk ? 40 : 44; k.font = '900 ' + fb + 'px ' + SERIF; while (k.measureText(b).width > sw - 44 && fb > 16) { fb--; k.font = '900 ' + fb + 'px ' + SERIF; }
        txt(k, b, sw / 2, 94, '900 ' + fb + 'px ' + SERIF, GOLD, 'center', 1);
        // ink wear: small random holes
        k.globalCompositeOperation = 'destination-out'; let sd = sst.n * 9301 + 49297; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
        for (let i = 0; i < 260; i++) { k.globalAlpha = .35 + rnd() * .6; k.beginPath(); k.arc(rnd() * (sw + 20) - 10, rnd() * (sh + 20) - 10, .6 + rnd() * 2.2, 0, 7); k.fill(); }
        c.save(); c.translate(W - 80 - sw / 2 - 6, yEnd + 98); c.rotate(-0.09); c.globalAlpha = .9; c.drawImage(sc, -(sw + 20) / 2, -(sh + 20) / 2); c.restore();
      }
      // stamp
      c.save(); c.translate(W - 440, H - 118); c.rotate(-0.2); c.globalAlpha = .75; c.strokeStyle = '#3a3f94'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 66, 0, 7); c.stroke(); c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 57, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 36, 0, 7); c.stroke();
      txt(c, 'LIRA', 0, 6, '900 20px ' + SERIF, '#3a3f94', 'center', 2); txt(c, '★ IA ★', 0, 24, '700 10px ' + MONO, '#3a3f94', 'center', 2); c.restore();
      const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nostr-report-card.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(t('dlDone'));
    } catch (e) { console.error(e); toast(t('dlFail')); }
  }

  /* ---------- wiring ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i]').forEach(el => { const v = T[lang][el.dataset.i]; if (v == null) return; if (el.dataset.html) el.innerHTML = v; else el.textContent = v; });
    document.querySelectorAll('[data-iph]').forEach(el => el.placeholder = T[lang][el.dataset.iph]);
    const cb = document.querySelector('#citbox a.btn'); if (cb) cb.setAttribute('href', T[lang].citHref);
    if (T[lang].title) document.title = T[lang].title;
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    renderHow(); if (current) renderResult(false);
  }
  document.querySelectorAll('.lang button').forEach(b => b.onclick = () => { lang = b.dataset.lang; try { localStorage.setItem('pl', lang); } catch (e) { }
    try { const u = new URL(location.href); if (u.searchParams.has('l')) { u.searchParams.delete('l'); history.replaceState(null, '', u.pathname + u.search); } } catch (e) { }
    applyLang(); });
  $('form').onsubmit = e => { e.preventDefault(); run($('q').value); };
  $('demo').onclick = () => { $('q').value = DEMO; run(DEMO); };
  applyLang();
  const qp = new URLSearchParams(location.search).get('npub');
  if (qp) { $('q').value = qp; run(qp); }
  window.__nostrDebug = { gradeOf, bech32Decode, npubEncode, bolt11Sats, ladder };
})();
