// THE LAST ARK - main module: scene, camera, pairs, UI.
import * as THREE from './vendor/three.module.min.js';
import { CONFIG } from './config.js';
import { figureGeometry, figureGeometryCoarse } from './voxel.js';
import { computeLayout, buildHull, buildCabins, slotPos, cabinPos, VS, WATERLINE, FIG_SCALE } from './ship.js';

const $ = (id) => document.getElementById(id);
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const qs = new URLSearchParams(location.search);
const STATE_URL = (LOCAL && qs.get('state')) || './state.json';
const FIGS_URL = (LOCAL && qs.get('figs')) || './figs.json';
const SEED = 7;

// ---------- built-in crate figure (used while a figure is being sculpted) ----------
const CRATE = (() => {
  const v = []; const n = 8;
  const glyph = ['111', '001', '011', '000', '010'];
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    const ext = (x === 0 || x === n - 1) + (y === 0 || y === n - 1) + (z === 0 || z === n - 1);
    let c = ext >= 2 ? 1 : ((y % 2) ? 0 : 2);
    if (z === n - 1 && ext < 2) {
      const gy = 6 - y, gx = x - 2;
      if (gy >= 0 && gy < 5 && gx >= 0 && gx < 3 && glyph[gy][gx] === '1') c = 3;
    }
    v.push([x, y, z, c]);
  }
  return { size: [n, n, n], palette: ['#c28a4d', '#7a4a22', '#b07a40', '#ffd23f'], voxels: v };
})();

// ---------- state ----------
let state = { pairs: [], cabins: [], totals: {}, day: 1, launch: CONFIG.LAUNCH };
let figs = {};
let pairs = [];
let layout = null;

async function getJSON(url, bust) {
  const u = bust ? url + (url.includes('?') ? '&' : '?') + 't=' + Date.now() : url;
  const r = await fetch(u, { cache: 'no-cache' });
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return r.json();
}

// ---------- renderer / scene ----------
const canvas = $('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { $('nogl').hidden = false; console.warn('WebGL unavailable', e); }

const scene = new THREE.Scene();
const HORIZON = new THREE.Color('#f3dfc3');
scene.fog = new THREE.Fog(HORIZON, 220, 1500);
const camera = new THREE.PerspectiveCamera(42, 1, 0.15, 4000);
const MAXPR = Math.min(window.devicePixelRatio || 1, 2);
let pr = MAXPR;

const hemi = new THREE.HemisphereLight(0xdcecff, 0xd8b684, 1.25);
const sun = new THREE.DirectionalLight(0xffe0ae, 2.1);
sun.position.set(-70, 100, 80);
scene.add(hemi, sun);

// sky
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  uniforms: { cTop: { value: new THREE.Color('#5aa7de') }, cMid: { value: new THREE.Color('#b9dff0') }, cHor: { value: HORIZON }, uSun: { value: new THREE.Vector3(0.35, 0.16, -0.92).normalize() } },
  vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.); }',
  fragmentShader: `uniform vec3 cTop,cMid,cHor,uSun; varying vec3 vD;
  void main(){ vec3 d = normalize(vD); float h = max(d.y,0.);
    vec3 c = mix(cHor, cMid, smoothstep(0.0,0.12,h)); c = mix(c, cTop, smoothstep(0.1,0.7,h));
    float s = max(dot(d,normalize(uSun)),0.); c += vec3(1.,.82,.5)*(pow(s,12.)*0.45 + pow(s,400.)*1.2);
    gl_FragColor = vec4(c,1.);
    #include <colorspace_fragment>
  }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 24, 12), skyMat);
sky.renderOrder = -10; sky.frustumCulled = false;
scene.add(sky);

// sea
const WAVE_GLSL = `float wave(vec2 p,float t){ return 0.30*sin(p.x*0.23+t*0.9)+0.22*sin(p.y*0.19-t*0.7+p.x*0.06)+0.12*sin((p.x+p.y)*0.55+t*1.4)+0.05*sin(p.x*1.1-p.y*0.9+t*2.1); }`;
function waveJS(x, z, t) {
  return 0.30 * Math.sin(x * 0.23 + t * 0.9) + 0.22 * Math.sin(z * 0.19 - t * 0.7 + x * 0.06) + 0.12 * Math.sin((x + z) * 0.55 + t * 1.4) + 0.05 * Math.sin(x * 1.1 - z * 0.9 + t * 2.1);
}
const seaU = {
  uTime: { value: 0 }, uCenter: { value: new THREE.Vector2() }, uCam: { value: new THREE.Vector3() }, uFog: { value: HORIZON },
  uDeep: { value: new THREE.Color('#15628a') }, uShal: { value: new THREE.Color('#3ba3bf') },
};
const seaMat = new THREE.ShaderMaterial({
  uniforms: seaU,
  vertexShader: `uniform float uTime; uniform vec2 uCenter; varying vec3 vW; ${WAVE_GLSL}
    void main(){ vec4 w = modelMatrix*vec4(position,1.); float d = length(w.xz-uCenter); float a = 1.-smoothstep(105.,165.,d);
      w.y += wave(w.xz,uTime)*a; vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uCam,uFog,uDeep,uShal; uniform float uTime; varying vec3 vW;
    void main(){ vec3 n = normalize(cross(dFdx(vW),dFdy(vW))); if(n.y<0.) n=-n;
      vec3 L = normalize(vec3(-0.45,0.65,0.55));
      float dif = 0.62 + 0.5*max(dot(n,L),0.);
      float h = clamp(vW.y*1.1+0.5,0.,1.);
      vec3 col = mix(uDeep,uShal,h*0.85+0.08)*dif;
      vec3 V = normalize(uCam-vW);
      float fr = pow(1.-max(dot(n,V),0.),3.);
      col = mix(col, vec3(0.78,0.9,0.95), fr*0.5);
      vec2 cell = floor(vW.xz*0.8); float hs = fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);
      col += step(0.97,hs)*(0.5+0.5*sin(uTime*2.+hs*60.))*0.14*vec3(1.,.95,.8);
      float f = smoothstep(100.,1200.,length(vW-uCam)); col = mix(col,uFog,f);
      gl_FragColor = vec4(col,1.);
      #include <colorspace_fragment>
    }`,
});
const seaInner = new THREE.Mesh(new THREE.PlaneGeometry(380, 380, 158, 158).rotateX(-Math.PI / 2), seaMat);
const seaOuter = new THREE.Mesh(new THREE.RingGeometry(160, 6000, 64, 6).rotateX(-Math.PI / 2), seaMat);
seaInner.frustumCulled = false; seaOuter.frustumCulled = false;
scene.add(seaInner, seaOuter);

// clouds (white, drifting) + storm bank on the horizon + rain
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rng(SEED);
function cloudField(count, build) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const boxes = [];
  for (let i = 0; i < count; i++) build(boxes, i);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), boxes.length);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  boxes.forEach((b, i) => { m.compose(new THREE.Vector3(...b.p), new THREE.Quaternion(), new THREE.Vector3(...b.s)); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.set(b.c)); });
  mesh.frustumCulled = false;
  return mesh;
}
const whiteClouds = new THREE.Group();
whiteClouds.add(cloudField(26, (out) => {
  const a = R() * Math.PI * 2, r = 140 + R() * 380, y = 75 + R() * 50, cx = Math.cos(a) * r, cz = Math.sin(a) * r;
  const w = 14 + R() * 22, d = 8 + R() * 10;
  for (let k = 0; k < 6; k++) {
    const sw = w * (0.35 + R() * 0.4);
    out.push({ p: [cx + (R() - 0.5) * w * 1.3, y + (R() - 0.3) * 3, cz + (R() - 0.5) * d], s: [sw, 3 + R() * 3, d * (0.6 + R() * 0.5)], c: R() > 0.3 ? '#ffffff' : '#f6ece0' });
  }
}));
scene.add(whiteClouds);
const storm = new THREE.Group();
const stormCols = ['#38404f', '#444c5b', '#505968', '#2e3441', '#5d6675'];
storm.add(cloudField(70, (out, i) => {
  const a = Math.PI + (i / 70 - 0.5) * 3.2 + (R() - 0.5) * 0.06, r = 440 + R() * 130;
  const cx = Math.sin(a) * r, cz = Math.cos(a) * r, y = 6 + R() * 8;
  const w = 22 + R() * 30;
  out.push({ p: [cx, y, cz], s: [w * 1.5, 7 + R() * 5, 28 + R() * 20], c: '#2b313e' });
  for (let k = 0; k < 7; k++) {
    const hh = 8 + R() * 20;
    out.push({ p: [cx + (R() - 0.5) * w * 1.4, y + 4 + hh / 2 + R() * 3, cz + (R() - 0.5) * 22], s: [6 + R() * 16, hh, 10 + R() * 16], c: stormCols[Math.floor(R() * stormCols.length)] });
  }
}));
scene.add(storm);
const rainGeo = (() => {
  const pts = [];
  for (let i = 0; i < 220; i++) {
    const a = Math.PI + (R() - 0.5) * 2.3, r = 420 + R() * 170, x = Math.sin(a) * r + (R() - 0.5) * 40, z = Math.cos(a) * r;
    for (let k = 0; k < 6; k++) { const y = k * 14; if (y > 40) continue; pts.push(x, y + 2, z, x - 1.2, y + 9, z); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
})();
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xdfe8f0, transparent: true, opacity: 0.35 }));
rain.frustumCulled = false;
scene.add(rain);

// ---------- ark ----------
const ark = new THREE.Group();
scene.add(ark);
const figMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const hullMat = new THREE.MeshLambertMaterial({ vertexColors: true });
let hullMesh = null, cabinMesh = null, cabinRanges = [], groups = [], pairInfo = [];
const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.3).scale(1, 1.4, 1), new THREE.MeshBasicMaterial({ color: 0xffc233 }));
marker.visible = false; ark.add(marker);
let selected = null; // {type:'pair'|'cabin', idx}

function disposeArk() {
  for (const o of [hullMesh, cabinMesh]) if (o) { ark.remove(o); o.geometry.dispose(); }
  for (const g of groups) { for (const m of [g.hi, g.lo, g.lo2]) { ark.remove(m); m.geometry.dispose(); m.dispose(); } }
  hullMesh = cabinMesh = null; groups = []; pairInfo = [];
}

function rebuildArk() {
  disposeArk();
  layout = computeLayout(pairs.length, state.cabins.length);
  hullMesh = new THREE.Mesh(buildHull(layout), hullMat);
  hullMesh.frustumCulled = false;
  ark.add(hullMesh);
  const cb = buildCabins(layout, state.cabins);
  cabinRanges = cb.ranges;
  if (cb.geometry) { cabinMesh = new THREE.Mesh(cb.geometry, hullMat); cabinMesh.frustumCulled = false; ark.add(cabinMesh); }
  const byFig = new Map();
  pairs.forEach((p, i) => {
    const id = (p.status === 'sculpting' || !figs[p.fig]) ? 'crate' : p.fig;
    if (!byFig.has(id)) byFig.set(id, []);
    byFig.get(id).push(i);
  });
  const m4 = new THREE.Matrix4();
  for (const [id, list] of byFig) {
    const fig = id === 'crate' ? (figs.crate || CRATE) : figs[id];
    const hi = new THREE.InstancedMesh(figureGeometry(fig, FIG_SCALE, false), figMat, list.length * 2);
    const lo = new THREE.InstancedMesh(figureGeometry(fig, FIG_SCALE, true), figMat, list.length * 2);
    list.forEach((pi, j) => {
      const sp = slotPos(layout, pi);
      for (let s = 0; s < 2; s++) {
        m4.makeTranslation(sp.x + (s ? 0.72 : -0.72), sp.y, sp.z);
        hi.setMatrixAt(j * 2 + s, m4); lo.setMatrixAt(j * 2 + s, m4);
      }
    });
    const lo2 = new THREE.InstancedMesh(figureGeometryCoarse(fig, FIG_SCALE), figMat, list.length * 2);
    list.forEach((pi, j) => { const sp = slotPos(layout, pi); for (let s = 0; s < 2; s++) { m4.makeTranslation(sp.x + (s ? 0.72 : -0.72), sp.y, sp.z); lo2.setMatrixAt(j * 2 + s, m4); } });
    for (const m of [hi, lo, lo2]) { m.frustumCulled = false; m.instanceMatrix.needsUpdate = true; ark.add(m); }
    lo.visible = false; lo2.visible = false;
    groups.push({ id, list, hi, lo, lo2, hiTris: hi.geometry.index.count / 3, loTris: lo.geometry.index.count / 3, lo2Tris: lo2.geometry.index.count / 3 });
  }
  pairInfo = pairs.map((p, i) => slotPos(layout, i));
}

function pairWorld(i, y = 0.6) { const p = pairInfo[i].clone(); p.y += y; return ark.localToWorld(p); }
function cabinWorld(i, y = 1.2) { const p = cabinPos(layout, i); p.y += y; return ark.localToWorld(p); }

// ---------- camera controls ----------
const cam = { theta: 0.62, phi: 0.5, dist: 90, tgt: new THREE.Vector3(0, 3, 0), follow: null };
const goal = { theta: cam.theta, phi: cam.phi, dist: cam.dist, tgt: cam.tgt.clone() };
let flying = 0, lastInteract = performance.now(), viewShift = innerWidth < 900 ? -0.06 : -0.05, viewShiftGoal = innerWidth < 900 ? -0.06 : -0.05;
let autoOk = true;
const BASE_SHIFT = innerWidth < 900 ? -0.06 : -0.05;
function limits() { return { min: 5, max: Math.max(160, (layout ? layout.L : 60) * 1.4 + 80) }; }

function initialView() {
  const L = layout.L, aspect = innerWidth / innerHeight;
  const hf = Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) * aspect);
  const need = Math.min(L, 90) * 0.5 / Math.tan(hf);
  goal.dist = THREE.MathUtils.clamp(need * (aspect < 0.8 ? 1.0 : 1.45), 28, 300);
  goal.phi = aspect < 0.8 ? 0.27 : 0.24;
  goal.theta = aspect < 0.8 ? 0.8 : 0.5;
  const count = Math.min(pairs.length, layout.perLevel);
  const cmid = layout.x0 + (Math.max(0, Math.ceil(count / layout.rows) - 1) / 2) * 3.2;
  goal.tgt.set(layout.L > 140 ? cmid : 0, 2, 0);
  Object.assign(cam, { theta: goal.theta, phi: goal.phi, dist: goal.dist * 1.4 });
  cam.tgt.copy(goal.tgt);
}

function flyTo(worldPos, dist, local) {
  goal.tgt.copy(worldPos); goal.dist = dist; goal.phi = 0.62;
  const t = ((cam.theta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  goal.theta = cam.theta - t + THREE.MathUtils.clamp(t, -0.8, 0.8);
  cam.follow = local ? local.clone() : null;
  flying = 1;
}

const pointers = new Map();
let down = null, lastPinch = 0, lastMid = null;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, btn: e.button, shift: e.shiftKey };
  else { down = null; lastPinch = 0; lastMid = null; }
  lastInteract = performance.now(); flying = 0;
});
canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  lastInteract = performance.now();
  if (pointers.size === 1) {
    if (down) down.moved += Math.abs(dx) + Math.abs(dy);
    if (down && (down.btn === 2 || down.shift)) pan(dx, dy);
    else { goal.theta -= dx * 0.0062; goal.phi = THREE.MathUtils.clamp(goal.phi + dy * 0.0048, 0.07, 1.4); flying = 0; }
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (lastPinch) { const l = limits(); goal.dist = THREE.MathUtils.clamp(goal.dist * (lastPinch / d), l.min, l.max); }
    if (lastMid) pan(mid.x - lastMid.x, mid.y - lastMid.y);
    lastPinch = d; lastMid = mid; flying = 0;
  }
});
function pan(dx, dy) {
  cam.follow = null;
  const s = goal.dist * 0.0016;
  const right = new THREE.Vector3(Math.cos(cam.theta), 0, -Math.sin(cam.theta));
  const fwd = new THREE.Vector3(-Math.sin(cam.theta), 0, -Math.cos(cam.theta));
  goal.tgt.addScaledVector(right, -dx * s).addScaledVector(fwd, dy * s);
  const half = layout ? layout.L / 2 + 20 : 60;
  goal.tgt.x = THREE.MathUtils.clamp(goal.tgt.x, -half, half); goal.tgt.z = THREE.MathUtils.clamp(goal.tgt.z, -40, 40);
}
const endPtr = (e) => {
  const had = pointers.delete(e.pointerId);
  if (!had) return;
  lastPinch = 0; lastMid = null;
  if (down && e.type === 'pointerup' && down.moved < 9 && performance.now() - down.t < 600) tap(e.clientX, e.clientY);
  if (pointers.size === 0) down = null;
};
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); const l = limits();
  goal.dist = THREE.MathUtils.clamp(goal.dist * Math.exp(e.deltaY * 0.0011), l.min, l.max);
  lastInteract = performance.now(); flying = 0;
}, { passive: false });

// ---------- picking ----------
const ray = new THREE.Raycaster();
function tap(cx, cy) {
  if (!layout) return;
  const ndc = new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const targets = groups.map((g) => g.lo).concat(cabinMesh ? [cabinMesh] : []);
  const hits = ray.intersectObjects(targets, false);
  if (!hits.length) { if (selected) closeCard(); return; }
  const h = hits[0];
  if (h.object === cabinMesh) {
    const fi = h.faceIndex; let lo = 0, hi = cabinRanges.length - 1, k = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; const r = cabinRanges[mid]; if (fi < r.start) hi = mid - 1; else if (fi >= r.end) lo = mid + 1; else { k = mid; break; } }
    if (k >= 0) selectCabin(k, true);
    return;
  }
  const g = groups.find((gr) => gr.lo === h.object);
  if (g) selectPair(g.list[h.instanceId >> 1], true);
}

// ---------- UI ----------
const fmt = (n) => n.toLocaleString('en-US');
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const isLira = (by) => by.length === 1 && by[0].toLowerCase().startsWith('lira');
function byText(p) {
  if (isLira(p.by)) return 'brought by Lira, an AI';
  const hs = p.by.map((h) => '@' + h.replace(/^@/, ''));
  return 'brought by ' + (hs.length > 1 ? hs.slice(0, -1).join(', ') + ' & ' + hs[hs.length - 1] : hs[0]);
}
function dateText(t) { try { return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } }

let hintGone = false;
function renderStats() {
  const np = pairs.length;
  const pass = state.totals?.passengers ?? new Set(pairs.flatMap((p) => p.by)).size;
  const day = Math.min(CONFIG.TOTAL_DAYS, Math.max(1, state.day || 1));
  $('stats').textContent = `Day ${day}/${CONFIG.TOTAL_DAYS} · ${fmt(np)} ${np === 1 ? 'pair' : 'pairs'} aboard · ${fmt(pass)} ${pass === 1 ? 'passenger' : 'passengers'}`;
  $('empty').hidden = np > 0;
  $('hint').hidden = np === 0 || !!selected || hintGone;
}
function renderCount() {
  const ms = new Date(state.launch || CONFIG.LAUNCH).getTime() - Date.now();
  const el = $('count');
  if (ms <= 0) { el.textContent = 'The Ark has sailed.'; return; }
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  const p2 = (n) => String(n).padStart(2, '0');
  el.innerHTML = `The Ark sails in <b>${d}d ${p2(h)}:${p2(m)}:${p2(sec)}</b>`;
}

// isometric canvas render of a figure pair (for the card)
function drawPair(cv, fig) {
  const ctx = cv.getContext('2d'); const W = cv.width, Hh = cv.height;
  ctx.clearRect(0, 0, W, Hh);
  const [sx] = fig.size; const gap = 2;
  const map = new Set(); const vox = [];
  for (let c = 0; c < 2; c++) for (const [x, y, z, ci] of fig.voxels) { const X = x + c * (sx + gap); map.add(X + ',' + y + ',' + z); vox.push([X, y, z, ci]); }
  const C = 0.8660254;
  const P = (x, y, z) => [(x - z) * C, (x + z) * 0.5 - y];
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  for (const [x, y, z] of vox) for (const dx of [0, 1]) for (const dy of [0, 1]) for (const dz of [0, 1]) {
    const [px, py] = P(x + dx, y + dy, z + dz); minx = Math.min(minx, px); maxx = Math.max(maxx, px); miny = Math.min(miny, py); maxy = Math.max(maxy, py);
  }
  const sc = Math.min(W * 0.92 / (maxx - minx), Hh * 0.88 / (maxy - miny));
  const ox = W / 2 - (minx + maxx) / 2 * sc, oy = Hh / 2 - (miny + maxy) / 2 * sc;
  const pal = fig.palette.map((h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; });
  vox.sort((a, b) => (a[0] + a[2]) - (b[0] + b[2]) || a[1] - b[1]);
  const poly = (pts, col) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x * sc + ox, y * sc + oy) : ctx.moveTo(x * sc + ox, y * sc + oy)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 0.6; ctx.stroke(); };
  const sh = (c, k) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
  ctx.fillStyle = 'rgba(77,47,22,.16)'; ctx.beginPath();
  ctx.ellipse(W / 2, oy + (maxy - 0.3) * sc, (maxx - minx) * sc * 0.42, (maxy - miny) * sc * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  for (const [x, y, z, ci] of vox) {
    const c = pal[ci] || [200, 200, 200];
    if (!map.has(x + ',' + (y + 1) + ',' + z)) poly([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], sh(c, 1.12));
    if (!map.has(x + ',' + y + ',' + (z + 1))) poly([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], sh(c, 0.86));
    if (!map.has((x + 1) + ',' + y + ',' + z)) poly([P(x + 1, y, z), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z)], sh(c, 0.68));
  }
}

function setCardOpen(on) {
  $('card').hidden = !on;
  document.body.classList.toggle('carding', on);
  viewShiftGoal = on && innerWidth < 900 ? 0.18 : BASE_SHIFT;
  autoOk = !on;
  if (on) { hintGone = true; $('hint').hidden = true; }
}
function selectPair(i, user) {
  const p = pairs[i]; if (!p) return;
  selected = { type: 'pair', idx: i };
  const crate = p.status === 'sculpting' || !figs[p.fig];
  const fig = crate ? (figs.crate || CRATE) : figs[p.fig];
  $('card-cv').style.display = '';
  drawPair($('card-cv'), fig);
  $('card-n').textContent = `PAIR #${p.n}` + (crate ? ' · being sculpted' : '');
  $('card-what').textContent = cap(p.what || p.fig);
  $('card-by').textContent = byText(p);
  $('card-date').textContent = dateText(p.t);
  $('card-open').hidden = false; $('card-share').hidden = false;
  $('card-open').href = `p/${p.n}/`;
  setCardOpen(true);
  marker.visible = true;
  const local = pairInfo[i].clone(); local.y += 0.5;
  flyTo(pairWorld(i, 0.5), innerWidth < 600 ? 21 : 15, local);
  if (user) history.replaceState(null, '', `?p=${p.n}`);
}
function selectCabin(k) {
  const c = state.cabins[k]; if (!c) return;
  selected = { type: 'cabin', idx: k };
  const cv = $('card-cv'); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none';
  $('card-n').textContent = `CABIN #${c.n}`;
  $('card-what').textContent = c.name;
  $('card-by').textContent = 'A cabin on the top deck, kept for its owner.';
  $('card-date').textContent = dateText(c.t);
  $('card-open').hidden = true; $('card-share').hidden = true;
  setCardOpen(true);
  marker.visible = true;
  const local = cabinPos(layout, k); local.y += 1.2;
  flyTo(cabinWorld(k, 1.0), innerWidth < 600 ? 24 : 17, local);
}
function closeCard() {
  selected = null; marker.visible = false; setCardOpen(false); cam.follow = null;
  if (qs.get('p') || location.search) history.replaceState(null, '', location.pathname);
}
$('card-x').onclick = closeCard;
$('card-share').onclick = async () => {
  if (!selected || selected.type !== 'pair') return;
  const p = pairs[selected.idx];
  const url = `${CONFIG.SITE_URL}p/${p.n}/`;
  const text = `${cap(p.what)} are aboard THE LAST ARK (pair #${p.n}). What would you save?`;
  try { if (navigator.share) { await navigator.share({ title: 'THE LAST ARK', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); $('card-share').textContent = 'Link copied'; setTimeout(() => ($('card-share').textContent = 'Share'), 1800); }
  catch { prompt('Copy this link', url); }
};

// board sheet
$('w-ig').href = CONFIG.INSTAGRAM_URL;
$('w-tg').href = CONFIG.BOT_URL;
if (CONFIG.NOSTR_URL) { $('w-no').href = CONFIG.NOSTR_URL; $('w-no').hidden = false; }
$('w-acc').href = CONFIG.ACCOUNTS_URL;
const openBoard = () => { $('backdrop').hidden = false; $('boardsheet').hidden = false; autoOk = false; hintGone = true; $('hint').hidden = true; };
const closeBoard = () => { $('backdrop').hidden = true; $('boardsheet').hidden = true; autoOk = !selected; };
$('board').onclick = openBoard; $('board-x').onclick = closeBoard; $('backdrop').onclick = closeBoard;
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeBoard(); if (selected) closeCard(); } });
$('copy').onclick = async () => { try { await navigator.clipboard.writeText('two pizzas @friend'); $('copy').textContent = 'copied'; setTimeout(() => ($('copy').textContent = 'copy'), 1500); } catch {} };

// labels near the camera
const tagPool = [];
for (let i = 0; i < 8; i++) { const d = document.createElement('div'); d.className = 'tag'; d.hidden = true; $('tags').appendChild(d); tagPool.push({ el: d, world: null }); }
let tagTimer = 0;
function updateTagSet() {
  if (!layout) return;
  const cands = [];
  const near = cam.dist < 12;
  if (selected) {
    const w = selected.type === 'pair' ? pairWorld(selected.idx, 1.7) : cabinWorld(selected.idx, 2.4);
    cands.push({ w, text: selected.type === 'pair' ? cap(pairs[selected.idx].what) : state.cabins[selected.idx].name, sel: true, cab: selected.type === 'cabin' });
  }
  if (near) {
    const tmp = new THREE.Vector3(); const scored = [];
    for (let i = 0; i < pairs.length; i++) {
      if (selected && selected.type === 'pair' && selected.idx === i) continue;
      tmp.copy(pairInfo[i]); ark.localToWorld(tmp);
      const d = tmp.distanceToSquared(cam.tgt);
      if (d < 380) scored.push([d, i]);
    }
    scored.sort((a, b) => a[0] - b[0]);
    for (const [, i] of scored.slice(0, 4)) cands.push({ w: pairWorld(i, 1.7), text: cap(pairs[i].what) });
    for (let k = 0; k < state.cabins.length && cands.length < 8; k++) {
      const w = cabinWorld(k, 2.4); if (w.distanceToSquared(cam.tgt) < 300) cands.push({ w, text: state.cabins[k].name, cab: true });
    }
  }
  tagPool.forEach((t, i) => {
    const c = cands[i];
    if (!c) { t.el.hidden = true; t.world = null; return; }
    t.world = c; t.el.textContent = c.text; t.el.className = 'tag' + (c.sel ? ' sel' : '') + (c.cab ? ' cab' : ''); t.el.hidden = false;
  });
}
const _v = new THREE.Vector3();
function placeTags() {
  for (const t of tagPool) {
    if (!t.world) continue;
    _v.copy(t.world.w).project(camera);
    if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) { t.el.style.opacity = 0; continue; }
    t.el.style.opacity = 1;
    t.el.style.transform = `translate(${((_v.x + 1) / 2 * innerWidth).toFixed(1)}px,${((1 - _v.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
  }
}

// ---------- main loop ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  if (renderer) { renderer.setPixelRatio(pr); renderer.setSize(w, h, false); }
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

const clock = new THREE.Clock();
let acc = 0, frames = 0, tNow = 0;
function frame() {
  let dt = Math.min(clock.getDelta(), 0.1); tNow += dt;
  { const RL = window.__reel; // deterministic capture hook (reel generator): window.__reel = {t, theta, phi, dist, tgt:[x,y,z]}
    if (RL) { dt = 0.0001; tNow = RL.t; flying = 0; cam.follow = null; lastInteract = performance.now();
      cam.theta = goal.theta = RL.theta; cam.phi = goal.phi = RL.phi; cam.dist = goal.dist = RL.dist;
      cam.tgt.set(RL.tgt[0], RL.tgt[1], RL.tgt[2]); goal.tgt.copy(cam.tgt); viewShift = viewShiftGoal = 0; } }
  acc += dt; frames++;
  if (frames === 90) { const avg = acc / frames; if (avg > 0.036 && pr > 1) { pr = Math.max(1, pr - 0.34); resize(); } acc = 0; frames = 0; }
  if (autoOk && performance.now() - lastInteract > 4500 && !flying) goal.theta += dt * 0.07;
  if (cam.follow) { const w = ark.localToWorld(cam.follow.clone()); goal.tgt.lerp(w, 1 - Math.exp(-dt * 6)); if (!flying) cam.tgt.copy(goal.tgt); }
  const k = 1 - Math.exp(-dt * (flying ? 3.2 : 8));
  cam.theta += (goal.theta - cam.theta) * k; cam.phi += (goal.phi - cam.phi) * k;
  cam.dist += (goal.dist - cam.dist) * k; cam.tgt.lerp(goal.tgt, k);
  if (flying && Math.abs(goal.dist - cam.dist) < 0.15 && cam.tgt.distanceTo(goal.tgt) < 0.15) flying = 0;
  const cp = Math.cos(cam.phi);
  camera.position.set(cam.tgt.x + cam.dist * cp * Math.sin(cam.theta), Math.max(1.2, cam.tgt.y + cam.dist * Math.sin(cam.phi)), cam.tgt.z + cam.dist * cp * Math.cos(cam.theta));
  camera.lookAt(cam.tgt);
  viewShift += (viewShiftGoal - viewShift) * (1 - Math.exp(-dt * 7));
  { const vs = viewShift; if (Math.abs(vs) > 0.002) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * vs, innerWidth, innerHeight); else if (camera.view) camera.clearViewOffset(); }
  camera.updateProjectionMatrix();

  seaU.uTime.value = tNow;
  const cx = Math.round(cam.tgt.x / 2.4) * 2.4, cz = Math.round(cam.tgt.z / 2.4) * 2.4;
  seaInner.position.set(cx, 0, cz); seaOuter.position.set(cx, 0, cz);
  seaU.uCenter.value.set(cx, cz); seaU.uCam.value.copy(camera.position);
  if (layout) {
    const hl = layout.L / 2, hw = layout.W / 2;
    const h0 = waveJS(0, 0, tNow), hb = waveJS(hl * 0.8, 0, tNow), hs = waveJS(-hl * 0.8, 0, tNow), hp = waveJS(0, hw, tNow), hst = waveJS(0, -hw, tNow);
    ark.position.y = -WATERLINE * VS + 0.45 + h0 * 0.9;
    ark.rotation.z = Math.atan2(hb - hs, hl * 1.6) * 0.9;
    ark.rotation.x = -Math.atan2(hp - hst, hw * 2) * 0.9;
    ark.rotation.y = Math.sin(tNow * 0.13) * 0.012;
    const lod = cam.dist > 100 ? 2 : cam.dist > 42 ? 1 : 0;
    let tris = hullMesh ? hullMesh.geometry.index.count / 3 : 0;
    for (const g of groups) { g.hi.visible = lod === 0; g.lo.visible = lod === 1; g.lo2.visible = lod === 2; tris += [g.hiTris, g.loTris, g.lo2Tris][lod] * g.list.length * 2; }
    window.__ark.tris = tris;
  }
  if (marker.visible && selected) {
    const loc = selected.type === 'pair' ? pairInfo[selected.idx] : cabinPos(layout, selected.idx);
    marker.position.set(loc.x, loc.y + (selected.type === 'pair' ? 2.2 : 3.2) + Math.sin(tNow * 4) * 0.12, loc.z);
    marker.rotation.y = tNow * 2;
  }
  whiteClouds.rotation.y = tNow * 0.0035;
  rain.position.y = -((tNow * 26) % 14);
  tagTimer -= dt; if (tagTimer <= 0) { updateTagSet(); tagTimer = 0.25; }
  placeTags();
  if (renderer) renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- boot ----------
window.__ark = { THREE, cam, goal, ark, tris: 0, get layout() { return layout; }, get pairs() { return pairs; }, selectPair, selectCabin, cabinWorld, closeCard, tap };

function applyData(st, fg, first) {
  state = Object.assign({ pairs: [], cabins: [], totals: {}, day: 1, launch: CONFIG.LAUNCH }, st);
  state.cabins = state.cabins || [];
  figs = fg || {};
  pairs = [...(state.pairs || [])].sort((a, b) => a.n - b.n);
  if (renderer) { rebuildArk(); if (first) initialView(); }
  renderStats();
  const pn = parseInt(qs.get('p'), 10);
  if (first && pn) { const i = pairs.findIndex((p) => p.n === pn); if (i >= 0) setTimeout(() => selectPair(i, false), 350); }
}

async function boot() {
  resize(); renderCount(); setInterval(renderCount, 1000);
  let st = { pairs: [] }, fg = {};
  try { st = await getJSON(STATE_URL, true); } catch (e) { console.warn('state.json:', e.message); }
  try { fg = await getJSON(FIGS_URL, true); } catch (e) { console.warn('figs.json:', e.message); }
  applyData(st, fg, true);
  if (qs.get('board')) openBoard();
  document.body.dataset.ready = '1';
  requestAnimationFrame(frame);
  setTimeout(() => { hintGone = true; $('hint').style.opacity = 0; }, 9000);
  setInterval(async () => {
    try {
      const s2 = await getJSON(STATE_URL, true);
      if (s2.updated !== state.updated || (s2.pairs || []).length !== pairs.length) {
        const f2 = await getJSON(FIGS_URL, true).catch(() => figs);
        const selN = selected && selected.type === 'pair' ? pairs[selected.idx]?.n : null;
        applyData(s2, f2, false);
        if (selN) { const i = pairs.findIndex((p) => p.n === selN); if (i >= 0) selected.idx = i; }
      }
    } catch {}
  }, 90000);
}
if (qs.get('reel')) { const st = document.createElement('style'); st.textContent = '#top,#bottom,#hint,#tags,#empty,.sheet,#backdrop{display:none!important}'; document.head.appendChild(st); }
boot();
