// Voxel meshing helpers: exposed faces only, vertex colours, optional ambient occlusion / greedy merge.
import * as THREE from './vendor/three.module.min.js';

const FACES = [
  { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], s: 0.88 },
  { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], s: 0.76 },
  { n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0], s: 1.0 },
  { n: [0, -1, 0], u: [0, 0, 1], v: [1, 0, 0], s: 0.5 },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], s: 0.94 },
  { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], s: 0.8 },
];
for (const f of FACES) {
  const c = [f.u[1] * f.v[2] - f.u[2] * f.v[1], f.u[2] * f.v[0] - f.u[0] * f.v[2], f.u[0] * f.v[1] - f.u[1] * f.v[0]];
  f.flip = (c[0] * f.n[0] + c[1] * f.n[1] + c[2] * f.n[2]) < 0;
}
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

export function hexLinear(hex) {
  const c = new THREE.Color(hex); // converts sRGB -> linear
  return [c.r, c.g, c.b];
}

export class MeshBuilder {
  constructor() { this.pos = []; this.col = []; this.nor = []; this.idx = []; this.n = 0; }
  quad(p, c4, nrm, flipTri, flipDiag) {
    const b = this.n;
    for (let i = 0; i < 4; i++) {
      this.pos.push(p[i][0], p[i][1], p[i][2]);
      this.col.push(c4[i][0], c4[i][1], c4[i][2]);
      this.nor.push(nrm[0], nrm[1], nrm[2]);
    }
    let t = flipDiag ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
    if (flipTri) t = [t[0], t[2], t[1], t[3], t[5], t[4]];
    for (const k of t) this.idx.push(b + k);
    this.n += 4;
  }
  /**
   * Adds a dense grid. get(x,y,z) -> palette index (0 = empty). palette[i] = [r,g,b] linear.
   * dims [nx,ny,nz]; origin = world position of cell (0,0,0) min corner; scale = world size of a cell.
   */
  addGrid(get, dims, palette, origin, scale, ao = true) {
    const [nx, ny, nz] = dims;
    const p = [0, 0, 0];
    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const ci = get(x, y, z);
      if (!ci) continue;
      const base = palette[ci];
      for (const f of FACES) {
        const [a, b, c] = f.n;
        if (get(x + a, y + b, z + c)) continue;
        const pts = [], cols = [], aos = [];
        for (const [su, sv] of CORNERS) {
          pts.push([
            origin[0] + (x + 0.5 + 0.5 * (f.n[0] + su * f.u[0] + sv * f.v[0])) * scale,
            origin[1] + (y + 0.5 + 0.5 * (f.n[1] + su * f.u[1] + sv * f.v[1])) * scale,
            origin[2] + (z + 0.5 + 0.5 * (f.n[2] + su * f.u[2] + sv * f.v[2])) * scale,
          ]);
          let k = 1;
          if (ao) {
            const s1 = get(x + a + su * f.u[0], y + b + su * f.u[1], z + c + su * f.u[2]) ? 1 : 0;
            const s2 = get(x + a + sv * f.v[0], y + b + sv * f.v[1], z + c + sv * f.v[2]) ? 1 : 0;
            const cc = get(x + a + su * f.u[0] + sv * f.v[0], y + b + su * f.u[1] + sv * f.v[1], z + c + su * f.u[2] + sv * f.v[2]) ? 1 : 0;
            const v = (s1 && s2) ? 0 : 3 - (s1 + s2 + cc);
            aos.push(v);
            k = 0.58 + 0.42 * (v / 3);
          } else aos.push(3);
          const m = f.s * k;
          cols.push([base[0] * m, base[1] * m, base[2] * m]);
        }
        const flipDiag = (aos[0] + aos[2]) < (aos[1] + aos[3]);
        this.quad(pts, cols, f.n, f.flip, flipDiag);
      }
    }
    return this;
  }
  /** Greedy-merged variant (no AO), for small grids (LOD). */
  addGridGreedy(get, dims, palette, origin, scale) {
    const D = dims;
    for (const f of FACES) {
      const ax = f.n[0] ? 0 : f.n[1] ? 1 : 2;
      const sgn = f.n[ax];
      const uax = f.u[0] ? 0 : f.u[1] ? 1 : 2;
      const vax = f.v[0] ? 0 : f.v[1] ? 1 : 2;
      const U = D[uax], V = D[vax];
      const q = [0, 0, 0];
      for (let s = 0; s < D[ax]; s++) {
        const mask = new Int32Array(U * V);
        for (let j = 0; j < V; j++) for (let i = 0; i < U; i++) {
          q[ax] = s; q[uax] = i; q[vax] = j;
          const ci = get(q[0], q[1], q[2]);
          if (!ci) continue;
          const r = [q[0], q[1], q[2]]; r[ax] += sgn;
          if (get(r[0], r[1], r[2])) continue;
          mask[j * U + i] = ci;
        }
        for (let j = 0; j < V; j++) for (let i = 0; i < U; i++) {
          const ci = mask[j * U + i];
          if (!ci) continue;
          let w = 1; while (i + w < U && mask[j * U + i + w] === ci) w++;
          let h = 1;
          outer: while (j + h < V) { for (let k = 0; k < w; k++) if (mask[(j + h) * U + i + k] !== ci) break outer; h++; }
          for (let jj = 0; jj < h; jj++) for (let ii = 0; ii < w; ii++) mask[(j + jj) * U + i + ii] = 0;
          const pts = [];
          for (const [su, sv] of CORNERS) {
            const P = [0, 0, 0];
            P[ax] = s + (sgn > 0 ? 1 : 0);
            P[uax] = i + (su > 0 ? w : 0);
            P[vax] = j + (sv > 0 ? h : 0);
            pts.push([origin[0] + P[0] * scale, origin[1] + P[1] * scale, origin[2] + P[2] * scale]);
          }
          const b = palette[ci], m = f.s * 0.88;
          const c = [b[0] * m, b[1] * m, b[2] * m];
          this.quad(pts, [c, c, c, c], f.n, f.flip, false);
        }
      }
    }
    return this;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setIndex(this.n > 65000 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

/** Build geometry for a figure {size, palette, voxels}. Origin = bottom-centre, world scale s per voxel. */
export function figureGeometry(fig, s, greedy) {
  const [sx, sy, sz] = fig.size.map((v) => Math.max(1, v | 0));
  const dims = [sx, sy, sz];
  const grid = new Uint8Array(sx * sy * sz);
  const pal = [[0, 0, 0]].concat(fig.palette.map(hexLinear));
  for (const [x, y, z, ci] of fig.voxels) {
    if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) continue;
    grid[x + sx * (y + sy * z)] = ci + 1;
  }
  const get = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) ? 0 : grid[x + sx * (y + sy * z)];
  const mb = new MeshBuilder();
  const origin = [-sx * s / 2, 0, -sz * s / 2];
  if (greedy) mb.addGridGreedy(get, dims, pal, origin, s); else mb.addGrid(get, dims, pal, origin, s, true);
  return mb.geometry();
}

/** Coarse figure (2x2x2 blocks merged) for very distant LOD. */
export function figureGeometryCoarse(fig, s) {
  const [sx, sy, sz] = fig.size.map((v) => Math.max(1, v | 0));
  const cx = Math.ceil(sx / 2), cy = Math.ceil(sy / 2), cz = Math.ceil(sz / 2);
  const cnt = new Map();
  for (const [x, y, z, ci] of fig.voxels) {
    const k = ((x >> 1) + cx * ((y >> 1) + cy * (z >> 1)));
    let m = cnt.get(k); if (!m) cnt.set(k, (m = { n: 0, c: new Map() }));
    m.n++; m.c.set(ci, (m.c.get(ci) || 0) + 1);
  }
  const grid = new Uint8Array(cx * cy * cz);
  for (const [k, m] of cnt) {
    if (m.n < 3) continue;
    let best = 0, bc = -1; for (const [c, n] of m.c) if (n > best) { best = n; bc = c; }
    grid[k] = bc + 1;
  }
  const pal = [[0, 0, 0]].concat(fig.palette.map(hexLinear));
  const get = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= cx || y >= cy || z >= cz) ? 0 : grid[x + cx * (y + cy * z)];
  const mb = new MeshBuilder();
  mb.addGridGreedy(get, [cx, cy, cz], pal, [-sx * s / 2, 0, -sz * s / 2], s * 2);
  return mb.geometry();
}
