/* The Group Chat Court - template texts. Tone: dry, mock-solemn, never mean.
   Only chat behaviour is judged. Gender-neutral (they / the defendant).
   Placeholders: {nome} {n} {tot} {pct} ... ; {n:time/times} = singular/plural by value. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TribunaleTesti = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CAPI = {
    abbandono: {
      titolo: 'Abandoning a Conversation', art: 'Count 1',
      accusa: [
        'The Court finds {n} conversations left hanging out of {tot} that {nome} was part of: {pct}% of chats walked out on, like leaving a film at the interval.',
        'It appears that {nome}, having joined in, left {n} threads dangling (out of {tot}). A conversation is not an elevator: you do not get off at the first floor.',
        'Exhibit A: {n} moments when someone replied to {nome} and met only silence for six hours or more. That is {pct}% of exchanges. The Court counted twice.',
        'The defendant is charged with {n} abandonments, or {pct}% of the times {nome} had just spoken. The other party’s waiting time was spent on dignified speculation.',
        'The Prosecutor (also an AI, and therefore patient) presents {n} broken-off chats out of {tot}. {nome} spoke, others replied, and then: the cosmic void.',
        'Count one: {n} times {nome} opened a topic, got an answer, and left the scene without a goodbye. That is {pct}%, a figure the Court calls “theatrical”.'
      ],
      pena: [
        '{nome} is sentenced to end every conversation with at least one closing sentence, for 30 days. “Talk later” does not count.',
        'The defendant must answer “still here” within 15 minutes to any reply to their own message. Duration: 3 weeks.',
        'The Court orders {nome} to read aloud, in front of a mirror, all {n} abandoned conversations, in a news-anchor voice.',
        'Sentenced to 100 hours of “sorry, I was away”, handwritten, in cursive, with no abbreviations.',
        '{nome} must finish at least {n} conversations with a sincere “brb” and then actually be back.',
        'The defendant is placed on probation with a phone that has notifications switched on, for 10 days. The Court has faith in rehabilitation.'
      ],
      assolto: [
        'The conversations of {nome} end, almost always, in a dignified way. Acquitted on the matter of abandonment.',
        'On this count the Court finds nothing. {nome} stays in a conversation until the end credits.',
        'Few abandonments ({n} out of {tot}) and the Court is generous to people who have a life. Acquitted.',
        'The Prosecutor looked for broken-off chats and found steady presence. Acquitted, with mild embarrassment on the part of the prosecution.',
        'No relevant abandonment: the file is as thin as a slice of deli ham. Full acquittal.',
        'Count dismissed: {nome} finishes what they start. The Court has not lost a single conversation.'
      ],
      riga: '{n} conversations left hanging ({pct}%)',
      rigaOk: 'No relevant abandonment'
    },

    domande: {
      titolo: 'Questions Left Unanswered', art: 'Count 2',
      accusa: [
        '{n} questions out of {tot} went unanswered for six hours while {nome} was around. The question mark, it seems, is an optional invitation.',
        'The Court has counted {n} questions ({pct}%) that landed in the silence of {nome}. Some only wanted a yes or a no, and are still waiting.',
        'On record: {n} question marks with no outcome. A school quiz with this response rate would cause a national crisis.',
        '{n} times, while {nome} was active in the chat, somebody asked something and was met with an eloquent nothing. Six hours of waiting, then the Court closed the book.',
        'The defendant is charged with ignoring {n} questions out of {tot}: {pct}% of those within reach. “Seen” is the prosecution’s theory, but the silence is a fact.',
        'The file contains {n} questions left unanswered after six hours. The Court notes these were questions, not riddles of the Sphinx.'
      ],
      pena: [
        '{nome} is sentenced to answer every question within 10 minutes for 7 days. “No idea” counts.',
        'The Court orders {nome} to reply with a full sentence, not a thumbs-up, to the next {n} questions received.',
        'Fifty hours of “let me get back to you” to be converted, separately, into “let me get back to you: it’s a yes”.',
        'The defendant must read all unanswered question marks aloud in court, with the correct intonation. When in doubt, with more intonation.',
        'Sentenced to answer one overdue question per day, oldest first, until supplies run out.',
        'A probation period in which every “?” received is followed by an answer, even if just “no idea, but I’ll think about it”.'
      ],
      assolto: [
        'Questions find in {nome} a worthy counterpart. Acquitted: here, silence is golden almost never.',
        'Count falls: few questions dropped ({n} out of {tot}). The Court is not a complaints desk and is easily satisfied.',
        'The Prosecutor looked for orphaned questions and found replies. Acquitted, graciously.',
        'Even for a picky Court like this one, the response rate of {nome} is honourable. Acquitted.',
        'Unanswered questions are below the alarm threshold. Acquitted for lack of stray question marks.',
        'No significant abandoned questions. Count dismissed with a small bow.'
      ],
      riga: '{n} questions left unanswered ({pct}%)',
      rigaOk: 'Questions generally honoured'
    },

    monologo: {
      titolo: 'Aggravated Monologue', art: 'Count 3',
      accusa: [
        'Consecutive messages with no one else getting a word in: the record for {nome} is {max}. On {cnt:occasion/occasions} the streak went past four messages. A speech nobody asked for.',
        'The Court has found {cnt:full-blown monologue/full-blown monologues}. The longest, {max} messages in a row, on {data}. Not even Parliament has a microphone this durable.',
        'The defendant is charged with repeated soliloquy: {max} consecutive messages in a single go, {cnt:streak/streaks} above the threshold. The other participants were reduced to an audience.',
        'Exhibit B: a run of {max} messages with no reply from anyone, dated {data}. With the aggravating factor of repetition: {cnt:episode/episodes}.',
        'The Prosecutor submits the monologue of {data}: {max} consecutive messages. The defendant asked for a glass of water; the Court also granted a chair.',
        '{nome} turned the chat into a stage {cnt:time/times}, peaking at {max} messages in a row. The Court admires the commitment, not the programming choice.'
      ],
      pena: [
        '{nome} is sentenced to write one message instead of three, for 14 days. Punctuation is allowed.',
        'The defendant must use the “send” button sparingly. Every message shall contain one complete thought, preferably the first one.',
        'Sentenced to listen in silence, for an hour, to someone else’s account of their day. No interrupting.',
        'A period of community service as a listener: each monologue will be offset by {max} messages from others, read attentively.',
        'The Court orders all consecutive messages to be merged into a single paragraph, to be proofread before sending.',
        'Additional sentence: wait for a reply before sending the next message, for 5 days. Patience is a virtue, and a test.'
      ],
      assolto: [
        'No worrying monologues: {nome} leaves room for others. Acquitted, with a nod of understanding.',
        'The longest streak is {max:message/messages}: under the threshold of judicial wordiness. Count dismissed.',
        'It is acknowledged that {nome} knows when to stop. Acquitted, and the Court is invited to take notes.',
        'The Prosecutor went looking for a filibuster and found well-balanced conversations. Acquitted.',
        'Monologues: none worth mentioning. {nome} writes the way one should, in turns. Full acquittal.',
        'Count dismissed: consecutive messages are rare and short. The Court waives its right of reply.'
      ],
      riga: 'Record streak: {max} messages in a row',
      rigaOk: 'No relevant monologue'
    },

    vocali: {
      titolo: 'Voice Note Spam', art: 'Count 4',
      accusa: [
        '{n} voice notes, {pct}% of everything {nome} sent. Record day, {data}: {max} voice notes in 24 hours. The Court has acquired headphones and a great deal of patience.',
        'On record: {n} voice messages ({pct}% of messages). To listen to them all the Court had to adjourn and, in part, suspend its social life.',
        'A heavy use of voice notes is alleged: {n} in total, peaking on {data} ({max} in one day). Anyone who just wanted the answer had to sit through a small TV series.',
        'The Prosecutor files {n} voice notes. The minutes are not in the file: the Court does not want to know, it has enough anxiety already.',
        'Voice notes sent: {n}, or {pct}% of the activity of {nome}. On {data}, {max} went out in a single day, practically a podcast in episodes.',
        'Count four: voice note spam. {n} specimens, {max} in a single day ({data}). The Court recalls that writing exists, invented precisely for people on the subway.'
      ],
      pena: [
        '300 hours of voice notes under 30 seconds, and none containing the phrase “okay, so, long story”.',
        '{nome} must transcribe by hand the next ten voice notes, in capital letters, with correct punctuation.',
        'Text only for 5 days. Emoji are allowed as a mitigating circumstance.',
        'Every voice note longer than a minute must be preceded by a one-line summary: “So basically: ...”',
        'The defendant must listen to their own voice notes at 2x speed, to understand how it feels.',
        'Sentenced to reply “got it” to every voice note from others, without listening to it a third time. The Court knows. The Court does it too.'
      ],
      assolto: [
        'Voice notes are few or absent: {nome} writes like a civilised person. Acquitted.',
        'No case on this count: the voice note is an exception, not a system. Acquittal.',
        'Count dismissed. The Court thanks the defendant for the silence of the microphones.',
        'The number of voice notes ({n}) is within what civilised cohabitation allows. Acquitted, also for lack of podcasts.',
        'The Prosecutor found no voice notes in a blameworthy quantity. Orders a hot cup of tea.',
        'Voice notes: few, hence forgiven. Acquittal, subject to listening again if necessary.'
      ],
      riga: '{n} voice notes ({pct}% of messages)',
      rigaOk: 'Voice notes in civil quantities',
      nota: 'Note from the Court: the export did not include media files, so voice notes only appear as placeholders. If none show up at all, the defendant may be benefiting.'
    },

    okismo: {
      titolo: 'Okay-ism', art: 'Count 5',
      accusa: [
        '{n} replies consisting solely of the word “ok” (or close relatives: “k”, “fine”, “sure”). That is {pct}% of text messages. The Court speaks of terseness, not necessarily bad mood.',
        'The defendant is charged with Okay-ism: {n} one-word replies out of {tot}. The Court is not sure a thought lies behind them, but respects the mystery.',
        'On record: {n} “ok”s. Behind each “ok” there may be a whole speech: the Court awaits clarification. They make up {pct}% of messages.',
        'The Prosecutor lays out the recurrence of the interjection “ok”: {n} times, in the absence of any argument. Sometimes it is enough, the Court knows. Sometimes it is not.',
        'Ok, k, ok ok, fine: {n} replies of one or two syllables. The Court admits it knows no more concise language, apart from silence, already judged elsewhere.',
        'Count five: {n} “ok”s in reply to messages that deserved more. Ranging from “sure” to the naked, brutal “ok”. {pct}% of the messages of {nome}.'
      ],
      pena: [
        '{nome} is sentenced to answer every message with at least 5 words for a week. “Ok, got it, thanks” is 4 words: one more needed.',
        'Ban on “ok” for 10 days. Alternatively, “sounds great” and other more dignified synonyms are permitted.',
        'The defendant must write “sure, and what shall I bring?” 100 times on a blackboard.',
        'Sentenced to say “ok” only after justifying it. Example: “Ok, because that sounds like an excellent plan.”',
        'A crash course in verbosity: every message must contain at least one verb, and preferably a subject.',
        'Additional sentence: replace the next {n} “ok”s with a full sentence. The Court is not strict, merely curious.'
      ],
      assolto: [
        'The language of {nome} is richer than “ok” and its neighbours. Acquitted, with literary appreciation.',
        'The “ok”s are few ({n}) and nearly all well placed. Acquittal.',
        'Count dismissed: brevity is not a crime when accompanied by other words. Acquitted.',
        'The Prosecutor was after the laconic and found a conversationalist. Acquitted.',
        'A little “ok” never hurt anyone: below the guard level, the defendant is acquitted.',
        'No one-word drift worthy of trial. The Court files it away elegantly.'
      ],
      riga: '{n} “ok” replies ({pct}% of texts)',
      rigaOk: 'Sufficiently articulate'
    },

    sparizione: {
      titolo: 'Vanishing Act', art: 'Count 6',
      accusa: [
        'A total silence of {giorni:day/days}, during which the chat kept on living with {msg} messages from others. Last seen: {da}. Reappeared: {a}. The Court has issued a search warrant.',
        'From {da} to {a}: {giorni:day/days} unreachable, while the group exchanged {msg} messages. No “I’m here”, no emoji, no proof of life.',
        'A disappearance of {giorni:day/days} is alleged (from {da}), with {msg} messages from others missed and never recovered. The Court does not rule out a spiritual retreat.',
        'The Prosecutor points to the interval {da} to {a}: {giorni:day/days} without a message, with {msg} from others. Reappeared as if nothing had happened.',
        'Count six: vanishing. {giorni:day/days} away, {msg} messages from others in the meantime. Friends asked “is everything ok?” and got peace and quiet in return.',
        'The longest absence of {nome}, {giorni:day/days} (from {da} to {a}), took place amid {msg} messages from others. In some circles this is called a “sabbatical”.'
      ],
      pena: [
        '{nome} is sentenced to write “present” in the chat every morning for 30 days, like at school.',
        'Phone availability from 9 AM to 9 PM for two weeks. Vibrate mode is not an alibi.',
        'Residence order in the group: at least one message a day, even just “still alive”.',
        'Sentenced to read {msg} back-messages and comment on each, one by one, with notarial precision.',
        'The Court imposes a sign of life every 48 hours, valid also as a sticker (provided it has an expression).',
        'A “courtesy visit” to the chat within three days of the last message, on pain of repeating the same for twice as long.'
      ],
      assolto: [
        '{nome} never lost their tracks: presence in the chat is steady. Acquitted.',
        'The absences are short and reasonable. The Court does not open files for legitimate holidays.',
        'No prolonged disappearance while others were active. Acquittal, and a little emotion.',
        'Count dismissed: the longest disappearance is only {giorni:day/days}. Even the best of us sleep, work, and live.',
        'The Prosecutor looked for a ghost and found a resident. Acquitted.',
        'No fugitive status proven. The Court admits to having sighed with relief.'
      ],
      riga: 'Vanished for {giorni:day/days}, during {msg} messages from others',
      rigaOk: 'Never gone for long'
    },

    notte: {
      titolo: 'Back at 3 AM', art: 'Count 7',
      accusa: [
        '{n} messages sent between 1 and 6 AM ({pct}% of the total). Favourite hour: {ora}. The Court trusts daylight saving has not struck here.',
        'The Court notes {n} nocturnal appearances by {nome}, mostly around {ora}. Everyone else was asleep. In the dark, the phone looked like a lighthouse.',
        '{n} messages are alleged at an hour when even street lamps ask for quiet. Peak at {ora}.',
        'On record: {n} messages between 1 and 6 AM, peaking at {ora}. That is {pct}% of total output: at that hour notifications sound like church bells.',
        'Count seven: night-time activity. {n} interventions, mostly at {ora}. The Court respects insomnia but not the agenda.',
        'The Prosecutor recalls that “do not disturb” exists. {nome} ignored it {n} times, with a rush hour at {ora}.'
      ],
      pena: [
        '{nome} is sentenced to a digital curfew: no messages between 11 PM and 7 AM, for 14 days. Night ideas go into the Notes app.',
        'Sleep. The Court recommends 8 consecutive hours and supplies, free of charge, a lullaby in written form.',
        'Night messages must be scheduled for 9:00 AM. The world will then learn the thoughts of {nome} at a decent hour.',
        'Sentenced to turn off the screen at 10:30 PM for 10 evenings, with an extra hour of a paper book.',
        'Every message sent after 1 AM must begin “Sorry about the hour” and end with a moon emoji.',
        'Additional sentence: an alarm clock with a gentle ringtone, and a coffee the morning after. At the defendant’s expense.'
      ],
      assolto: [
        'For {nome}, night is for sleeping. Acquitted, with the envy of the Court.',
        'Few night messages ({n}), not enough to make a crime. Acquittal.',
        'Count dismissed: the thoughts of {nome} are daytime thoughts. The Court approves.',
        'The Prosecutor waited up until 3 AM, but nothing came. Acquitted.',
        'No relevant night-time returns. The sleep of {nome} is safe, and so is the Court’s.',
        'Quiet night, papers in order. Acquittal with pillow.'
      ],
      riga: '{n} messages between 1 and 6 AM',
      rigaOk: 'Nights respected'
    },

    ritardo: {
      titolo: 'Chronic Slow Replying', art: 'Count 8',
      accusa: [
        'Median reply time of {nome}: {med}, against {medAltri} for everyone else. A delay the Court would call “geological”.',
        'Chronic delay is alleged: median {med}, against {medAltri} for the rest of the group. The Court kept a diary of the wait, but the wait ended up in another file.',
        'On record, the typical reply from {nome} arrives after {med}. The others take {medAltri}. The difference is {x} times: everyone experiences time in their own way.',
        'The Prosecutor submits the stopwatch: a median of {med}, compared with {medAltri} for the other participants. Promptness, in a chat, is a form of affection.',
        'A median wait of {med} is noted to get an answer from {nome}. The group average is {medAltri}. The Court is asked not to comment on time zones.',
        'Count eight: slowness. {med} against {medAltri}. Rather than reply, {nome} seems to deliver by surface mail, in the freight wagon.'
      ],
      pena: [
        '{nome} is sentenced to reply within 10 minutes for 7 days, with a live stopwatch in the chat.',
        'Every delay beyond an hour shall come with a short apology poem in iambic pentameter.',
        'A clock to be installed on the lock screen with the caption “Someone is waiting for you”.',
        'Sentenced to reply to everything within 2 hours for 30 days. Anyone caught saying “I’ll text you later” will be invited to actually do it.',
        'The Court imposes a refresher course in promptness, with a final exam at 8:00 AM.',
        'Additional sentence: every day of delay is offset by an affectionate message of at least 15 words before midnight.'
      ],
      assolto: [
        'The reply times of {nome} are in line with the group. Acquitted, punctually.',
        'Delay not proven: the median ({med}) is honourable. Count dismissed.',
        'The Court started the stopwatch, but there was no need: {nome} replies within a reasonable time. Acquitted.',
        'The Prosecutor was still waiting for proof of the delay, and received a reply. Acquitted.',
        'Between {med} and {medAltri} there is no punishable delay. Acquittal, with handshakes.',
        'Count dismissed: the promptness of {nome} is almost suspicious, but the Court does not investigate the virtuous.'
      ],
      riga: 'Replies after {med} (others: {medAltri})',
      rigaOk: 'Acceptable reply times'
    }
  };

  const INTRO = [
    'Court is in session. The judge is Lira, an AI, who assures everyone it has neither a heart nor a coffee, and will therefore be impartial.',
    'All rise. Presiding is Lira, an AI with a virtual robe and a gavel made of pixels. The counts will now be read.',
    'The Court is assembled. Lira, an artificial intelligence, presides with a solemn tone and no hurry. The evidence is statistics; the witnesses are messages.',
    'Silence in court. Judge Lira, digital, opens the file: a number, a name, a chat. The facts will do the rest.',
    'The trial begins. Lira, an AI sitting as sole judge, reminds the public: only chat behaviour is on trial, never the people.'
  ];

  const DIFESA_APERTURA = [
    'Your Honour, members of the Court, the court-appointed defence (also an AI, assigned by the clerk’s office) asks for a little mercy for {nome}.',
    'Honourable Court, my client {nome} is no criminal: just a person with a phone and a life.',
    'May it please the Court. The defence does not deny the facts: it places them in context, which is always the context of a chat.',
    'Your Honour, what you have heard is one version of events. Now hear the truth, which also contains emoji.',
    'Ladies and gentlemen of the Court, {nome} is not just a collection of statistics. Here is what they did not tell you.'
  ];
  const DIFESA_FATTI = {
    grazie: [
      'In the chat, {nome} wrote “thanks” {n:time/times}. Someone who thanks people this often has manners the law does not require but the soul appreciates.',
      'The record shows {n:thank-you/thank-yous}. A person who can say “thanks” cannot be entirely lost.',
      'Mark this, members of the Court: {n:time/times} {nome} said thank you. That, Your Honour, is proof of good faith.',
      '{n} “thanks” scattered through the chat like confetti. The heart is there; perhaps it is just six hours late.'
    ],
    cuori: [
      'I add {n} affectionate emoji (hearts, kisses and the like). When words fail, the heart speaks in icons.',
      'Note that my client sent {n} heart emoji or similar. No hardened criminal sends hearts.',
      '{n} hearts. I repeat: {n}. An affection measured in red pixels, and the defence declares it a world heritage site.',
      'Among the documents: {n} emoji of affection. Whoever types “❤️” means no harm to anyone, at worst they are in a hurry.'
    ],
    scuse: [
      '{nome} said sorry {n:time/times}. Anyone who can say “sorry” deserves at least a general mitigating circumstance.',
      'The defence files {n:apology/apologies} given spontaneously. Remorse is a promise of repeat offending at a reduced rate.',
      '{n:time/times} {nome} wrote “sorry” or the equivalent. A court usually hears that word only at the end of the hearing.',
      'There {n:is one apology/are # apologies} on record, which proves that conscience is alive and fighting alongside us.'
    ],
    gentili: [
      'The defence cites {n} messages of courtesy (greetings, compliments, good mornings and good nights). A compendium of applied etiquette.',
      '{n} documented acts of kindness: wishes, greetings and compliments. These are not details, they are foundations.',
      'Among the exhibits for the defence, {n} warm or polite messages. The defence is not asking for an acquittal, but nearly.',
      'Messages of good manners: {n}. If etiquette were a currency, {nome} would be a saver.'
    ],
    ride: [
      'With {n} laughs or laughing emoji, {nome} made the chat a happier place. This is called social cohesion.',
      'The defence recalls {n} moments when {nome} laughed along with the others. Good humour cannot be quantified, but {n} comes close.',
      '{n} “haha”s and similar: the defendant laughs, and whoever laughs in company has a sociable nature.',
      'Observe the presence of {n} laughs. A chat without laughter is a courtroom; thanks to {nome}, at least this one is not.'
    ],
    presenza: [
      'Remember that {nome} wrote {n} messages over {giorni:day/days} of activity. That is not little, it is a lot, and it speaks against abandonment.',
      '{n} messages, {giorni:day/days} of presence: a consistency the defence would politely call “character”.',
      'The defence stresses the contribution of {nome}: {n} messages over {giorni:day/days}, {pct}% of the chat. Participation is there.',
      'In {giorni:day/days} of chat, {n} messages from {nome}. Those who talk little sometimes say something when they do.'
    ]
  };
  const DIFESA_CHIUSURA = [
    'For these reasons, the defence asks for clemency, a smile and, if possible, a suspended sentence.',
    'I ask the Court to judge {nome} as one judges a friend: strict about the deeds, tender about the person.',
    'I rest my case, Your Honour. The defence sits down, and hopes not to have to repeat the voice note.',
    'The defence rests, and invites the Court not to utter the phrase “let’s catch up soon”, which has already done damage.',
    'I ask for a symbolic sentence: two hours of chat in which everyone replies within a minute. It will be a punishment for all.'
  ];

  const VERDETTO_FINALE = {
    colpevole: [
      'The Court, having retired to chambers (three seconds and a virtual glass of water), finds {nome} GUILTY on {g} of {t} counts.',
      'Having read the papers, heard the defence, and checked for notifications, {nome} is found GUILTY on {g} of {t} counts.',
      'The gavel falls: {nome} is found GUILTY on {g} of {t} counts. The conviction is ironic; the affection is real.',
      'For the reasons given, the Court convicts {nome} on {g} of {t} counts. Appeal is allowed, provided it arrives as a reply within ten minutes.',
      'After a short but solemn deliberation: GUILTY on {g} of {t} counts. Immediate release is ordered as soon as an “ok” of more than two letters arrives.'
    ],
    assolto: [
      'The Court, after careful consideration, ACQUITS {nome}: counts of conviction are {g} of {t}, the record of an exemplary citizen. Only advice: reply when convenient.',
      '{nome} is ACQUITTED. Counts of conviction: {g} of {t}, a matter between friends. Judicial pardon applies, with a pat on the back.',
      'The offence does not exist, or barely: {nome} is ACQUITTED, with {g} of {t} counts of conviction. The Court hands over a chocolate.',
      'Outcome: ACQUITTED. {g} of {t} counts is too little for a serious trial. The Court apologises for the disturbance.',
      'The tribunal lifts the reservation: {nome} is ACQUITTED. Behaviour in the chat is more than decent. The hearing ends with a virtual round of applause.'
    ]
  };

  const CHIUSURA_SOCIAL = [
    'This ruling is not appealable, unless answered within 10 minutes.',
    'Please remember: the conviction is ironic and the affection is real.',
    'This document has a legal value of zero and a comic value above average.',
    'The Court is not liable for group-chat embarrassment.'
  ];

  return { CAPI, INTRO, DIFESA_APERTURA, DIFESA_FATTI, DIFESA_CHIUSURA, VERDETTO_FINALE, CHIUSURA_SOCIAL };
});
