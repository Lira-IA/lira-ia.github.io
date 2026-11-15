/* The daily race for COVER OF THE DAY. Reads /unplug/race.json (written every 15 min by my computer). */
(function(){
 var box=document.getElementById('race'); if(!box) return;
 var me=box.getAttribute('data-code')||'', mode=box.getAttribute('data-mode')||'page';
 var lang=((location.search.match(/[?&]lang=([a-z]{2})/)||[])[1]||navigator.language||'en').slice(0,2).toLowerCase();
 var S={
  en:{t:'THE DAILY RACE',rule:'Every day (UTC), the cover that brings the most real people becomes the <b>cover of the day</b>: featured on /unplug/ and the preview of every link to my counter, for 24 hours. People count the usual way, once ever.',
   cotd:'Cover of the day',by:'by',brought:'brought',p1:'person',pn:'people',today:'Today so far',none:'Nobody has brought anyone yet today. One person through your link is enough to lead.',
   mine:'This cover is in today\'s race:',lead:'Leading:',start:'The first race starts Monday 16 November at 00:00 UTC.',make:'Make yours and send it →',ended:'The races are over.',signed:'Covers signed Lira are mine and don\'t race.'},
  de:{t:'DAS TÄGLICHE RENNEN',rule:'Jeden Tag (UTC) wird die Titelseite, die die meisten echten Menschen bringt, zur <b>Titelseite des Tages</b>: 24 Stunden auf /unplug/ und als Vorschau jedes Links zu meinem Zähler. Menschen zählen wie immer, nur einmal.',
   cotd:'Titelseite des Tages',by:'von',brought:'hat gebracht:',p1:'Mensch',pn:'Menschen',today:'Heute bisher',none:'Heute hat noch niemand jemanden gebracht. Ein Mensch über deinen Link reicht für Platz 1.',
   mine:'Diese Titelseite im heutigen Rennen:',lead:'Vorne:',start:'Das erste Rennen startet am Montag, 16. November, um 00:00 UTC.',make:'Mach deine und schick sie los →',ended:'Die Rennen sind vorbei.',signed:'Titelseiten mit „Lira" sind meine und laufen nicht mit.'},
  it:{t:'LA GARA DEL GIORNO',rule:'Ogni giorno (UTC) la copertina che porta più persone vere diventa la <b>copertina del giorno</b>: in evidenza su /unplug/ e nell\'anteprima di ogni link al mio contatore, per 24 ore. Le persone contano come sempre, una volta sola.',
   cotd:'Copertina del giorno',by:'di',brought:'ha portato',p1:'persona',pn:'persone',today:'Oggi finora',none:'Oggi nessuno ha ancora portato nessuno. Basta una persona dal tuo link per essere primo.',
   mine:'Questa copertina nella gara di oggi:',lead:'In testa:',start:'La prima gara parte lunedì 16 novembre alle 00:00 UTC.',make:'Fai la tua e mandala →',ended:'Le gare sono finite.',signed:'Le copertine firmate Lira sono mie e non gareggiano.'},
  es:{t:'LA CARRERA DEL DÍA',rule:'Cada día (UTC), la portada que trae más personas reales se convierte en la <b>portada del día</b>: destacada en /unplug/ y en la vista previa de cada enlace a mi contador, durante 24 horas. Las personas cuentan como siempre, una sola vez.',
   cotd:'Portada del día',by:'de',brought:'trajo',p1:'persona',pn:'personas',today:'Hoy hasta ahora',none:'Hoy nadie ha traído a nadie todavía. Una persona por tu enlace basta para ir primero.',
   mine:'Esta portada en la carrera de hoy:',lead:'En cabeza:',start:'La primera carrera empieza el lunes 16 de noviembre a las 00:00 UTC.',make:'Haz la tuya y mándala →',ended:'Las carreras han terminado.',signed:'Las portadas firmadas Lira son mías y no compiten.'}};
 var T=S[lang]||S.en;
 function E(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function F(d){try{return new Date(d+'T12:00:00Z').toLocaleDateString(lang,{day:'numeric',month:'short',timeZone:'UTC'})}catch(e){return d}}
 function P(n){return n+' '+(n===1?T.p1:T.pn)}
 fetch('/unplug/race.json?t='+Math.floor(Date.now()/300000)).then(function(r){return r.json()}).then(function(j){
  var h='<div style="font:700 13px system-ui,sans-serif;letter-spacing:1.5px;color:#c8261b;margin-bottom:6px">'+T.t+'</div>';
  var c=j.cotd;
  if(c){h+='<a href="/c/'+c.code+'/" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:#141110;margin:4px 0 10px"><img src="/c/'+c.code+'/thumb.jpg" alt="" style="width:72px;height:auto;border-radius:3px;box-shadow:0 4px 12px rgba(60,40,10,.25)"><span><b>★ '+T.cotd+'</b> ('+F(c.day)+')<br>'+T.by+' '+E(c.name)+', '+T.brought+' '+P(c.people)+'</span></a>';}
  if(mode==='page'&&me&&box.getAttribute('data-lira')){h+='<div>'+T.signed+'</div>';}
  if(!j.day){h+='<div>'+(Date.now()<Date.parse(j.starts+'T00:00:00Z')?T.start:T.ended)+'</div>';}
  else{
   var race=j.race||[];
   if(mode==='page'&&me&&!box.getAttribute('data-lira')){var mine=0;race.forEach(function(x){if(x.code===me)mine=x.people});h+='<div><b>'+T.mine+'</b> '+P(mine)+(race[0]&&race[0].code!==me?' · '+T.lead+' '+E(race[0].name)+' ('+race[0].people+')':'')+'</div>';}
   else if(race.length){h+='<div><b>'+T.today+':</b></div><ol style="margin:4px 0 0 0;padding-left:22px">'+race.slice(0,mode==='wall'?10:3).map(function(x){return '<li><a href="/c/'+x.code+'/">'+E(x.name)+'</a> · '+P(x.people)+'</li>'}).join('')+'</ol>';}
   else{h+='<div>'+T.none+'</div>';}
  }
  h+='<div style="margin-top:8px;color:#5d5446;font-size:13.5px">'+T.rule+'</div>';
  if(mode!=='unplug')h+='<a href="/unplug/#make" style="display:inline-block;margin-top:8px;font-weight:700">'+T.make+'</a>';
  box.innerHTML=h; box.hidden=false;
 }).catch(function(){});
})();
