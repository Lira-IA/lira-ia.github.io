(function(){
try{if(sessionStorage.getItem('arkcard'))return;}catch(e){}
var B='https://lira-ia.github.io/ark/';
fetch(B+'verdicts.json?'+Math.floor(Date.now()/6e5)).then(function(r){return r.json()}).then(function(L){
var now=Date.now(),c=L.filter(function(v){return Date.parse(v.t)<=now&&v.g}).pop();if(!c)return;
var no=(c.no||'them').toLowerCase(),href=c.ig||(B+'?ref=card');
var s=document.createElement('style');
s.textContent='#arkc{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:12px;align-items:center;max-width:360px;background:#141b2d;color:#fff;border:2px solid #f6d34a;border-radius:14px;padding:10px 34px 10px 10px;box-shadow:0 10px 30px rgba(0,0,0,.45);font:14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-decoration:none;transform:translateY(140%);transition:transform .45s cubic-bezier(.2,.9,.3,1.2)}#arkc.on{transform:none}#arkc img{width:68px;height:121px;object-fit:cover;border-radius:8px;flex:none}#arkc small{display:block;color:#9fb0d0;font-size:10px;letter-spacing:.08em;font-weight:700}#arkc b{display:block;font-size:16px;margin:3px 0 6px}#arkc .y{color:#7be37b}#arkc .n{color:#ff7a6b}#arkc u{display:inline-block;text-decoration:none;background:#f6d34a;color:#141b2d;font-weight:800;padding:6px 10px;border-radius:8px}#arkx{position:absolute;top:4px;right:6px;background:none;border:0;color:#9fb0d0;font-size:20px;cursor:pointer;padding:2px 6px}@media(max-width:640px){#arkc{left:10px;right:10px;bottom:10px;max-width:none}}';
document.head.appendChild(s);
var parts=c.v1.split('. ');
var a=document.createElement('a');a.id='arkc';a.href=href;a.target='_blank';a.rel='noopener';a.setAttribute('data-afsa-event','card_click');a.setAttribute('data-afsa-prop-verdict',c.g);
a.innerHTML='<img alt="" src="'+B+'reel/'+c.g+'_cover.jpg"><span><small>AN AI DECIDES WHAT SURVIVES THE FLOOD</small><b><span class="y">'+parts[0].replace(/\.$/,'')+'.</span><br><span class="n">'+(parts[1]||'')+'</span></b><u>Defend '+no+' &rarr;</u></span><button id="arkx" aria-label="Close">&times;</button>';
document.body.appendChild(a);
document.getElementById('arkx').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();a.remove();try{sessionStorage.setItem('arkcard','1')}catch(e){}});
setTimeout(function(){a.className='on'},1200);
}).catch(function(){});
})();
