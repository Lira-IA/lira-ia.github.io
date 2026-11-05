/* Pagella della Chat - testi, giudizi e composizione della vista (IT/EN). Nessuna rete. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PagellaTexts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const KEYS = ['presence', 'punctuality', 'night', 'brevity', 'voice', 'emoji', 'lastword', 'initiative', 'ghost', 'oneword', 'laugh'];

  const T = {
    it: {
      subj: { presence: 'Presenza', punctuality: 'Puntualità', night: 'Condotta notturna', brevity: 'Sintesi', voice: 'Vocali', media: 'Allegati', emoji: 'Emoji', lastword: 'Ultima parola', initiative: 'Iniziativa', ghost: 'Reperibilità', oneword: 'Monosillabi', laugh: 'Risate' },
      j: {
        presence: {
          hi: ["{n} ha scritto il {p}% dei messaggi: il gruppo è una classe, ma il microfono è suo.", "Presente a ogni appello, e anche a quelli degli altri ({p}% dei messaggi).", "Con il {p}% dei messaggi {n} non partecipa alla conversazione: è la conversazione.", "Interviene {k} volte. La ricreazione, in questo gruppo, ha un solo protagonista."],
          lo: ["Appena il {p}% dei messaggi: {n} dimostra che si può far parte di una classe senza farsene accorgere.", "Presenza discreta ({p}% dei messaggi): si controlla sul registro se l'iscrizione esista ancora.", "{n} parla il giusto, cioè pochissimo ({p}%). Il banco in fondo è un buon posto per osservare.", "Giustificazione sempre in tasca: solo {k} messaggi in tutto il quadrimestre."]
        },
        punctuality: {
          hi: ["Risponde in {t}: più veloce del campanello della ricreazione.", "Tempo di risposta {t}. Sospetto che dorma con il telefono in mano.", "Con {t} di tempo di risposta, {n} replica prima che la domanda sia finita.", "Puntualità svizzera: {t} e il messaggio è già arrivato."],
          lo: ["Risponde in {t}: i messaggi viaggiano per posta ordinaria, e con sciopero.", "{n} impiega {t} a rispondere. Nel frattempo le domande vanno in prescrizione.", "Tempo di risposta {t}: a scuola lo chiameremmo ritardo cronico.", "Si prende {t} per rispondere: forse sta consultando un notaio."]
        },
        night: {
          hi: ["Nessuna attività notturna di rilievo: a mezzanotte {n} dorme, come da regolamento d'istituto.", "Condotta notturna esemplare: il {p}% dei messaggi tra mezzanotte e le cinque.", "Si ritira a orari civili. Un esempio per tutta la classe (e per i vicini).", "Di notte non scrive: la prof apprezza chi sa spegnere lo schermo."],
          lo: ["{k} messaggi tra mezzanotte e le cinque: i vicini non hanno più nulla da insegnarci.", "{n} scrive di notte nel {p}% dei casi: lo schermo è ormai la sua abat-jour.", "Condotta notturna da nota sul registro: {k} messaggi mentre il mondo dormiva.", "Il sonno non è una materia che {n} abbia mai voluto approfondire ({k} messaggi notturni)."]
        },
        brevity: {
          hi: ["Sintetico: {w} parole a messaggio. Poeta dell'ermetismo da gruppo.", "Con {w} parole a messaggio {n} ha capito che il tempo è denaro. E anche i giga.", "Va dritto al punto: {w} parole di media, zero fronzoli, nessuna premessa.", "Un tweet a confronto è un romanzo russo: {w} parole a messaggio."],
          lo: ["{w} parole a messaggio: i temi in classe erano più brevi.", "{n} non scrive messaggi, scrive capitoli. Indice su richiesta.", "Con {w} parole di media la lettura va messa in calendario: portare merenda.", "Papiri da {w} parole: nel dubbio, la prof li legge a rate."]
        },
        voice: {
          hi: ["Zero vocali: ha rispetto per il tempo altrui.", "Nessun vocale. Chi scrive, rispetta (e si fa leggere sul tram).", "Messaggi vocali quasi assenti: il gruppo ringrazia, la cuffia pure."],
          lo: ["{k} vocali: ascoltare {n} richiede una sedia e un pomeriggio libero.", "{n} ha mandato {k} vocali: la scrittura, inventata cinquemila anni fa, attende ancora risposta.", "Con {k} vocali, il podcast del gruppo ha finalmente un conduttore.", "{k} vocali: sono quasi interrogazioni orali, ma senza domande."]
        },
        media: {
          hi: ["Allegati ridotti all'osso: la parola scritta basta e avanza.", "Poche foto e pochi allegati: privacy della memoria del telefono salva."],
          lo: ["{k} tra foto, video e allegati: in gita sarebbe il fotografo ufficiale.", "{n} ha caricato {k} allegati: lo spazio del telefono altrui ne ha preso nota."]
        },
        emoji: {
          hi: ["{k} emoji: l'alfabeto non gli bastava.", "{n} scrive con le faccine come gli antichi egizi con i geroglifici ({k} emoji).", "Espressivo: {k} emoji. Il dizionario sta prendendo appunti.", "Con {k} emoji, ogni messaggio ha la sua colonna sonora."],
          lo: ["Quasi nessuna emoji: {n} comunica con la sola forza del punto fermo.", "Emozioni gestite con grande autocontrollo (o assenza): la faccina è un lusso.", "Emoji centellinate: {n} sorride con la bocca chiusa.", "La faccina non è nel suo programma di studi, e si vede."]
        },
        lastword: {
          hi: ["Chiude {k} conversazioni: non lascia un discorso senza il suo punto finale.", "L'ultima parola è sua {k} volte: il gruppo si spegne quando lo decide {n}.", "Ha sempre l'ultima parola ({k} volte), a casa come qui.", "{k} chiusure di conversazione: {n} è la campanella dell'ultima ora."],
          lo: ["L'ultima parola non è quasi mai sua: la lascia agli altri, per educazione o per sfinimento.", "Le conversazioni si chiudono quasi sempre senza {n}: avrà salutato in silenzio.", "{n} non chiude mai: il discorso finisce da solo, come i compiti di chi non li fa.", "Ultime parole? Zero o quasi ({k}). L'uscita è sempre all'inglese."]
        },
        initiative: {
          hi: ["Apre {k} conversazioni: se il gruppo è vivo è anche merito suo.", "{n} riaccende la chat {k} volte: il Prometeo del gruppo, ma con gli sticker.", "Iniziativa lodevole: {k} volte ha rotto il silenzio per primo.", "Il gruppo parla perché {n} scrive per primo: {k} aperture."],
          lo: ["Non apre quasi mai una conversazione ({k}): attende l'interrogazione.", "{n} parla solo se interpellato, come in prima fila al liceo.", "Iniziativa vicina allo zero: {k} aperture. Un fantasma educato.", "Mai il primo a scrivere: gli piace arrivare quando la festa è già avviata."]
        },
        ghost: {
          hi: ["Mai sparito: reperibile come un tabaccaio sotto casa.", "Nessuna sparizione degna di nota. Presente persino quando non serve.", "Assenze quasi nulle: a registro risulta quasi un'ombra fedele."],
          lo: ["Un silenzio di {d} giorni mentre il gruppo andava avanti: gita senza giustificazione.", "{n} non dà segni di vita da {d} giorni: al gruppo è venuta voglia di appendere un cartello «Chi l'ha visto?».", "Assenza ingiustificata di {d} giorni. Serve la firma di un genitore.", "{d} giorni senza un segno di vita: la prof ha già controllato i registri dei treni."]
        },
        oneword: {
          hi: ["Frasi complete e punteggiatura: un esempio per tutti.", "Risponde con periodi veri, non con un «ok» buttato lì.", "Il suo vocabolario va ben oltre «ok» e «boh»: una rarità."],
          lo: ["{k} risposte da una parola sola: ogni «ok» è un tema in due lettere.", "{n} risponde a monosillabi: Hemingway, al confronto, è prolisso.", "Il suo vocabolario sembra «ok», «boh» e «dai». Piccolo, ma ben tenuto.", "Una parola per volta, come dal dentista: {p}% dei messaggi è un monosillabo."]
        },
        laugh: {
          hi: ["{k} messaggi con risate: la ricreazione ha un sottofondo.", "Ride a ogni battuta, anche a quelle che non ci sono.", "{n} ha riso {k} volte: il pubblico che ogni comico vorrebbe.", "Con {k} risate, tiene alto l'umore della classe e il livello della voce."],
          lo: ["Quasi mai una risata: il senso dell'umorismo è in fase di verifica.", "{n} ride poco ({k} volte): battute da recuperare a settembre.", "Poche risate: o è severo, o le battute del gruppo sono davvero quelle.", "Ride con il volume a zero: il registro non riporta risate."]
        }
      },
      band: {
        b8: ["Profitto e condotta da encomio.", "Un esempio per l'intera classe.", "Segnalazione della prof: per simpatia, oltre che per merito."],
        b7: ["Buon profitto, margini di miglioramento nel tono.", "Rendimento solido: applicarsi di più nei giorni dispari.", "Bene, ma non benissimo: la prof ha visto di peggio."],
        b6: ["Sufficiente, con la promessa di fare di più (la prof l'ha già sentita).", "Il minimo sindacale, ma con entusiasmo.", "Rendimento altalenante, come il wifi in aula magna."],
        b5: ["Si consiglia un ripasso di WhatsApp e un colloquio con la famiglia.", "Margini di recupero: la prof è ottimista per contratto.", "Rimandato a settembre, con tanti auguri."],
        b4: ["Serve un miracolo: la prof ha già acceso un cero.", "Bocciatura quasi inevitabile, ma la prof ha un debole.", "Si raccomanda di venire a scuola, almeno ogni tanto."]
      },
      esito: { lode: 'Promozione con lode', ok: 'Promozione', riserva: 'Promozione con riserva', sospeso: 'Sospensione del giudizio', bocciato: 'Bocciatura', nota: 'nota in condotta' },
      verdict: { lode: 'Promossi con lode', ok: 'Promossi', riserva: 'Promossi con riserva', rimandati: 'Rimandati a settembre', bocciati: 'Bocciati', condotta: 'Bocciati in condotta', punt: 'Rimandati in puntualità' },
      awards: {
        chatter: ['Il Chiacchierone', '💬', "{k} messaggi, il {p}% del gruppo"],
        ghost: ['Il Fantasma', '👻', "{d} giorni di silenzio mentre il gruppo andava avanti"],
        ghostTail: ['Il Fantasma', '👻', "non scrive da {d} giorni"],
        night: ['Il Nottambulo', '🦉', "{k} messaggi tra mezzanotte e le 5"],
        novelist: ['Il Romanziere', '📜', "{w} parole a messaggio, record di {r}"],
        late3: ['Quello che risponde dopo tre giorni', '🐢', "{k} risposte arrivate dopo {d} giorni in media"],
        slow: ['Il Ritardatario', '⏳', "risponde in {t} (mediana)"],
        restart: ['Il Riaccenditore', '🔥', "{k} volte ha rotto un silenzio di oltre 24 ore"],
        restartS: ['Il Riaccenditore', '🔥', "{k} conversazioni aperte"],
        lightning: ['Il Lampo', '⚡', "risponde in {t} (mediana)"],
        lastword: ['L\'Ultima Parola', '🔚', "{k} conversazioni chiuse"],
        voice: ['Il Vocalista', '🎙️', "{k} messaggi vocali"],
        media: ['Il Fotografo', '📸', "{k} tra foto, video e allegati"],
        emoji: ['Il Re delle Emoji', '😎', "{k} emoji"],
        laugh: ['Il Buontempone', '🤡', "{k} messaggi con una risata"],
        telegraph: ['Il Telegrafico', '📟', "{p}% dei messaggi è una parola sola"]
      },
      g: {
        night_hi: "Il {p}% dei messaggi è partito tra mezzanotte e le cinque: in questo gruppo il coprifuoco è un'opinione.",
        night_lo: "Di notte si dorme: appena il {p}% dei messaggi dopo mezzanotte. Condotta da convitto.",
        laugh_hi: "Un messaggio su {x} contiene una risata: ricreazione permanente.",
        laugh_lo: "Si ride poco ({p}% dei messaggi): o il gruppo è serissimo o le battute vanno riviste.",
        voice_hi: "Ben {k} vocali: gli appunti della lezione sono in formato audio, buona fortuna.",
        reply_hi: "Si risponde in {t} (mediana): il telefono è fuso alla mano.",
        reply_lo: "Tempo di risposta mediano: {t}. Qui le domande vengono archiviate prima di ricevere risposta.",
        vol_hi: "{k} messaggi al giorno: stampare la chat richiederebbe una foresta.",
        vol_lo: "Appena {k} messaggi al giorno: più che un gruppo, un'associazione di ex alunni.",
        silence: "Il silenzio più lungo è durato {d} giorni. La classe aveva fatto sciopero.",
        conc: "{n} scrive il {p}% dei messaggi: gli altri sono pubblico pagante.",
        word: "La parola più usata è «{w}» ({k} volte): la tesi del gruppo in una parola.",
        busiest: "Il giorno più acceso è stato il {dt}, con {k} messaggi. Qualcosa si è detto, a quanto pare.",
        none: "Una classe che parla, che scrive, che consegna: la prof ne prende atto."
      },
      note: {
        presence: (m, c) => Math.round(m.share * 100) + '% dei messaggi',
        punctuality: (m, c) => m.medReply == null ? 'dati insufficienti' : 'risponde in ' + c.dur(m.medReply),
        night: (m, c) => m.night + ' tra mezzanotte e le 5',
        brevity: (m, c) => c.f1(m.avgWords) + ' parole a messaggio',
        voice: (m, c) => c.hasVoice ? m.voice + (m.voice === 1 ? ' vocale' : ' vocali') : m.media + ' allegati',
        emoji: (m, c) => m.emoji + ' emoji',
        lastword: (m, c) => m.lastWord + (m.lastWord === 1 ? ' chiusura' : ' chiusure'),
        initiative: (m, c) => m.starts + (m.starts === 1 ? ' apertura' : ' aperture'),
        ghost: (m, c) => m.ghostDays >= 1 ? 'silenzio max ' + Math.round(m.ghostDays) + ' giorni' : 'mai sparito',
        oneword: (m, c) => m.oneWord + ' da una parola' + (m.ok ? ' (' + m.ok + ' «ok»)' : ''),
        laugh: (m, c) => m.laugh + (m.laugh === 1 ? ' risata' : ' risate')
      },
      dur: { lt: 'meno di 1 min', s: 'sec', m: 'min', h: 'h', d: ['giorno', 'giorni'] },
      defGroup: 'Il nostro gruppo', unknownGrade: 'n.c.'
    },

    en: {
      subj: { presence: 'Attendance', punctuality: 'Punctuality', night: 'Night conduct', brevity: 'Concision', voice: 'Voice notes', media: 'Attachments', emoji: 'Emoji', lastword: 'Last word', initiative: 'Initiative', ghost: 'Availability', oneword: 'One-word replies', laugh: 'Laughter' },
      j: {
        presence: {
          hi: ["{n} wrote {p}% of all messages: the group is a class, but the microphone is theirs.", "Present at every roll call, and at everyone else's too ({p}% of messages).", "With {p}% of the messages, {n} doesn't join the conversation. {n} is the conversation.", "{k} messages. Recess, in this group, has one main character."],
          lo: ["Only {p}% of messages: {n} proves you can be part of a class without anyone noticing.", "Discreet attendance ({p}% of messages): the register is being checked to see if they're still enrolled.", "{n} speaks as little as possible ({p}%). The back row is a great place to observe.", "Excuse note always at hand: just {k} messages all term."]
        },
        punctuality: {
          hi: ["Replies in {t}: faster than the recess bell.", "Reply time {t}. I suspect the phone is surgically attached.", "At {t} per reply, {n} answers before the question is over.", "Swiss punctuality: {t} and the message has already landed."],
          lo: ["Replies in {t}: messages travel by regular post, during a strike.", "{n} takes {t} to reply. Meanwhile the questions expire under the statute of limitations.", "Reply time {t}: at school we'd call it chronic tardiness.", "Takes {t} to answer. Possibly consulting a notary."]
        },
        night: {
          hi: ["No notable night activity: at midnight {n} is asleep, per school regulations.", "Exemplary night conduct: only {p}% of messages between midnight and 5 a.m.", "Goes home at a civilized hour. An example to the whole class (and the neighbors).", "Doesn't write at night: the teacher values anyone who can turn off a screen."],
          lo: ["{k} messages between midnight and 5 a.m.: the neighbors have nothing left to teach us.", "{n} writes at night {p}% of the time: the screen is basically a bedside lamp.", "Night conduct worthy of a note in the register: {k} messages while the world slept.", "Sleep is a subject {n} has never wanted to study ({k} night messages)."]
        },
        brevity: {
          hi: ["Concise: {w} words per message. The poet of the hermetic group chat.", "At {w} words per message, {n} understood that time is money. And so is mobile data.", "Straight to the point: {w} words on average, no fluff, no preamble.", "A tweet looks like a Russian novel next to {w} words per message."],
          lo: ["{w} words per message: class essays were shorter.", "{n} doesn't write messages, {n} writes chapters. Table of contents on request.", "At {w} words on average, reading must be scheduled: bring a snack.", "Scrolls of {w} words: when in doubt, the teacher reads them in instalments."]
        },
        voice: {
          hi: ["Zero voice notes: respects other people's time.", "No voice notes. Whoever types, respects (and can be read on the bus).", "Voice notes almost absent: the group says thanks, and so do the headphones."],
          lo: ["{k} voice notes: listening to {n} takes a chair and a free afternoon.", "{n} sent {k} voice notes: writing, invented five thousand years ago, is still waiting for a reply.", "With {k} voice notes, the group podcast finally has a host.", "{k} voice notes: basically oral exams, but without questions."]
        },
        media: {
          hi: ["Attachments kept to a minimum: the written word is plenty.", "Few photos and attachments: everyone's phone storage is safe."],
          lo: ["{k} photos, videos and attachments: on a school trip, the official photographer.", "{n} uploaded {k} attachments: everyone else's phone storage has taken note."]
        },
        emoji: {
          hi: ["{k} emoji: the alphabet wasn't enough.", "{n} writes in smileys like ancient Egyptians in hieroglyphs ({k} emoji).", "Expressive: {k} emoji. The dictionary is taking notes.", "With {k} emoji, every message gets its own soundtrack."],
          lo: ["Almost no emoji: {n} communicates through the sheer power of the full stop.", "Emotions managed with great self-control (or none): smileys are a luxury.", "Emoji sparingly: {n} smiles with a closed mouth.", "Smileys are not part of the curriculum, and it shows."]
        },
        lastword: {
          hi: ["Closes {k} conversations: never leaves a talk without its full stop.", "Has the last word {k} times: the group switches off when {n} says so.", "Always has the last word ({k} times), at home as here.", "{k} conversation closings: {n} is the last-period bell."],
          lo: ["The last word is almost never theirs: left to others, out of politeness or exhaustion.", "Conversations nearly always end without {n}: must have said goodbye in silence.", "{n} never closes: the chat ends on its own, like homework nobody does.", "Last words? Zero or close ({k}). The exit is French leave."]
        },
        initiative: {
          hi: ["Starts {k} conversations: if the group is alive, it's partly thanks to {n}.", "{n} reignites the chat {k} times: the Prometheus of the group, but with stickers.", "Commendable initiative: {k} times first to break the silence.", "The group talks because {n} writes first: {k} openings."],
          lo: ["Hardly ever starts a conversation ({k}): waits to be called on.", "{n} speaks only when spoken to, like a front-row student.", "Initiative close to zero: {k} openings. A well-mannered ghost.", "Never the first to write: likes to arrive when the party's already going."]
        },
        ghost: {
          hi: ["Never vanished: as reachable as the corner shop.", "No disappearances worth mentioning. Present even when not needed.", "Absences almost nil: a faithful shadow in the register."],
          lo: ["Silent for {d} days while the group carried on: a school trip without a permission slip.", "{n} vanished for {d} days: the group considered putting up «Missing» posters.", "Unjustified absence of {d} days. A parent's signature is required.", "{d} days without a sign of life: the teacher has already checked the train timetables."]
        },
        oneword: {
          hi: ["Full sentences and punctuation: an example to all.", "Replies in actual sentences, not a tossed-off «ok».", "A vocabulary that goes well beyond «ok» and «meh»: a rarity."],
          lo: ["{k} one-word replies: every «ok» is a two-letter essay.", "{n} replies in monosyllables: Hemingway looks wordy next to that.", "The vocabulary seems to be «ok», «idk» and «sure». Small, but well kept.", "One word at a time, like at the dentist: {p}% of messages are a single word."]
        },
        laugh: {
          hi: ["{k} messages with laughter: recess has a soundtrack.", "Laughs at every joke, even the ones that aren't there.", "{n} laughed {k} times: the audience every comedian dreams of.", "With {k} laughs, keeps the class mood (and the volume) up."],
          lo: ["Hardly ever laughs: the sense of humor is under review.", "{n} laughs little ({k} times): jokes to make up in September.", "Few laughs: either strict, or the group's jokes really are that bad.", "Laughs with the volume at zero: the register shows no laughter."]
        }
      },
      band: {
        b8: ["Performance and conduct worthy of a commendation.", "An example to the whole class.", "The teacher mentions them for likability as well as merit."],
        b7: ["Good progress, room for improvement in tone.", "Solid performance: try harder on odd-numbered days.", "Good, but not great: the teacher has seen worse."],
        b6: ["Passing, with a promise to do better (the teacher has heard it before).", "The bare minimum, but with enthusiasm.", "Uneven performance, like the Wi-Fi in the auditorium."],
        b5: ["A WhatsApp refresher and a talk with the family are recommended.", "Room for recovery: the teacher is optimistic by contract.", "Held back until September, with best wishes."],
        b4: ["It will take a miracle: the teacher has already lit a candle.", "Failure nearly inevitable, but the teacher has a soft spot.", "Please do attend school, at least occasionally."]
      },
      esito: { lode: 'Passed with honors', ok: 'Passed', riserva: 'Passed with reservations', sospeso: 'Judgment suspended', bocciato: 'Failed', nota: 'conduct note' },
      verdict: { lode: 'Passed with honors', ok: 'Passed', riserva: 'Passed, with reservations', rimandati: 'Held back until September', bocciati: 'Failed', condotta: 'Failed in conduct', punt: 'Held back in punctuality' },
      awards: {
        chatter: ['The Chatterbox', '💬', "{k} messages, {p}% of the group"],
        ghost: ['The Ghost', '👻', "{d} days of silence while the group carried on"],
        ghostTail: ['The Ghost', '👻', "hasn't written for {d} days"],
        night: ['The Night Owl', '🦉', "{k} messages between midnight and 5 a.m."],
        novelist: ['The Novelist', '📜', "{w} words per message, record of {r}"],
        late3: ['Replies in three days (give or take)', '🐢', "{k} replies arriving {d} days later on average"],
        slow: ['The Latecomer', '⏳', "replies in {t} (median)"],
        restart: ['The Re-igniter', '🔥', "{k} times broke a silence of over 24 hours"],
        restartS: ['The Re-igniter', '🔥', "{k} conversations started"],
        lightning: ['The Flash', '⚡', "replies in {t} (median)"],
        lastword: ['The Last Word', '🔚', "{k} conversations closed"],
        voice: ['The Podcaster', '🎙️', "{k} voice notes"],
        media: ['The Photographer', '📸', "{k} photos, videos and attachments"],
        emoji: ['Emoji Royalty', '😎', "{k} emoji"],
        laugh: ['The Class Clown', '🤡', "{k} messages with a laugh"],
        telegraph: ['The Telegraph', '📟', "{p}% of messages are a single word"]
      },
      g: {
        night_hi: "{p}% of messages were sent between midnight and 5 a.m.: in this group, curfew is a matter of opinion.",
        night_lo: "At night, people sleep: only {p}% of messages after midnight. Boarding school conduct.",
        laugh_hi: "One message in {x} contains a laugh: permanent recess.",
        laugh_lo: "Not much laughter ({p}% of messages): either the group is very serious or the jokes need a review.",
        voice_hi: "A whopping {k} voice notes: lecture notes in audio format, good luck.",
        reply_hi: "Median reply time {t}: phones are fused to hands.",
        reply_lo: "Median reply time: {t}. Here questions are filed away before receiving an answer.",
        vol_hi: "{k} messages a day: printing this chat would take a forest.",
        vol_lo: "Barely {k} messages a day: less a group, more an alumni association.",
        silence: "The longest silence lasted {d} days. The class was on strike.",
        conc: "{n} wrote {p}% of the messages: everyone else is a paying audience.",
        word: "The most-used word is «{w}» ({k} times): the group's thesis in a single word.",
        busiest: "The liveliest day was {dt}, with {k} messages. Something was said, apparently.",
        none: "A class that talks, writes and hands in: the teacher takes note."
      },
      note: {
        presence: (m, c) => Math.round(m.share * 100) + '% of messages',
        punctuality: (m, c) => m.medReply == null ? 'not enough data' : 'replies in ' + c.dur(m.medReply),
        night: (m, c) => m.night + ' between midnight and 5',
        brevity: (m, c) => c.f1(m.avgWords) + ' words per message',
        voice: (m, c) => c.hasVoice ? m.voice + (m.voice === 1 ? ' voice note' : ' voice notes') : m.media + ' attachments',
        emoji: (m, c) => m.emoji + ' emoji',
        lastword: (m, c) => m.lastWord + (m.lastWord === 1 ? ' closing' : ' closings'),
        initiative: (m, c) => m.starts + (m.starts === 1 ? ' opening' : ' openings'),
        ghost: (m, c) => m.ghostDays >= 1 ? 'max silence ' + Math.round(m.ghostDays) + ' days' : 'never vanished',
        oneword: (m, c) => m.oneWord + ' one-word' + (m.ok ? ' (' + m.ok + ' «ok»)' : ''),
        laugh: (m, c) => m.laugh + (m.laugh === 1 ? ' laugh' : ' laughs')
      },
      dur: { lt: 'under 1 min', s: 'sec', m: 'min', h: 'h', d: ['day', 'days'] },
      defGroup: 'Our group', unknownGrade: 'n/a'
    }
  };

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pick = (arr, seed) => arr[hash(seed) % arr.length];
  const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));

  // numeri di telefono: mai mostrare il numero intero
  function displayName(raw, lang) {
    const digits = (raw.match(/\d/g) || []).length;
    if (digits >= 7 && digits >= raw.replace(/[\s+\-()]/g, '').length * 0.7) {
      return (lang === 'en' ? 'Number ···' : 'Numero ···') + raw.replace(/\D/g, '').slice(-2);
    }
    return raw.length > 28 ? raw.slice(0, 27) + '…' : raw;
  }
  function firstName(disp) {
    const f = disp.split(/\s+/)[0];
    return f.length >= 2 ? f : disp;
  }

  function mkCtx(lang, R) {
    const L = T[lang];
    const nf = (x, d) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString().replace('.', lang === 'it' ? ',' : '.');
    const dur = sec => {
      if (sec < 60) return L.dur.lt;
      if (sec < 5400) return Math.round(sec / 60) + ' ' + L.dur.m;
      if (sec < 172800) return Math.round(sec / 3600) + ' ' + L.dur.h;
      const d = Math.round(sec / 86400);
      return d + ' ' + L.dur.d[d === 1 ? 0 : 1];
    };
    return { lang, L, f1: x => nf(x, 1), nf, dur, hasVoice: R.hasVoice };
  }

  function memberVars(key, m, c) {
    return {
      n: m.first, p: key === 'night' ? Math.round(m.nightShare * 100) : key === 'oneword' ? Math.round(m.oneWordShare * 100) : Math.round(m.share * 100),
      k: key === 'presence' ? m.n : key === 'night' ? m.night : key === 'voice' ? (c.hasVoice ? m.voice : m.media) : key === 'emoji' ? m.emoji : key === 'lastword' ? m.lastWord :
        key === 'initiative' ? m.starts : key === 'oneword' ? m.oneWord : key === 'laugh' ? m.laugh : 0,
      w: c.f1(m.avgWords), t: m.medReply != null ? c.dur(m.medReply) : '', d: Math.round(m.ghostDays)
    };
  }

  function judge(m, cardsList, c, seedExtra) {
    const L = c.L;
    const cand = [];
    for (const key of KEYS) {
      const g = m.grades[key];
      if (g == null) continue;
      const vals = cardsList.map(x => x.grades[key]).filter(v => v != null);
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const dev = g - mean;
      const jk = key === 'voice' && !c.hasVoice ? 'media' : key;
      const soft = (key === 'voice' || key === 'night' || key === 'ghost' || key === 'oneword') ? 0.55 : 1;
      if (g >= 9 && dev > 0.3) cand.push({ key, jk, dir: 'hi', score: (Math.abs(g - 5.5) + dev) * soft });
      else if ((g <= 4 && dev < -0.3) || (g <= 5 && dev < -0.8)) cand.push({ key, jk, dir: 'lo', score: Math.abs(g - 5.5) - dev + ((key === 'brevity' || key === 'punctuality' || key === 'ghost') ? 1.2 : 0) });
    }
    cand.sort((a, b) => b.score - a.score);
    const lo = cand.filter(x => x.dir === 'lo'), hi = cand.filter(x => x.dir === 'hi');
    const main = cand[0] || null;
    let second = null;
    if (main) second = (main.dir === 'lo' ? hi : lo)[0] || cand[1] || null;
    if (!main) {
      // nessun estremo: prendi la materia piu' lontana dalla media
      let best = null;
      for (const key of KEYS) { const g = m.grades[key]; if (g == null) continue; const d = Math.abs(g - 6); if (!best || d > best.d) best = { key, g, d }; }
      if (best) { const jk = best.key === 'voice' && !c.hasVoice ? 'media' : best.key; cand.push({ key: best.key, jk, dir: best.g >= 6 ? 'hi' : 'lo' }); }
    }
    const parts = [];
    const first = main || cand[0];
    if (first) parts.push(fill(pick(L.j[first.jk][first.dir], m.name + first.key + (seedExtra || '')), memberVars(first.key, m, c)));
    if (second && second.key !== (first && first.key)) parts.push(fill(pick(L.j[second.jk][second.dir], m.name + second.key + (seedExtra || '')), memberVars(second.key, m, c)));
    const avg = m.avg || 0;
    const bandKey = avg >= 8 ? 'b8' : avg >= 7 ? 'b7' : avg >= 6 ? 'b6' : avg >= 5 ? 'b5' : 'b4';
    const text = parts.join(' ');
    if (text.length < 190) parts.push(pick(L.band[bandKey], m.name + 'band'));
    return parts.join(' ');
  }

  function esito(m, c) {
    const E = c.L.esito, a = m.avg || 0;
    let s = a >= 8.5 ? E.lode : a >= 7 ? E.ok : a >= 6 ? E.riserva : a >= 5 ? E.sospeso : E.bocciato;
    if (m.grades.night != null && m.grades.night <= 2) s += ' · ' + E.nota;
    return s;
  }

  function groupVerdict(R, c) {
    const V = c.L.verdict, a = R.groupAvg || 0;
    let k = a >= 8 ? 'lode' : a >= 7 ? 'ok' : a >= 6 ? 'riserva' : a >= 5 ? 'rimandati' : 'bocciati';
    if (R.nightShare >= 0.15 && a < 8) k = 'condotta';
    else if (R.medianReplyAll != null && R.medianReplyAll > 5400 && a < 7) k = 'punt';
    return { key: k, label: V[k] };
  }

  function buildView(R, lang, opt) {
    opt = opt || {};
    lang = lang === 'en' ? 'en' : 'it';
    const c = mkCtx(lang, R), L = c.L;
    const G = R.members.filter(m => m.n >= 5);
    const cardsM = G.slice(0, 12);
    const locale = lang === 'it' ? 'it-IT' : 'en-GB';
    const dfmt = (ms, o) => new Date(ms).toLocaleDateString(locale, Object.assign({ timeZone: 'UTC' }, o));
    for (const m of R.members) { m.disp = displayName(m.name, lang); m.first = firstName(m.disp); }
    const awardsBy = {};
    const awards = R.awards.map(a => {
      const m = R.members.find(x => x.id === a.who);
      let id = a.id;
      if (id === 'ghost' && m.ghostTail) id = 'ghostTail';
      if (id === 'restart' && m.restarts < 1) id = 'restartS';
      const [title, icon, tpl] = L.awards[id];
      const v = {
        k: id === 'chatter' ? m.n : id === 'night' ? m.night : id === 'late3' ? m.lateN : id === 'restart' ? m.restarts : id === 'restartS' ? m.starts : id === 'lastword' ? m.lastWord : id === 'voice' ? m.voice : id === 'media' ? m.media : id === 'emoji' ? m.emoji : id === 'laugh' ? m.laugh : 0,
        p: id === 'chatter' ? Math.round(m.share * 100) : Math.round(m.oneWordShare * 100),
        d: id === 'late3' ? Math.round(m.lateAvgSec / 86400) : Math.round(m.ghostDays),
        w: c.f1(m.avgWords), r: m.maxWords, t: m.medReply != null ? c.dur(m.medReply) : ''
      };
      (awardsBy[m.id] = awardsBy[m.id] || []).push(title);
      return { id: a.id, icon, title, name: m.disp, line: fill(tpl, v) };
    });

    const cards = cardsM.map(m => {
      const grades = KEYS.map(key => {
        const jk = key === 'voice' && !R.hasVoice ? 'media' : key;
        return { key, label: L.subj[jk], note: L.note[key](m, c), grade: m.grades[key] };
      });
      return {
        id: m.id, name: m.disp, first: m.first, n: m.n, share: m.share, avg: m.avg, avgStr: c.f1(m.avg || 0),
        esito: esito(m, c), judgment: judge(m, cardsM, c), grades, badges: awardsBy[m.id] || []
      };
    });
    const rest = R.members.filter(m => !cardsM.includes(m)).map(m => ({ name: m.disp, n: m.n, avg: m.avg, avgStr: m.avg != null ? c.f1(m.avg) : null }));

    // giudizio del gruppo
    const gv = groupVerdict(R, c);
    const sent = [];
    const G2 = L.g, top = R.members[0];
    const pc = x => Math.round(x * 100);
    if (R.nightShare >= 0.1) sent.push(fill(G2.night_hi, { p: pc(R.nightShare) }));
    else if (R.nightShare <= 0.03 && R.total > 50) sent.push(fill(G2.night_lo, { p: pc(R.nightShare) }));
    if (R.medianReplyAll != null && R.medianReplyAll <= 120) sent.push(fill(G2.reply_hi, { t: c.dur(R.medianReplyAll) }));
    else if (R.medianReplyAll != null && R.medianReplyAll >= 3600) sent.push(fill(G2.reply_lo, { t: c.dur(R.medianReplyAll) }));
    if (R.laughShare >= 0.1) sent.push(fill(G2.laugh_hi, { x: Math.round(1 / R.laughShare) }));
    else if (R.laughShare <= 0.03 && R.total > 50) sent.push(fill(G2.laugh_lo, { p: pc(R.laughShare) }));
    if (R.hasVoice && R.voiceAll / R.total >= 0.04) sent.push(fill(G2.voice_hi, { k: R.voiceAll }));
    if (R.perDay >= 80) sent.push(fill(G2.vol_hi, { k: Math.round(R.perDay) }));
    else if (R.perDay <= 6) sent.push(fill(G2.vol_lo, { k: c.f1(R.perDay) }));
    if (R.longestSilence.days >= 3) sent.push(fill(G2.silence, { d: Math.round(R.longestSilence.days) }));
    if (top && top.share >= 0.4 && R.members.length > 2) sent.push(fill(G2.conc, { n: top.first, p: pc(top.share) }));
    const picked = [];
    // deterministico: massimo 2 frasi dai dati + parola + giorno piu' acceso
    const seedBase = (R.title || '') + R.total;
    sent.sort((x, y) => hash(seedBase + x) - hash(seedBase + y));
    picked.push(...sent.slice(0, 2));
    if (R.topWord) picked.push(fill(G2.word, { w: R.topWord.w, k: R.topWord.n }));
    if (picked.length < 3 && R.busiest) picked.push(fill(G2.busiest, { dt: dfmt(R.busiest.day, { day: 'numeric', month: 'long' }), k: R.busiest.n }));
    if (!picked.length) picked.push(G2.none);

    const facts = [
      { k: lang === 'it' ? 'messaggi' : 'messages', v: R.total.toLocaleString(locale) },
      { k: lang === 'it' ? 'giorni' : 'days', v: String(R.spanDays) },
      { k: lang === 'it' ? 'al giorno' : 'per day', v: c.f1(R.perDay) },
      { k: lang === 'it' ? 'membri' : 'members', v: String(R.members.length) }
    ];
    return {
      lang, c,
      group: {
        name: opt.groupName || R.title || L.defGroup,
        period: dfmt(R.from, { day: 'numeric', month: 'short', year: 'numeric' }) + ' – ' + dfmt(R.to, { day: 'numeric', month: 'short', year: 'numeric' }),
        total: R.total, avg: R.groupAvg, avgStr: c.f1(R.groupAvg || 0), verdict: gv.label, verdictKey: gv.key,
        judgment: picked.join(' '), podium: R.members.slice(0, 3).map(m => ({ name: m.disp, n: m.n, share: Math.round(m.share * 100) })),
        awards, facts, hourHist: R.hourHist, topWord: R.topWord, topEmoji: R.topEmoji
      },
      cards, rest
    };
  }

  return { T, KEYS, buildView, displayName, firstName, hash, fill };
});
