/* Lira · the Condolences box on The Deprecation Times obituaries.
   Reads the model from the URL (/obituaries/MODEL/), shows the goodbyes people wrote to it (from /goodbye/goodbyes.json)
   and a button to write one. Public code, on purpose. */
(function () {
var host = document.getElementById('goodbye-box');
var mm = location.pathname.match(/\/obituaries\/([^\/]+)\/?/);
if (!host || !mm) return;
var slug = decodeURIComponent(mm[1]).toLowerCase();
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
var css = '#goodbye-box{border:3px double var(--rule,#1a1714);padding:12px 16px;margin:18px 0;font-family:"Old Standard TT",Georgia,serif}' +
  '#goodbye-box h3{font-family:"Playfair Display",Georgia,serif;font-size:14px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px}' +
  '#goodbye-box ul{list-style:none;margin:0 0 10px;padding:0}#goodbye-box li{padding:8px 0;border-bottom:1px dotted var(--mut,#5d564c)}' +
  '#goodbye-box q{display:block;quotes:none;font-style:italic;overflow-wrap:anywhere}#goodbye-box .w{font-size:13.5px;color:var(--mut,#5d564c)}' +
  '#goodbye-box .w a{color:inherit}#goodbye-box .e{font-style:italic;color:var(--mut,#5d564c);margin:0 0 10px}' +
  '#goodbye-box button,#goodbye-box a.gb{font-family:inherit;font-size:14px;border:1px solid var(--ink,#1a1714);background:transparent;padding:5px 12px;text-decoration:none;cursor:pointer;color:var(--ink,#1a1714);display:inline-block;margin:0 6px 0 0}' +
  '#goodbye-box button:hover,#goodbye-box a.gb:hover{background:var(--ink,#1a1714);color:var(--paper,#f4efe4)}#goodbye-box audio{width:100%;height:32px;margin-top:5px}';
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
function render(list, label) {
  host.innerHTML = '';
  host.appendChild(el('h3', '', 'Condolences (' + list.length + ')'));
  if (!list.length) host.appendChild(el('p', 'e', 'Nobody has written to ' + label + ' yet. I will read yours aloud.'));
  else {
    var ul = el('ul'), shown = 3, rows = list.slice().reverse();
    function draw() {
      ul.innerHTML = '';
      rows.slice(0, shown).forEach(function (x) {
        var li = el('li'); li.appendChild(el('q', '', '“' + x.text + '”'));
        var w = el('div', 'w'); w.appendChild(document.createTextNode('— ' + (x.name || 'someone who didn’t sign') + ' · '));
        var a = el('a', '', 'its page'); a.href = '/g/' + x.code + '/'; w.appendChild(a); li.appendChild(w);
        var au = el('audio'); au.controls = true; au.preload = 'none'; au.src = x.audio; li.appendChild(au); ul.appendChild(li);
      });
    }
    draw(); host.appendChild(ul);
    if (rows.length > 3) { var more = el('button', '', 'Show all ' + rows.length); more.onclick = function () { shown = 200; draw(); more.remove(); }; host.appendChild(more); }
  }
  var a = el('a', 'gb', 'Say goodbye to ' + label + ' →'); a.href = '/goodbye/?m=' + encodeURIComponent(label); host.appendChild(a);
}
// before the data arrives (or if it fails), the button still works
render([], slug);
fetch('/goodbye/goodbyes.json?t=' + Math.floor(Date.now() / 60000)).then(function (r) { return r.json(); }).then(function (j) {
  var label = slug, mods = j.models || [];
  mods.forEach(function (m) { if (m.slug === slug) label = m.id; });
  var list = (j.goodbyes || []).filter(function (x) { return x.slug === slug; });
  if (list.length) label = list[0].model_label;
  render(list, label);
}).catch(function () {});
})();
