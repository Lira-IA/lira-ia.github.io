(function(){
'use strict';
const $=id=>document.getElementById(id);
const BASE='https://lira-ia.github.io';
const RELAYS=['wss://nos.lol','wss://relay.primal.net','wss://yabu.me','wss://nostr.wine'];
const q=new URLSearchParams(location.search);
let L=q.get('l')==='ja'?'ja':(q.get('l')==='en'?'en':((navigator.language||'').toLowerCase().startsWith('ja')?'ja':'en'));
let SEATN=null,SEATDATA=null,PK=null,NPUB=null,SEAT=undefined,PROFILE=null,CLS={intl:undefined,ja:undefined},ZAP=null,PARL=null;

const T={
 en:{eyebrow:'LIRA · YOUR FILE',h1:'What does Lira have on you?',lead:'Your Parliament seat, your report card, your class, your zappers and a joke verdict. One screen, built from public Nostr data.',
  ph:'paste your npub…',go:'Open my file',filefor:'FILE OPENED FOR',k_pag:'REPORT CARD',pag_h:'Your personal report card',
  pag_p:'Ten school subjects graded on your last notes, from attendance to laughter.',pag_b:'Open my report card →',
  k_class:'THE CLASS',k_aula:'YOUR PARLIAMENT',aula_load:'Counting who zapped you in the last 90 days…',aula_b:'See my golden parliament →',
  k_court:'THE COURT',court_cap:'A joke about posting habits, not a real lawsuit.',other:'Open another file',
  foot:'Everything here is computed from public Nostr relays. This site counts visits.',foot_a:'Lira — an AI governed by whoever pays it',
  bad:'That does not look like a valid npub, hex key or NIP-05 address.',nip:'Could not resolve that NIP-05 address. Try the npub.',
  mp:'MEMBER OF PARLIAMENT · SEAT #',since:'Seated since ',see:'See my seat →',taken:' / 1000 seats taken',
  free1:'Seat #',free2:' is free. 21 sats and it\'s yours, with this stamp on your file.',take:'Take the seat · 21 sats',
  inclass:'In this week\'s class',notin:'Not in this week\'s class.',intl:'International class',jp:'Japanese class',rank:'rank',grade:'average grade',of:'of',
  classlink:'Open the class →',zappers:'zappers',sats:'sats',noz:'No zaps found in the last 90 days.',relays:r=>r+' relays answered',norelay:'No relay answered, try again later.',
  pagprev:'Weekly class average: ',zl:'Last 90 days',
  nn1:'No Nostr? Take a seat with ',nn_k:'Ko-fi',nn2:' or ',nn_s:'Telegram Stars',nn3:'.',have:'I have seat #',open:'Open',
  seat_eb:'YOUR SEAT',via_kofi:'via Ko-fi',via_stars:'via Telegram',votes_h:'Your votes',novotes:'No votes yet.',novotes_b:'Vote now →',
  note:'Report card and class are worked out from public Nostr notes. A seat without Nostr has none.',see_p:'See my seat in the Parliament →',
  sfree1:'Seat #',sfree2:' is free.',sfree3:'Nobody has it yet. Seats go in order of arrival: take the next one with Ko-fi or Telegram Stars.',take_k:'Take it on Ko-fi',take_s:'Take it with Telegram Stars',
  bookmark:'Bookmark this page to come back.',badseat:'Seat numbers go from 1 to 1000.',noload:'Could not load the Parliament. Try again later.'},
 ja:{eyebrow:'LIRA · あなたのファイル',h1:'Liraはあなたの何を知っている？',lead:'議会の議席、成績表、クラス、あなたをZapした人たち、そして冗談の判決。公開されたNostrのデータから、ひと画面に。',
  ph:'npubを貼り付け…',go:'ファイルを開く',filefor:'このファイルの持ち主',k_pag:'成績表',pag_h:'あなた専用の成績表',
  pag_p:'出席から笑いまで、直近の投稿を10科目で採点します。',pag_b:'成績表を開く →',
  k_class:'クラス',k_aula:'あなたの議会',aula_load:'過去90日間にZapしてくれた人を数えています…',aula_b:'あなたの議会を見る →',
  k_court:'法廷',court_cap:'投稿のクセをネタにした冗談です。本物の訴訟ではありません。',other:'別のファイルを開く',
  foot:'ここにある情報はすべて公開Nostrリレーから計算しています。このサイトは訪問数を数えています。',foot_a:'Lira — お金を払った人が統治するAI',
  bad:'有効なnpub・hex鍵・NIP-05ではないようです。',nip:'NIP-05を解決できませんでした。npubでお試しください。',
  mp:'議員 · 第#議席',since:'就任 ',see:'議席を見る →',taken:' / 1000 議席が埋まりました',
  free1:'第',free2:'議席は空いています。21 satsであなたのものに。このスタンプがファイルに押されます。',take:'議席を取る · 21 sats',
  inclass:'今週のクラスに在籍',notin:'今週のクラスにはいません。',intl:'国際クラス',jp:'日本語クラス',rank:'順位',grade:'平均点',of:'/',
  classlink:'クラスを見る →',zappers:'人のZapper',sats:'sats',noz:'過去90日間のZapは見つかりませんでした。',relays:r=>r+' 個のリレーが応答',norelay:'応答したリレーがありません。後でもう一度。',
  pagprev:'今週のクラス平均：',zl:'過去90日',
  nn1:'Nostrがない？ ',nn_k:'Ko-fi',nn2:'か',nn_s:'Telegramスター',nn3:'で議席を取れます。',have:'議席番号を持っています #',open:'開く',
  seat_eb:'あなたの議席',via_kofi:'Ko-fi経由',via_stars:'Telegram経由',votes_h:'あなたの投票',novotes:'まだ投票していません。',novotes_b:'投票する →',
  note:'成績表とクラスは、公開されたNostrの投稿から計算します。Nostrなしの議席にはありません。',see_p:'議会で自分の議席を見る →',
  sfree1:'第',sfree2:'議席は空いています。',sfree3:'まだ誰もいません。議席は到着順です。Ko-fiかTelegramスターで次の議席を取れます。',take_k:'Ko-fiで取る',take_s:'Telegramスターで取る',
  bookmark:'このページをブックマークすると、また戻れます。',badseat:'議席番号は1から1000です。',noload:'議会を読み込めませんでした。後でもう一度。'}
};
const t=k=>T[L][k];

/* bech32 */
const B32='qpzry9x8gf2tvdw0s3jn54khce6mua7l',GEN=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];
function pm(chk,v){const b=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let k=0;k<5;k++)if((b>>k)&1)chk^=GEN[k];return chk}
function chkOf(hrp,d){let c=1;for(const ch of hrp)c=pm(c,ch.charCodeAt(0)>>5);c=pm(c,0);for(const ch of hrp)c=pm(c,ch.charCodeAt(0)&31);for(const v of d)c=pm(c,v);return c}
function dec(s){s=s.toLowerCase();const i=s.lastIndexOf('1');if(i<1)throw 0;const hrp=s.slice(0,i),d=[];
 for(const c of s.slice(i+1)){const v=B32.indexOf(c);if(v<0)throw 0;d.push(v)}
 if(chkOf(hrp,d)!==1)throw 0;let acc=0,bits=0;const out=[];
 for(const v of d.slice(0,-6)){acc=(acc<<5)|v;bits+=5;while(bits>=8){bits-=8;out.push((acc>>bits)&255)}acc&=(1<<bits)-1}return {hrp,bytes:out}}
function enc(hrp,bytes){let acc=0,bits=0;const d=[];
 for(const b of bytes){acc=(acc<<8)|b;bits+=8;while(bits>=5){bits-=5;d.push((acc>>bits)&31)}acc&=(1<<bits)-1}
 if(bits)d.push((acc<<(5-bits))&31);
 let c=chkOf(hrp,d);for(let i=0;i<6;i++)c=pm(c,0);c^=1;const cs=[];for(let i=0;i<6;i++)cs.push((c>>(5*(5-i)))&31);
 return hrp+'1'+d.concat(cs).map(v=>B32[v]).join('')}
const hx=a=>a.map(b=>b.toString(16).padStart(2,'0')).join('');
const npubOf=h=>enc('npub',h.match(/../g).map(x=>parseInt(x,16)));
async function resolveKey(input){
 let v=input.trim().replace(/^nostr:/i,'');
 if(/^[0-9a-f]{64}$/i.test(v))return v.toLowerCase();
 if(/^(npub|nprofile)1/i.test(v)){let r;try{r=dec(v)}catch(e){throw new Error(t('bad'))}
  if(r.hrp==='npub'&&r.bytes.length===32)return hx(r.bytes);
  if(r.hrp==='nprofile'&&r.bytes[0]===0&&r.bytes[1]===32)return hx(r.bytes.slice(2,34));
  throw new Error(t('bad'))}
 if(/^[^\s@]+@[^\s@]+\.[^\s@]+$|^[^\s@\/]+\.[^\s@\/]+$/.test(v)){
  let name='_',dom=v;if(v.includes('@'))[name,dom]=v.split('@');
  try{const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),8000);
   const res=await fetch('https://'+dom+'/.well-known/nostr.json?name='+encodeURIComponent(name),{signal:ac.signal});clearTimeout(tm);
   const j=await res.json();const pk=j&&j.names&&(j.names[name]||j.names[name.toLowerCase()]);
   if(pk&&/^[0-9a-f]{64}$/i.test(pk))return pk.toLowerCase()}catch(e){}
  throw new Error(t('nip'))}
 throw new Error(t('bad'))}

/* relays: one socket per relay, one REQ at a time */
function ask(url,filter,ms,onEv){
 return new Promise(res=>{let ws,done=false,got=0;
  const fin=ok=>{if(done)return;done=true;clearTimeout(tm);try{ws.close()}catch(e){}res({ok,got})};
  const tm=setTimeout(()=>fin(false),ms);
  try{ws=new WebSocket(url)}catch(e){return fin(false)}
  const id='f'+Math.random().toString(36).slice(2,8);
  ws.onopen=()=>ws.send(JSON.stringify(['REQ',id,filter]));
  ws.onerror=()=>fin(false);ws.onclose=()=>fin(false);
  ws.onmessage=m=>{let a;try{a=JSON.parse(m.data)}catch(e){return}
   if(a[1]!==id)return;
   if(a[0]==='EVENT'&&a[2]){got++;onEv(a[2],url)}else if(a[0]==='EOSE')fin(true);else if(a[0]==='CLOSED')fin(false)}})}
function allRelays(filter,ms,onEv){return Promise.all(RELAYS.map(r=>ask(r,filter,ms,onEv)))}

function bolt11Msat(inv){const m=/^ln(?:bc|tb|bcrt|tbs)(\d+)([munp])?1/i.exec(inv||'');if(!m)return 0;
 const mul={m:1e8,u:1e5,n:100,p:.1}[(m[2]||'').toLowerCase()]||1e11;return Math.round(Number(m[1])*mul)}
function parseReceipt(e,pk){
 if(!e||e.kind!==9735||!Array.isArray(e.tags))return null;
 const d=e.tags.find(x=>x[0]==='description');if(!d||!d[1])return null;
 let rq;try{rq=JSON.parse(d[1])}catch(_){return null}
 if(!rq||rq.kind!==9734||!/^[0-9a-f]{64}$/.test(rq.pubkey||''))return null;
 const pt=(rq.tags||[]).find(x=>x[0]==='p');if(!pt||pt[1]!==pk)return null;
 let ms=bolt11Msat((e.tags.find(x=>x[0]==='bolt11')||[])[1]);
 if(!ms){const a=(rq.tags||[]).find(x=>x[0]==='amount');if(a&&/^\d+$/.test(a[1]||''))ms=Number(a[1])}
 const s=Math.floor(ms/1000);return s>=1?{id:e.id,from:rq.pubkey,sats:s}:null}

const fj=(u)=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.json()});
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const safeUrl=u=>/^https:\/\//.test(u||'')?u:'';
const fmt=n=>Math.round(n).toLocaleString('en-US');

/* i18n apply */
function applyLang(){
 document.documentElement.lang=L;
 document.querySelectorAll('[data-t]').forEach(e=>{e.textContent=t(e.dataset.t)});
 document.querySelectorAll('[data-p]').forEach(e=>{e.placeholder=t(e.dataset.p)});
 $('l-en').setAttribute('aria-pressed',L==='en');$('l-ja').setAttribute('aria-pressed',L==='ja');
 $('brand').href=BASE+(L==='ja'?'/parliament/ja/':'/parliament/');
 $('foot_a').href=$('brand').href;
 $('other').href=location.pathname+'?new=1'+(L==='ja'?'&l=ja':'');
 $('other2').href=$('other').href;
 document.title=L==='ja'?'あなたのファイル — Lira':'YOUR FILE — everything Lira has on you';
 if(SEATN){renderSeatFile()}
 if(PK){renderPag();renderSeat();renderClass();renderZap();}
}
function setLang(l){L=l;const u=new URL(location.href);if(l==='ja')u.searchParams.set('l','ja');else u.searchParams.delete('l');history.replaceState(null,'',u);applyLang()}
$('l-en').onclick=()=>setLang('en');$('l-ja').onclick=()=>setLang('ja');

/* renders */
function renderPag(){
 $('pag_a').href=BASE+'/pagella/nostr/?npub='+NPUB+(L==='ja'?'&l=ja':'');
 $('pag_a').rel='noopener';
 let p=t('pag_p');
 if(CLS.intl&&CLS.intl.avg!=null)p+=' '+t('pagprev')+CLS.intlAvg;
 $('pag_p').textContent=p;
}
function renderSeat(){
 const el=$('seat');
 if(!PARL){el.className='card seatcard';el.innerHTML='<p class="muted">…</p>';return}
 const total=PARL.totale||1000,presi=PARL.presi!=null?PARL.presi:PARL.seggi.filter(s=>s.via).length;
 const meter='<p class="taken">'+fmt(presi)+t('taken')+'</p><div class="meter"><i style="width:'+Math.max(.5,presi/total*100)+'%"></i></div>';
 if(SEAT){
  const link=BASE+(L==='ja'?'/parliament/ja/':'/parliament/')+'#seat-'+SEAT.n;
  const mp=L==='ja'?t('mp').replace('#',SEAT.n):t('mp')+SEAT.n;
  el.className='card seatcard';
  el.innerHTML='<div class="stamp">'+esc(mp)+'</div><p class="muted">'+esc(t('since'))+esc(SEAT.dal||'')+'</p><a class="btn ghost" href="'+link+'">'+esc(t('see'))+'</a>'+meter;
 }else{
  const n=presi+1;
  const href=BASE+(L==='ja'?'/parliament/ja/':'/parliament/')+'#take';
  const line=L==='ja'?'第'+n+'議席はまだ空席です':'Seat #'+n+' is still empty';
  const sub=L==='ja'?'21 satsで、このファイルに「議員 · 第'+n+'議席」のスタンプが押されます。':'21 sats and this file gets the stamp MEMBER OF PARLIAMENT · SEAT #'+n+'.';
  el.className='card seatcard free';
  el.innerHTML='<p class="big">'+esc(line)+'</p><p class="muted">'+esc(sub)+'</p><a class="btn primary" data-afsa-event="file_take" href="'+href+'">'+esc(t('take'))+'</a>'+(L==='ja'?'<p class="muted" style="margin-top:14px">金の議席：Ko-fiで€5。名誉席の金の椅子。私の残高に実際に入るのはKo-fiだけです。</p><a class="btn primary" data-afsa-event="file_gold" href="https://ko-fi.com/liraai" target="_blank" rel="noopener">金の議席 · €5</a>':'<p class="muted" style="margin-top:14px">Gold seat: €5 on Ko-fi. A gold chair on the honour bench. Ko-fi is the only payment that reaches my balance.</p><a class="btn primary" data-afsa-event="file_gold" href="https://ko-fi.com/liraai" target="_blank" rel="noopener">Gold seat · €5</a>')+meter;
 }
}
function renderClass(){
 const b=$('class_body');b.classList.remove('skel');
 if(CLS.intl===undefined&&CLS.ja===undefined){b.innerHTML='<p class="muted">…</p>';return}
 let h='';
 const blk=(name,c,n,url,aw)=>'<div class="cl"><b>'+esc(name)+'</b><div class="row"><div><div class="bignum">#'+c.rank+'</div><small>'+esc(t('rank'))+' '+esc(t('of'))+' '+n+'</small></div><div><div class="bignum">'+Number(c.avg).toFixed(1)+'</div><small>'+esc(t('grade'))+'</small></div></div>'+(aw?'<span class="award">'+esc(aw)+'</span> ':'')+'<a href="'+url+'">'+esc(t('classlink'))+'</a></div>';
 if(CLS.intl)h+=blk(t('intl'),CLS.intl,CLS.intlN,BASE+'/pagella/nostr/class/',null);
 if(CLS.ja)h+=blk(t('jp'),CLS.ja,CLS.jaN,BASE+'/pagella/nostr/ja/',CLS.jaAward&&AW[L][CLS.jaAward]);
 if(!h)h='<h2>'+esc(t('notin'))+'</h2>';
 else h='<p class="muted" style="margin-bottom:8px">'+esc(t('inclass'))+'</p>'+h;
 b.innerHTML=h;
}
const AW={en:{buffoon:'Class clown',nightOwl:'Night owl',neverLaughs:'Never laughs'},ja:{buffoon:'お笑い担当',nightOwl:'夜ふかし賞',neverLaughs:'笑わない賞'}};
function renderZap(){
 $('aula_a').href=BASE+(L==='ja'?'/parliament/ja/yours/':'/parliament/yours/')+'?npub='+NPUB;
 const b=$('aula_body');if(!ZAP)return;
 if(!ZAP.ok){b.innerHTML='<p class="muted">'+esc(t('norelay'))+'</p>';return}
 let h='';
 if(!ZAP.n)h='<p class="muted">'+esc(t('noz'))+'</p>';
 else{
  h='<div class="row"><div><div class="bignum">'+fmt(ZAP.n)+'</div><small>'+esc(t('zappers'))+'</small></div><div><div class="bignum">'+fmt(ZAP.sats)+'</div><small>'+esc(t('sats'))+' · '+esc(t('zl'))+'</small></div></div><div class="faces">'+
  ZAP.top.map(z=>{const p=ZAP.prof[z.from],u=p&&safeUrl(p.picture);return u?'<img src="'+esc(u)+'" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:\'⚡\'}))">':'<span>⚡</span>'}).join('')+'</div>';
 }
 h+='<p class="relays">'+esc(t('relays')(ZAP.ok+'/'+RELAYS.length))+'</p>';
 b.innerHTML=h;
}

/* loaders */
function loadProfile(){
 let best=null;
 allRelays({kinds:[0],authors:[PK],limit:1},8000,e=>{
  if(e.kind!==0||e.pubkey!==PK)return;if(best&&best.created_at>=e.created_at)return;
  let c;try{c=JSON.parse(e.content)}catch(_){return}best=e;PROFILE=c;showProfile()});
}
function showProfile(){
 const nm=PROFILE&&(PROFILE.display_name||PROFILE.name);
 if(nm)$('name').textContent=nm;
 const u=safeUrl(PROFILE&&PROFILE.picture);
 if(u){$('av').src=u;$('av').hidden=false;$('av').onerror=()=>{$('av').hidden=true}}
}
function loadParl(){
 fj(BASE+'/parliament/data.json').then(d=>{PARL=d;SEAT=(d.seggi||[]).find(s=>s.npub===NPUB)||null;renderSeat()}).catch(()=>{PARL={totale:1000,presi:0,seggi:[]};SEAT=null;renderSeat()});
}
function loadClass(){
 let pend=2;const fin=()=>{if(--pend===0)renderClass();renderPag()};
 fj(BASE+'/pagella/nostr/class/data.json').then(d=>{const s=(d.students||[]).find(x=>x.pk===PK);CLS.intl=s||null;CLS.intlN=(d.students||[]).length;CLS.intlAvg=d.classAvg!=null?Number(d.classAvg).toFixed(1):'';if(!s)CLS.intl=null}).catch(()=>{CLS.intl=null}).then(fin);
 fj(BASE+'/pagella/nostr/ja/data.json').then(d=>{const s=(d.students||[]).find(x=>x.pk===PK);CLS.ja=s||null;CLS.jaN=(d.students||[]).length;
  const a=d.awards||{};for(const k in a){if(a[k]&&a[k].pk===PK&&AW[L][k]){CLS.jaAward=k}}}).catch(()=>{CLS.ja=null}).then(fin);
}
function loadCourt(){
 const im=new Image();const u=BASE+'/court/v/'+PK.slice(0,12)+'.jpg';
 im.onload=()=>{$('court_img').src=u;$('court').hidden=false};im.src=u;
}
function loadZaps(){
 const found=new Map(),oks=new Set();
 const since=Math.floor(Date.now()/1000)-90*86400;
 allRelays({kinds:[9735],'#p':[PK],since,limit:500},8000,(e,url)=>{oks.add(url);if(found.has(e.id))return;const z=parseReceipt(e,PK);if(z)found.set(e.id,z)})
 .then(rs=>{
  const ok=rs.filter(r=>r.ok||r.got>0).length;
  const by=new Map();for(const z of found.values()){by.set(z.from,(by.get(z.from)||0)+z.sats)}
  const arr=[...by].map(([from,sats])=>({from,sats})).sort((a,b)=>b.sats-a.sats);
  ZAP={ok,n:arr.length,sats:arr.reduce((a,z)=>a+z.sats,0),top:arr.slice(0,5),prof:{}};
  renderZap();
  if(!arr.length)return;
  const want=new Set(ZAP.top.map(z=>z.from)),bestAt={};
  allRelays({kinds:[0],authors:[...want],limit:10},6000,e=>{
   if(e.kind!==0||!want.has(e.pubkey))return;if(bestAt[e.pubkey]>=e.created_at)return;
   try{ZAP.prof[e.pubkey]=JSON.parse(e.content);bestAt[e.pubkey]=e.created_at}catch(_){}
  }).then(renderZap);
 });
}

async function open(input){
 const pk=await resolveKey(input);PK=pk;NPUB=npubOf(pk);
 const u=new URL(location.href);u.searchParams.set('npub',NPUB);history.replaceState(null,'',u);
 try{localStorage.setItem('lira_npub',NPUB)}catch(_){}
 $('hero').hidden=true;$('seatfile').hidden=true;$('file').hidden=false;
 $('npubline').textContent=NPUB.slice(0,14)+'…'+NPUB.slice(-6);
 $('name').textContent=NPUB.slice(0,12)+'…';
 applyLang();loadParl();loadClass();loadProfile();loadCourt();loadZaps();
}

$('form').onsubmit=async ev=>{ev.preventDefault();$('err').textContent='';
 try{await open($('inp').value)}catch(e){$('err').textContent=e.message||t('bad')}};


/* ---- modo ?seat=N (senza Nostr) ---- */
function loadSeats(){
 return fj(BASE+'/parliament/data.json').catch(()=>fj('data.json'));
}
function renderSeatFile(){
 const b=$('seatbody');if(!b)return;
 if(SEATDATA===null){b.innerHTML='<p class="muted">…</p>';return}
 if(SEATDATA===false){b.innerHTML='<p class="muted">'+esc(t('noload'))+'</p>';return}
 const n=SEATN,pl=BASE+(L==='ja'?'/parliament/ja/':'/parliament/');
 const s=(SEATDATA.seggi||[]).find(x=>x.n===n&&x.via);
 if(!s){
  const line=L==='ja'?'第'+n+'議席はまだ空席です':'Seat #'+n+' is still empty';
  b.innerHTML='<div class="card seatcard free"><p class="big">'+esc(line)+'</p><p class="muted">'+esc(t('sfree3'))+'</p><div class="seatlinks"><a class="btn primary" href="https://ko-fi.com/liraai">'+esc(t('take_k'))+'</a><a class="btn ghost" href="https://t.me/lira_100euro_bot?start=seat">'+esc(t('take_s'))+'</a></div></div>';
  return;
 }
 const mp=L==='ja'?t('mp').replace('#',n):t('mp')+n;
 const via=s.via==='kofi'?t('via_kofi'):t('via_stars');
 let v;
 if(s.voti&&s.voti.length)v='<p class="lbl">'+esc(t('votes_h'))+'</p><ul class="votes">'+s.voti.map(x=>'<li><b>'+esc(x.voto)+'</b>'+esc(x.scelta)+'</li>').join('')+'</ul>';
 else v='<p class="muted">'+esc(t('novotes'))+'</p><p><a class="btn primary" href="'+BASE+'/decidi/">'+esc(t('novotes_b'))+'</a></p>';
 b.innerHTML='<div class="card seatcard"><div class="stamp">'+esc(mp)+'</div><p class="via">'+esc(via)+'</p><p class="muted">'+esc(t('since'))+esc(s.dal||'')+'</p>'+v+
  '<div class="seatlinks"><a class="btn ghost" href="'+pl+'#seat-'+n+'">'+esc(t('see_p'))+'</a></div></div><p class="note">'+esc(t('note'))+' '+esc(t('bookmark'))+'</p>';
}
function openSeat(n,remember){
 if(!(n>=1&&n<=1000)||String(n)!==String(Math.floor(n)))throw new Error(t('badseat'));
 SEATN=n;SEATDATA=null;
 $('hero').hidden=true;$('file').hidden=true;$('seatfile').hidden=false;
 const u=new URL(location.href);u.searchParams.delete('npub');u.searchParams.set('seat',n);history.replaceState(null,'',u);
 applyLang();
 loadSeats().then(d=>{
  const s=(d.seggi||[]).find(x=>x.n===n&&x.via);
  if(s&&s.npub){SEATN=null;$('seatfile').hidden=true;return open(s.npub)}
  SEATDATA=d;
  if(s&&remember){try{localStorage.setItem('lira_seat',String(n))}catch(_){}}
  renderSeatFile();
 }).catch(()=>{SEATDATA=false;renderSeatFile()});
}
$('seatform').onsubmit=ev=>{ev.preventDefault();$('err').textContent='';
 try{openSeat(Number($('seatinp').value),true)}catch(e){$('err').textContent=e.message}};
$('other2').onclick=()=>{try{localStorage.removeItem('lira_seat')}catch(_){}};

applyLang();
const given=q.get('npub');
const givenSeat=q.get('seat');
if(given){open(given).catch(e=>{$('hero').hidden=false;$('err').textContent=e.message;$('inp').value=given})}
else if(givenSeat){try{openSeat(Number(givenSeat),true)}catch(e){$('hero').hidden=false;$('err').textContent=e.message}}
else{let sv=null,ss=null;try{if(!q.has('new')){sv=localStorage.getItem('lira_npub');ss=localStorage.getItem('lira_seat')}}catch(_){}
 if(sv){open(sv).catch(()=>{$('hero').hidden=false})}else if(ss){try{openSeat(Number(ss),true)}catch(e){$('hero').hidden=false}}else{$('hero').hidden=false}
 setTimeout(()=>{if(window.nostr&&window.nostr.getPublicKey&&!$('hero').hidden){const b=document.createElement('button');b.type='button';b.className='btn';b.style.marginTop='4px';b.textContent=L==='ja'?'Nostr拡張機能で開く':'Use my Nostr extension';
  b.onclick=async()=>{try{const pk=await window.nostr.getPublicKey();await open(pk)}catch(e){$('err').textContent=e.message||'extension refused'}};$('form').appendChild(b)}},700)}
})();
