// Procedural voxel Ark: layout from pair count, hull geometry, slot positions, cabins.
import * as THREE from './vendor/three.module.min.js';
import { MeshBuilder, hexLinear } from './voxel.js';

export const VS = 0.5;          // world size of one hull voxel
export const WATERLINE = 3;     // voxel row that sits at sea level
const B = 8;                    // hold rows below the lowest deck
const H = 6;                    // rows per deck level
export const PAIR_PITCH = 3.2;  // along x
export const ROW_PITCH = 2.0;   // along z
export const FIG_SCALE = 0.1;

export function computeLayout(nPairs, nCabins) {
  const n = nPairs;
  const rows = n <= 30 ? 3 : n <= 120 ? 5 : n <= 400 ? 7 : n <= 1000 ? 9 : 11;
  const levels = 2 + (n > 60 ? 1 : 0) + (n > 300 ? 1 : 0) + (n > 1500 ? 1 : 0);
  const cabinCols = Math.ceil(Math.ceil(nCabins / 2));
  const cols = Math.max(8, Math.ceil(n / (levels * rows)), cabinCols);
  const sternPad = 3, houseLen = 10, bowPad = 14;
  const L = sternPad + houseLen + cols * PAIR_PITCH + bowPad;
  const W = rows * 2 + 7;
  const NX = Math.ceil(L / VS) + 2, NZ = Math.ceil(W / VS) + 2;
  const NY = B + levels * H + 8 + 8 + 18 + 4;
  const fy = (j) => B + (levels - 1 - j) * H; // floor row of level j (0 = top)
  return { n, rows, levels, cols, L, W, NX, NY, NZ, sternPad, houseLen, bowPad, fy, perLevel: rows * cols, cabinCols,
    x0: -L / 2 + sternPad + houseLen + PAIR_PITCH / 2 };
}

const ROW_ORDER = (rows) => { const a = [0]; for (let i = 1; a.length < rows; i++) { a.push(i); a.push(-i); } return a.slice(0, rows); };

export function slotPos(lay, i) {
  const j = Math.floor(i / lay.perLevel), k = i % lay.perLevel;
  const col = Math.floor(k / lay.rows);
  const o = ROW_ORDER(lay.rows)[k % lay.rows];
  return new THREE.Vector3(lay.x0 + col * PAIR_PITCH, (lay.fy(j) + 1) * VS, o * ROW_PITCH);
}

export function cabinPos(lay, i) {
  const col = i >> 1, side = (i & 1) ? 1 : -1;
  return new THREE.Vector3(lay.x0 + col * PAIR_PITCH, (lay.fy(0) + 1) * VS, side * (lay.rows + 1.9));
}

function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

export function buildHull(lay) {
  const { NX, NY, NZ, levels, L } = lay;
  const pal = [[0, 0, 0]];
  const add = (hex, nv = 3) => {
    const i = pal.length; const c = hexLinear(hex);
    for (let k = 0; k < nv; k++) { const m = 0.93 + 0.07 * k; pal.push([c[0] * m, c[1] * m, c[2] * m]); }
    return i;
  };
  const C = {
    HL: add('#bd7d43'), HD: add('#93592c'), TRIM: add('#5b3719'), DECK: add('#dfb170'), DECKD: add('#c99a5c'),
    TAR: add('#3a2a20', 2), HOUSE: add('#ecc994'), BEAM: add('#7d4c27', 2), ROOF: add('#c9532f'), ROOFD: add('#a63f24'),
    WIN: add('#2f5877', 1), WINL: add('#8fd0e8', 1), DOOR: add('#4d2f16', 1), MAST: add('#7d4c27', 1),
    FLAG: add('#2ec4b6', 1), FLAG2: add('#ffd166', 1), LAMP: add('#ffe08a', 1),
  };
  const grid = new Uint8Array(NX * NY * NZ);
  const idx = (x, y, z) => x + NX * (y + NY * z);
  const put = (x, y, z, c, nv = 3) => {
    if (x < 0 || y < 0 || z < 0 || x >= NX || y >= NY || z >= NZ) return;
    grid[idx(x, y, z)] = c + (nv > 1 ? Math.floor(hash3(x, y, z) * nv) : 0);
  };
  const Zc = NZ / 2, Wh = (lay.W / 2) / VS;
  // width factor per column
  const hwx = new Float32Array(NX);
  for (let ix = 0; ix < NX; ix++) {
    const xw = (ix + 0.5) * VS - (NX * VS) / 2; // centred on grid, grid is ~L wide
    const db = L / 2 - xw, ds = xw + L / 2;
    const tb = Math.min(1, Math.max(0, db / 14)), ts = Math.min(1, Math.max(0, ds / 6));
    const fb = Math.pow(tb, 0.6), fs = 0.62 + 0.38 * Math.pow(ts, 0.7);
    hwx[ix] = Wh * Math.min(fb, fs);
  }
  const topF = lay.fy(0);
  for (let ix = 0; ix < NX; ix++) {
    const xw = (ix + 0.5) * VS - (NX * VS) / 2;
    const dB = L / 2 - xw, dS = xw + L / 2;
    const sheer = Math.round(4 * Math.pow(Math.max(0, 1 - dB / 9), 1.5) + 2 * Math.max(0, 1 - dS / 4));
    for (let iz = 0; iz < NZ; iz++) {
      const dz = Math.abs(iz + 0.5 - Zc);
      for (let iy = 0; iy < NY; iy++) {
        const yf = iy < B ? 0.5 + 0.5 * (iy / B) : 1;
        const hw = hwx[ix] * yf;
        if (hw < 0.9 || dz >= hw) continue;
        const edge = dz >= hw - 1;
        if (iy < B) {
          if (iy < WATERLINE - 1) put(ix, iy, iz, C.TAR, 2);
          else if (!edge) put(ix, iy, iz, C.HD);
          else if (iy === B - 1 || iy === WATERLINE) put(ix, iy, iz, C.TRIM, 1);
          else if (ix % 9 === 0) put(ix, iy, iz, C.TRIM, 1);
          else put(ix, iy, iz, ((iy >> 1) & 1) ? C.HL : C.HD);
          continue;
        }
        // above hold
        const rel = iy - B;
        const m = Math.floor(rel / H);           // 0 = lowest deck
        const j = levels - 1 - m;                // level index (0 = top)
        if (j < 0) continue;
        const r = rel - m * H;                   // row inside level, 0 = floor
        if (r === 0) {
          if (edge) put(ix, iy, iz, C.TRIM, 1);
          else put(ix, iy, iz, (iz % 3 === 0) ? C.DECKD : C.DECK);
          continue;
        }
        if (!edge) continue;
        const isTop = j === 0;
        const wallH = isTop ? 2 + sheer : 1;
        const post = (ix % 8 === 3) && !isTop;
        if (post) { put(ix, iy, iz, C.TRIM, 1); continue; }
        if (r <= wallH) {
          if (ix % 9 === 0) put(ix, iy, iz, C.TRIM, 1);
          else if (r === wallH) put(ix, iy, iz, C.HD);
          else put(ix, iy, iz, (r & 1) ? C.HL : C.HD);
        }
      }
    }
  }
  // ---- house on the top deck (stern) ----
  const gx0 = Math.round((NX * VS / 2 - L / 2 + lay.sternPad) / VS);
  const gx1 = gx0 + Math.round(lay.houseLen / VS);
  const hz = 6, cz = Math.floor(Zc);
  const base = topF + 1, wallRows = 8;
  const zmin = cz - hz, zmax = cz + hz; // inclusive walls at zmin & zmax-1
  for (let x = gx0; x < gx1; x++) for (let z = zmin; z < zmax; z++) for (let y = base; y < base + wallRows; y++) {
    const onX = x === gx0 || x === gx1 - 1, onZ = z === zmin || z === zmax - 1;
    if (!onX && !onZ) continue;
    const corner = onX && onZ;
    if (corner || (y === base + wallRows - 1)) put(x, y, z, C.BEAM, 2);
    else put(x, y, z, C.HOUSE);
  }
  // windows
  for (const zf of [zmin, zmax - 1]) for (let wx = gx0 + 3; wx < gx1 - 4; wx += 6) for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) {
    put(wx + dx, base + 3 + dy, zf, (dx === 1 && dy === 1) ? C.WINL : C.WIN, 1);
  }
  // door on the bow-facing end
  const dzc = cz;
  for (let dz = -1; dz <= 1; dz++) for (let dy = 0; dy < 5; dy++) put(gx1 - 1, base + dy, dzc + dz, C.DOOR, 1);
  put(gx1 - 1, base + 5, dzc, C.LAMP, 1);
  // gable roof along x
  for (let r = 0; r < 7; r++) {
    const half = hz + 1 - r;
    for (let x = gx0 - 1; x <= gx1; x++) for (let z = cz - half; z < cz + half; z++) {
      put(x, base + wallRows + r, z, (r & 1) ? C.ROOFD : C.ROOF);
    }
  }
  // mast + flag
  const mx = gx0 + 8, my = base + wallRows + 7;
  for (let y = 0; y < 16; y++) put(mx, my + y, cz, C.MAST, 1);
  for (let dx = 1; dx <= 7; dx++) for (let dy = 0; dy < 5; dy++) {
    if (dy === 0 && dx > 5) continue; if (dy === 4 && dx > 5) continue;
    put(mx - dx, my + 10 + dy, cz, (dx === 3 && dy === 2) ? C.FLAG2 : C.FLAG, 1);
  }
  put(mx, my + 16, cz, C.FLAG2, 1);
  // bow figurehead lantern
  const bx = Math.round((NX * VS / 2 + L / 2) / VS) - 2;
  put(bx, topF + 4, Math.floor(Zc), C.LAMP, 1);

  const get = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= NX || y >= NY || z >= NZ) ? 0 : grid[idx(x, y, z)];
  const mb = new MeshBuilder();
  mb.addGrid(get, [NX, NY, NZ], pal, [-(NX * VS) / 2, 0, -(NZ * VS) / 2], VS, true);
  return mb.geometry();
}

const PASTELS = ['#f4c5a8', '#a8d8c8', '#f2e394', '#b7c6f0', '#f0b0b8', '#cfe3a0', '#e6c9f0'];
const ROOFS = ['#b8472a', '#2f7f86', '#3b5ea8', '#8a4a9a', '#c9822b'];

/** Merged mesh of all cabins; returns {geometry, ranges:[{start,end,cabin}], positions} */
export function buildCabins(lay, cabins) {
  const mb = new MeshBuilder();
  const ranges = [];
  const D = [6, 7, 6];
  for (let i = 0; i < cabins.length; i++) {
    const hsh = hash3(i * 7 + 1, 3, 9);
    const wall = hexLinear(PASTELS[Math.floor(hsh * PASTELS.length) % PASTELS.length]);
    const roof = hexLinear(ROOFS[Math.floor(hash3(i, 5, 2) * ROOFS.length) % ROOFS.length]);
    const pal = [[0, 0, 0], wall, roof, hexLinear('#4d2f16'), hexLinear('#2f5877'), hexLinear('#8a5328')];
    const g = new Uint8Array(6 * 7 * 6);
    const set = (x, y, z, c) => { g[x + 6 * (y + 7 * z)] = c; };
    for (let y = 0; y < 4; y++) for (let x = 1; x <= 4; x++) for (let z = 1; z <= 4; z++) set(x, y, z, 1);
    for (let x = 0; x <= 5; x++) for (let z = 0; z <= 5; z++) set(x, 4, z, 2);
    for (let x = 1; x <= 4; x++) for (let z = 1; z <= 4; z++) set(x, 5, z, 2);
    for (let x = 2; x <= 3; x++) for (let z = 2; z <= 3; z++) set(x, 6, z, 2);
    set(2, 0, 5, 5); set(3, 0, 5, 5); // doormat
    g[2 + 6 * (0 + 7 * 4)] = 3; g[3 + 6 * (0 + 7 * 4)] = 3; g[2 + 6 * (1 + 7 * 4)] = 3; g[3 + 6 * (1 + 7 * 4)] = 3;
    g[1 + 6 * (2 + 7 * 4)] = 4; g[4 + 6 * (2 + 7 * 4)] = 4; // windows
    const get = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= 6 || y >= 7 || z >= 6) ? 0 : g[x + 6 * (y + 7 * z)];
    const p = cabinPos(lay, i);
    const start = mb.idx.length;
    mb.addGrid(get, D, pal, [p.x - 3 * VS, p.y, p.z - 3 * VS], VS, true);
    ranges.push({ start: start / 3, end: mb.idx.length / 3, cabin: cabins[i] });
  }
  return { geometry: mb.n ? mb.geometry() : null, ranges };
}
