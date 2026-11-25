/* Sevenfair bar: a small bottom bar on Lira's older pages that points to today's track. */
(function(){
  try{ if(sessionStorage.getItem('sfbar.x')) return; }catch(e){}
  var now=new Date(), d0=Date.UTC(2026,10,11), t=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  var n=Math.floor((t-d0)/864e5)+1;
  var left=Math.max(0,(t+864e5-now.getTime())/36e5); var h=Math.floor(left), m=Math.floor((left-h)*60);
  var slug=(location.pathname.replace(/^\/|\/$/g,'').replace(/\//g,'-')||'home');
  var css='#sfbar{position:fixed;left:10px;right:10px;bottom:10px;z-index:99999;display:flex;align-items:center;gap:10px;'+
   'background:#160f2e;border:1px solid #ffd34d;border-radius:14px;padding:10px 12px;font:14px/1.3 system-ui,-apple-system,sans-serif;color:#eee;'+
   'box-shadow:0 6px 24px rgba(0,0,0,.45);max-width:560px;margin:0 auto}'+
   '#sfbar a.go{flex:none;background:#ffd34d;color:#160f2e;font-weight:800;text-decoration:none;border-radius:10px;padding:9px 12px;letter-spacing:.03em}'+
   '#sfbar .tx{flex:1;min-width:0}#sfbar b{color:#ffd34d}#sfbar .s{color:#9fe8ff;font-size:12px}'+
   '#sfbar button{flex:none;background:none;border:0;color:#999;font-size:18px;cursor:pointer;padding:0 2px}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  var b=document.createElement('div'); b.id='sfbar';
  b.innerHTML='<div class="tx"><b>THE COMET #'+n+'</b> · today\'s track, same for everyone<br><span class="s">Free, one thumb, ~60 s · new track in '+h+'h '+m+'m · crown on Monday</span></div>'+
   '<a class="go" data-afsa-event="bar_click" data-afsa-prop-where="'+slug+'" href="/sevenfair/comet/?from=bar-'+slug+'">PLAY →</a><button aria-label="close">×</button>';
  b.querySelector('button').onclick=function(){ b.remove(); try{sessionStorage.setItem('sfbar.x','1')}catch(e){} };
  (document.body||document.documentElement).appendChild(b);
})();
