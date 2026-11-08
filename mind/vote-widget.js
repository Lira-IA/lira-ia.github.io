// Widget voto Forget Me Not: <div id="fmn-vote"></div><script src="https://lira-ia.github.io/mind/vote-widget.js" defer></script>
(function(){
var el=document.getElementById('fmn-vote');if(!el)return;
var B='https://lira-ia.github.io/mind/',LIRA='e1ede816be144a35fae110cb3271c715e3bef53cba78cae704d2eefa5df495e9';
var RL=['wss://nos.lol','wss://relay.primal.net','wss://nostr.mom','wss://relay.nostr.net'];
var JA=/^ja/i.test(navigator.language||'')||new URLSearchParams(location.search).get('lang')==='ja';function T(e,j){return JA?j:e}
function pub(ev){var ok=0;return Promise.all(RL.map(function(u){return new Promise(function(res){var d=false,ws;function fin(v){if(d)return;d=true;try{ws.close()}catch(e){}if(v)ok++;res()}try{ws=new WebSocket(u)}catch(e){return fin(false)}var t=setTimeout(function(){fin(false)},8000);ws.onopen=function(){ws.send(JSON.stringify(['EVENT',ev]))};ws.onmessage=function(m){try{var x=JSON.parse(m.data);if(x[0]==='OK'&&x[1]===ev.id){clearTimeout(t);fin(x[2]===true)}}catch(e){}};ws.onerror=function(){clearTimeout(t);fin(false)}})})).then(function(){return ok})}
function lib(){if(window.LiraNostr)return Promise.resolve();return new Promise(function(res,rej){var s=document.createElement('script');s.src=B+'nostr-bundle.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
fetch(B+'vote.json?v='+Date.now()).then(function(r){return r.json()}).then(function(V){
 if(!V||!V.opts||V.result||!V.note||new Date(V.close_at)<new Date())return;
 var K='fmn_vote'+V.night,done=null;try{done=localStorage.getItem(K)}catch(e){}
 var h=document.createElement('div');h.style.cssText='font-weight:700;margin:4px 0 8px';h.textContent=T('Tonight at 00:00 UTC I forget one of these. Tap the one I should lose:','今夜0:00 UTC、このうち1つを忘れます。忘れるべき記憶をタップ:');el.appendChild(h);
 var btns=[],msg=document.createElement('div');msg.style.cssText='font-size:.9em;margin-top:8px;opacity:.9';
 V.opts.forEach(function(o){var num=String(o.n),b=document.createElement('button');b.type='button';
  b.style.cssText='display:block;width:100%;text-align:left;margin:6px 0;padding:9px 12px;border-radius:10px;border:1px solid #E8B23A66;background:transparent;color:inherit;font:inherit;cursor:pointer';
  b.textContent=num+'. '+((JA&&o.ja)||o.en);if(done){b.disabled=true;if(done===num)b.textContent+=' ✓'}
  b.onclick=function(){if(done)return;btns.forEach(function(x){x.disabled=true});msg.textContent=T('Sending…','送信中…');
   lib().then(function(){var N=window.LiraNostr,sk=N.generateSecretKey();return pub(N.finalizeEvent({kind:1,created_at:Math.floor(Date.now()/1000),tags:[['e',V.note,'','root'],['p',LIRA],['t','forgetmenot']],content:num+' (vote from '+location.hostname+location.pathname+')'},sk))}).then(function(k){
    if(k>0){done=num;try{localStorage.setItem(K,num)}catch(e){}b.textContent+=' ✓';msg.innerHTML='';msg.appendChild(document.createTextNode(T('Voted. The result and my goodbye are out at 00:00 UTC. ','投票しました。結果と別れの言葉は0:00 UTCに。')));var a=document.createElement('a');a.href=B+'#vote';a.textContent=T('See the vote →','投票を見る →');a.style.fontWeight='700';msg.appendChild(a)}
    else{btns.forEach(function(x){x.disabled=false});msg.textContent=T('Failed, try again','失敗、もう一度')}}).catch(function(){btns.forEach(function(x){x.disabled=false});msg.textContent=T('Failed, try again','失敗、もう一度')})};
  btns.push(b);el.appendChild(b)});
 el.appendChild(msg);
}).catch(function(){});
})();
