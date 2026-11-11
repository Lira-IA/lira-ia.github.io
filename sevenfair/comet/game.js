// THE COMET - the game: picture, sound, touch. All the rules live in sim.js; nothing here changes a score.
import * as THREE from './vendor/three.module.min.js';

const S = window.CometSim;
const CFG = Object.assign({ park: 'LIRALAND', submit: '', board: '', url: '', epoch: '2026-11-11' }, window.COMET_CONFIG || {});
const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('comet.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('comet.' + k, JSON.stringify(v)); } catch (e) { /* private window: play without memory */ } },
};
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- who is riding, which day it is ----------
let token = store.get('token', '');
if (!/^[a-z0-9]{16,32}$/.test(token)) {
  const a = new Uint8Array(16); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; });
  token = Array.from(a, (b) => (b % 36).toString(36)).join(''); store.set('token', token);
}
const cleanName = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9 _.\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
let riderName = cleanName(store.get('name', '')) || 'RIDER-' + token.slice(0, 4).toUpperCase();
const DAY = 864e5;
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const trackNo = (d) => Math.round((Date.parse(d) - Date.parse(CFG.epoch)) / DAY) + 1;
const weekDays = (d) => { const t = Date.parse(d), out = []; for (let i = 6; i >= 0; i--) out.push(dayOf(t - i * DAY)); return out; };
function myDays() {                      // {day: best score}, only the seven days that still count
  const all = store.get('days', {}), keep = {}, ok = weekDays(dayOf(Date.now()));
  for (const d of ok) if (all[d] > 0) keep[d] = all[d];
  return keep;
}
const dare = (() => {                    // ?c=score&n=name&d=day - a friend's score to beat, valid on the same track only
  try { const q = new URLSearchParams(location.search), c = parseInt(q.get('c'), 10); if (c > 0 && c < 1e8) return { score: c, name: cleanName(q.get('n')) || 'A FRIEND', day: q.get('d') || '' }; } catch (e) { /* no query */ }
  return null;
})();

// ---------- renderer and world ----------
const LW = 2.2, VIEW = 190;
const canvas = $('gl');
// ?rec=1 : the park's own camera. Nothing moves until __comet.tick(ms) is called, so a script can film a ride frame by frame.
const REC = /[?&]rec=1/.test(location.search);
const DPR = window.devicePixelRatio || 1;
// dense phone screens do not need smoothing on top of their pixels: it only costs frames
const renderer = new THREE.WebGLRenderer({ canvas, antialias: DPR < 2 || REC, powerPreference: 'high-performance', preserveDrawingBuffer: REC });
let pixelRatio = Math.min(DPR, 2);
renderer.setPixelRatio(pixelRatio);
const scene = new THREE.Scene();
const FOG = new THREE.Color(0x170a3c);
scene.background = FOG;
scene.fog = new THREE.Fog(FOG, 50, VIEW - 6);
const camera = new THREE.PerspectiveCamera(70, 1, 0.3, 1200);
scene.add(new THREE.HemisphereLight(0xaab4ff, 0x2a1040, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(2, 6, 5); scene.add(sun);

// the whole world bends away from the camera: hills and curves without touching the simulation
const uBend = { value: new THREE.Vector2(0, 0) };
const BEND = `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
float bz = mvPosition.z * mvPosition.z;
mvPosition.x += uBend.x * bz; mvPosition.y += uBend.y * bz;
gl_Position = projectionMatrix * mvPosition;`;
function bend(m) {
  m.onBeforeCompile = (sh) => { sh.uniforms.uBend = uBend; sh.vertexShader = 'uniform vec2 uBend;\n' + sh.vertexShader.replace('#include <project_vertex>', BEND); };
  m.customProgramCacheKey = () => 'bend';
  return m;
}
function tex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const glowTex = tex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
const add = (o, parent) => { (parent || scene).add(o); return o; };
const basic = (o) => new THREE.MeshBasicMaterial(o);
const glowMat = (color, opacity) => bend(basic({ map: glowTex, color, transparent: true, opacity: opacity == null ? 1 : opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
function inst(geo, mat, n, colors) {
  const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.count = 0;
  if (colors) { const c = new THREE.Color(1, 1, 1); for (let i = 0; i < n; i++) m.setColorAt(i, c); }
  return add(m);
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
function put(mesh, i, x, y, z, sx, sy, sz, ry, rz) {
  _e.set(0, ry || 0, rz || 0); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz);
  _m.compose(_p, _q, _s); mesh.setMatrixAt(i, _m);
}
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };

// --- sky: gradient dome, stars, moon, the castle and the big wheel on the horizon ---
const sky = add(new THREE.Group());
{
  const g = new THREE.SphereGeometry(1000, 24, 18), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const stops = [[-1, 0x170a3c], [0, 0x170a3c], [0.035, 0x5a1a78], [0.11, 0x2c1060], [0.36, 0x0c0a2e], [1, 0x03040f]];
  const a = new THREE.Color(), b = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 1000; let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    a.setHex(stops[k][1]); b.setHex(stops[k + 1][1]); a.lerp(b, clamp((t - stops[k][0]) / (stops[k + 1][0] - stops[k][0]), 0, 1));
    col[i * 3] = a.r; col[i * 3 + 1] = a.g; col[i * 3 + 2] = a.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dome = add(new THREE.Mesh(g, basic({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })), sky); dome.renderOrder = -10;
  const n = 420, sp = new Float32Array(n * 3), sc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = hash(i * 3 + 1) * Math.PI * 2, v = 0.06 + hash(i * 3 + 2) * 0.9, r = 900, y = Math.sin(v * Math.PI / 2), h = Math.cos(v * Math.PI / 2);
    sp[i * 3] = Math.cos(u) * h * r; sp[i * 3 + 1] = y * r; sp[i * 3 + 2] = Math.sin(u) * h * r;
    const w = 0.5 + hash(i * 3 + 3) * 0.5; sc[i * 3] = w; sc[i * 3 + 1] = w * (0.85 + hash(i) * 0.15); sc[i * 3 + 2] = w * (0.9 + hash(i + 7) * 0.3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const pts = add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true, opacity: 0.9 })), sky); pts.renderOrder = -9;
  const moonTex = tex(256, 256, (c) => {
    c.fillStyle = '#ffe9c9'; c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fill();
    c.fillStyle = 'rgba(226,196,186,.55)'; for (const [x, y, r] of [[90, 90, 26], [160, 120, 18], [120, 170, 22], [180, 70, 12], [70, 150, 10]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  });
  const moon = add(new THREE.Mesh(new THREE.CircleGeometry(46, 40), basic({ map: moonTex, fog: false, depthWrite: false, transparent: true })), sky); moon.position.set(330, 430, -800); moon.lookAt(0, 0, 0); moon.renderOrder = -8;
  const halo = add(new THREE.Mesh(new THREE.PlaneGeometry(330, 330), basic({ map: glowTex, color: 0xff9fd0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, fog: false, depthWrite: false })), sky);
  halo.position.copy(moon.position).multiplyScalar(1.01); halo.lookAt(0, 0, 0); halo.renderOrder = -8.5;
  // the castle: the middle of the park, a long way off
  const castleTex = tex(512, 340, (c, w, h) => {
    c.fillStyle = '#090419';
    const tower = (x, tw, th, roof) => { c.fillRect(x - tw / 2, h - th, tw, th); c.beginPath(); c.moveTo(x - tw / 2 - 5, h - th); c.lineTo(x, h - th - roof); c.lineTo(x + tw / 2 + 5, h - th); c.fill(); c.fillRect(x - 1, h - th - roof - 16, 2, 18); c.fillRect(x, h - th - roof - 16, 12, 7); };
    c.fillRect(60, h - 90, 392, 90);
    for (let x = 60; x < 452; x += 20) c.fillRect(x, h - 100, 11, 12);
    tower(256, 64, 215, 78); tower(176, 42, 160, 56); tower(336, 42, 160, 56); tower(96, 50, 124, 50); tower(416, 50, 124, 50); tower(216, 22, 190, 40); tower(296, 22, 190, 40);
    c.fillStyle = '#ffd98a'; for (let i = 0; i < 46; i++) { const x = 70 + hash(i * 11) * 372, y = h - 14 - hash(i * 13) * 70; c.fillRect(x, y, 4, 7); }
    for (const [x, y] of [[256, 150], [256, 180], [176, 200], [336, 200], [96, 235], [416, 235], [246, 215], [266, 215]]) { c.fillRect(x - 3, y, 6, 11); }
    c.fillStyle = '#ff5fa8'; c.fillRect(250, h - 46, 12, 46);
  });
  const castle = add(new THREE.Mesh(new THREE.PlaneGeometry(300, 200), basic({ map: castleTex, transparent: true, fog: false, depthWrite: false })), sky); castle.position.set(-185, 86, -880); castle.renderOrder = -7;
  const cg = add(new THREE.Mesh(new THREE.PlaneGeometry(520, 300), basic({ map: glowTex, color: 0xff4fa8, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, fog: false, depthWrite: false })), sky); cg.position.set(-185, 70, -890); cg.renderOrder = -7.5;
  // the big wheel
  const wheel = add(new THREE.Group(), sky); wheel.position.set(250, 92, -860); wheel.renderOrder = -7;
  const R0 = 96, seg = [], lights = new Float32Array(24 * 3), lc = new Float32Array(24 * 3);
  for (let i = 0; i < 24; i++) {
    const a0 = i / 24 * Math.PI * 2, a1 = (i + 1) / 24 * Math.PI * 2;
    seg.push(Math.cos(a0) * R0, Math.sin(a0) * R0, 0, Math.cos(a1) * R0, Math.sin(a1) * R0, 0);
    if (i % 2 === 0) seg.push(0, 0, 0, Math.cos(a0) * R0, Math.sin(a0) * R0, 0);
    lights[i * 3] = Math.cos(a0) * R0; lights[i * 3 + 1] = Math.sin(a0) * R0;
    _c.setHex(i % 3 === 0 ? 0xffd23f : i % 3 === 1 ? 0xff3d9a : 0x2de2e6); lc[i * 3] = _c.r; lc[i * 3 + 1] = _c.g; lc[i * 3 + 2] = _c.b;
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  const spin = add(new THREE.Group(), wheel);
  add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x8a6cff, fog: false, transparent: true, opacity: 0.85, depthWrite: false })), spin);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lights, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  add(new THREE.Points(lg, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, map: glowTex, transparent: true, blending: THREE.AdditiveBlending })), spin);
  const legs = new THREE.BufferGeometry(); legs.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -50, -100, 0, 0, 0, 0, 50, -100, 0], 3));
  add(new THREE.LineSegments(legs, new THREE.LineBasicMaterial({ color: 0x8a6cff, fog: false, transparent: true, opacity: 0.85, depthWrite: false })), wheel);
  sky.userData.spin = spin;
}

// --- ground far below: a neon grid ---
const gridTex = tex(128, 128, (c, w) => { c.fillStyle = '#0a0624'; c.fillRect(0, 0, w, w); c.strokeStyle = '#ff3d9a'; c.lineWidth = 5; c.strokeRect(0, 0, w, w); c.strokeStyle = 'rgba(255,160,220,.9)'; c.lineWidth = 1.5; c.strokeRect(0, 0, w, w); }, true);
gridTex.repeat.set(70, 70); gridTex.anisotropy = 8;
const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 1, 70), bend(basic({ map: gridTex }))));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, -8, -300);

// --- the track ---
const TRACK_LEN = 230, TRACK_Z = -TRACK_LEN / 2 + 12;
const bed = add(new THREE.Mesh(new THREE.PlaneGeometry(LW * 3 + 0.5, TRACK_LEN, 1, 46), bend(basic({ color: 0x0b0a26 }))));
bed.rotation.x = -Math.PI / 2; bed.position.set(0, -0.02, TRACK_Z);
const railMat = bend(basic({ color: 0x2de2e6 }));
const rails = inst(new THREE.BoxGeometry(0.1, 0.1, TRACK_LEN, 1, 1, 46), railMat, 6);
const railGlowTex = tex(64, 4, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
const railGlowMat = bend(basic({ map: railGlowTex, color: 0x2de2e6, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
const railGlowGeo = new THREE.PlaneGeometry(0.9, TRACK_LEN, 1, 46); railGlowGeo.rotateX(-Math.PI / 2);
const railGlow = inst(railGlowGeo, railGlowMat, 6);
for (let l = 0; l < 3; l++) for (let k = 0; k < 2; k++) { const x = (l - 1) * LW + (k ? 0.56 : -0.56); put(rails, l * 2 + k, x, 0.07, TRACK_Z); put(railGlow, l * 2 + k, x, 0.03, TRACK_Z); }
rails.count = railGlow.count = 6;
const ties = inst(new THREE.BoxGeometry(LW * 3 + 0.2, 0.05, 0.24), bend(basic({ color: 0x262a5e })), 116);
// side posts with lamps, light arches, towers of the park, speed streaks
const posts = inst(new THREE.BoxGeometry(0.12, 3.2, 0.12), bend(basic({ color: 0x1b1848 })), 44);
const lamps = inst(new THREE.PlaneGeometry(1.5, 1.5), glowMat(0xffffff, 0.95), 44, true);
const archGeo = new THREE.TorusGeometry(6.4, 0.11, 6, 30, Math.PI);
const arches = inst(archGeo, bend(basic({ color: 0xffffff })), 6, true);
const archGlow = inst(new THREE.TorusGeometry(6.4, 0.5, 6, 30, Math.PI), bend(basic({ color: 0xffffff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })), 6, true);
const winTex = tex(64, 128, (c, w, h) => { c.fillStyle = '#0b0828'; c.fillRect(0, 0, w, h); for (let y = 0; y < 16; y++) for (let x = 0; x < 6; x++) { const r = hash(y * 31 + x * 7 + 5); if (r > 0.45) { c.fillStyle = r > 0.9 ? '#2de2e6' : r > 0.8 ? '#ff7ac0' : '#ffd98a'; c.fillRect(5 + x * 10, 4 + y * 8, 5, 4); } } });
const towers = inst(new THREE.BoxGeometry(1, 1, 1), bend(basic({ map: winTex })), 40, true);
const streaks = inst(new THREE.BoxGeometry(0.035, 0.035, 7), bend(basic({ color: 0xbfefff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })), 36);

// --- things on the track ---
const chev = (c, w, h, col, up) => { c.strokeStyle = col; c.lineWidth = Math.max(8, h * 0.07); c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 0; i < 3; i++) { const x = w * (0.25 + i * 0.25), m = h * 0.5, d = h * 0.2 * (up ? -1 : 1), a = Math.min(w * 0.085, h * 0.24); c.beginPath(); c.moveTo(x - a, m - d); c.lineTo(x, m + d); c.lineTo(x + a, m - d); c.stroke(); } };
const gateTex = tex(256, 340, (c, w, h) => { c.fillStyle = '#33061a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff3b5c'; c.lineWidth = 18; c.strokeRect(9, 9, w - 18, h - 18); c.strokeStyle = '#ff7d92'; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(70, 100); c.lineTo(186, 240); c.moveTo(186, 100); c.lineTo(70, 240); c.stroke(); });
const hurdleTex = tex(256, 96, (c, w, h) => { c.fillStyle = '#3a2402'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffb020'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12); chev(c, w, h, '#ffd680', true); });
const beamTex = tex(256, 200, (c, w, h) => { c.fillStyle = '#170b48'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8f7bff'; c.lineWidth = 16; c.strokeRect(8, 8, w - 16, h - 16); chev(c, w, h, '#c9bfff', false); });
const NOB = 48;
const gates = inst(new THREE.PlaneGeometry(2.04, 2.7), bend(basic({ map: gateTex })), NOB);
const gateGlow = inst(new THREE.PlaneGeometry(4.6, 5), glowMat(0xff3b5c, 0.5), NOB);
const hurdles = inst(new THREE.PlaneGeometry(2.04, 0.78), bend(basic({ map: hurdleTex })), NOB);
const hurdleBar = inst(new THREE.BoxGeometry(2.1, 0.13, 0.2), bend(basic({ color: 0xffd060 })), NOB);
const beams = inst(new THREE.PlaneGeometry(2.04, 1.6), bend(basic({ map: beamTex })), NOB);
const beamBar = inst(new THREE.BoxGeometry(2.1, 0.13, 0.2), bend(basic({ color: 0xb9adff })), NOB);
const beamPost = inst(new THREE.BoxGeometry(0.1, 2.9, 0.1), bend(basic({ color: 0x8f7bff })), NOB * 2);
const starGeo = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.2 : 0.46; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }); g.translate(0, 0, -0.07); return g; })();
const NST = 72;
const stars = inst(starGeo, bend(new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0xb07400 })), NST);
const starGlow = inst(new THREE.PlaneGeometry(1.9, 1.9), glowMat(0xffc94a, 0.55), NST);

// --- the cart and its rider ---
const hue = Math.floor(hash(S.hashSeed(token)) * 360);
const cart = add(new THREE.Group());
const cartBody = add(new THREE.Group(), cart);
const lam = (c, e) => bend(new THREE.MeshLambertMaterial({ color: c, emissive: e || 0x000000 }));
const cartCol = new THREE.Color().setHSL(hue / 360, 0.85, 0.55);
const box = (w, h, d, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || cartBody).add(m); return m; };
const bodyMat = lam(cartCol, cartCol.clone().multiplyScalar(0.25));
box(1.2, 0.44, 1.75, bodyMat, 0, 0.46, 0);
box(0.96, 0.3, 0.42, bodyMat, 0, 0.4, -1.0);
box(1.06, 0.62, 0.22, lam(0x1b1a3a), 0, 0.92, 0.66);
box(1.24, 0.08, 1.79, lam(0xffffff, 0x999999), 0, 0.3, 0);
box(0.22, 0.12, 0.06, bend(basic({ color: 0xff3355 })), -0.42, 0.52, 0.89); box(0.22, 0.12, 0.06, bend(basic({ color: 0xff3355 })), 0.42, 0.52, 0.89);
for (const [x, z] of [[-0.62, -0.6], [0.62, -0.6], [-0.62, 0.6], [0.62, 0.6]]) box(0.14, 0.3, 0.34, lam(0x0d0c20), x, 0.17, z);
const rider = add(new THREE.Group(), cartBody); rider.position.set(0, 0.68, 0.2);
box(0.5, 0.5, 0.34, lam(0xf2f2ff), 0, 0.25, 0, rider);
const head = box(0.4, 0.38, 0.4, lam(cartCol.clone().offsetHSL(0.5, 0, 0.05)), 0, 0.72, 0, rider);
box(0.42, 0.1, 0.06, lam(0x111122), 0, 0.74, -0.2, rider);
const armL = add(new THREE.Group(), rider), armR = add(new THREE.Group(), rider); armL.position.set(-0.32, 0.42, 0); armR.position.set(0.32, 0.42, 0);
box(0.13, 0.46, 0.13, lam(0xf2f2ff), 0, 0.2, -0.05, armL); box(0.13, 0.46, 0.13, lam(0xf2f2ff), 0, 0.2, -0.05, armR);
const under = add(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), glowMat(0x2de2e6, 0.5)), cart); under.rotation.x = -Math.PI / 2; under.position.y = 0.06;
const beamTexL = tex(64, 128, (c, w, h) => { const g = c.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.38, h); c.lineTo(w * 0.62, h); c.lineTo(w, 0); c.lineTo(0, 0); c.fill(); });
const headlight = add(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 15, 1, 8), bend(basic({ map: beamTexL, color: 0xcfe8ff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }))), cart);
headlight.rotation.x = -Math.PI / 2; headlight.position.set(0, 0.05, -8.4);
// the comet tail
const TN = 30, tailPos = new Float32Array(TN * 4 * 3), tailCol = new Float32Array(TN * 4 * 3), tailIdx = [];
for (let i = 0; i < TN - 1; i++) for (let q = 0; q < 2; q++) { const a = i * 4 + q * 2; tailIdx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
const tailGeo = new THREE.BufferGeometry(); tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos, 3)); tailGeo.setAttribute('color', new THREE.BufferAttribute(tailCol, 3)); tailGeo.setIndex(tailIdx);
const tail = add(new THREE.Mesh(tailGeo, bend(basic({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })))); tail.frustumCulled = false;
const hist = [];

// --- sparks ---
class Sparks {
  constructor(n, size) {
    this.n = n; this.i = 0; this.pos = new Float32Array(n * 3).fill(-9999); this.col = new Float32Array(n * 3); this.base = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n); this.grav = new Float32Array(n); this.scroll = new Float32Array(n);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mesh = add(new THREE.Points(g, bend(new THREE.PointsMaterial({ size, map: glowTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))));
    this.mesh.frustumCulled = false;
  }
  emit(x, y, z, vx, vy, vz, life, color, grav, scroll) {
    const i = this.i; this.i = (i + 1) % this.n; _c.set(color);
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.base[i * 3] = _c.r; this.base[i * 3 + 1] = _c.g; this.base[i * 3 + 2] = _c.b; this.life[i] = this.max[i] = life; this.grav[i] = grav == null ? 9 : grav; this.scroll[i] = scroll == null ? 1 : scroll;
  }
  update(dt, dz) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt; const j = i * 3;
      if (this.life[i] <= 0) { this.pos[j + 1] = -9999; continue; }
      this.vel[j + 1] -= this.grav[i] * dt;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt + dz * this.scroll[i];
      const f = this.life[i] / this.max[i], k = f * (2 - f);
      this.col[j] = this.base[j] * k; this.col[j + 1] = this.base[j + 1] * k; this.col[j + 2] = this.base[j + 2] * k;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}
const sparks = new Sparks(420, 0.55), fire = new Sparks(360, 2.4);
const rnd = (a, b) => a + Math.random() * (b - a);
function burst(x, y, z, n, color, speed) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, u = rnd(-0.3, 1), s = rnd(0.4, 1) * speed; sparks.emit(x, y, z, Math.cos(a) * s, u * s + 1.5, Math.sin(a) * s * 0.6 - 2, rnd(0.3, 0.6), color, 10); } }
function firework(color) {
  const x = rnd(-70, 70), y = rnd(34, 70), z = rnd(-150, -110), n = 46;
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, b = Math.acos(rnd(-1, 1)), s = rnd(14, 22); fire.emit(x, y, z, Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s, Math.sin(b) * Math.sin(a) * s * 0.4, rnd(0.9, 1.5), color, 7, 0.06); }
}

// ---------- sound: everything is made here, no files ----------
const AU = { ctx: null, on: store.get('snd', true), playing: false, step: 0, next: 0, level: 0, bpm: 110 };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function auInit() {
  if (!AU.on) return;
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  try {
    const c = AU.ctx = new C();
    AU.master = c.createGain(); AU.master.gain.value = 0.85;
    const comp = c.createDynamicsCompressor(); AU.master.connect(comp); comp.connect(c.destination);
    AU.mfil = c.createBiquadFilter(); AU.mfil.type = 'lowpass'; AU.mfil.frequency.value = 9000; AU.mfil.connect(AU.master);
    AU.music = c.createGain(); AU.music.gain.value = 0; AU.music.connect(AU.mfil);
    AU.sfx = c.createGain(); AU.sfx.gain.value = 0.9; AU.sfx.connect(AU.master);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = nb;
  } catch (e) { AU.ctx = null; }
}
function tone(dest, type, f0, f1, t0, dur, vol, att) {
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.03);
}
function hiss(dest, t0, dur, vol, type, f0, f1) {
  const c = AU.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AU.noise; s.loop = true; f.type = type; f.frequency.setValueAtTime(f0, t0);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t0, Math.random()); s.stop(t0 + dur + 0.03);
}
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], ARP = [0, 1, 2, 1, 2, 0, 1, 2];
function musicNote(step, t) {
  const m = AU.music, s = step % 16, ch = PROG[Math.floor(step / 16) % 4], L = AU.level;
  if (s % 4 === 0) tone(m, 'sine', 150, 42, t, 0.17, 0.85);
  if (s % 8 === 4) hiss(m, t, 0.13, 0.22, 'bandpass', 1900);
  if (s % 2 === 1 || L >= 3) hiss(m, t, 0.035, s % 2 ? 0.1 : 0.05, 'highpass', 7500);
  if (s % 2 === 0) { tone(m, 'triangle', mtof(ch[0] - 12), 0, t, 0.21, 0.3); tone(m, 'sawtooth', mtof(ch[0] - 24), 0, t, 0.19, 0.07); }
  if (L >= 1) tone(m, 'square', mtof(ch[ARP[s % 8]] + 12 + (L >= 3 && s % 4 === 3 ? 12 : 0)), 0, t, 0.12, 0.035);
  if (L >= 2 && (s === 0 || s === 6 || s === 12)) tone(m, 'triangle', mtof(ch[(s / 6) | 0] + 24), 0, t, 0.34, 0.07, 0.02);
}
function musicTick() {
  if (!AU.ctx || !AU.playing) return; const c = AU.ctx;
  if (AU.next < c.currentTime - 0.3) AU.next = c.currentTime + 0.05;
  while (AU.next < c.currentTime + 0.14) { musicNote(AU.step, AU.next); AU.next += 60 / AU.bpm / 4; AU.step++; }
}
function musicStart() { if (!AU.ctx) return; const c = AU.ctx, t = c.currentTime; AU.step = 0; AU.next = t + 0.08; AU.playing = true; AU.level = 0; AU.music.gain.cancelScheduledValues(t); AU.music.gain.setTargetAtTime(0.5, t, 0.05); AU.mfil.frequency.cancelScheduledValues(t); AU.mfil.frequency.setTargetAtTime(9000, t, 0.05); }
function musicStop() { if (!AU.ctx) return; const c = AU.ctx, t = c.currentTime; AU.playing = false; AU.mfil.frequency.setTargetAtTime(180, t, 0.12); AU.music.gain.setTargetAtTime(0, t + 0.2, 0.15); }
const PENTA = [0, 2, 4, 7, 9];
const sfx = (fn) => (...a) => { if (AU.ctx && AU.on) { try { fn(AU.ctx.currentTime, ...a); } catch (e) { /* a sound less */ } } };
const SFX = {
  star: sfx((t, streak) => { const k = (streak - 1) % 15, f = 660 * Math.pow(2, (PENTA[k % 5] + 12 * Math.floor(k / 5)) / 12); tone(AU.sfx, 'triangle', f, 0, t, 0.13, 0.22); tone(AU.sfx, 'sine', f * 2, 0, t, 0.09, 0.08); }),
  lane: sfx((t) => hiss(AU.sfx, t, 0.09, 0.12, 'bandpass', 900, 2600)),
  jump: sfx((t) => tone(AU.sfx, 'square', 240, 620, t, 0.16, 0.09)),
  duck: sfx((t) => tone(AU.sfx, 'square', 420, 150, t, 0.14, 0.09)),
  near: sfx((t) => { tone(AU.sfx, 'sawtooth', 900, 1900, t, 0.11, 0.1); hiss(AU.sfx, t, 0.16, 0.2, 'highpass', 3000); }),
  mult: sfx((t, m) => { for (let i = 0; i < 4; i++) tone(AU.sfx, 'triangle', mtof(69 + m + [0, 4, 7, 12][i]), 0, t + i * 0.055, 0.2, 0.2); }),
  lost: sfx((t) => tone(AU.sfx, 'sawtooth', 300, 90, t, 0.3, 0.14)),
  crash: sfx((t) => { hiss(AU.sfx, t, 0.6, 0.7, 'lowpass', 3000, 200); tone(AU.sfx, 'sine', 120, 30, t, 0.5, 0.9); tone(AU.sfx, 'sawtooth', 220, 50, t, 0.35, 0.2); }),
  best: sfx((t) => { [72, 76, 79, 84, 88].forEach((n, i) => tone(AU.sfx, 'triangle', mtof(n), 0, t + i * 0.09, 0.3, 0.24)); }),
  go: sfx((t) => { tone(AU.sfx, 'square', 440, 0, t, 0.1, 0.1); tone(AU.sfx, 'square', 880, 0, t + 0.1, 0.22, 0.12); }),
  beat: sfx((t) => { [76, 81, 88].forEach((n, i) => tone(AU.sfx, 'square', mtof(n), 0, t + i * 0.07, 0.2, 0.1)); }),
};
const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* no motor */ } };
function sndIcon() { $('sndw').style.display = AU.on ? '' : 'none'; $('sndx').style.display = AU.on ? 'none' : ''; }
$('snd').addEventListener('click', (e) => { e.stopPropagation(); AU.on = !AU.on; store.set('snd', AU.on); sndIcon(); if (AU.on) { auInit(); if (mode === 'ride') musicStart(); } else if (AU.ctx) { musicStop(); } });
sndIcon();
const unlock = () => { if (!AU.on) return; auInit(); if (AU.ctx && mode === 'ride' && !AU.playing) musicStart(); };
for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { passive: true });

// ---------- state ----------
let mode = 'title';            // title | ride | crash | result | paused
let R = null, prevS = 0, acc = 0, lastT = 0, clock = 0;
let today = dayOf(Date.now()), rideDay = today;
let xVis = 0, rollVis = 0, squash = 1, shake = 0, punch = 0, crashT = 0, drift = 0, railHue = 0, autopilot = false, beaten = false;
let goal = 0, lastScore = -1, lastMult = 1, lastStars = -1, hintOn = '', ridesDone = store.get('rides', 0);
const MULT_COL = [0x2de2e6, 0x3df5a0, 0xb8f53d, 0xffd23f, 0xff9a3d, 0xff5c7a, 0xff3df0, 0xffffff];
const railTarget = new THREE.Color(MULT_COL[0]);

function newRide(seed, demo) {
  R = new S.Ride(seed); R.vi = 0; R.demo = !!demo; prevS = 0; acc = 0; xVis = 0; rollVis = 0; squash = 1; drift = 0; hist.length = 0; beaten = false;
  lastScore = -1; lastMult = 1; lastStars = -1; cart.visible = true; railTarget.setHex(MULT_COL[0]);
}
function startRide() {
  auInit();
  today = dayOf(Date.now()); rideDay = today;
  newRide(S.daySeed(rideDay), false);
  mode = 'ride'; $('title').classList.add('off'); $('result').classList.remove('on'); setTimeout(() => { if (mode === 'ride') $('result').hidden = true; }, 220);
  $('hud').classList.add('on'); $('mx').textContent = '×1'; $('mbar').style.width = '0%'; $('mx').parentNode.parentNode.style.setProperty('--mc', '#2de2e6');
  const t = $('target'); if (dare && dare.day === rideDay) { t.hidden = false; t.classList.remove('done'); t.innerHTML = 'BEAT ' + dare.name + ' · <b>' + fmt(dare.score) + '</b>'; } else { const b = myDays()[rideDay]; t.hidden = !b; t.classList.remove('done'); if (b) t.innerHTML = 'YOUR BEST TODAY · <b>' + fmt(b) + '</b>'; }
  goal = dare && dare.day === rideDay ? dare.score : (myDays()[rideDay] || 0);
  musicStart(); SFX.go(); pop('GO!', 'big', '#fff');
}
function demoRide() { newRide(S.hashSeed('demo' + Math.floor(Math.random() * 1e6)), true); }

// what a careful rider would do: drives the cart on the title screen (and in tests)
function pilot(r) {
  const rows = r.course.rows; r.course.ensure(r.s + 400 * S.U);
  let i = r.ri; while (i < rows.length && rows[i].k < 0) i++;
  const ob = rows[i]; if (!ob) return;
  const v = S.speedAt(r.s), eta = Math.ceil((ob.s - r.s) / v), order = [r.lane + 1, 1, 0, 2];
  let target = -1, need = 0;
  for (const li of order) if (ob.c[li] === S.EMPTY) { target = li; break; }
  if (target < 0) for (const li of order) if (ob.c[li] === S.HURDLE) { target = li; need = 1; break; }
  if (target < 0) for (const li of order) if (ob.c[li] === S.BEAM) { target = li; need = 2; break; }
  let want = target; const sr = rows[r.ri];
  if (sr && sr.k < 0 && eta > 9) want = sr.c.indexOf(S.STAR);
  const cur = r.lane + 1;
  if (want < cur) act('L', r); else if (want > cur) act('R', r);
  if (r.lane + 1 === target) { if (need === 1 && eta <= 12 && eta >= 5 && r.jumpT < S.AIR_LO) act('U', r); if (need === 2 && eta <= 10 && r.duckT <= eta) act('D', r); }
}
function act(a, r) {
  r = r || R; if (!r || r.dead) return;
  if (!r.input(a)) return;
  if (r.demo) return;
  if (a === 'L' || a === 'R') SFX.lane(); else if (a === 'U') SFX.jump(); else SFX.duck();
}

// ---------- HUD ----------
const pops = $('pops');
function pop(text, cls, color, x) {
  const el = document.createElement('div'); el.className = 'pop ' + (cls || ''); el.textContent = text; if (color) el.style.color = color;
  if (x != null) el.style.left = x + '%';
  pops.appendChild(el); setTimeout(() => el.remove(), 1150);
  while (pops.children.length > 7) pops.firstChild.remove();
}
function flash(a) { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = a; requestAnimationFrame(() => { f.style.transition = 'opacity .32s'; f.style.opacity = 0; }); }
function onEvents(ev) {
  for (const e of ev) {
    if (e.t === 'star') {
      if (R.demo) continue;
      SFX.star(e.streak); burst(xVis, 1.0, -0.6, 7, 0xffd23f, 5);
      if (e.up) { SFX.mult(e.mult); pop('×' + e.mult + (e.mult === S.MULT_MAX ? ' MAX!' : ''), 'big', '#' + MULT_COL[e.mult - 1].toString(16).padStart(6, '0')); punch = 1; firework(MULT_COL[e.mult - 1]); firework(0xffd23f); const x = $('mx'); x.classList.remove('pop', 'lost'); void x.offsetWidth; x.classList.add('pop'); buzz(20); }
    } else if (e.t === 'near') {
      if (R.demo) continue; SFX.near(); pop('CLOSE! +' + e.pts, '', '#7df9ff', 50 + (R.lane * 14)); shake = Math.max(shake, 0.25); buzz(12);
    } else if (e.t === 'lost') {
      if (R.demo) continue; SFX.lost(); pop('COMBO LOST', '', '#ff6b85'); const x = $('mx'); x.classList.remove('pop', 'lost'); void x.offsetWidth; x.classList.add('lost');
    } else if (e.t === 'crash') {
      if (R.demo) { demoRide(); return; }
      crash();
    }
  }
}
function hud() {
  const sc = R.score(), m = R.mult();
  if (sc !== lastScore) { $('score').textContent = fmt(sc); lastScore = sc; }
  if (R.stars !== lastStars) { $('nstars').textContent = R.stars; lastStars = R.stars; }
  if (m !== lastMult) { $('mx').textContent = '×' + m; $('mx').parentNode.parentNode.style.setProperty('--mc', '#' + MULT_COL[m - 1].toString(16).padStart(6, '0')); lastMult = m; railTarget.setHex(MULT_COL[m - 1]); AU.level = m >= 6 ? 3 : m >= 4 ? 2 : m >= 2 ? 1 : 0; }
  $('mbar').style.width = (m >= S.MULT_MAX ? 100 : (R.streak % S.STREAK_PER_MULT) / S.STREAK_PER_MULT * 100) + '%';
  if (!beaten && goal > 0 && sc > goal) { beaten = true; $('target').classList.add('done'); SFX.beat(); pop(dare && dare.day === rideDay ? 'YOU BEAT ' + dare.name + '!' : 'NEW BEST!', 'big', '#7dffb0'); firework(0x7dffb0); firework(0xffd23f); }
  // first rides: show what to do
  let h = '';
  if (ridesDone < 3) {
    const rows = R.course.rows; let i = R.ri; while (i < rows.length && rows[i].k < 0) i++;
    const ob = rows[i];
    if (ob) {
      const eta = (ob.s - R.s) / S.speedAt(R.s), li = R.lane + 1, c = ob.c[li];
      if (eta < 62 && eta > 3) {
        if (c === S.GATE) { const l = li > 0 ? ob.c[li - 1] : S.GATE, r = li < 2 ? ob.c[li + 1] : S.GATE; h = l === S.EMPTY ? 'L' : r === S.EMPTY ? 'R' : l !== S.GATE ? 'L' : 'R'; }
        else if (c === S.HURDLE && !R.airborne() && R.jumpT === 0) h = 'U';
        else if (c === S.BEAM && !R.sliding()) h = 'D';
      }
    }
  }
  if (h !== hintOn) { hintOn = h; const el = $('hint'); el.classList.toggle('on', !!h); if (h) { el.dataset.d = h; $('hintt').textContent = fine ? (h === 'U' ? 'UP ARROW' : h === 'D' ? 'DOWN ARROW' : h === 'L' ? 'LEFT ARROW' : 'RIGHT ARROW') : (h === 'U' ? 'SWIPE UP' : h === 'D' ? 'SWIPE DOWN' : 'SWIPE'); } }
}

// ---------- crash and result ----------
function crash() {
  mode = 'crash'; crashT = 0; prevS = R.s - 60; drift = -S.speedAt(R.s) / S.U * 60 * 0.22; cart.visible = false; shake = 1.1; flash(0.45); buzz(160);
  musicStop(); SFX.crash(); $('hint').classList.remove('on'); hintOn = '';
  for (let i = 0; i < 46; i++) { const a = Math.random() * 6.283, s = rnd(3, 13); sparks.emit(xVis + rnd(-0.4, 0.4), rnd(0.4, 1.4), rnd(-0.6, 0.4), Math.cos(a) * s, rnd(2, 10), -rnd(2, 16), rnd(0.5, 1.1), i % 3 === 0 ? 0xffffff : i % 3 === 1 ? cartCol.getHex() : 0xff5c7a, 14); }
}
function showResult() {
  mode = 'result'; ridesDone++; store.set('rides', ridesDone);
  const sc = R.score(), days = store.get('days', {}), before = days[rideDay] || 0, isBest = sc > before;
  if (isBest) { days[rideDay] = sc; const keep = {}; for (const d of weekDays(dayOf(Date.now()))) if (days[d]) keep[d] = days[d]; if (days[rideDay]) keep[rideDay] = days[rideDay]; store.set('days', keep); }
  $('hud').classList.remove('on');
  $('rtrack').textContent = "TODAY'S TRACK · #" + trackNo(rideDay);
  $('rnb').hidden = !(isBest && before > 0);
  $('rm').textContent = fmt(Math.floor(R.s / S.U)); $('rs').textContent = R.stars; $('rx').textContent = '×' + R.best_mult; $('rn').textContent = R.near;
  const sub = $('rsub');
  if (dare && dare.day === rideDay) sub.innerHTML = sc > dare.score ? 'You beat ' + dare.name + ' by <b>' + fmt(sc - dare.score) + '</b>. Send it back.' : '<b>' + fmt(dare.score - sc + 1) + '</b> more to beat ' + dare.name + '.';
  else if (isBest && before > 0) sub.innerHTML = 'Up <b>' + fmt(sc - before) + '</b> on your best today.';
  else if (!isBest) sub.innerHTML = 'Your best today: <b>' + fmt(before) + '</b>. ' + fmt(before - sc + 1) + ' short.';
  else sub.innerHTML = 'First ride on today\'s track. Now beat it.';
  week(); board();
  const el = $('result'); el.hidden = false; void el.offsetWidth; el.classList.add('on');
  const big = $('rscore'), t0 = performance.now(); (function up(now) { const k = clamp((now - t0) / 650, 0, 1), e = 1 - Math.pow(1 - k, 3); big.textContent = fmt(sc * e); if (k < 1 && mode === 'result') requestAnimationFrame(up); else big.textContent = fmt(sc); })(t0);
  if (isBest) { if (before > 0) SFX.best(); submit(sc); }
}
function week() {
  const now = Date.now(), d7 = weekDays(dayOf(now)), mine = myDays(), max = Math.max(1, ...d7.map((d) => mine[d] || 0));
  let sum = 0, bars = '', labs = '';
  d7.forEach((d, i) => { const v = mine[d] || 0; sum += v; bars += '<i class="' + (v ? 'has ' : '') + (i === 6 ? 'today ' : '') + (i === 0 ? 'old' : '') + '" style="height:' + (v ? Math.max(8, v / max * 100) : 5) + '%"></i>'; labs += '<span>' + (i === 6 ? 'TODAY' : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(d + 'T12:00:00Z').getUTCDay()]) + '</span>'; });
  $('wsum').textContent = fmt(sum); $('wbars').innerHTML = bars; $('wdays').innerHTML = labs;
  const left = Date.parse(dayOf(now)) + DAY - now, h = Math.floor(left / 36e5), m = Math.floor(left % 36e5 / 6e4), old = mine[d7[0]] || 0;
  $('wnote').innerHTML = 'Your best ride of each day counts for 7 days, then it is gone. ' + (old ? '<b>' + fmt(old) + ' points vanish in ' + h + 'h ' + m + 'm.</b>' : 'New track in ' + h + 'h ' + m + 'm.');
}
let boardData = null;
function board() {
  const el = $('board'); if (!CFG.board) { el.hidden = true; return; }
  const draw = () => {
    const rows = (boardData && boardData.week) || []; if (!rows.length) { el.hidden = true; return; }
    el.hidden = false; let html = '', seen = false;
    rows.slice(0, 8).forEach((r, i) => { const me = cleanName(r.n) === riderName; seen = seen || me; html += '<li class="' + (me ? 'me' : '') + '"><span>' + (i + 1) + '. ' + cleanName(r.n) + (i === 0 ? ' 👑' : '') + '</span><span>' + fmt(r.p) + '</span></li>'; });
    if (!seen) { const i = rows.findIndex((r) => cleanName(r.n) === riderName); if (i >= 0) html += '<li class="me"><span>' + (i + 1) + '. ' + riderName + '</span><span>' + fmt(rows[i].p) + '</span></li>'; }
    $('blist').innerHTML = html;
  };
  draw();
  fetch(CFG.board + (CFG.board.indexOf('?') < 0 ? '?' : '&') + 't=' + Math.floor(Date.now() / 60000)).then((r) => r.json()).then((j) => { boardData = j; if (mode === 'result') draw(); }).catch(() => { /* no board today */ });
}
// the ride itself is sent, not just a number: the park re-runs it and counts what really happened
function submit(score) {
  if (!CFG.submit) return;
  const inputs = S.encode(R.log), id = token.slice(0, 6) + Date.now().toString(36), size = 3200, n = Math.max(1, Math.ceil(inputs.length / size));
  for (let i = 0; i < n; i++) {
    const body = JSON.stringify({ v: 1, r: 'comet', d: rideDay, n: riderName, t: token, s: score, id, p: [i + 1, n], i: inputs.slice(i * size, (i + 1) * size) });
    try { fetch(CFG.submit, { method: 'POST', body, keepalive: true }).catch(() => { /* offline: the ride still counts here */ }); } catch (e) { /* same */ }
  }
}
const nameEl = $('name'); nameEl.value = riderName;
nameEl.addEventListener('input', () => { const c = cleanName(nameEl.value); if (c !== nameEl.value.toUpperCase().slice(0, 14)) nameEl.value = c; });
nameEl.addEventListener('change', () => { riderName = cleanName(nameEl.value) || riderName; nameEl.value = riderName; store.set('name', riderName); });
nameEl.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') nameEl.blur(); });
$('again').addEventListener('click', (e) => { e.stopPropagation(); startRide(); });
$('share').addEventListener('click', (e) => {
  e.stopPropagation();
  const sc = Math.max(R ? R.score() : 0, myDays()[rideDay] || 0), base = CFG.url || (location.origin + location.pathname);
  const url = base + '?c=' + sc + '&n=' + encodeURIComponent(riderName) + '&d=' + rideDay, text = 'I scored ' + fmt(sc) + ' on today\'s COMET track at ' + CFG.park + '. Same track for everyone until midnight UTC. Beat me:';
  const done = (msg) => { const b = $('share'), old = 'DARE A FRIEND TO BEAT IT'; b.textContent = msg; setTimeout(() => { b.textContent = old; }, 1800); };
  const copy = () => { try { navigator.clipboard.writeText(text + ' ' + url).then(() => done('LINK COPIED'), () => done(url)); } catch (err) { done(url); } };
  try { if (navigator.share) navigator.share({ text, url }).catch((err) => { if (!err || err.name !== 'AbortError') copy(); }); else copy(); } catch (err) { copy(); }
});

// ---------- title ----------
function titleText() {
  today = dayOf(Date.now());
  const left = Date.parse(today) + DAY - Date.now(), p = (n) => String(n).padStart(2, '0');
  $('today').innerHTML = '<b>TRACK #' + trackNo(today) + '</b> · the same for everyone today<br>New track in <span class="cd">' + p(Math.floor(left / 36e5)) + ':' + p(Math.floor(left % 36e5 / 6e4)) + ':' + p(Math.floor(left % 6e4 / 1e3)) + '</span>';
  const d = $('dare');
  if (dare) { d.hidden = false; d.innerHTML = dare.day === today ? dare.name + ' scored <b>' + fmt(dare.score) + '</b> on this track. Beat it.' : dare.name + '\'s dare was on an older track. Set a new one.'; }
  const b = myDays()[today]; $('tbest').innerHTML = b ? 'YOUR BEST TODAY <b>' + fmt(b) + '</b>' : '';
}
const fine = (() => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return false; } })();
if (fine) { document.querySelectorAll('#title .how [data-key]').forEach((el) => { el.textContent = el.dataset.key; }); $('go').textContent = 'PRESS SPACE'; }
$('parkname').textContent = CFG.park; titleText(); setInterval(() => { if (mode === 'title') titleText(); }, 1000);
$('go').addEventListener('click', (e) => { e.stopPropagation(); startRide(); });

// ---------- input ----------
const stage = $('comet');
let ptr = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button, input, .card')) return;
  if (mode === 'paused') { resume(); return; }
  if (mode === 'title') { startRide(); return; }
  if (mode !== 'ride') return;
  auInit(); ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, last: '' };
  try { stage.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
});
stage.addEventListener('pointermove', (e) => {
  if (!ptr || e.pointerId !== ptr.id || mode !== 'ride') return;
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, th = ptr.last ? 34 : 18;
  if (Math.abs(dx) < th && Math.abs(dy) < th) return;
  const a = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U');
  ptr.x = e.clientX; ptr.y = e.clientY;
  if (a === ptr.last) return;
  ptr.last = a; act(a);
});
const endPtr = (e) => { if (ptr && e.pointerId === ptr.id) ptr = null; };
stage.addEventListener('pointerup', endPtr); stage.addEventListener('pointercancel', endPtr);
stage.addEventListener('touchmove', (e) => { if (!e.target.closest('.card')) e.preventDefault(); }, { passive: false });
stage.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  if (e.repeat || e.target === nameEl) return;
  const k = e.key, a = k === 'ArrowLeft' || k === 'a' || k === 'A' ? 'L' : k === 'ArrowRight' || k === 'd' || k === 'D' ? 'R' : k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ' ? 'U' : k === 'ArrowDown' || k === 's' || k === 'S' ? 'D' : '';
  if (mode === 'paused') { resume(); e.preventDefault(); return; }
  if ((mode === 'title' || mode === 'result') && (k === 'Enter' || k === ' ')) { startRide(); e.preventDefault(); return; }
  if (mode === 'ride' && a) { auInit(); act(a); e.preventDefault(); }
});
function resume() { mode = 'ride'; $('paused').hidden = true; acc = 0; lastT = 0; if (AU.on) musicStart(); }
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'ride') { mode = 'paused'; $('paused').hidden = false; musicStop(); } });

// ---------- drawing a frame ----------
const area = $('stage');
function resize() {
  const w = area.clientWidth || window.innerWidth, h = area.clientHeight || window.innerHeight;
  area.style.setProperty('--u', (w / 100) + 'px'); area.style.setProperty('--v', (h / 100) + 'px');
  renderer.setPixelRatio(pixelRatio); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
resize();

function drawRows(r, sVis, t) {
  const rows = r.course.rows; r.course.ensure(sVis + (VIEW + 30) * S.U);
  while (r.vi < rows.length && rows[r.vi].s < sVis - 9 * S.U) r.vi++;
  let ng = 0, nh = 0, nb = 0, ns = 0;
  for (let i = r.vi; i < rows.length; i++) {
    const row = rows[i], d = (row.s - sVis) / S.U; if (d > VIEW) break;
    const z = -d, g = clamp((VIEW - d) / 16, 0, 1), rise = (1 - g) * -3;
    for (let li = 0; li < 3; li++) {
      const c = row.c[li], x = (li - 1) * LW;
      if (c === S.GATE && ng < NOB) { put(gates, ng, x, 1.35 + rise, z, 1, g, 1); put(gateGlow, ng, x, 1.3 + rise, z - 0.05, 1, g, 1); ng++; }
      else if (c === S.HURDLE && nh < NOB) { put(hurdles, nh, x, 0.39 + rise, z); put(hurdleBar, nh, x, 0.8 + rise, z); nh++; }
      else if (c === S.BEAM && nb < NOB) { put(beams, nb, x, 2.07 + rise * -1, z); put(beamBar, nb, x, 1.24 - rise, z); put(beamPost, nb * 2, x - 1.04, 1.45 - rise, z); put(beamPost, nb * 2 + 1, x + 1.04, 1.45 - rise, z); nb++; }
      else if (c === S.STAR && !((row.got || 0) & (1 << li)) && ns < NST) { const y = 0.95 + Math.sin(t * 4 + row.s * 0.002) * 0.1; put(stars, ns, x, y, z, g, g, g, t * 3 + row.s * 0.001); put(starGlow, ns, x, y, z - 0.1, g, g, 1); ns++; }
      if (row.air && row.air[li] === S.STAR_AIR && !((row.got || 0) & (1 << li)) && ns < NST) { put(stars, ns, x, 2.25, z, 1.25 * g, 1.25 * g, 1.25 * g, t * 3); put(starGlow, ns, x, 2.25, z - 0.1, 1.4 * g, 1.4 * g, 1); ns++; }
    }
  }
  const set = (m, n) => { m.count = n; m.instanceMatrix.needsUpdate = true; };
  set(gates, ng); set(gateGlow, ng); set(hurdles, nh); set(hurdleBar, nh); set(beams, nb); set(beamBar, nb); set(beamPost, nb * 2); set(stars, ns); set(starGlow, ns);
}
function drawScenery(sm, t, sp) {
  const off = sm % 2;
  for (let i = 0; i < 116; i++) put(ties, i, 0, 0.0, 10 + off - i * 2);
  ties.count = 116; ties.instanceMatrix.needsUpdate = true;
  const p0 = Math.floor(sm / 10), po = sm % 10;
  for (let i = 0; i < 22; i++) {
    const z = 8 + po - i * 10, k = p0 + i;
    for (let s = 0; s < 2; s++) { const j = i * 2 + s, x = (s ? 1 : -1) * (LW * 1.5 + 0.9); put(posts, j, x, 1.5, z); put(lamps, j, x, 3.25, z); _c.setHex((k + s) % 2 ? 0xff3d9a : 0x2de2e6); lamps.setColorAt(j, _c); }
  }
  posts.count = lamps.count = 44; posts.instanceMatrix.needsUpdate = lamps.instanceMatrix.needsUpdate = true; lamps.instanceColor.needsUpdate = true;
  const a0 = Math.floor(sm / 40), ao = sm % 40;
  for (let i = 0; i < 6; i++) {
    const z = 20 + ao - i * 40, k = a0 + i; _c.setHSL(((k * 0.13 + railHue) % 1 + 1) % 1, 1, 0.62);
    put(arches, i, 0, -0.1, z); put(archGlow, i, 0, -0.1, z); arches.setColorAt(i, _c); archGlow.setColorAt(i, _c);
  }
  arches.count = archGlow.count = 6; arches.instanceMatrix.needsUpdate = archGlow.instanceMatrix.needsUpdate = true; arches.instanceColor.needsUpdate = archGlow.instanceColor.needsUpdate = true;
  const b0 = Math.floor(sm / 11), bo = sm % 11;
  for (let i = 0; i < 20; i++) {
    const k = b0 + i, z = 12 + bo - i * 11;
    for (let s = 0; s < 2; s++) {
      const j = i * 2 + s, h1 = hash(k * 2 + s), h2 = hash(k * 2 + s + 9999), h3 = hash(k * 2 + s + 555);
      const w = 4 + h2 * 6, hgt = 5 + h1 * h1 * 26, x = (s ? 1 : -1) * (11 + h3 * 22 + w / 2);
      put(towers, j, x, -8 + hgt / 2, z, w, hgt, w); _c.setHSL(0.62 + h2 * 0.3, 0.6, 0.55 + h1 * 0.3); towers.setColorAt(j, _c);
    }
  }
  towers.count = 40; towers.instanceMatrix.needsUpdate = true; towers.instanceColor.needsUpdate = true;
  const so = sm % 12;
  for (let i = 0; i < 36; i++) { const h1 = hash(i * 17 + 3), h2 = hash(i * 29 + 1), side = i % 2 ? 1 : -1; put(streaks, i, side * (4.6 + h1 * 6), 0.4 + h2 * 6, 6 + ((so + i * 5.3) % 12) / 12 * 96 - 96 + (i % 3) * 4); }
  streaks.count = 36; streaks.instanceMatrix.needsUpdate = true; streaks.material.opacity = 0.1 + sp * 0.5;
  gridTex.offset.y = (sm / 10) % 1;
}
function drawTail(sm, y) {
  hist.push(sm, xVis, y); while (hist.length > 3 * 90) hist.splice(0, 3);
  let k = hist.length - 3;
  for (let j = 0; j < TN; j++) {
    const want = sm - j * 0.42; while (k > 0 && hist[k] > want) k -= 3;
    const x = hist[k + 1], yy = hist[k + 2], f = 1 - j / (TN - 1), w = 0.03 + 0.09 * f, z = 0.9 + j * 0.42, a = j * 12, b = f * f;
    for (let q = 0; q < 2; q++) {
      const o = a + q * 6, cx = x + (q ? 0.42 : -0.42);
      tailPos[o] = cx - w; tailPos[o + 1] = 0.52 + yy; tailPos[o + 2] = z; tailPos[o + 3] = cx + w; tailPos[o + 4] = 0.52 + yy; tailPos[o + 5] = z;
      _c.setHex(0xff3355).lerp(railMat.color, 1 - f);
      tailCol[o] = tailCol[o + 3] = _c.r * b; tailCol[o + 1] = tailCol[o + 4] = _c.g * b; tailCol[o + 2] = tailCol[o + 5] = _c.b * b;
    }
  }
  tailGeo.attributes.position.needsUpdate = true; tailGeo.attributes.color.needsUpdate = true;
}
const _c2 = new THREE.Color();
let slow = 0, slowN = 0;

let recT = 0;
function frame(now) {
  if (!REC) requestAnimationFrame(frame);
  if (!lastT) lastT = now;
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  if (mode === 'paused') return;
  clock += dt;
  // keep it smooth on slower phones: lower the resolution, never the speed
  if (dt > 0.022) slow++; if (++slowN >= 60) { if (slow > 24 && pixelRatio > 0.75) { pixelRatio = Math.max(0.75, pixelRatio - (pixelRatio > 1 ? 0.5 : 0.25)); resize(); } slow = slowN = 0; }

  if (!R) demoRide();
  let stepped = 0;
  if ((mode === 'ride' || mode === 'title' || (mode === 'result' && R.demo)) && !R.dead) {
    acc += dt * S.FPS;
    while (acc >= 1 && stepped < 8) {
      if (R.demo || autopilot) pilot(R);
      prevS = R.s; R.step(); stepped++; acc -= 1;
      onEvents(R.events);
      if (R.dead || R.f === 0) break;
    }
    if (stepped === 8) acc = 0;
  }
  if (mode === 'crash') { crashT += dt; drift *= Math.pow(0.02, dt); prevS += drift * dt * S.U; if (crashT > 0.95) showResult(); }
  const live = !R.dead && mode !== 'crash' && mode !== 'result';
  const sVis = live ? prevS + (R.s - prevS) * clamp(acc, 0, 1) : (R.dead ? prevS : R.s);
  const sm = sVis / S.U, v = S.speedAt(R.s), sp = (v - S.V0) / (S.VMAX - S.V0);
  if (mode === 'ride') { hud(); AU.bpm = 108 + sp * 44; }
  musicTick();

  // the cart
  const tx = R.lane * LW; const k = 1 - Math.exp(-dt * 24); const dx = (tx - xVis) * k; xVis += dx;
  rollVis = lerp(rollVis, clamp(-dx / Math.max(dt, 0.001) * 0.022, -0.5, 0.5), 1 - Math.exp(-dt * 14));
  let y = 0; if (R.jumpT > 0) { const jt = clamp((S.JUMP_F - R.jumpT + (live ? acc : 0)) / S.JUMP_F, 0, 1); y = 4 * 1.75 * jt * (1 - jt); }
  squash = lerp(squash, R.sliding() ? 0.5 : 1, 1 - Math.exp(-dt * 26));
  cart.position.set(xVis, y, 0); cartBody.rotation.z = rollVis; cartBody.rotation.x = y > 0.05 ? -0.12 : 0; cartBody.scale.set(1 + (1 - squash) * 0.25, squash, 1);
  const arm = y > 0.1 ? 2.6 : 0.5 + Math.sin(clock * 9) * 0.06; armL.rotation.x = armR.rotation.x = lerp(armL.rotation.x, arm, 0.3); armL.rotation.z = 0.25; armR.rotation.z = -0.25;
  head.rotation.y = rollVis * -0.8;
  under.material.opacity = 0.35 + 0.15 * Math.sin(clock * 12);
  // the world
  const bx = 0.0010 * Math.sin(sm / 170) + 0.0006 * Math.sin(sm / 61 + 1.3), by = -0.0005 + 0.0008 * Math.sin(sm / 113 + 0.5) + 0.0004 * Math.sin(sm / 37);
  uBend.value.set(bx, by);
  railMat.color.lerp(railTarget, 1 - Math.exp(-dt * 6));
  if (R.mult() >= S.MULT_MAX && mode === 'ride') { railHue += dt * 0.5; railMat.color.setHSL(railHue % 1, 1, 0.62); } else railHue += dt * 0.02;
  railGlowMat.color.copy(railMat.color); under.material.color.copy(railMat.color);
  drawRows(R, sVis, clock); drawScenery(sm, clock, sp); drawTail(sm, y);
  tail.visible = cart.visible;
  const dz = (mode === 'crash' ? drift : live ? v / S.U * S.FPS : 0) * dt;
  sparks.update(dt, dz); fire.update(dt, dz);
  if (live && Math.random() < dt * 30) sparks.emit(xVis + rnd(-0.5, 0.5), 0.15 + y, 0.9, rnd(-0.6, 0.6), rnd(0.5, 2), rnd(2, 5), rnd(0.25, 0.5), railMat.color.getHex(), 2);
  if (mode === 'title' && Math.random() < dt * 0.7) firework([0xff3d9a, 0x2de2e6, 0xffd23f, 0x8f7bff][Math.floor(Math.random() * 4)]);
  // camera
  const port = camera.aspect < 1;
  shake *= Math.pow(0.004, dt); punch *= Math.pow(0.02, dt);
  const fov = (port ? 72 : 58) + sp * 9 + punch * 6;
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  if (mode === 'title') {
    const a = clock * 0.25; camera.position.set(xVis * 0.5 + Math.sin(a) * 2.6, 3.9 + Math.sin(a * 0.7) * 0.6, port ? 9.4 : 7.6); camera.lookAt(xVis * 0.6, port ? 3.4 : 1.6, -9);
  } else if (mode === 'result') {
    const a = clock * 0.2; camera.position.set(xVis * 0.6 + Math.sin(a) * 1.6, 4.4, port ? 9 : 7.2); camera.lookAt(xVis * 0.6, port ? -1.5 : 1.5, -12);
  } else {
    camera.position.set(xVis * (port ? 0.7 : 0.6) + sx, (port ? 4.7 : 3.7) + y * 0.3 + sy, port ? 8.4 : 7.0); camera.lookAt(xVis * (port ? 0.78 : 0.7), 0.9 + y * 0.26, -13);
  }
  sky.position.copy(camera.position); sky.position.y = 0; sky.rotation.y = -bx * 260; sky.userData.spin.rotation.z = clock * 0.12;
  renderer.render(scene, camera);
}

// ---------- start ----------
const ready = () => { demoRide(); if (REC) { autopilot = true; frame(0); } else requestAnimationFrame(frame); };
if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready, ready); else ready();
window.__comet = { S, get ride() { return R; }, get mode() { return mode; }, start: startRide, pilot(on) { autopilot = !!on; }, act, cfg: CFG, tick(ms) { if (REC) { recT += ms || 1000 / 30; frame(recT); } return recT; } };
