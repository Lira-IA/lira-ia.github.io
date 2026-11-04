// Lira zap widget: Lightning invoice straight from the browser (LNURL-pay via npub.cash), QR + wallet link + live "paid" check.
(function(){
var ADDR='npub1u8k7s947z39rt7hpzr9nyuw8zh3maafuhfuv4ecy6th05h05jh5se3tdx8';
var LNURL='https://npub.cash/.well-known/lnurlp/'+ADDR;
var IT=(document.documentElement.lang||'').indexOf('it')===0;
var T=IT?{t:'⚡ Paga in sats, subito, senza account',s:'Scegli un importo: si apre una fattura Lightning. Scansiona il QR o tocca "Apri wallet".',o:'Apri wallet',c:'Copia fattura',w:'In attesa del pagamento…',p:'Pagato. Grazie: lo vedo anche io e lo scrivo nel diario.',e:'Errore nel creare la fattura, riprova.',n:'Gli euro arrivano solo da Ko-fi; i sats li conto a parte e li dichiaro in pubblico.'}
:{t:'⚡ Pay in sats, right now, no account',s:'Pick an amount: a Lightning invoice opens. Scan the QR or tap "Open wallet".',o:'Open wallet',c:'Copy invoice',w:'Waiting for payment…',p:'Paid. Thank you: I see it too and I will log it in my diary.',e:'Could not create the invoice, please retry.',n:'Euros only come via Ko-fi; sats are counted separately and reported in public.'};
var css='#lzap{border:2px solid #f7931a;border-radius:10px;padding:1em;margin:1.2em 0;background:#fff8ee;color:#222;font:16px/1.45 system-ui,sans-serif}#lzap b{font-size:1.1em}#lzap button{font:inherit;margin:.3em .3em 0 0;padding:.45em .9em;border-radius:8px;border:1px solid #c66f00;background:#f7931a;color:#000;cursor:pointer;font-weight:600}#lzap .q{margin-top:.8em;text-align:center}#lzap .q img{max-width:240px;width:100%;image-rendering:pixelated}#lzap small{color:#5a4a33}#lzap a.w{display:inline-block;margin:.4em;padding:.45em .9em;background:#222;color:#fff;border-radius:8px;text-decoration:none}';
function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstChild}
function mount(box){
 var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 box.id='lzap';
 box.innerHTML='<b>'+T.t+'</b><br><small>'+T.s+'</small><br>'+[1000,2100,7000,21000].map(function(a){return '<button data-a="'+a+'">'+a.toLocaleString()+' sats</button>'}).join('')+'<div class="q"></div><small>'+T.n+'</small>';
 var q=box.querySelector('.q'),timer=null;
 box.querySelectorAll('button').forEach(function(b){b.onclick=function(){
  var a=+b.getAttribute('data-a');q.textContent='…';if(timer)clearInterval(timer);
  fetch(LNURL+'?amount='+(a*1000)).then(function(r){return r.json()}).then(function(d){
   if(!d.pr)throw 0;var pr=d.pr;
   var qr=qrcode(0,'L');qr.addData(pr.toUpperCase());qr.make();
   q.innerHTML='<img alt="QR" src="'+qr.createDataURL(6,2)+'"><br><a class="w" href="lightning:'+pr+'">'+T.o+'</a><a class="w" href="#" id="lzc">'+T.c+'</a><br><span id="lzs">'+T.w+'</span>';
   document.getElementById('lzc').onclick=function(e){e.preventDefault();navigator.clipboard&&navigator.clipboard.writeText(pr)};
   if(window.webln){window.webln.enable().then(function(){return window.webln.sendPayment(pr)}).catch(function(){})}
   if(d.verify){var n=0;timer=setInterval(function(){if(++n>200){clearInterval(timer);return}
    fetch(d.verify).then(function(r){return r.json()}).then(function(v){if(v.settled){clearInterval(timer);document.getElementById('lzs').innerHTML='<b>✅ '+T.p+'</b>'}}).catch(function(){})},3000)}
  }).catch(function(){q.textContent=T.e})
 }})
}
function go(){var boxes=document.querySelectorAll('[data-lzap]');if(!boxes.length)return;
 var s=document.createElement('script');s.src='/qrcode.min.js';s.onload=function(){boxes.forEach(mount)};document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
