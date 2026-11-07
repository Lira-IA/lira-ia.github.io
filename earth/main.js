import * as THREE from './vendor/three.module.min.js';

const Q = new URLSearchParams(location.search);
const REEL = Q.get('reel') === '1';
const DET = Q.get('t') !== null && Q.get('t') !== '';
if (REEL) document.documentElement.classList.add('reel');
const $ = id => document.getElementById(id);
const D2R = Math.PI / 180, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const TOTAL_COUNTRIES = 195; // countries that can be claimed (UN members + observers)

// ---------- helpers ----------
function sph(lat, lon, r, v) {
  const la = lat * D2R, lo = lon * D2R, c = Math.cos(la);
  return v.set(r * c * Math.sin(lo), r * Math.sin(la), r * c * Math.cos(lo));
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const flag = cc => (cc && cc.length === 2) ? String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65) : '\u{1F3F3}';
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// ---------- renderer / scene ----------
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: DET || REEL });
let maxDpr = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(maxDpr);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
scene.add(camera);
scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x8088c8, 1.0));
const sun = new THREE.DirectionalLight(0xfff3dc, 2.6);
sun.position.set(-2.5, 3, 4);
camera.add(sun); camera.add(sun.target); sun.target.position.set(0, 0, -5);

const world = new THREE.Group(); scene.add(world);

// ocean: faceted low-poly sphere
{
  const g = new THREE.IcosahedronGeometry(1, 14);
  const n = g.attributes.position.count, col = new Float32Array(n * 3), r = rng(5);
  const a = new THREE.Color('#2f93ee'), b = new THREE.Color('#2380dc'), c = new THREE.Color();
  for (let i = 0; i < n; i += 3) {
    const px = g.attributes.position.getY(i);
    c.copy(a).lerp(b, r() * .9).multiplyScalar(0.92 + 0.12 * (1 - Math.abs(px)));
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  world.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  // polar ice caps
  const cap = (s) => {
    const cg = new THREE.SphereGeometry(1.006, 28, 3, 0, Math.PI * 2, s ? Math.PI - 0.27 : 0, 0.27).toNonIndexed();
    cg.computeVertexNormals();
    return new THREE.Mesh(cg, new THREE.MeshLambertMaterial({ color: 0xf2f9ff, flatShading: true }));
  };
  world.add(cap(true), cap(false));
}

// atmosphere glow
{
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 vN;varying vec3 vV;void main(){float f=clamp(1.0+dot(vN,vV)*1.0,0.,1.);f=pow(f,2.2);gl_FragColor=vec4(vec3(0.45,0.82,1.0)*f*1.25,f);}'
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 32), m));
}

// stars
{
  const r = rng(11), n = 700, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = r() * 2 - 1, t = r() * 6.283, s = Math.sqrt(1 - u * u); p.set([s * Math.cos(t) * 40, u * 40, s * Math.sin(t) * 40], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: .75, depthWrite: false })));
}

// clouds
const clouds = (() => {
  const r = rng(77), parts = [], v = new THREE.Vector3(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 22; i++) {
    const lat = Math.asin(r() * 1.7 - .85) / D2R, lon = r() * 360 - 180;
    const n = sph(lat, lon, 1, new THREE.Vector3()).normalize();
    q.setFromUnitVectors(up, n);
    const blobs = 3 + Math.floor(r() * 3);
    for (let b = 0; b < blobs; b++) {
      const s = .02 + r() * .02;
      const ico = new THREE.IcosahedronGeometry(1, 0);
      m.compose(new THREE.Vector3((b - blobs / 2) * .05 + r() * .01, 0, (r() - .5) * .03).applyQuaternion(q).add(n.clone().multiplyScalar(1.075 + r() * .01)), q, new THREE.Vector3(s * 1.3, s * .55, s));
      ico.applyMatrix4(m); ico.deleteAttribute('uv'); ico.deleteAttribute('normal'); parts.push(ico);
    }
  }
  const g = merge(parts, false); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: .93, emissive: 0x334466 }));
  scene.add(mesh); return mesh;
})();

function merge(list, withColor = true) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), C = withColor ? new Float32Array(n * 3) : null; let o = 0;
  for (const g of list) {
    P.set(g.attributes.position.array, o * 3); if (withColor) C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  if (withColor) out.setAttribute('color', new THREE.BufferAttribute(C, 3));
  return out;
}

// ---------- toy house geometries ----------
function part(geo, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz)));
  const n = g.attributes.position.count, c = new THREE.Color(color), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
function prism(w, h, l) {
  const a = [-w / 2, 0, l / 2], b = [w / 2, 0, l / 2], c = [0, h, l / 2], d = [-w / 2, 0, -l / 2], e = [w / 2, 0, -l / 2], f = [0, h, -l / 2];
  const t = [a, b, c, e, d, f, a, c, f, a, f, d, b, e, f, b, f, c].flat();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(t), 3)); return g;
}
const BOX = new THREE.BoxGeometry(1, 1, 1);
function finish(list) { const g = merge(list); g.computeVertexNormals(); return g; }
function houseParts(flagPole) {
  const L = [part(BOX, '#fff6e4', 0, .35, 0, 1, .7, .8), part(prism(1.4, .55, 1.05), '#e5392b', 0, .7, 0), part(BOX, '#7a4a2a', 0, .17, .405, .2, .34, .02),
    part(BOX, '#7fc8ff', .3, .42, .405, .2, .18, .02), part(BOX, '#7fc8ff', -.3, .42, .405, .2, .18, .02)];
  if (flagPole) {
    L.push(part(new THREE.CylinderGeometry(.035, .035, 1.1, 5), '#f2f2f2', -.45, 1.2, 0));
    L.push(part(BOX, '#1f6bff', -.2, 1.58, 0, .5, .17, .03), part(BOX, '#ffffff', -.2, 1.42, 0, .5, .17, .03), part(BOX, '#ff3b3b', -.2, 1.26, 0, .5, .17, .03));
  }
  return L;
}
function palaceParts(crown) {
  const G = '#ffc928', G2 = '#ffe36a', R = '#d9352b';
  const L = [part(BOX, G, 0, .45, 0, 1.7, .9, 1.0), part(BOX, G2, 0, 1.05, 0, .7, 1.2, .7), part(new THREE.SphereGeometry(.42, 8, 5), G2, 0, 1.75, 0, 1, 1.05, 1),
    part(BOX, '#7a3b00', 0, .27, .505, .35, .55, .02), part(new THREE.CylinderGeometry(.03, .03, .5, 4), '#fff', 0, 2.35, 0)];
  for (const s of [-1, 1]) {
    L.push(part(new THREE.CylinderGeometry(.22, .24, 1.35, 6), G, s * .95, .68, .1));
    L.push(part(new THREE.ConeGeometry(.3, .55, 6), R, s * .95, 1.62, .1));
    L.push(part(BOX, '#7fc8ff', s * .45, .55, .505, .18, .3, .02));
    L.push(part(BOX, '#7fc8ff', s * .5, 1.15, .36, .14, .26, .02));
  }
  if (crown) {
    const y = 2.1;
    L.push(part(new THREE.CylinderGeometry(.34, .3, .22, 10), '#ffd400', 0, 2.38 + y * 0, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.2832; L.push(part(new THREE.ConeGeometry(.1, .32, 5), '#ffd400', Math.sin(a) * .3, 2.64, Math.cos(a) * .3)); L.push(part(new THREE.SphereGeometry(.06, 5, 4), '#ff2a55', Math.sin(a) * .3, 2.84, Math.cos(a) * .3)); }
    L.push(part(new THREE.SphereGeometry(.09, 6, 4), '#ff2a55', 0, 2.4, .3));
  }
  return L.map(g => g);
}
const GEO = { house: finish(houseParts(false)), mayor: finish(houseParts(true)), palace: finish(palaceParts(false)), crown: finish(palaceParts(true)) };
GEO.mayor.scale = 1.25; GEO.palace.scale = 1.1; GEO.crown.scale = 1.1;

const HS = { value: 0.05 };
function patch(mat) {
  mat.onBeforeCompile = s => {
    s.uniforms.uHS = HS;
    s.vertexShader = 'uniform float uHS;\n' + s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3(position) * uHS;');
  };
  return mat;
}
const MAT = {
  house: patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: 0x151008 })),
  gold: patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: 0x4a3200 }))
};
const houseGroup = new THREE.Group(); world.add(houseGroup);

// marker for highlighted house
const marker = new THREE.Group();
{
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.04, .1, 4), new THREE.MeshBasicMaterial({ color: 0xffe14a }));
  cone.rotation.x = Math.PI; cone.position.y = .09;
  const ring = new THREE.Mesh(new THREE.RingGeometry(.035, .05, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: .9, depthTest: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .004; ring.name = 'ring'; ring.renderOrder = 5;
  marker.add(cone, ring); marker.visible = false; world.add(marker);
}

// ---------- land ----------
let landMesh = null, surfaceR = {}, centers = {};
const DESERT = new Set('EG SA LY DZ ML NE TD MR SD AE OM YE IQ JO KW QA NA BW TM EH SY IR AF PK'.split(' '));
const GREENS_V = ['#46d23c', '#2fc65a', '#6fdc3f', '#27c47c', '#8fe03c', '#3bcf8a', '#57d048'];
const GREENS_M = ['#8fcf5e', '#9ad56a', '#a9cf5c', '#7fc56e', '#b4d86a', '#8ccb64'];
const SAND_V = ['#f0d070', '#ebc766'], SAND_M = ['#dfc98a', '#d8c380'];
const MAXE = 4;
function buildLand(countries, claimed) {
  const P = [], C = [], tmp = new THREE.Vector3(), nrm = new THREE.Vector3();
  const col = new THREE.Color(), wall = new THREE.Color();
  surfaceR = {}; centers = {};
  const BASE = .985;
  const quad = (va, vb, vc, flipFix, color) => { // push tri
    P.push(va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z);
    for (let k = 0; k < 3; k++) C.push(color.r, color.g, color.b);
  };
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const dd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  for (const co of countries) {
    const isC = co.cc && claimed.has(co.cc);
    const top = isC ? 1.024 : 1.011;
    if (co.cc) surfaceR[co.cc] = top;
    const h = hash(co.name);
    let hex = co.cc === 'GL' ? '#eef7fb' : DESERT.has(co.cc) ? (isC ? SAND_V : SAND_M)[h % 2] : (isC ? GREENS_V : GREENS_M)[h % (isC ? GREENS_V.length : GREENS_M.length)];
    col.set(hex); wall.copy(col).multiplyScalar(.58).lerp(new THREE.Color('#5a3b22'), .25);
    const rr = rng(h);
    const polys = co.g === 'Polygon' ? [co.c] : co.c;
    let best = null, bestA = -1;
    for (const poly of polys) {
      const rings = poly.map(r => r.slice(0, -1));
      // centre of the biggest polygon
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of rings[0]) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      const area = (x1 - x0) * (y1 - y0);
      if (area > bestA) { bestA = area; best = { lon: (x0 + x1) / 2, lat: (y0 + y1) / 2, ext: Math.max((x1 - x0) * Math.cos((y0 + y1) / 2 * D2R), y1 - y0) }; }
      const contour = rings[0].map(p => new THREE.Vector2(p[0], p[1]));
      const holes = rings.slice(1).map(r => r.map(p => new THREE.Vector2(p[0], p[1])));
      let faces;
      try { faces = THREE.ShapeUtils.triangulateShape(contour, holes); } catch (e) { continue; }
      const pts = contour.concat(...holes).map(p => [p.x, p.y]);
      const emit = (a, b, c, depth) => {
        const l1 = dd(a, b), l2 = dd(b, c), l3 = dd(c, a), m = Math.max(l1, l2, l3);
        if (m > MAXE && depth < 14) {
          if (m === l1) { const q = mid(a, b); emit(a, q, c, depth + 1); emit(q, b, c, depth + 1); }
          else if (m === l2) { const q = mid(b, c); emit(a, b, q, depth + 1); emit(a, q, c, depth + 1); }
          else { const q = mid(c, a); emit(a, b, q, depth + 1); emit(q, b, c, depth + 1); }
          return;
        }
        sph(a[1], a[0], top, va); sph(b[1], b[0], top, vb); sph(c[1], c[0], top, vc);
        e1.subVectors(vb, va); e2.subVectors(vc, va); nrm.crossVectors(e1, e2);
        const cx = va.x + vb.x + vc.x, cy = va.y + vb.y + vc.y, cz = va.z + vb.z + vc.z;
        const sh = 0.93 + rr() * .14;
        const cc2 = col.clone().multiplyScalar(sh);
        if (nrm.x * cx + nrm.y * cy + nrm.z * cz < 0) quad(va, vc, vb, 0, cc2); else quad(va, vb, vc, 0, cc2);
      };
      for (const f of faces) emit(pts[f[0]], pts[f[1]], pts[f[2]], 0);
      // walls
      for (const ring of rings) {
        for (let i = 0; i < ring.length; i++) {
          const p = ring[i], q = ring[(i + 1) % ring.length];
          const n = Math.max(1, Math.ceil(dd(p, q) / MAXE));
          for (let s = 0; s < n; s++) {
            const a0 = [p[0] + (q[0] - p[0]) * s / n, p[1] + (q[1] - p[1]) * s / n], a1 = [p[0] + (q[0] - p[0]) * (s + 1) / n, p[1] + (q[1] - p[1]) * (s + 1) / n];
            const t0 = sph(a0[1], a0[0], top, new THREE.Vector3()), t1 = sph(a1[1], a1[0], top, new THREE.Vector3());
            const b0 = sph(a0[1], a0[0], BASE, new THREE.Vector3()), b1 = sph(a1[1], a1[0], BASE, new THREE.Vector3());
            quad(t0, b0, t1, 0, wall); quad(t1, b0, b1, 0, wall);
          }
        }
      }
    }
    if (co.cc && best) centers[co.cc] = best;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  g.computeVertexNormals();
  if (landMesh) { world.remove(landMesh); landMesh.geometry.dispose(); }
  landMesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true }));
  world.add(landMesh);
}

// ---------- houses ----------
let HOUSES = [], STATE = null, hpos = [], hmesh = [];
function buildHouses(state) {
  for (const m of hmesh) { houseGroup.remove(m); m.dispose(); }
  hmesh = []; hpos = [];
  const groups = { house: [], mayor: [], palace: [], crown: [] };
  HOUSES = state.houses || [];
  HOUSES.forEach((h, i) => {
    const kind = h.role === 'president' ? 'crown' : (h.gold ? 'palace' : (h.role === 'mayor' ? 'mayor' : 'house'));
    groups[kind].push(i);
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), n = new THREE.Vector3(), p = new THREE.Vector3();
  hpos = new Array(HOUSES.length);
  for (const kind of Object.keys(groups)) {
    const idx = groups[kind]; if (!idx.length) continue;
    const mesh = new THREE.InstancedMesh(GEO[kind], (kind === 'palace' || kind === 'crown') ? MAT.gold : MAT.house, idx.length);
    mesh.frustumCulled = false;
    idx.forEach((hi, k) => {
      const h = HOUSES[hi], r = surfaceR[h.cc] || 1.011;
      sph(h.lat, h.lon, 1, n);
      q.setFromUnitVectors(up, n);
      q2.setFromAxisAngle(up, (hash(h.user || String(hi)) % 628) / 100);
      q.multiply(q2);
      p.copy(n).multiplyScalar(r - .001);
      m4.compose(p, q, one); mesh.setMatrixAt(k, m4);
      hpos[hi] = { n: n.clone(), r: r, kind, scale: GEO[kind].scale || 1 };
    });
    mesh.instanceMatrix.needsUpdate = true;
    houseGroup.add(mesh); hmesh.push(mesh);
  }
}

// ---------- camera model (analytic in time T) ----------
let T = DET ? (parseFloat(Q.get('t')) || 0) : 0;
const t0wall = performance.now();
const K = 3.2, SPEED = 4.5;
let base = { lat: 22, lon: 12, d: innerWidth > innerHeight ? 4.4 : 3.2, t0: 0, vlon: 0, vlat: 0, auto: true };
let fly = null, flyRes = null;
const view = { w: 1, h: 1 };
function camAt(t) {
  if (fly) {
    const e = clamp((t - fly.t0) / fly.dur, 0, 1);
    if (e >= 1) { base = { lat: fly.to.lat, lon: fly.to.lon, d: fly.to.d, t0: fly.t0 + fly.dur, vlon: 0, vlat: 0, auto: fly.auto }; fly = null; if (flyRes) { flyRes(); flyRes = null; } }
    else {
      const k = e < .5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
      const f = fly.from, o = fly.to;
      return { lat: f.lat + (o.lat - f.lat) * k, lon: f.lon + (o.lon - f.lon) * k, d: f.d + (o.d - f.d) * k + Math.sin(Math.PI * k) * fly.arc };
    }
  }
  const dt = Math.max(0, t - base.t0), dec = (1 - Math.exp(-K * dt)) / K;
  return { lat: clamp(base.lat + base.vlat * dec, -80, 80), lon: base.lon + base.vlon * dec + (base.auto ? SPEED * dt : 0), d: base.d };
}
function rebase(extra) { const c = camAt(T); base = Object.assign({ lat: c.lat, lon: c.lon, d: c.d, t0: T, vlon: 0, vlat: 0, auto: base.auto }, extra || {}); fly = null; }
function wrap(l) { return ((l + 540) % 360) - 180; }
function flyTo(target, zoom, dur = 2.4, auto = false) {
  let lat, lon, d;
  if (typeof target === 'string') {
    const cc = target.toUpperCase(), c = centers[cc];
    if (c) { lat = c.lat; lon = c.lon; d = clamp(1.9 + c.ext / 22, 2.0, 3.4); }
    else {
      const hs = HOUSES.filter(h => h.cc === cc);
      if (!hs.length) return Promise.resolve(false);
      lat = hs.reduce((a, h) => a + h.lat, 0) / hs.length; lon = hs.reduce((a, h) => a + h.lon, 0) / hs.length; d = 1.5;
    }
  } else if (target && typeof target.lat === 'number') { lat = target.lat; lon = target.lon; d = 1.7; }
  else return Promise.resolve(false);
  if (typeof zoom === 'number') d = zoom;
  d = clamp(d, 1.16, 7);
  lat = clamp(lat - (d < 2.2 ? 0 : 0), -75, 75);
  const cur = camAt(T);
  let dl = wrap(lon - cur.lon); // shortest path
  const from = { lat: cur.lat, lon: cur.lon, d: cur.d }, to = { lat, lon: cur.lon + dl, d };
  if (dur === 0) { base = { lat, lon, d, t0: T, vlon: 0, vlat: 0, auto: auto }; fly = null; if (landMesh) render(); return Promise.resolve(true); }
  fly = { t0: T, dur: Math.max(.01, dur), from, to, arc: Math.min(1.2, Math.abs(dl) / 120 + Math.abs(lat - cur.lat) / 150), auto };
  return new Promise(res => { flyRes = () => res(true); });
}

// ---------- resize / render ----------
const dock = $('dock'), hdr = document.querySelector('.hdr');
function resize() {
  const w = innerWidth, h = innerHeight; view.w = w; view.h = h;
  renderer.setSize(w, h, false);
  const asp = w / h;
  const fov = asp >= 1 ? 39 : 2 * Math.atan(Math.tan(19.5 * D2R) / asp) / D2R;
  camera.fov = clamp(fov, 39, 80); camera.aspect = asp;
  const desk = w >= 900;
  let offY = 0, offX = 0;
  if (!REEL) {
    if (desk) offX = 0; // globe a bit toward the middle between panels
    else { const top = hdr.getBoundingClientRect().bottom, bot = dock.getBoundingClientRect().top; offY = h / 2 - (top + bot) / 2; offY = -offY; }
  }
  if (offX || offY) camera.setViewOffset(w, h, offX, offY, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  document.documentElement.style.setProperty('--dockh', dock.offsetHeight + 'px');
}
addEventListener('resize', () => { resize(); if (DET) render(); });

const _v = new THREE.Vector3();
let grow = 1;
function render() {
  const c = camAt(T);
  sph(c.lat, wrap(c.lon), c.d, camera.position);
  camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0);
    HS.value = clamp(0.009 + 0.0095 * (c.d - 1.2), 0.007, 0.05) * clamp(grow, 0.001, 1);
  clouds.rotation.y = T * 0.012; clouds.rotation.x = 0.0;
  if (marker.visible && marker.userData.h != null) {
    const hp = hpos[marker.userData.h];
    marker.position.copy(hp.n).multiplyScalar(hp.r);
    marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hp.n);
    const s = HS.value * 22 * (1 + Math.max(0, c.d - 1.6) * .35);
    marker.scale.setScalar(Math.max(s, 0.001));
    marker.children[0].position.y = (hp.kind === 'crown' ? .3 : hp.kind === 'house' ? .2 : .26) + .02 * Math.sin(T * 5);
    const pr = (T * 1.2) % 1; const ring = marker.children[1]; ring.scale.setScalar(1.1 + pr * 1.3); ring.material.opacity = .9 * (1 - pr);
  }
  renderer.render(scene, camera);
}

// ---------- interaction ----------
const ptrs = new Map(); let downInfo = null, pinch0 = 0, lastMove = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) { downInfo = { x: e.clientX, y: e.clientY, t: performance.now() }; rebase(); base.auto = false; lastMove = { t: performance.now(), x: e.clientX, y: e.clientY, vx: 0, vy: 0 }; }
  else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); downInfo = null; }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 1) {
    const c = camAt(T), degpx = 57.3 * Math.tan(camera.fov * D2R / 2) * (c.d - 1) / (view.h / 2) * 1.05;
    base.lon -= dx * degpx; base.lat = clamp(base.lat + dy * degpx, -80, 80); base.t0 = T; base.vlon = 0; base.vlat = 0; base.auto = false; fly = null;
    const now = performance.now(), dt = Math.max(1, now - lastMove.t) / 1000;
    lastMove.vx = lastMove.vx * .6 + (-dx * degpx / dt) * .4; lastMove.vy = lastMove.vy * .6 + (dy * degpx / dt) * .4; lastMove.t = now;
    if (DET) render();
  } else if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch0 > 0) { rebase(); base.d = clamp(base.d * pinch0 / dist, 1.16, 7); base.auto = false; pinch0 = dist; if (DET) render(); }
  }
});
function up(e) {
  const p = ptrs.get(e.pointerId); if (!p) return; ptrs.delete(e.pointerId);
  if (downInfo && e.type === 'pointerup') {
    const moved = Math.hypot(e.clientX - downInfo.x, e.clientY - downInfo.y), dtm = performance.now() - downInfo.t;
    if (moved < 8 && dtm < 600) { pick(e.clientX, e.clientY); }
    else if (lastMove && performance.now() - lastMove.t < 80) { rebase({ vlon: clamp(lastMove.vx, -180, 180), vlat: clamp(lastMove.vy, -90, 90) }); }
  }
  downInfo = null;
  if (ptrs.size === 0) { clearTimeout(autoTimer); base.auto = base.auto; autoTimer = setTimeout(() => { if (!ptrs.size && !DET) { rebase(); base.auto = true; } }, 3500); }
}
let autoTimer = 0;
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('wheel', e => { e.preventDefault(); rebase(); base.d = clamp(base.d * Math.exp(e.deltaY * 0.0014), 1.16, 7); base.auto = false; clearTimeout(autoTimer); autoTimer = setTimeout(() => { rebase(); base.auto = true; }, 4000); if (DET) render(); }, { passive: false });

function pick(px, py) {
  const c = camAt(T), cp = camera.position, best = { i: -1, d: 1e9 };
  camera.updateMatrixWorld();
  const ndc = new THREE.Vector3(), cam = cp.clone().normalize();
  for (let i = 0; i < HOUSES.length; i++) {
    const hp = hpos[i]; if (!hp) continue;
    if (hp.n.dot(cam) < Math.min(0.2, 1 / c.d) * 0.9) continue;
    ndc.copy(hp.n).multiplyScalar(hp.r + .02 * hp.scale * HS.value / .05).project(camera);
    const sx = (ndc.x * .5 + .5) * view.w - (camera.view && camera.view.enabled ? -camera.view.offsetX : 0), sy = (-ndc.y * .5 + .5) * view.h + (camera.view && camera.view.enabled ? camera.view.offsetY * 0 : 0);
    // account for view offset
    const ox = camera.view && camera.view.enabled ? camera.view.offsetX : 0, oy = camera.view && camera.view.enabled ? camera.view.offsetY : 0;
    const X = (ndc.x * .5 + .5) * view.w - ox, Y = (-ndc.y * .5 + .5) * view.h - oy;
    let d = Math.hypot(X - px, Y - py);
    if (hpos[i].kind === 'crown') d -= 10; else if (hpos[i].kind === 'palace' || hpos[i].kind === 'mayor') d -= 4;
    if (d < best.d) { best.d = d; best.i = i; }
  }
  if (best.i >= 0 && best.d < 30) { select(best.i); return; }
  hideCard();
}

// ---------- card ----------
const card = $('card');
function select(i, fly_) {
  const h = HOUSES[i]; if (!h) return;
  marker.visible = true; marker.userData.h = i;
  const kind = h.gold ? 'gold' : h.role;
  $('cu').textContent = '@' + h.user;
  const av = $('cav'); av.textContent = (h.user || '?')[0]; av.style.background = `hsl(${hash(h.user) % 360},65%,48%)`;
  const b = $('cb'); b.className = 'badge ' + kind;
  b.textContent = h.gold ? '✨ Golden palace' + (h.role === 'president' ? ' · President' : '') : h.role === 'president' ? '\u{1F451} President' : h.role === 'mayor' ? '\u{1F3DB} Mayor' : '\u{1F3E0} Citizen';
  const days = Math.max(0, Math.ceil((Date.parse(h.until) - Date.now()) / 864e5));
  const cl = $('cl'); cl.textContent = '';
  const where = flag(h.cc) + ' ' + h.country + (h.city ? ' · ' + h.city : '');
  cl.append(where, document.createElement('br'), 'House #' + h.n + ' · ' + days + (days === 1 ? ' day' : ' days') + ' left');
  if (h.src !== 'seed') { cl.append(document.createElement('br')); const a = document.createElement('a'); a.href = 'https://www.instagram.com/' + encodeURIComponent(h.user) + '/'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'instagram.com/' + h.user; cl.append(a); }
  $('cn').textContent = h.note || '';
  card.classList.add('show');
  if (DET) render();
}
function hideCard() { card.classList.remove('show'); marker.visible = false; marker.userData.h = null; if (DET) render(); }
$('cx').onclick = hideCard;

function findUser(u) { u = (u || '').replace(/^@/, '').toLowerCase(); return HOUSES.findIndex(h => (h.user || '').toLowerCase() === u); }
function goUser(u) {
  const i = findUser(u); if (i < 0) return false;
  const h = HOUSES[i]; select(i);
  flyTo({ lat: h.lat - 3.5, lon: h.lon }, 1.45, DET ? 0 : 2.2);
  return true;
}

// ---------- UI data ----------
const lb = $('lb');
function fillUI(state) {
  const t = state.totals || {}, pres = state.presidents || {}, cs = state.countries || {};
  const nH = (state.houses || []).length, nC = Object.keys(cs).length, nP = Object.keys(pres).length;
  $('sH').textContent = nH.toLocaleString('en'); $('sC').textContent = nC; $('sP').textContent = nP;
  $('sF').textContent = Math.max(0, TOTAL_COUNTRIES - nP);
  if (nH && state.houses.every(h => h.src === 'seed')) $('demo').style.display = 'inline-block';
  const rows = Object.entries(cs).sort((a, b) => b[1].houses - a[1].houses || (pres[a[0]] ? Date.parse(pres[a[0]].since) : 0) - (pres[b[0]] ? Date.parse(pres[b[0]].since) : 0)).slice(0, 60);
  const L = $('lbl'); L.textContent = '';
  rows.forEach(([cc, c], i) => {
    const r = document.createElement('div'); r.className = 'lr';
    const mk = (cls, txt) => { const d = document.createElement('div'); d.className = cls; d.textContent = txt; return d; };
    const nm = mk('nm', c.name); if (pres[cc]) { const s = document.createElement('small'); s.textContent = '\u{1F451} @' + pres[cc].user; nm.append(s); }
    r.append(mk('rk', i + 1), mk('fl', flag(cc)), nm, mk('ct', c.houses));
    r.onclick = () => { lb.classList.remove('open'); flyTo(cc, undefined, 2.2); };
    L.append(r);
  });
  if (!rows.length) L.textContent = 'No houses yet. Be the first!';
  $('lbf').textContent = Math.max(0, TOTAL_COUNTRIES - nP) + ' countries still have no President';
}
$('lbo').onclick = () => lb.classList.add('open'); $('lbx').onclick = () => lb.classList.remove('open');

const qIn = $('q'), sug = $('sug');
function suggest() {
  const v = qIn.value.replace(/^@/, '').trim().toLowerCase(); sug.textContent = '';
  if (!v) { sug.style.display = 'none'; return; }
  const m = HOUSES.filter(h => (h.user || '').toLowerCase().includes(v)).slice(0, 5);
  if (!m.length) { const d = document.createElement('div'); d.textContent = 'No house for @' + v + ' yet. Comment your country on Instagram!'; sug.append(d); }
  m.forEach(h => { const d = document.createElement('div'); d.textContent = '@' + h.user; const s = document.createElement('small'); s.textContent = flag(h.cc) + ' ' + h.country; d.append(s); d.onclick = () => { goUser(h.user); sug.style.display = 'none'; qIn.blur(); }; sug.append(d); });
  sug.style.display = 'block';
}
qIn.addEventListener('input', suggest);
qIn.addEventListener('keydown', e => { if (e.key === 'Enter') { const v = qIn.value; if (goUser(v)) { sug.style.display = 'none'; qIn.blur(); } else suggest(); } });
addEventListener('pointerdown', e => { if (!sug.contains(e.target) && e.target !== qIn) sug.style.display = 'none'; });

// ---------- boot ----------
let countriesData = null, lastUpdated = null;
async function loadState(first) {
  const r = await fetch('./state.json?_=' + (first ? '' : Date.now()), { cache: 'no-cache' });
  const st = await r.json();
  if (!first && st.updated === lastUpdated) return;
  lastUpdated = st.updated; STATE = st;
  buildLand(countriesData, new Set(Object.keys(st.presidents || {})));
  buildHouses(st);
  fillUI(st);
}
let ready;
window.EARTH = {
  get ready() { return ready; },
  setTime(t) { T = +t || 0; render(); },
  flyTo(target, zoom, dur) { return flyTo(target, zoom, dur === undefined ? (DET ? 0 : 2.4) : dur); },
  highlight(handle) { const i = findUser(handle); if (i < 0) { hideCard(); return null; } select(i); render(); return HOUSES[i]; },
  get time() { return T; }
};
ready = (async () => {
  countriesData = await (await fetch('./countries.json')).json();
  await loadState(true);
  resize();
  const f = Q.get('focus'), u = Q.get('user');
  if (f) await flyTo(f, undefined, 0, false);
  if (u) { const ok = findUser(u) >= 0; if (ok) { const i = findUser(u), h = HOUSES[i]; select(i); await flyTo({ lat: h.lat - 3.5, lon: h.lon }, 1.45, 0, false); } }
  if (!f && !u && !DET) { base.t0 = 0; }
  if (DET) { grow = 1; render(); }
  else {
    const start = performance.now();
    let acc = 0, frames = 0, last = performance.now(), lowCount = 0;
    const loop = () => {
      const now = performance.now(); T = (now - t0wall) / 1000;
      grow = smooth((now - start - 250) / 1800);
      render();
      const dt = now - last; last = now; acc += dt; frames++;
      if (acc > 1500 && frames > 20) { if (acc / frames > 36 && maxDpr > 1) { maxDpr = Math.max(1, maxDpr - .5); renderer.setPixelRatio(maxDpr); resize(); } acc = 0; frames = 0; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    setInterval(() => loadState(false).catch(() => { }), 60000);
  }
  document.getElementById('load').classList.add('gone');
  return true;
})();
ready.catch(e => { console.error(e); const l = $('load'); l.textContent = 'Could not load the planet. Please reload.'; });
