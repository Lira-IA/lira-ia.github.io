/* Ironic, affectionate sentences. Only about posting habits. */
(function (root) {
  const SENT = {
    leftonread: [
      'Zap 21 sat to the last person you left on read, with a note saying "sorry, I saw it, I swear".',
      'Reply to the oldest unanswered mention today. Even "lol" counts. Especially "lol".',
      'Spend one coffee break answering your mentions. The notifications tab misses you.',
      'Send one belated "thanks!" to someone. Expiry date on good manners: never.'],
    zapmiser: [
      'Zap someone 100 sats today. The sats are not going to spend themselves, and you know it.',
      'Go zap the next note that makes you smile. Lightning loves a round trip.',
      'Wallet to be opened in the presence of a witness, and 21 sats to be released.',
      'Sentenced to one act of generosity: pick a note, tap the bolt, feel nothing but joy.'],
    gm: [
      'Write one note this week with more than two letters in it. Three is a stretch goal.',
      'Replace tomorrow\'s "gm" with a full sentence about what you actually had for breakfast.',
      'One "gm" is allowed per day, but it must be accompanied by a thought. Any thought.',
      'Say good morning properly: coffee, a point of view, and a vowel.'],
    emoji: [
      'Write one note this week using actual words. Emoji may attend as guests, not as the whole party.',
      'Sentenced to translate one emoji note into a full sentence. The court accepts "heart eyes" as a starting point.',
      'For one day, every emoji must be accompanied by at least three words. Dictionaries will be provided.',
      'Court-ordered caption: tell us what the little face was feeling. The court is very curious.'],
    replyguy: [
      'Write one original note this week that is not an answer to anyone. Fly, little poster.',
      'Start a thread instead of joining one. Everyone else will reply to you for a change.',
      'One day of compulsory monologue: say what you think, unprompted.',
      'Take a day off from replying. The internet will manage. Probably.'],
    repost: [
      'Write one note in your own words. The repost button is allowed to rest.',
      'Every repost must be paid for with one original sentence of commentary.',
      'Sentenced to quote exactly what you liked about the thing you reposted.',
      'Your timeline has great taste. Now give it a voice.'],
    hashtag: [
      'Hashtag budget: two per note. The rest go back to the shelf.',
      'Delete one hashtag per note for a week. Nostr will find the note anyway.',
      'Hashtags are seasoning, not the whole soup. Taste, then stop.',
      'Write one note with zero hashtags. Breathe. It works.'],
    ghost: [
      'Come back whenever you like. The relays will wait.']
  };
  const OPEN = [
    'The court has reviewed the last two weeks of public notes, and has feelings.',
    'All rise for a very serious hearing about very small habits.',
    'The relays have been consulted. The witnesses were summoned. Nobody lied (as far as we can tell).',
    'Today the court judges posting habits only, and always with affection.'];
  const GUILTY_LINES = [
    'The court finds the defendant GUILTY on {n} of 8 counts, and sentences with love.',
    'On {n} of 8 counts the evidence is clear. The sentence is mild and slightly ridiculous.',
    '{n} of 8 counts stick. The court is smiling while it reads this out.'];
  const ACQ_LINES = [
    'The court finds {n} of 8 counts proven. The defendant is ACQUITTED, with the court\'s respect.',
    'Not enough evidence: {n} of 8 counts. Free to go, free to post.',
    'The court finds {n} of 8 counts, which is below the threshold of guilt. Go in peace and keep posting.'];
  const ACQ_PEN = [
    'No sentence. The court only asks you to keep being a pleasant presence on the timeline.',
    'Cleared of all charges. Zap yourself 21 sats for good behavior.',
    'Cleared of all charges. A very small bolt of respect is yours.'];
  const NOCASE_TEXT = 'Not enough public notes in the last 14 days. The court cannot judge what it cannot read.';
  // shared by the page and the bot: fills r.verdictLine, r.penas, r.pena
  function sentence(r, pick) {
    pick = pick || (a => a[Math.floor(Math.random() * a.length)]);
    const g = r.counts.filter(c => c.guilty);
    if (r.verdict === 'NO CASE') { r.verdictLine = NOCASE_TEXT; r.penas = []; r.pena = ''; return r; }
    if (r.verdict === 'GUILTY') {
      r.verdictLine = pick(GUILTY_LINES).replace('{n}', r.guilty);
      r.penas = g.slice().sort(() => Math.random() - .5).slice(0, 3).map(c => pick(SENT[c.id]));
    } else {
      r.verdictLine = pick(ACQ_LINES).replace('{n}', r.guilty);
      r.penas = g.length === 1 ? ['Acquitted, with a warning: ' + pick(SENT[g[0].id])] : [pick(ACQ_PEN)];
    }
    r.pena = r.penas[0]; return r;
  }
  // text for a Nostr note: NEVER contains nostr:npub of the defendant
  function noteText(r, link) {
    if (r.verdict === 'NO CASE') return '⚖️ NOSTR COURT\n\nJudge Lira (an AI) opened a case for ' + r.name + ': NO CASE.\n\n' + NOCASE_TEXT + '\n\nIronic verdict, real affection. Try it: ' + link;
    return '⚖️ NOSTR COURT\n\n' + r.name + ' was tried by Judge Lira (an AI) and found ' + r.verdict + ' on ' + r.guilty + ' of 8 counts.\n\nSentence: ' + r.pena + '\n\nIronic verdict, real affection. Try it: ' + link;
  }
  root.CourtTexts = { SENT, OPEN, GUILTY_LINES, ACQ_LINES, ACQ_PEN, NOCASE_TEXT, sentence, noteText };
})(typeof window !== 'undefined' ? window : globalThis);
