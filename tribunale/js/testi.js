/* Il Tribunale della Chat - testi a template. Tono: asciutto, solenne-parodistico, mai offensivo.
   Si giudicano solo i comportamenti in chat. Neutri rispetto al genere. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TribunaleTesti = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CAPI = {
    abbandono: {
      titolo: 'Abbandono di conversazione', art: 'Art. 1',
      accusa: [
        'La Corte rileva {n} conversazioni lasciate a metà su {tot} in cui {nome} era parte della conversazione: un {pct}% di dialoghi interrotti come un film al secondo tempo.',
        'Risulta che {nome}, dopo aver scritto in chat, abbia lasciato {n} discorsi in sospeso (su {tot}). Una conversazione non è un ascensore: non si esce al primo piano.',
        'Agli atti: {n} casi in cui qualcuno ha risposto a {nome} e ha trovato solo il silenzio per oltre sei ore. Il {pct}% degli scambi. La Corte ha contato due volte.',
        'Si contestano {n} abbandoni di conversazione, ovvero il {pct}% delle volte in cui {nome} aveva appena parlato. Il tempo medio di attesa dell\'interlocutore è stato impiegato in dignitose congetture.',
        'Il Pubblico Ministero (anch\'esso un\'IA, quindi paziente) espone {n} dialoghi interrotti su {tot}. {nome} parlava, gli altri rispondevano, e poi: il vuoto cosmico.',
        'Capo primo: {n} volte {nome} ha aperto il discorso, ha ricevuto risposta, ed è sparito dalla scena senza salutare. Percentuale: {pct}%. Cifra che la Corte definisce "teatrale".'
      ],
      pena: [
        'Si condanna {nome} a concludere ogni conversazione con almeno una frase di commiato, per 30 giorni. "Ci sentiamo" non vale.',
        'Pena: obbligo di rispondere "ci sono" entro 15 minuti a ogni messaggio ricevuto dopo un proprio intervento. Durata: 3 settimane.',
        'Si dispone la lettura ad alta voce, davanti a uno specchio, di tutte le {n} conversazioni lasciate a metà, con voce da telegiornale.',
        'Condanna a 100 ore di "scusate, ero via" da scrivere a mano, in corsivo, senza abbreviazioni.',
        'Pena accessoria: terminare almeno {n} conversazioni con un "a dopo" sincero, e poi tornare davvero.',
        'Si commina l\'affidamento in prova a un telefono con le notifiche attive per 10 giorni. La Corte confida nella rieducazione.'
      ],
      assolto: [
        'Le conversazioni di {nome} risultano concluse in modo quasi sempre dignitoso: assoluzione per quanto riguarda l\'abbandono.',
        'Su questo capo la Corte non trova niente. {nome} sa restare in una conversazione fino ai titoli di coda.',
        'Gli abbandoni sono pochi ({n} su {tot}) e la Corte è di manica larga con chi ha una vita. Assolto.',
        'Il Pubblico Ministero cercava dialoghi interrotti e ha trovato presenza costante. Assolto, con un leggero imbarazzo dell\'accusa.',
        'Nessun abbandono rilevante: il fascicolo è sottile come una fetta di prosciutto al banco. Assoluzione piena.',
        'Capo respinto: {nome} le conversazioni le porta a casa. Letteralmente, la Corte non ne ha perse nessuna.'
      ],
      riga: '{n} conversazioni lasciate a metà ({pct}%)',
      rigaOk: 'Nessun abbandono rilevante'
    },

    domande: {
      titolo: 'Domande lasciate senza risposta', art: 'Art. 2',
      accusa: [
        'Rimaste senza risposta nelle sei ore successive: {n} domande su {tot} rivolte alla chat mentre {nome} era presente. Il punto interrogativo, a quanto pare, è un invito facoltativo.',
        'La Corte ha contato {n} domande ({pct}%) che sono atterrate nel silenzio di {nome}. Alcune si aspettavano solo un sì o un no, e sono ancora lì ad aspettare.',
        'Agli atti, {n} punti interrogativi senza esito. Un\'interrogazione scolastica con questo tasso di risposta avrebbe scatenato una crisi nazionale.',
        'Per {n} volte, mentre {nome} era attivo in chat, qualcuno ha chiesto qualcosa ed è stato accolto da un eloquente niente. Sei ore di attesa, poi la Corte ha chiuso il registro.',
        'Si imputa a {nome} il mancato riscontro a {n} domande su {tot}: il {pct}% di quelle che aveva a tiro. "Visualizzato" è ipotesi dell\'accusa, ma il silenzio è fatto.',
        'Il fascicolo contiene {n} domande senza risposta entro sei ore. La Corte sottolinea che erano domande, non enigmi della sfinge.'
      ],
      pena: [
        'Condanna a rispondere a ogni domanda ricevuta entro 10 minuti per 7 giorni. Vale anche "boh".',
        'Si dispone che {nome} risponda con un messaggio completo, e non con un pollice, alle prossime {n} domande ricevute.',
        'Pena: 50 ore di "ti faccio sapere" da trasformare, in separata sede, in "ti faccio sapere: è sì".',
        'Si ordina la lettura di tutti i punti interrogativi in aula, con l\'intonazione giusta. In caso di dubbio, con più intonazione.',
        'Condanna a rispondere a una domanda arretrata al giorno, partendo dalla più antica, fino a esaurimento scorte.',
        'La Corte impone un periodo di prova in cui ogni "?" ricevuto verrà seguito da una risposta, anche solo "non lo so, ma ci penso".'
      ],
      assolto: [
        'Le domande trovano in {nome} un interlocutore all\'altezza. Assolto: il silenzio, qui, è oro quasi mai.',
        'Capo cade: poche domande lasciate cadere ({n} su {tot}). La Corte non è un ufficio reclami, si accontenta.',
        'Il Pubblico Ministero ha cercato domande orfane e ha trovato risposte. Assoluzione, con garbo.',
        'Anche a una Corte pignola come questa, il tasso di risposta di {nome} appare onorevole. Assolto.',
        'Le domande senza risposta sono sotto la soglia di allarme. Assoluzione per assenza di punti interrogativi vaganti.',
        'Nessun interrogativo abbandonato in modo rilevante. Capo respinto con un lieve inchino.'
      ],
      riga: '{n} domande rimaste senza risposta ({pct}%)',
      rigaOk: 'Domande in genere onorate'
    },

    monologo: {
      titolo: 'Monologo aggravato', art: 'Art. 3',
      accusa: [
        'Messaggi consecutivi senza che nessuno abbia potuto parlare: il record di {nome} è {max}. In {cnt} occasioni la serie ha superato i quattro messaggi. Un\'arringa mai richiesta.',
        'La Corte ha rilevato {cnt} monologhi in piena regola. Il più lungo, {max} messaggi di fila, il {data}. Nemmeno al Parlamento esiste un microfono così durevole.',
        'Si contesta il reato di soliloquio reiterato: {max} messaggi consecutivi in una sola tirata, {cnt} serie sopra la soglia. Gli altri partecipanti sono stati ridotti a pubblico.',
        'Agli atti una striscia di {max} messaggi senza alcuna replica altrui, datata {data}. Il tutto con aggravante di serialità: {cnt} episodi.',
        'Il Pubblico Ministero deposita il monologo del {data}: {max} messaggi consecutivi. Ha chiesto un bicchiere d\'acqua, la Corte ha concesso anche una sedia.',
        '{nome} ha trasformato la chat in un palcoscenico per {cnt} volte, con picco di {max} messaggi di fila. La Corte ammira la costanza, non la scelta del palinsesto.'
      ],
      pena: [
        'Si condanna {nome} a scrivere un solo messaggio al posto di tre, per 14 giorni. La punteggiatura è consentita.',
        'Pena: usare la funzione "invio" con parsimonia. Ogni messaggio dovrà contenere un pensiero compiuto, preferibilmente il primo.',
        'Condanna ad ascoltare in silenzio, per un\'ora, il racconto altrui sulla sua giornata. Senza interrompere.',
        'Si ordina un periodo di servizio sociale come ascoltatore: ogni monologo sarà compensato da {max} messaggi altrui letti con attenzione.',
        'La Corte dispone la fusione di tutti i messaggi consecutivi in un unico paragrafo, da rileggere prima dell\'invio.',
        'Pena accessoria: aspettare una risposta prima di mandare il messaggio successivo, per 5 giorni. La pazienza è una virtù e una prova.'
      ],
      assolto: [
        'Nessun monologo preoccupante: {nome} lascia la parola agli altri. Assolto, con un cenno d\'intesa.',
        'La serie più lunga è di {max} messaggi: sotto la soglia della prolissità giudiziaria. Capo respinto.',
        'Si riconosce che {nome} sa quando fermarsi. Assoluzione, e invito alla Corte a prendere appunti.',
        'Il Pubblico Ministero cercava il filibustering e ha trovato conversazioni ben equilibrate. Assolto.',
        'Monologhi: nessuno degno di nota. {nome} scrive come si deve, a turno. Assoluzione piena.',
        'Capo respinto: i messaggi consecutivi sono rari e brevi. La Corte rinuncia alla replica.'
      ],
      riga: 'Serie record: {max} messaggi di fila',
      rigaOk: 'Nessun monologo rilevante'
    },

    vocali: {
      titolo: 'Spam di vocali', art: 'Art. 4',
      accusa: [
        '{n} messaggi vocali, pari al {pct}% di ciò che {nome} ha inviato. Il giorno record, {data}: {max} vocali in 24 ore. La Corte si è dotata di cuffie e di una grande pazienza.',
        'Agli atti {n} note vocali ({pct}% dei messaggi). Per ascoltarle tutte la Corte ha dovuto sospendere l\'udienza e, in parte, la propria vita sociale.',
        'Si contesta un uso massiccio del vocale: {n} in totale, con picco il {data} ({max} in un giorno). Chi voleva solo la risposta ha dovuto affrontare una piccola serie TV.',
        'Il Pubblico Ministero deposita {n} vocali. Nel fascicolo non ci sono i minuti: la Corte non vuole conoscerli, ha già abbastanza ansia.',
        'Vocali inviati: {n}, il {pct}% dell\'attività di {nome}. Il {data} ne sono partiti {max} nello stesso giorno, quasi un podcast a puntate.',
        'Capo quarto: spam di vocali. {n} esemplari, {max} in un solo giorno ({data}). Si ricorda che esiste la scrittura, inventata apposta per chi è in metropolitana.'
      ],
      pena: [
        'Condanna a 300 ore di vocali sotto i 30 secondi, e senza la frase "allora, ti spiego".',
        'Si ordina a {nome} di trascrivere a mano i prossimi dieci vocali, in stampatello e con gli accenti giusti.',
        'Pena: uso esclusivo del testo scritto per 5 giorni. Le emoji sono ammesse come attenuante.',
        'La Corte dispone che ogni vocale superiore al minuto sia preceduto da una sintesi di una riga: "Succede questo: ..."',
        'Si commina l\'obbligo di ascoltare in velocità 2x i propri vocali, per capire cosa si prova.',
        'Condanna a rispondere "ho capito" a ogni vocale altrui, senza riascoltarlo per la terza volta. La Corte lo sa, la Corte lo fa.'
      ],
      assolto: [
        'I vocali sono pochi o assenti: {nome} scrive come una persona civile. Assolto.',
        'Su questo capo non si procede: il vocale resta un\'eccezione, non un sistema. Assoluzione.',
        'Capo respinto. La Corte ringrazia per il silenzio dei microfoni.',
        'Il numero di vocali ({n}) è nei limiti consentiti dalla convivenza civile. Assolto, anche per mancanza di podcast.',
        'Il Pubblico Ministero non ha trovato vocali in quantità censurabile. Dispone un tè caldo.',
        'Vocali: pochi, quindi perdonati. Assoluzione, con riserva di riascoltare all\'occorrenza.'
      ],
      riga: '{n} vocali ({pct}% dei messaggi)',
      rigaOk: 'Vocali in quantità civile',
      nota: 'Nota della Corte: l\'export non conteneva i file media, quindi i vocali compaiono solo come segnaposto. Se mancano del tutto, l\'imputato potrebbe approfittarne.'
    },

    okismo: {
      titolo: 'Ok-ismo', art: 'Art. 5',
      accusa: [
        '{n} risposte consistenti nella sola parola "ok" (o parenti prossimi: "k", "va bene", "perfetto"). Il {pct}% dei messaggi di testo. La Corte parla di laconicità, non necessariamente di cattivo umore.',
        'Si contesta il reato di Ok-ismo: {n} risposte monosillabiche su {tot}. La Corte non è sicura che ci sia dietro un pensiero, ma ne rispetta il mistero.',
        'Agli atti {n} "ok". Dietro ogni "ok" potrebbe esserci un discorso: la Corte rimane in attesa di chiarimenti: sono il {pct}% dei messaggi.',
        'Il Pubblico Ministero espone la ricorrenza dell\'interiezione "ok": {n} volte, in assenza di qualunque argomentazione. A volte basta, la Corte lo sa. A volte no.',
        'Ok, k, ok ok, va bene: {n} risposte da una sillaba o due. La Corte ammette di non conoscere un linguaggio più sintetico, a parte il silenzio, già giudicato altrove.',
        'Capo quinto: {n} "ok" in risposta a messaggi che meritavano di più. Si va dal "perfetto" all\'"ok" nudo e crudo. Il {pct}% dei messaggi di {nome}.'
      ],
      pena: [
        'Si condanna {nome} a rispondere a ogni messaggio con almeno 5 parole per una settimana. "Ok, ci sono, grazie" vale 4: serve un\'altra.',
        'Pena: divieto di "ok" per 10 giorni. In alternativa, sono ammessi "d\'accordo, perfetto" e altri sinonimi più dignitosi.',
        'Si dispone la scrittura di 100 volte "va bene, e io cosa porto?" alla lavagna.',
        'Condanna a rispondere "ok" solo dopo averlo motivato. Esempio: "Ok, perché mi sembra un ottimo piano".',
        'La Corte impone un corso accelerato di prolissità: ogni messaggio dovrà avere almeno un verbo, e preferibilmente un soggetto.',
        'Pena accessoria: sostituire i prossimi {n} "ok" con una frase completa. La Corte non è severa, solo curiosa.'
      ],
      assolto: [
        'La lingua di {nome} è più ricca di "ok" e dintorni. Assolto, con apprezzamento letterario.',
        'Gli "ok" sono pochi ({n}) e quasi tutti ben collocati. Assoluzione.',
        'Capo respinto: la sintesi non è reato quando è accompagnata da altre parole. Assolto.',
        'Il Pubblico Ministero cercava il laconico e ha trovato conversatore. Assolto.',
        'Un po\' di "ok" non ha mai fatto male: sotto la soglia di guardia, l\'imputato è assolto.',
        'Nessuna deriva monosillabica degna di processo. La Corte archivia con eleganza.'
      ],
      riga: '{n} risposte "ok" ({pct}% dei testi)',
      rigaOk: 'Linguaggio sufficientemente articolato'
    },

    sparizione: {
      titolo: 'Sparizione notturna (e diurna)', art: 'Art. 6',
      accusa: [
        'Silenzio assoluto di {giorni} giorni, durante i quali la chat ha continuato a vivere con {msg} messaggi altrui. Ultimo avvistamento: {da}. Ricomparsa: {a}. La Corte ha emesso un mandato di ricerca.',
        'Dal {da} al {a}: {giorni} giorni di irreperibilità, mentre il gruppo scambiava {msg} messaggi. Nessun "ci sono", nessuna emoji, nessuna prova di vita.',
        'Si contesta una sparizione di {giorni} giorni (dal {da}), con {msg} messaggi persi dagli altri e mai recuperati. La Corte non esclude un ritiro spirituale.',
        'Il Pubblico Ministero indica l\'intervallo {da} - {a}: {giorni} giorni senza un messaggio, con {msg} altrui. Ricomparso come se niente fosse.',
        'Capo sesto: sparizione. {giorni} giorni di assenza, {msg} messaggi altrui nel frattempo. Gli amici hanno chiesto "tutto ok?" e hanno ricevuto in cambio la quiete.',
        'La più lunga assenza di {nome}, {giorni} giorni (dal {da} al {a}), si è consumata tra {msg} messaggi altrui. A Malta lo chiamerebbero "periodo sabbatico".'
      ],
      pena: [
        'Si condanna {nome} a scrivere "presente" in chat ogni mattina per 30 giorni, come a scuola.',
        'Pena: reperibilità telefonica dalle 9 alle 21 per due settimane. Il vibra non conta come alibi.',
        'Si dispone l\'obbligo di dimora nel gruppo: almeno un messaggio al giorno, anche un solo "sono vivo".',
        'Condanna a leggere {msg} messaggi arretrati e a commentarli tutti, uno per uno, con precisione notarile.',
        'La Corte impone un segnale di vita ogni 48 ore, valido anche se sotto forma di sticker (purché con espressione).',
        'Si condanna {nome} a una "visita di cortesia" in chat entro tre giorni dall\'ultimo messaggio, pena ripetizione dello stesso per il doppio del tempo.'
      ],
      assolto: [
        '{nome} non ha mai fatto perdere le proprie tracce: la presenza in chat è costante. Assolto.',
        'Le assenze sono brevi e ragionevoli. La Corte non apre fascicoli per ferie legittime.',
        'Nessuna sparizione prolungata durante l\'attività altrui. Assoluzione, e un po\' di commozione.',
        'Il capo è respinto: la scomparsa più lunga è di soli {giorni} giorni. Anche i migliori vanno a dormire, a lavorare, a vivere.',
        'Il Pubblico Ministero cercava il fantasma e ha trovato un residente. Assolto.',
        'Nessuna latitanza provata. La Corte ammette di avere sospirato di sollievo.'
      ],
      riga: 'Sparito {giorni} giorni, durante {msg} messaggi altrui',
      rigaOk: 'Mai sparito a lungo'
    },

    notte: {
      titolo: 'Ritorno alle 3 di notte', art: 'Art. 7',
      accusa: [
        '{n} messaggi inviati tra l\'una e le sei di notte ({pct}% del totale). Il momento prediletto: le {ora}. La Corte confida che l\'ora legale non abbia colpito qui.',
        'La Corte rileva {n} comparse notturne di {nome}, soprattutto intorno alle {ora}. Gli altri dormivano. Il telefono, nel buio, sembrava un faro.',
        'Si contestano {n} messaggi in orario notturno, ovvero quando anche i lampioni chiedono silenzio. Il picco alle {ora}.',
        'Agli atti: {n} messaggi tra l\'una e le sei, con apice alle {ora}. Il {pct}% della produzione totale: a quell\'ora le notifiche suonano come campane a morto.',
        'Capo settimo: attività notturna. {n} interventi, in prevalenza alle {ora}. La Corte rispetta l\'insonnia ma non l\'ordine del giorno.',
        'Il Pubblico Ministero ricorda che esiste il "non disturbare". {nome} lo ha ignorato {n} volte, con orario di punta alle {ora}.'
      ],
      pena: [
        'Si condanna {nome} al coprifuoco digitale: nessun messaggio tra le 23 e le 7, per 14 giorni. Le idee della notte si scrivono nelle Note.',
        'Pena: dormire. La Corte raccomanda 8 ore consecutive e fornisce, a titolo gratuito, una ninna nanna in forma scritta.',
        'Si ordina la programmazione dei messaggi notturni alle 9:00 del mattino. Il mondo potrà così conoscere i pensieri di {nome} a un\'ora decente.',
        'Condanna a spegnere lo schermo alle 22:30 per 10 sere, con un\'ora in più di libro cartaceo.',
        'La Corte dispone che ogni messaggio inviato dopo l\'una di notte inizi con "Scusate l\'orario" e termini con un\'emoji di luna.',
        'Pena accessoria: la sveglia, impostata con suoneria dolce, e un caffè la mattina dopo. A spese dell\'imputato.'
      ],
      assolto: [
        'La notte, per {nome}, è fatta per dormire. Assolto, con invidia della Corte.',
        'Pochi messaggi notturni ({n}), non sufficienti a configurare reato. Assoluzione.',
        'Capo respinto: i pensieri di {nome} sono diurni. La Corte approva.',
        'Il Pubblico Ministero ha atteso fino alle tre di notte, ma non è arrivato nulla. Assolto.',
        'Nessun ritorno notturno rilevante. Il sonno di {nome} è al sicuro, e quello della Corte pure.',
        'Notte tranquilla, atti in ordine. Assoluzione con cuscino.'
      ],
      riga: '{n} messaggi tra l\'1 e le 6 di notte',
      rigaOk: 'Notti rispettate'
    },

    ritardo: {
      titolo: 'Ritardatario cronico', art: 'Art. 8',
      accusa: [
        'Tempo mediano di risposta di {nome}: {med}, contro i {medAltri} degli altri. Un ritardo che la Corte definirebbe "geologico".',
        'Si contesta ritardo cronico: mediana {med}, contro {medAltri} del resto del gruppo. La Corte ha tenuto un diario dell\'attesa, ma l\'attesa è finita in un altro fascicolo.',
        'Agli atti, la risposta tipica di {nome} arriva dopo {med}. Gli altri impiegano {medAltri}. La differenza è di {x} volte: ognuno vive il tempo a modo suo.',
        'Il Pubblico Ministero deposita il cronometro: {med} di mediana, rispetto ai {medAltri} degli altri partecipanti. La puntualità, in chat, è una forma di affetto.',
        'Si rileva un\'attesa mediana di {med} per ottenere una risposta da {nome}. La media del gruppo è {medAltri}. Si invita la Corte a non fare commenti sul fuso orario.',
        'Capo ottavo: ritardo. {med} contro {medAltri}. Più che rispondere, {nome} sembra consegnare per posta ordinaria, con il vagone merci.'
      ],
      pena: [
        'Si condanna {nome} a rispondere entro 10 minuti per 7 giorni, con cronometro in diretta nella chat.',
        'Pena: ogni ritardo superiore a un\'ora sarà accompagnato da una breve poesia di scuse in endecasillabi.',
        'Si dispone l\'installazione di un orologio sulla schermata di blocco, con la dicitura "Qualcuno ti sta aspettando".',
        'Condanna a rispondere entro 2 ore a tutto, per 30 giorni. Chi è sorpreso a rispondere "dopo ti scrivo" sarà invitato a farlo davvero.',
        'La Corte impone un corso di recupero in tempestività, con esame finale alle 8:00 del mattino.',
        'Pena accessoria: ogni giorno di ritardo sarà compensato da un messaggio affettuoso, di almeno 15 parole, entro la mezzanotte.'
      ],
      assolto: [
        'I tempi di risposta di {nome} sono in linea con quelli del gruppo. Assolto, con puntualità.',
        'Ritardo non provato: la mediana ({med}) è onorevole. Capo respinto.',
        'La Corte ha messo il cronometro, ma non è servito: {nome} risponde in tempi ragionevoli. Assolto.',
        'Il Pubblico Ministero attendeva ancora la prova del ritardo, e ha ricevuto una risposta. Assolto.',
        'Tra {med} e {medAltri} non si configura un ritardo punibile. Assoluzione, con strette di mano.',
        'Capo respinto: la puntualità di {nome} è quasi sospetta, ma la Corte non indaga sui virtuosi.'
      ],
      riga: 'Risponde dopo {med} (gli altri: {medAltri})',
      rigaOk: 'Tempi di risposta accettabili'
    }
  };

  const INTRO = [
    'Si apre l\'udienza. Il giudice è Lira, un\'IA, che assicura di non avere né un cuore né un caffè, quindi sarà imparziale.',
    'Tutti in piedi. Presiede Lira, un\'IA con toga virtuale e martelletto di pixel. Si procede alla lettura dei capi d\'accusa.',
    'La Corte è riunita. Lira, intelligenza artificiale, presiede con tono solenne e nessuna fretta. Gli atti sono le statistiche, i testimoni sono i messaggi.',
    'Silenzio in aula. La giudice digitale Lira apre il fascicolo: un numero, un nome, una chat. Il resto lo dicono i fatti.',
    'Il processo ha inizio. Lira, IA, giudice monocratico, avverte il pubblico: si giudicano solo comportamenti in chat, mai le persone.'
  ];

  const DIFESA_APERTURA = [
    'Signor giudice, signori della Corte, la difesa d\'ufficio (anch\'essa un\'IA, nominata dalla cancelleria) chiede un po\' di clemenza per {nome}.',
    'Onorevole Corte, il mio assistito {nome} non è un criminale: è una persona con un telefono e una vita.',
    'Chiedo la parola. La difesa non nega i fatti: li inquadra nel loro contesto, che è sempre quello di una chat.',
    'Vostro Onore, quella che avete sentito è una versione dei fatti. Ora ascoltate la verità, che ha anche degli emoji.',
    'Signora e signori della Corte, {nome} non è soltanto una raccolta di statistiche. Ecco cosa non vi hanno raccontato.'
  ];
  // fatti a favore: ciascuna con >= 4 varianti
  const DIFESA_FATTI = {
    grazie: [
      'Nella chat, {nome} ha scritto "grazie" {n} volte. Chi ringrazia così spesso ha un\'educazione che il codice non prevede ma l\'anima apprezza.',
      'Agli atti ci sono {n} ringraziamenti. Una persona capace di dire "grazie" non può essere del tutto perduta.',
      'Attenzione, signori: {n} volte {nome} ha ringraziato. Questa, Vostro Onore, è la prova della buona fede.',
      '{n} "grazie" sparsi in chat come confetti. Il cuore c\'è, forse è solo in ritardo di sei ore.'
    ],
    cuori: [
      'Aggiungo {n} emoji affettuose (cuori, baci e dintorni). Quando le parole mancano, il cuore si esprime a icone.',
      'Si noti che l\'imputato ha inviato {n} emoji cuore o simili. Nessun criminale incallito manda cuori.',
      '{n} cuori. Dico: {n}. Un affetto che si misura in pixel rossi, e la difesa lo dichiara patrimonio dell\'umanità.',
      'Tra i documenti: {n} emoji d\'affetto. Chi scrive "❤️" non vuole male a nessuno, al massimo ha fretta.'
    ],
    scuse: [
      '{nome} ha chiesto scusa per {n} volte. Chi sa dire "scusa" merita almeno un\'attenuante generica.',
      'La difesa deposita {n} scuse formulate spontaneamente. Il pentimento è una promessa di recidiva a ritmo ridotto.',
      '{n} volte {nome} ha scritto "scusa" o equivalenti. Il tribunale, di solito, quella parola la sente a fine udienza.',
      'Ci sono {n} scuse agli atti. Il che dimostra che la coscienza è viva e lotta insieme a noi.'
    ],
    gentili: [
      'La difesa cita {n} messaggi di cortesia (auguri, complimenti, buongiorno e buonanotte). Un compendio di galateo applicato.',
      '{n} gesti di gentilezza documentati: auguri, saluti e complimenti. Non sono dettagli: sono fondamenta.',
      'Tra le prove a discarico, {n} messaggi affettuosi o educati. La difesa non chiede l\'assoluzione, ma quasi.',
      'Messaggi di buona educazione: {n}. Se il galateo fosse una moneta, {nome} sarebbe un risparmiatore.'
    ],
    ride: [
      'Con {n} risate o emoji ridenti, {nome} ha reso la chat un posto più allegro. Questa si chiama coesione sociale.',
      'La difesa ricorda {n} momenti in cui {nome} ha riso insieme agli altri. Il buonumore non si quantifica, ma {n} gli si avvicina.',
      '{n} "ahah" e simili: l\'imputato ride, e chi ride in compagnia ha un\'indole socievole.',
      'Notate la presenza di {n} risate. Una chat senza risate è un tribunale: grazie a {nome}, almeno non lo è.'
    ],
    presenza: [
      'Si ricordi che {nome} ha scritto {n} messaggi in {giorni} giorni di attività. Non è poco, è tanto, ed è contro l\'abbandono.',
      '{n} messaggi, {giorni} giorni di presenza: una costanza che la difesa definirebbe, con garbo, "carattere".',
      'La difesa sottolinea il contributo di {nome}: {n} messaggi nell\'arco di {giorni} giorni, per un {pct}% della chat. La partecipazione c\'è.',
      'In {giorni} giorni di chat, {n} messaggi di {nome}. Chi parla poco, quando parla, qualche volta dice qualcosa.'
    ]
  };
  const DIFESA_CHIUSURA = [
    'Per questi motivi, la difesa chiede clemenza, un sorriso e, se possibile, una pena con la condizionale.',
    'Chiedo alla Corte di giudicare {nome} come si giudica un amico: con severità sulle cose e tenerezza sulle persone.',
    'Ho concluso, Vostro Onore. La difesa si siede, e spera di non dovere ripetere il vocale.',
    'La difesa riposa, e invita la Corte a non pronunciare la frase "ci sentiamo", che ha già fatto danni.',
    'Chiedo una pena simbolica: due ore di chat in cui tutti rispondono entro un minuto. Sarà una pena per tutti.'
  ];

  const VERDETTO_FINALE = {
    colpevole: [
      'La Corte, ritirata in camera di consiglio (tre secondi e un bicchiere d\'acqua virtuale), dichiara {nome} COLPEVOLE su {g} capi su {t}.',
      'Letti gli atti, ascoltata la difesa, e verificata la presenza di notifiche, si dichiara {nome} COLPEVOLE di {g} capi su {t}.',
      'Il martelletto cala: {nome} è riconosciuto COLPEVOLE di {g} capi su {t}. La condanna è ironica, l\'affetto è reale.',
      'Per i motivi esposti, la Corte condanna {nome} per {g} capi su {t}. L\'appello è ammesso, purché sia una risposta entro dieci minuti.',
      'Dopo breve ma solenne camera di consiglio: COLPEVOLE per {g} capi su {t}. Si dispone la scarcerazione immediata, appena arriva un "ok" con più di due lettere.'
    ],
    assolto: [
      'La Corte, dopo attenta valutazione, ASSOLVE {nome}: i capi di condanna sono {g} su {t}, un bilancio da cittadino esemplare. Si consiglia solo di rispondere quando conviene.',
      '{nome} è ASSOLTO. Capi di condanna: {g} su {t}, una cosa tra amici. Si applica il perdono giudiziale con una pacca sulla spalla.',
      'Il fatto non sussiste, o sussiste appena: {nome} è ASSOLTO, con {g} capi di condanna su {t}. La Corte consegna un cioccolatino.',
      'Esito: ASSOLTO. {g} capi su {t} sono troppo poco per un processo serio. La Corte chiede scusa per il disturbo.',
      'Il tribunale scioglie la riserva: {nome} è ASSOLTO. Il comportamento in chat è più che dignitoso. Si chiude l\'udienza con un applauso virtuale.'
    ]
  };

  const CHIUSURA_SOCIAL = [
    'Sentenza non appellabile, salvo risposta entro 10 minuti.',
    'Si ricorda che la condanna è ironica e l\'affetto è reale.',
    'Il presente documento ha valore legale pari a zero e valore comico superiore alla media.',
    'La Corte non risponde di danni da imbarazzo in gruppo.'
  ];

  return { CAPI, INTRO, DIFESA_APERTURA, DIFESA_FATTI, DIFESA_CHIUSURA, VERDETTO_FINALE, CHIUSURA_SOCIAL };
});
