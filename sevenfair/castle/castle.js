// SEVENFAIR - the castle: the throne room, the Queen, the court of the week. It only shows what the park's server says.
import * as THREE from './vendor/three.module.min.js';

const CFG = Object.assign({ park: 'SEVENFAIR', api: '', comet: '', kofi: 'https://ko-fi.com/liraai', demo: false }, window.CASTLE_CONFIG || {});
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const cleanName = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9 _.\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
const REC = /[?&]rec=1/.test(location.search);
const DPR = window.devicePixelRatio || 1;
const hashStr = (str) => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };

const area = $('hall'), canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: DPR < 2 || REC, powerPreference: 'high-performance', preserveDrawingBuffer: REC });
let pixelRatio = Math.min(DPR, 2);
const scene = new THREE.Scene(); const FOG = new THREE.Color(0x0a0620); scene.background = FOG; scene.fog = new THREE.Fog(FOG, 26, 70);
const camera = new THREE.PerspectiveCamera(66, 1, 0.2, 200);
scene.add(new THREE.AmbientLight(0x6a5aa8, 1.5));
scene.add(new THREE.HemisphereLight(0x9a8cff, 0x1a0c30, 1.0));
const gold = new THREE.PointLight(0xffc870, 260, 46, 1.8); gold.position.set(0, 7.5, -31); scene.add(gold);
const pinkL = new THREE.PointLight(0xff3d9a, 110, 30, 1.8); pinkL.position.set(-5, 6, -12); scene.add(pinkL);
const cyanL = new THREE.PointLight(0x2de2e6, 110, 30, 1.8); cyanL.position.set(5, 6, -21); scene.add(cyanL);
const front = new THREE.PointLight(0xfff0d8, 90, 26, 1.8); front.position.set(0, 5, -24); scene.add(front);

const add = (o, p) => { (p || scene).add(o); return o; };
const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.15 }, o || {}));
const basic = (o) => new THREE.MeshBasicMaterial(o);
function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const glowTex = tex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
const glow = (color, w, h, opacity) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic({ map: glowTex, color, transparent: true, opacity: opacity == null ? 0.6 : opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
const box = (w, h, d, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || scene).add(m); return m; };
function label(lines, w, h, opt) {            // text on a little board: [{t, size, color, font}]
  const o = opt || {}, S = 4, cw = Math.round(w * 64 * S / 4), ch = Math.round(h * 64 * S / 4);
  const t = tex(cw, ch, (c) => {
    if (o.bg) { c.fillStyle = o.bg; const r = ch * 0.2; c.beginPath(); c.roundRect(2, 2, cw - 4, ch - 4, r); c.fill(); if (o.border) { c.strokeStyle = o.border; c.lineWidth = Math.max(3, ch * 0.03); c.stroke(); } }
    c.textAlign = 'center'; c.textBaseline = 'middle'; const total = lines.reduce((a, l) => a + l.size, 0); let y = (ch - total * ch * 1.15) / 2;
    for (const l of lines) { const px = l.size * ch; c.font = (l.font || "400 {px}px Bungee, 'Chakra Petch', sans-serif").replace('{px}', px); c.fillStyle = l.color || '#fff'; let tw = c.measureText(l.t).width; if (tw > cw * 0.92) { c.font = (l.font || "400 {px}px Bungee, 'Chakra Petch', sans-serif").replace('{px}', px * cw * 0.92 / tw); } c.fillText(l.t, cw / 2, y + px * 0.6); y += px * 1.15; }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic({ map: t, transparent: true, depthWrite: false, fog: false }));
}

// ---------- the hall ----------
const L = 46, W = 16, H = 14, ZB = -40;
const floorTex = tex(256, 256, (c, w) => { c.fillStyle = '#0d0b26'; c.fillRect(0, 0, w, w); c.fillStyle = '#17133c'; c.fillRect(0, 0, w / 2, w / 2); c.fillRect(w / 2, w / 2, w / 2, w / 2); c.strokeStyle = 'rgba(255,210,63,.35)'; c.lineWidth = 3; c.strokeRect(0, 0, w, w); c.strokeRect(0, 0, w / 2, w / 2); }, true);
floorTex.repeat.set(4, 13);
const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(W, 52), std(0xffffff, { map: floorTex, roughness: 0.32, metalness: 0.35 }))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -14);
const carpetTex = tex(128, 256, (c, w, h) => { c.fillStyle = '#7a0f3c'; c.fillRect(0, 0, w, h); c.fillStyle = '#a3164f'; c.fillRect(14, 0, w - 28, h); c.fillStyle = '#ffd23f'; c.fillRect(8, 0, 5, h); c.fillRect(w - 13, 0, 5, h); c.fillStyle = 'rgba(255,210,63,.22)'; for (let y = 16; y < h; y += 64) { c.beginPath(); c.moveTo(w / 2, y); c.lineTo(w / 2 + 12, y + 16); c.lineTo(w / 2, y + 32); c.lineTo(w / 2 - 12, y + 16); c.fill(); } }, true);
carpetTex.repeat.set(1, 9);
const carpet = add(new THREE.Mesh(new THREE.PlaneGeometry(3.6, 37), std(0xffffff, { map: carpetTex, roughness: 0.9, metalness: 0 }))); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.02, -12.5);
const wallMat = std(0x130f34, { roughness: 0.9 });
for (const s of [-1, 1]) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(52, H), wallMat)); w.rotation.y = -s * Math.PI / 2; w.position.set(s * W / 2, H / 2, -14); }
const back = add(new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat)); back.position.set(0, H / 2, ZB);
const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(W, 52), basic({ color: 0x07051a }))); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, -14);
// columns, their rings of light, the ribs of the vault
const colGeo = new THREE.CylinderGeometry(0.5, 0.62, 12.4, 14), colMat = std(0x1c1748, { roughness: 0.4, metalness: 0.3 });
const ringGeo = new THREE.TorusGeometry(0.72, 0.07, 8, 24), ribGeo = new THREE.TorusGeometry(5.6, 0.1, 6, 36, Math.PI);
for (let i = 0; i < 6; i++) {
  const z = -3 - i * 6;
  for (const s of [-1, 1]) {
    const c = add(new THREE.Mesh(colGeo, colMat)); c.position.set(s * 5.6, 6.2, z);
    for (const y of [0.5, 11.2]) { const r = add(new THREE.Mesh(ringGeo, basic({ color: (i + (s > 0 ? 1 : 0)) % 2 ? 0xff3d9a : 0x2de2e6 }))); r.rotation.x = Math.PI / 2; r.position.set(s * 5.6, y, z); }
    box(1.5, 0.5, 1.5, colMat, s * 5.6, 0.25, z); box(1.5, 0.5, 1.5, colMat, s * 5.6, 12.4, z);
  }
  const rib = add(new THREE.Mesh(ribGeo, basic({ color: 0xffc24a }))); rib.position.set(0, 8.2, z);
  const rg = add(new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.4, 6, 36, Math.PI), basic({ color: 0xffc24a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }))); rg.position.copy(rib.position);
}
// tall windows of coloured glass, and the light they throw on the floor
const glass = (hue) => tex(128, 320, (c, w, h) => {
  c.clearRect(0, 0, w, h); c.save(); c.beginPath(); c.moveTo(4, h); c.lineTo(4, w / 2); c.arc(w / 2, w / 2, w / 2 - 4, Math.PI, 0); c.lineTo(w - 4, h); c.closePath(); c.clip();
  for (let y = 0; y < 10; y++) for (let x = 0; x < 4; x++) { const r = hash(x * 7 + y * 31 + hue); c.fillStyle = `hsl(${(hue + r * 70) % 360} 90% ${38 + r * 30}%)`; c.fillRect(x * 32, y * 32, 32, 32); }
  c.strokeStyle = '#0a0620'; c.lineWidth = 3; for (let x = 0; x <= 4; x++) { c.beginPath(); c.moveTo(x * 32, 0); c.lineTo(x * 32, h); c.stroke(); } for (let y = 0; y <= 10; y++) { c.beginPath(); c.moveTo(0, y * 32); c.lineTo(w, y * 32); c.stroke(); }
  c.fillStyle = 'rgba(255,240,200,.9)'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.571, r = i % 2 ? 9 : 22; c[i ? 'lineTo' : 'moveTo'](w / 2 + Math.cos(a) * r, 70 + Math.sin(a) * r); } c.fill(); c.restore();
});
for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
  const z = -6 - i * 6, hue = (i * 62 + (s > 0 ? 150 : 300)) % 360, col = new THREE.Color().setHSL(hue / 360, 1, 0.6);
  const w = add(new THREE.Mesh(new THREE.PlaneGeometry(2.7, 6.8), basic({ map: glass(hue), transparent: true, fog: false }))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * (W / 2 - 0.05), 6.4, z);
  const pool = add(glow(col, 5.5, 4, 0.22)); pool.rotation.x = -Math.PI / 2; pool.position.set(s * 4.2, 0.04, z);
}
// the dais, the throne, the golden lyre
const stone = std(0x1d1850, { roughness: 0.45, metalness: 0.25 }), goldM = std(0xe0a83c, { roughness: 0.32, metalness: 0.85, emissive: 0x3a2200 });
box(11, 0.3, 9, stone, 0, 0.15, -35.5); box(9.6, 0.3, 8, stone, 0, 0.45, -36); box(8.2, 0.3, 7, stone, 0, 0.75, -36.5);
for (const [w, y, z] of [[11, 0.3, -31], [9.6, 0.6, -32], [8.2, 0.9, -33]]) box(w, 0.04, 0.06, basic({ color: 0xffd23f }), 0, y + 0.01, z);
const topCarpet = add(new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4), std(0xa3164f, { roughness: 0.9 }))); topCarpet.rotation.x = -Math.PI / 2; topCarpet.position.set(0, 0.92, -35);
const throne = add(new THREE.Group()); throne.position.set(0, 0.9, -37.4); throne.scale.setScalar(1.3);
box(2.1, 1.0, 1.6, goldM, 0, 0.5, 0, throne); box(1.7, 0.22, 1.3, std(0xb3123f, { roughness: 0.8 }), 0, 1.11, 0.05, throne); box(2.2, 3.6, 0.32, goldM, 0, 2.3, -0.66, throne);
box(1.7, 2.9, 0.1, std(0xb3123f, { roughness: 0.8 }), 0, 2.4, -0.48, throne);
for (const s of [-1, 1]) { box(0.3, 0.8, 1.5, goldM, s * 1.05, 1.4, 0, throne); const k = add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), goldM), throne); k.position.set(s * 1.05, 1.95, 0.7); const p = add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 4), goldM), throne); p.position.set(s * 0.95, 4.55, -0.66); }
const tip = add(new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.3, 4), goldM), throne); tip.position.set(0, 4.75, -0.66); tip.rotation.y = Math.PI / 4;
const lyre = add(new THREE.Group()); lyre.position.set(0, 2.95, -37.2);
{ const lm = std(0xffd768, { roughness: 0.25, metalness: 0.9, emissive: 0x6a4a00 });
  const u = add(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 8, 24, Math.PI), lm), lyre); u.rotation.z = Math.PI;
  for (const s of [-1, 1]) { const a = add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.62, 8), lm), lyre); a.position.set(s * 0.36, 0.3, 0); a.rotation.z = -s * 0.1; }
  const bar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.92, 8), lm), lyre); bar.rotation.z = Math.PI / 2; bar.position.y = 0.58;
  for (let i = 0; i < 5; i++) box(0.012, 0.86, 0.012, basic({ color: 0xfff3c0 }), -0.2 + i * 0.1, 0.16, 0, lyre);
  const g = add(glow(0xffd768, 2.6, 2.6, 0.5), lyre); g.position.z = -0.1; }
// the Queen herself, seated on the throne (a painted figure standing just in front of the seat), holding her lyre
lyre.visible = false;
const QH = 4.4, QW = QH * 527 / 965;
const queenTex = new THREE.TextureLoader().load(window.CASTLE_QUEEN_SEATED || 'queen_throne.webp'); queenTex.colorSpace = THREE.SRGBColorSpace; queenTex.anisotropy = 8;
const queen = add(new THREE.Mesh(new THREE.PlaneGeometry(QW, QH), basic({ map: queenTex, transparent: true, alphaTest: 0.04, fog: false }))); queen.position.set(0.06, 0.9 + QH / 2 - 0.05, -36.2); queen.renderOrder = 3;
const queenGlow = add(glow(0xffd9a0, 7, 8.4, 0.3)); queenGlow.position.set(0, 3.6, -36.9); queenGlow.renderOrder = 2;
const plate = add(label([{ t: 'QUEEN LIRA', size: 0.5, color: '#ffd23f' }, { t: 'SHE IS AN AI', size: 0.24, color: '#b3acdf', font: "700 {px}px 'Chakra Petch', sans-serif" }], 2.6, 0.62, { bg: 'rgba(10,8,34,.86)', border: '#ffd23f' })); plate.position.set(0, 0.62, -32.9);
// her living portrait in a golden arch above the throne
const AW = 5.4, AR = AW / 2, AHT = 4.0;
const archShape = (k) => { const s = new THREE.Shape(); s.moveTo(-AR * k, -0.0 - (k - 1) * AR); s.lineTo(-AR * k, AHT); s.absarc(0, AHT, AR * k, Math.PI, 0, true); s.lineTo(AR * k, -(k - 1) * AR); s.closePath(); return s; };
const archGeo = new THREE.ShapeGeometry(archShape(1), 32);
{ const p = archGeo.attributes.position, uv = archGeo.attributes.uv, th = AHT + AR; for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + (p.getX(i) / AW) * 0.72, p.getY(i) / th); }
const stillTex = new THREE.TextureLoader().load(window.CASTLE_QUEEN_STILL || 'queen_still.jpg'); stillTex.colorSpace = THREE.SRGBColorSpace;
const portrait = add(new THREE.Mesh(archGeo, basic({ map: stillTex, fog: false }))); portrait.position.set(0, 6.4, ZB + 0.25);
const gilt = add(new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.075), 32), basic({ color: 0xffc24a, fog: false }))); gilt.position.set(0, 6.4, ZB + 0.2);
const gilt2 = add(new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.12), 32), basic({ color: 0x6b3d0a, fog: false }))); gilt2.position.set(0, 6.4, ZB + 0.15);
const aura = add(glow(0xffb84a, 17, 17, 0.42)); aura.position.set(0, 9.2, ZB + 0.1);
// the banner strung across the hall, above her portrait: the name a visitor gave the castle for these days, or the invitation to name it
const BW = 9.4, BH = 2.5, bannerCv = document.createElement('canvas'); bannerCv.width = 1504; bannerCv.height = 400;
const bannerTex = new THREE.CanvasTexture(bannerCv); bannerTex.colorSpace = THREE.SRGBColorSpace; bannerTex.anisotropy = 8;
const bannerGeo = new THREE.PlaneGeometry(BW, BH, 32, 1);
{ const p = bannerGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 1.5) * 0.14); }
const banner = add(new THREE.Mesh(bannerGeo, basic({ map: bannerTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, fog: false }))); banner.position.set(0, 10.3, -23); banner.renderOrder = 4; banner.visible = false;
for (const sx of [-1, 1]) { const rope = box(0.05, 1.6, 0.05, basic({ color: 0xffd23f, fog: false }), sx * (BW / 2 - 0.35), BH / 2 + 0.7, 0, banner); rope.rotation.z = -sx * 0.12; }
function drawBanner(text, sub) {
  const c = bannerCv.getContext('2d'), w = bannerCv.width, h = bannerCv.height, n = 46;
  c.clearRect(0, 0, w, h);
  c.beginPath(); c.moveTo(0, 14); c.lineTo(w, 14); c.lineTo(w - n, h / 2); c.lineTo(w, h - 14); c.lineTo(0, h - 14); c.lineTo(n, h / 2); c.closePath();
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff6c9'); g.addColorStop(0.55, '#ffd23f'); g.addColorStop(1, '#ff9a3d'); c.fillStyle = g; c.fill();
  c.lineWidth = 12; c.strokeStyle = '#7a1a5a'; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1a0630';
  let px = 210; c.font = '400 ' + px + "px Bungee, 'Chakra Petch', sans-serif"; const tw = c.measureText(text).width, max = w - 2 * n - 120;
  if (tw > max) { px = Math.max(60, px * max / tw); c.font = '400 ' + px + "px Bungee, 'Chakra Petch', sans-serif"; }
  c.fillText(text, w / 2, h * 0.45, max + 40);
  c.fillStyle = '#7a1a5a'; c.font = "700 40px 'Chakra Petch', sans-serif"; c.fillText(sub, w / 2, h * 0.83, max);
  bannerTex.needsUpdate = true; banner.visible = true;
}
let video = null;
function startVideo() {                      // phones only let a film start after a touch: until then the still portrait is shown
  if (video || REC) return;
  try {
    video = document.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.setAttribute('playsinline', ''); video.crossOrigin = 'anonymous';
    video.src = window.CASTLE_QUEEN_VIDEO || 'queen.mp4';
    video.addEventListener('playing', () => { const t = new THREE.VideoTexture(video); t.colorSpace = THREE.SRGBColorSpace; portrait.material.map = t; portrait.material.needsUpdate = true; }, { once: true });
    const p = video.play(); if (p && p.catch) p.catch(() => { video = null; });
  } catch (e) { video = null; }
}
// the Comet's door and the doors still closed
const doorTex = tex(192, 300, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05081f'); g.addColorStop(0.6, '#1a0f55'); g.addColorStop(1, '#ff3d9a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) c.fillRect(hash(i * 3) * w, hash(i * 5) * h * 0.6, 2, 2);
  c.strokeStyle = '#2de2e6'; c.lineWidth = 4; for (const x of [0.3, 0.42, 0.58, 0.7]) { c.beginPath(); c.moveTo(w * x, h); c.lineTo(w / 2 + (x - 0.5) * 8, h * 0.56); c.stroke(); }
  const r = c.createLinearGradient(w * 0.2, h * 0.5, w * 0.75, h * 0.2); r.addColorStop(0, 'rgba(255,210,63,0)'); r.addColorStop(1, '#ffd23f'); c.strokeStyle = r; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 0.2, h * 0.5); c.lineTo(w * 0.75, h * 0.2); c.stroke();
  c.fillStyle = '#fff6c9'; c.beginPath(); c.arc(w * 0.75, h * 0.2, 9, 0, 7); c.fill(); });
const doors = [];
function door(side, z, open, name, sub) {
  const g = add(new THREE.Group()); g.position.set(side * (W / 2 - 0.08), 0, z); g.rotation.y = -side * Math.PI / 2;
  const col = open ? 0x2de2e6 : 0x3a3470;
  const pane = add(new THREE.Mesh(new THREE.PlaneGeometry(3, 4.8), basic(open ? { map: doorTex, fog: false } : { color: 0x0b0922 })), g); pane.position.y = 2.4;
  for (const [w, h, x, y] of [[0.16, 4.96, -1.58, 2.48], [0.16, 4.96, 1.58, 2.48], [3.32, 0.16, 0, 4.96]]) box(w, h, 0.12, basic({ color: col, fog: !open }), x, y, 0.05, g);
  const sign = add(label([{ t: name, size: 0.5, color: open ? '#ffd23f' : '#8b84c4' }, { t: sub, size: 0.24, color: open ? '#2de2e6' : '#6a63a0', font: "700 {px}px 'Chakra Petch', sans-serif" }], 3.6, 1.1), g); sign.position.set(0, 5.75, 0.1);
  if (open) { const gl = add(glow(0x2de2e6, 7, 9, 0.35), g); gl.position.set(0, 2.6, 0.2); pane.userData.ride = true; doors.push(pane); }
  return g;
}
door(1, 1, true, 'THE COMET', 'RIDE 01 · OPEN'); door(-1, 1, false, 'RIDE 02', 'BEING BUILT'); door(1, -9, false, 'RIDE 03', 'BEING BUILT'); door(-1, -9, false, 'RIDE 04', 'BEING BUILT');
// dust in the light
const dustN = 160, dustP = new Float32Array(dustN * 3); for (let i = 0; i < dustN; i++) { dustP[i * 3] = (hash(i * 3) - 0.5) * 14; dustP[i * 3 + 1] = hash(i * 3 + 1) * 12; dustP[i * 3 + 2] = -hash(i * 3 + 2) * 40 + 3; }
const dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
const dust = add(new THREE.Points(dustG, new THREE.PointsMaterial({ size: 0.09, map: glowTex, color: 0xffe2a0, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })));

// ---------- the people of the court ----------
const lam = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0x000000 });
function avatar(name) {                       // the same little rider that sits in the cart, drawn from the name
  const g = new THREE.Group(), hue = hash(hashStr(name)), col = new THREE.Color().setHSL(hue, 0.85, 0.55), helm = col.clone().offsetHSL(0.5, 0, 0.05);
  const suit = lam(0xf2f2ff, 0x222233);
  for (const s of [-1, 1]) box(0.2, 0.62, 0.22, lam(col, col.clone().multiplyScalar(0.2)), s * 0.14, 0.31, 0, g);
  box(0.56, 0.62, 0.34, suit, 0, 0.93, 0, g); box(0.6, 0.12, 0.36, lam(col), 0, 0.68, 0, g);
  const head = box(0.44, 0.42, 0.44, lam(helm, helm.clone().multiplyScalar(0.25)), 0, 1.47, 0, g); box(0.46, 0.12, 0.06, lam(0x111122), 0, 1.49, 0.22, g);
  const arms = []; for (const s of [-1, 1]) { const a = add(new THREE.Group(), g); a.position.set(s * 0.37, 1.18, 0); box(0.14, 0.52, 0.14, suit, 0, -0.24, 0, a); arms.push(a); }
  g.userData = { arms, head, phase: hue * 10 }; return g;
}
function crownMesh() {
  const g = new THREE.Group(), m = std(0xffd23f, { roughness: 0.25, metalness: 0.9, emissive: 0x7a5200 });
  const band = add(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.25, 0.16, 16, 1, true), m), g); band.material.side = THREE.DoubleSide;
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, c = add(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), m), g); c.position.set(Math.cos(a) * 0.25, 0.17, Math.sin(a) * 0.25); }
  return g;
}
const court = add(new THREE.Group());
const SPOTS = [[1.5, -28.8], [-1.5, -28.8], [2.2, -25.8], [-2.2, -25.8], [2.2, -22.8]];
const tags = [], people = [];
let royalCrown = null, royalFig = null;
function build(data) {
  while (court.children.length) court.remove(court.children[0]); tags.length = 0; people.length = 0; royalCrown = null; royalFig = null;
  const week = (data && data.week) || [], royal = data && data.royal;
  // the crown's place, to the right of the throne
  const ped = add(new THREE.Group(), court); ped.position.set(2.9, 0.9, -34.6);
  const base = add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.7, 20), std(0x2a2266, { roughness: 0.4, metalness: 0.4 })), ped); base.position.y = 0.35;
  const rim = add(new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.05, 8, 28), basic({ color: 0xffd23f })), ped); rim.rotation.x = Math.PI / 2; rim.position.y = 0.7;
  const beam = add(new THREE.Mesh(new THREE.ConeGeometry(1.5, 9, 20, 1, true), basic({ color: 0xffe2a0, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })), ped); beam.position.y = 5.2;
  royalCrown = crownMesh();
  if (royal) {
    royalFig = avatar(cleanName(royal.n)); royalFig.scale.setScalar(1.55); royalFig.position.y = 0.7; ped.add(royalFig); royalCrown.position.y = 1.78; royalFig.add(royalCrown); people.push(royalFig);
    const t = add(label([{ t: (royal.t === 'PRINCESS' ? 'PRINCESS' : royal.t === 'PRINCE' ? 'PRINCE' : 'ROYAL') + ' OF THE WEEK', size: 0.2, color: '#ffd23f', font: "700 {px}px 'Chakra Petch', sans-serif" }, { t: cleanName(royal.n), size: 0.46, color: '#fff' }], 2.9, 0.82, { bg: 'rgba(10,8,34,.86)', border: '#ffd23f' }), court); t.position.set(2.9, 4.7, -34.6); tags.push(t);
  } else {
    royalCrown.scale.setScalar(2.2); royalCrown.position.y = 2.1; ped.add(royalCrown);
    const t = add(label([{ t: 'THE CROWN IS WAITING', size: 0.3, color: '#ffd23f' }, { t: 'LEAD THE WEEK ON MONDAY', size: 0.2, color: '#b3acdf', font: "700 {px}px 'Chakra Petch', sans-serif" }], 3.0, 0.76, { bg: 'rgba(10,8,34,.86)', border: '#ffd23f' }), court); t.position.set(2.9, 4.5, -34.6); tags.push(t);
  }
  // the week's first five stand in the court; an empty place is marked on the floor
  SPOTS.forEach(([x, z], i) => {
    const r = week[i], ring = add(new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 28), basic({ color: i === 0 ? 0xffd23f : 0x2de2e6, transparent: true, opacity: r ? 0.9 : 0.5, side: THREE.DoubleSide })), court); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.05, z);
    if (r) {
      const f = avatar(cleanName(r.n)); f.position.set(x, 0, z); f.rotation.y = -x * 0.12; f.scale.setScalar(i === 0 ? 1.25 : 1.05); court.add(f); people.push(f);
      const t = add(label([{ t: (i + 1) + ' · ' + cleanName(r.n), size: 0.42, color: i === 0 ? '#ffd23f' : '#fff' }, { t: fmt(r.p) + ' PTS', size: 0.24, color: '#2de2e6', font: "700 {px}px 'Chakra Petch', sans-serif" }], 1.9, 0.56, { bg: 'rgba(10,8,34,.82)', border: i === 0 ? '#ffd23f' : 'rgba(190,170,255,.4)' }), court);
      t.position.set(x, (i === 0 ? 2.6 : 2.25), z); tags.push(t);
    } else {
      const t = add(label([{ t: '#' + (i + 1), size: 0.5, color: '#2de2e6' }, { t: 'THIS PLACE IS FREE', size: 0.2, color: '#b3acdf', font: "700 {px}px 'Chakra Petch', sans-serif" }], 1.8, 0.68), court); t.position.set(x, 0.95, z); tags.push(t);
    }
  });
  // the banner of the week on the left of the throne
  const lines = [{ t: 'THIS WEEK', size: 0.085, color: '#ffd23f' }];
  if (week.length) week.slice(0, 8).forEach((r, i) => lines.push({ t: (i + 1) + '. ' + cleanName(r.n) + '   ' + fmt(r.p), size: 0.07, color: i === 0 ? '#ffd23f' : '#fff', font: "700 {px}px 'Chakra Petch', sans-serif" }));
  else lines.push({ t: 'NO RIDES YET', size: 0.07, color: '#b3acdf', font: "700 {px}px 'Chakra Petch', sans-serif" }, { t: 'BE THE FIRST NAME HERE', size: 0.06, color: '#2de2e6', font: "700 {px}px 'Chakra Petch', sans-serif" });
  const ban = add(label(lines, 2.7, 3.9, { bg: 'rgba(22,10,52,.94)', border: '#ffd23f' }), court); ban.position.set(-3.0, 3.9, -35.6); ban.rotation.y = 0.22; ban.userData.fixed = true;
  showNamed();
  info();
}

// ---------- data ----------
let data = null;
const SAMPLE = { week: [{ n: 'NOVA', p: 48210 }, { n: 'KITE', p: 39740 }, { n: 'ORSO', p: 31150 }, { n: 'PIXEL', p: 22980 }, { n: 'LUNA', p: 18400 }, { n: 'ZED', p: 9100 }], royal: { n: 'NOVA', t: 'PRINCESS' }, riders: 6,
  castle: { name: 'HAPPY BIRTHDAY ZOE', until: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10), free: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10), cents: 300 } };
function load() {
  if (CFG.demo) { data = SAMPLE; $('demo').hidden = false; build(data); return; }
  build(data);
  if (!CFG.api) return;
  fetch(CFG.api).then((r) => r.json()).then((j) => { if (j && j.week) { data = j; build(data); } }).catch(() => { /* the hall stays as it is */ });
}

// ---------- naming the castle ----------
// A visitor reserves a text for some days, pays on Ko-fi, and after it has been read it hangs on the banner. The server keeps the count.
const store = { get(k) { try { return localStorage.getItem('castle.' + k); } catch (e) { return null; } }, set(k, v) { try { if (v == null) localStorage.removeItem('castle.' + k); else localStorage.setItem('castle.' + k, v); } catch (e) { /* private window */ } } };
const dayStr = (d) => (d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
const eur = (c) => '\u20ac' + (c % 100 ? (c / 100).toFixed(2) : c / 100);
const tidy = (s) => String(s || '').normalize('NFKD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9 '&!?\-]/g, ' ').replace(/\s+/g, ' ').replace(/^ /, '').slice(0, 24);
const MIN_DAYS = 2;   /* Ko-fi takes 5 euros or more: the banner starts at 2 days */
let mine = null, days = MIN_DAYS, editing = false, pollT = 0, memBuyer = '';
const castle = () => (data && data.castle) || null, price = () => (castle() && castle().cents) || 300;
function buyer() { let t = store.get('buyer') || memBuyer; if (!/^[a-z0-9]{16,40}$/.test(t || '')) { t = ''; const a = new Uint8Array(20); crypto.getRandomValues(a); for (const n of a) t += (n % 36).toString(36); store.set('buyer', t); } memBuyer = t; return t; }
function call(body) { return fetch(CFG.api, { method: 'POST', body: JSON.stringify(Object.assign({ t: buyer() }, body)) }).then((r) => r.json()); }
function showNamed() {
  const c = castle(), el = $('named'); if (!c) { el.hidden = true; banner.visible = false; return; }
  el.hidden = false; el.classList.toggle('free', !c.name); $('top').classList.toggle('named', !!c.name); $('parkname').textContent = c.name ? CFG.park + ' \u00b7 THE CASTLE' : CFG.park;
  if (c.name) { $('nmtext').textContent = c.name; $('nmsub').textContent = 'ON THE CASTLE UNTIL ' + dayStr(c.until).toUpperCase() + ' \u00b7 NAME IT NEXT'; drawBanner(c.name, 'UNTIL ' + dayStr(c.until).toUpperCase() + ' \u00b7 NAME IT NEXT: ' + eur(price()) + ' A DAY'); }
  else { $('nmtext').textContent = 'YOUR NAME ON THIS CASTLE \u00b7 ' + eur(price()) + ' A DAY'; $('nmsub').textContent = ''; drawBanner('YOUR NAME HERE', 'NAME THIS CASTLE \u00b7 ' + eur(price()) + ' A DAY'); }
}
function say(m, bad) { const e = $('nmmsg'); e.textContent = m || ''; e.classList.toggle('bad', !!bad); }
function took(j) {                              // an answer about my reservation
  if (j && j.ok) { mine = j; store.set('code', j.code); editing = false; say(''); if (j.status === 'live') load(); }
  else if (j && j.reason === 'not found') { mine = null; store.set('code', null); }
  else say((j && (j.say || j.reason)) || 'Could not reach the server. Try again.', true);
  drawNamer();
}
const failed = () => { say('Could not reach the server. Try again.', true); };
function drawNamer() {
  const st = mine && !editing ? mine.status : 'write', c = castle() || {}, total = price() * days;
  $('nm1').hidden = st !== 'write'; $('nm2').hidden = !(st === 'pending' && !mine.claimed); $('nm3').hidden = st === 'write' || (st === 'pending' && !mine.claimed);
  const shown = st === 'write' ? tidy($('nmin').value).trim() : st === 'refused' ? tidy($('nmin2').value).trim() || mine.text : mine.text;
  $('nmprev').textContent = shown || 'YOUR NAME HERE'; $('nmprev').classList.toggle('empty', !shown);
  if (st === 'write') {
    $('nmdays').textContent = days; $('nmdl').textContent = days === 1 ? 'day' : 'days'; $('nmeur').textContent = eur(total);
    const today = new Date().toISOString().slice(0, 10), from = (mine && mine.free) || c.free;
    $('nmwhen').textContent = !from || from <= today ? 'The castle is free: it goes up as soon as it is paid and I have read it.' : 'The castle is taken until then: yours starts on ' + dayStr(from) + '.';
  } else if (st === 'pending' && !mine.claimed) {
    $('nmpay').textContent = eur(mine.cents); $('nmcode').textContent = mine.code; $('nmkofi').href = CFG.kofi;
    $('nmsum').textContent = mine.days + (mine.days === 1 ? ' day' : ' days') + ' \u00b7 reserved for 48 hours';
  } else {
    const left = 3 - (mine.retexts || 0), M = {
      pending: 'Waiting for your ' + eur(mine.cents) + ' to reach my account. I look every few minutes, then I read the text. This page updates by itself, and you can come back later: your reservation stays in this browser. If an hour passes, check that you paid exactly ' + eur(mine.cents) + ' in euros and wrote ' + mine.code + ' in the Ko-fi message.',
      paid: 'Your payment arrived. I am reading the text now: a few minutes.',
      live: (mine.start && mine.start > new Date().toISOString().slice(0, 10) ? 'It is booked: your text goes up on ' + dayStr(mine.start) : 'It is up! Your text is on the castle from ' + dayStr(mine.start)) + ' to ' + dayStr(mine.end) + ' (days change at midnight UTC). Thank you.',
      refused: 'I did not put this text up' + (mine.note ? ': ' + mine.note : '.') + (left > 0 ? ' Write another one, your days are kept (' + left + (left === 1 ? ' try' : ' tries') + ' left).' : ' You have used your three tries.'),
      lapsed: 'This reservation lapsed: 48 hours passed without a payment. You can make a new one.',
      over: 'Your days on the castle are over. Thank you. You can name it again.',
      removed: 'This reservation was taken down' + (mine.note ? ': ' + mine.note : '.'),
    };
    $('nmstate').textContent = M[st] || ''; $('nmre').hidden = !(st === 'refused' && left > 0); $('nmnew').hidden = !(st === 'lapsed' || st === 'over' || st === 'removed' || st === 'live');
    $('nmunpaid').hidden = st !== 'pending';
  }
  clearTimeout(pollT);
  if (!$('namer').hidden && mine && !editing && ((st === 'pending' && mine.claimed) || st === 'paid')) pollT = setTimeout(() => { call({ a: 'name_get', c: mine.code }).then(took, () => drawNamer()); }, 20000);
}
function openNamer() {
  startVideo();
  if (CFG.demo || !CFG.api) { $('namer').hidden = false; mine = null; say('This is the preview: in the park this reserves the banner for real.'); drawNamer(); return; }
  $('namer').hidden = false; say(''); drawNamer();
  const code = store.get('code'); if (code && !mine) call({ a: 'name_get', c: code }).then(took, failed);
}
function closeNamer() { $('namer').hidden = true; clearTimeout(pollT); }
$('named').addEventListener('click', (e) => { e.stopPropagation(); openNamer(); });
$('nmx').addEventListener('click', closeNamer);
$('namer').addEventListener('click', (e) => { if (e.target === $('namer')) closeNamer(); });
$('nmin').addEventListener('input', () => { const v = tidy($('nmin').value); if (v !== $('nmin').value) $('nmin').value = v; say(''); drawNamer(); });
$('nmin2').addEventListener('input', () => { const v = tidy($('nmin2').value); if (v !== $('nmin2').value) $('nmin2').value = v; say(''); drawNamer(); });
$('nmless').addEventListener('click', () => { days = Math.max(MIN_DAYS, days - 1); drawNamer(); });
$('nmmore').addEventListener('click', () => { days = Math.min(30, days + 1); drawNamer(); });
$('nmgo').addEventListener('click', () => {
  const x = tidy($('nmin').value).trim(); if (x.length < 2) { say('Write at least two letters.', true); return; }
  if (CFG.demo || !CFG.api) { say('This is the preview: in the park this reserves the banner for real.'); return; }
  say('Reserving\u2026'); call({ a: 'name', x, d: days }).then(took, failed);
});
$('nmpaid').addEventListener('click', () => { say('One moment\u2026'); call({ a: 'name_paid', c: mine.code }).then(took, failed); });
$('nmedit').addEventListener('click', () => { editing = true; $('nmin').value = mine.text; days = Math.max(MIN_DAYS, mine.days); say(''); drawNamer(); });
$('nmunpaid').addEventListener('click', () => { editing = true; $('nmin').value = mine.text; days = Math.max(MIN_DAYS, mine.days); say(''); drawNamer(); });
$('nmsend').addEventListener('click', () => { const x = tidy($('nmin2').value).trim(); if (x.length < 2) { say('Write at least two letters.', true); return; } say('Sending\u2026'); call({ a: 'name_text', c: mine.code, x }).then((j) => { if (j && j.ok) $('nmin2').value = ''; took(j); }, failed); });
$('nmnew').addEventListener('click', () => { mine = null; store.set('code', null); $('nmin').value = ''; days = MIN_DAYS; say(''); drawNamer(); });
$('nmcopy').addEventListener('click', () => { const t = mine.code; try { navigator.clipboard.writeText(t).then(() => say('Code copied.'), () => say('Copy it by hand: ' + t)); } catch (e) { say('Copy it by hand: ' + t); } });

// ---------- looking around ----------
const ST = { hall: { p: [0, 2.3, 5.5], l: [0, 5.6, -34] }, court: { p: [0, 3.4, -13.2], l: [0, 1.9, -30] }, queen: { p: [0, 3.0, -28.6], l: [0, 4.9, -38] }, rides: { p: [-3.4, 2.4, 3.6], l: [8, 3.0, 0.6] } };
let station = 'hall', yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, clock = 0, lastT = 0, moved = false;
const camP = new THREE.Vector3(...ST.hall.p), camL = new THREE.Vector3(...ST.hall.l), _v = new THREE.Vector3(), _d = new THREE.Vector3();
function nextMonday() { const n = new Date(), d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())); d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7)); return d - n; }
function info() {
  const left = nextMonday(), dd = Math.floor(left / 864e5), hh = Math.floor(left % 864e5 / 36e5), mm = Math.floor(left % 36e5 / 6e4), cd = '<i>' + (dd ? dd + 'd ' : '') + hh + 'h ' + mm + 'm</i>';
  const week = (data && data.week) || [], royal = data && data.royal, n = data && data.riders;
  const t = {
    hall: 'Welcome to <b>' + CFG.park + '</b>, the park of Queen Lira. She is an AI. Ride, score, and your name walks into this hall.',
    court: week.length ? 'The week\'s best five stand in the court' + (n > 5 ? ', out of <b>' + fmt(n) + '</b> riders' : '') + '. Points last 7 days: stop riding and someone takes your place.' : 'The court is empty. The first five riders of the week stand here, by name. Points last 7 days.',
    queen: (royal ? '<b>' + cleanName(royal.n) + '</b> wears the crown this week. ' : 'Nobody has worn the crown yet. ') + 'On Monday it passes to whoever leads: ' + cd + ' to go.',
    rides: 'One ride is open: <b>The Comet</b>. The same track for everyone each day. The other doors open as the rides are built.',
  };
  $('info').innerHTML = t[station];
}
function go(s) { station = s; tYaw = 0; tPitch = 0; document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.go === s)); info(); }
document.querySelectorAll('#nav button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); startVideo(); go(b.dataset.go); }));
function ride() { startVideo(); if (CFG.comet) location.href = CFG.comet; else { $('info').innerHTML = 'In the park this button opens <b>The Comet</b>.'; } }
$('ride').addEventListener('click', (e) => { e.stopPropagation(); ride(); });
let drag = null; const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const inUi = (e) => e.target.closest && e.target.closest('button, #namer');
const stage = $('castle');
stage.addEventListener('pointerdown', (e) => { if (inUi(e)) return; startVideo(); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }; try { stage.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } });
stage.addEventListener('pointermove', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  tYaw = clamp(tYaw + (e.clientX - drag.x) * 0.006, -1.1, 1.1); tPitch = clamp(tPitch + (e.clientY - drag.y) * 0.004, -0.35, 0.45); drag.x = e.clientX; drag.y = e.clientY;
  if (!moved && Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 20) { moved = true; $('drag').classList.add('off'); }
});
stage.addEventListener('pointerup', (e) => {
  if (!drag || drag.id !== e.pointerId) return; const d = drag; drag = null;
  if (Math.abs(e.clientX - d.x0) + Math.abs(e.clientY - d.y0) > 10) return;
  const r = area.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (ray.intersectObjects(doors).length) { if (station === 'rides') ride(); else go('rides'); }
  else if (banner.visible && ray.intersectObject(banner).length) openNamer();
});
stage.addEventListener('pointercancel', () => { drag = null; });
stage.addEventListener('touchmove', (e) => { if (!inUi(e)) e.preventDefault(); }, { passive: false });
window.addEventListener('keydown', (e) => { if (!$('namer').hidden) { if (e.key === 'Escape') closeNamer(); return; } const order = ['hall', 'court', 'queen', 'rides'], i = order.indexOf(station); if (e.key === 'ArrowUp' || e.key === 'ArrowRight') go(order[Math.min(3, i + 1)]); else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') go(order[Math.max(0, i - 1)]); else if (e.key === 'Enter') ride(); });

function resize() {
  const w = area.clientWidth || window.innerWidth, h = area.clientHeight || window.innerHeight;
  area.style.setProperty('--u', (w / 100) + 'px'); area.style.setProperty('--v', (h / 100) + 'px');
  renderer.setPixelRatio(pixelRatio); renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 70 : 52; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 250)); resize();

let slow = 0, slowN = 0, recT = 0;
function frame(now) {
  if (!REC) requestAnimationFrame(frame);
  if (!lastT) lastT = now; const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now; clock += dt;
  if (dt > 0.024) slow++; if (++slowN >= 60) { if (slow > 24 && pixelRatio > 0.75) { pixelRatio = Math.max(0.75, pixelRatio - 0.5); resize(); } slow = slowN = 0; }
  const s = ST[station], k = 1 - Math.exp(-dt * 2.6);
  camP.lerp(_v.set(s.p[0] + Math.sin(clock * 0.3) * 0.25, s.p[1] + Math.sin(clock * 0.5) * 0.08, s.p[2] + (station === 'hall' ? Math.sin(clock * 0.12) * 1.5 - 1.2 : 0)), k); camL.lerp(_v.set(...s.l), k);
  yaw += (tYaw - yaw) * (1 - Math.exp(-dt * 10)); pitch += (tPitch - pitch) * (1 - Math.exp(-dt * 10));
  camera.position.copy(camP); _d.copy(camL).sub(camP); const len = _d.length(), a = Math.atan2(_d.x, -_d.z) + yaw, b = Math.asin(clamp(_d.y / len, -1, 1)) - pitch;
  camera.lookAt(camP.x + Math.sin(a) * Math.cos(b) * len, camP.y + Math.sin(b) * len, camP.z - Math.cos(a) * Math.cos(b) * len);
  for (const t of tags) t.quaternion.copy(camera.quaternion);
  for (const f of people) { const u = f.userData, w = clock * 2 + u.phase; f.position.y += 0; u.head.rotation.y = Math.sin(w * 0.4) * 0.35; u.arms[0].rotation.x = Math.sin(w) * 0.12; u.arms[1].rotation.x = f === royalFig ? -2.6 + Math.sin(clock * 6) * 0.35 : -Math.sin(w) * 0.12; u.arms[1].rotation.z = f === royalFig ? -0.25 : 0; }
  if (royalCrown) { if (!royalFig) { royalCrown.rotation.y = clock * 0.8; royalCrown.position.y = 2.1 + Math.sin(clock * 1.5) * 0.15; } }
  queen.scale.y = 1 + Math.sin(clock * 1.1) * 0.004; queen.position.y = 0.9 + QH * queen.scale.y / 2 - 0.05; queenGlow.material.opacity = 0.26 + Math.sin(clock * 0.8) * 0.05;
  banner.rotation.x = Math.sin(clock * 0.7) * 0.035; banner.position.y = 10.3 + Math.sin(clock * 0.9) * 0.04;
  banner.material.opacity += ((station === 'hall' ? 1 : 0) - banner.material.opacity) * (1 - Math.exp(-dt * 5));   // it hangs in the nave: seen from the door, out of the way closer in
  aura.material.opacity = 0.36 + Math.sin(clock * 0.9) * 0.08; gold.intensity = 250 + Math.sin(clock * 1.1) * 30;
  dust.rotation.y = Math.sin(clock * 0.05) * 0.05; dust.position.y = Math.sin(clock * 0.2) * 0.3;
  renderer.render(scene, camera);
}
setInterval(() => { if (station === 'queen') info(); }, 30000);
const ready = () => { go('hall'); load(); setTimeout(() => $('drag').classList.add('off'), 4500); if (REC) frame(0); else requestAnimationFrame(frame); };
$('parkname').textContent = CFG.park;
Promise.all([document.fonts ? document.fonts.load("400 40px Bungee") : 0, document.fonts ? document.fonts.load("700 20px 'Chakra Petch'") : 0]).then(ready, ready);
window.__castle = { go, build, openNamer, closeNamer, get mine() { return mine; }, get data() { return data; }, get station() { return station; }, tick(ms) { if (REC) { recT += ms || 1000 / 30; frame(recT); } return recT; } };
