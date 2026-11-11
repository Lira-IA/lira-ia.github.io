// THE COMET - simulation. Shared by the browser (the game) and node (the score check).
// Everything here is integer arithmetic on a fixed 60 Hz step, so the same seed and the same inputs give the same
// score on every machine. That is what lets the leaderboard re-run a submitted ride instead of trusting a number.
(function (root) {
  'use strict';
  var FPS = 60;
  var U = 100;                       // distance units per metre
  var V0 = 20, VMAX = 46;            // speed, units per frame (12 m/s -> 27.6 m/s)
  var V_STEP = 9000;                 // +1 speed every 90 m
  var JUMP_F = 34, DUCK_F = 30;      // frames in the air / sliding
  var AIR_LO = 5, AIR_HI = JUMP_F - 4;
  var NEAR_F = 14;                   // a lane change this close to a gate counts as a near miss
  var MAX_FRAMES = FPS * 60 * 20;    // no ride lasts longer than 20 minutes
  var MULT_MAX = 8, STREAK_PER_MULT = 10;
  var GAP_MAX = 52, GAP_MIN = 30;    // frames between two obstacles, start and hardest
  // cells
  var EMPTY = 0, GATE = 1, HURDLE = 2, BEAM = 3, STAR = 4, STAR_AIR = 5;

  function prng(seed) {              // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return (t ^ (t >>> 14)) >>> 0;
    };
  }
  function hashSeed(str) {           // FNV-1a
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function daySeed(day) { return hashSeed('liraland-comet-' + day); }
  function speedAt(s) { var v = V0 + Math.floor(s / V_STEP); return v > VMAX ? VMAX : v; }
  function gapAt(k) { var g = GAP_MAX - 2 * Math.floor(k / 6); return g < GAP_MIN ? GAP_MIN : g; }

  // ---- the track: rows of three cells, generated on demand, identical for everyone on the same seed ----
  function Course(seed) {
    this.rnd = prng(seed);
    this.rows = [];                  // {s, c:[left, mid, right], k: obstacle index or -1 for a star row}
    this.nextS = 46 * U;             // first obstacle 46 m in
    this.prevS = 16 * U;
    this.k = 0;
    this.lastFree = 1;
  }
  Course.prototype.pick = function (n) { return this.rnd() % n; };
  Course.prototype.ensure = function (upTo) {
    while (this.nextS <= upTo) this.addSegment();
  };
  Course.prototype.addSegment = function () {
    var k = this.k++, s = this.nextS, tier = Math.min(6, Math.floor(k / 9));
    var c = [EMPTY, EMPTY, EMPTY], r = this.pick(100), a = this.pick(3), b, free = -1, need = 0; // need: 0 lane, 1 jump, 2 duck
    var kind;
    if (k < 3) kind = 0;
    else if (tier === 0) kind = r < 60 ? 0 : r < 80 ? 2 : 3;
    else if (tier === 1) kind = r < 30 ? 0 : r < 55 ? 1 : r < 75 ? 2 : r < 90 ? 3 : 4;
    else if (tier === 2) kind = r < 15 ? 0 : r < 45 ? 1 : r < 60 ? 2 : r < 75 ? 3 : r < 88 ? 4 : 5;
    else kind = r < 8 ? 0 : r < 36 ? 1 : r < 48 ? 2 : r < 60 ? 3 : r < 76 ? 4 : r < 88 ? 5 : 6;
    if (kind === 0) { c[a] = GATE; free = (a + 1 + this.pick(2)) % 3; }                       // one gate
    else if (kind === 1) { free = a; c[(a + 1) % 3] = GATE; c[(a + 2) % 3] = GATE; }          // two gates
    else if (kind === 2) { c[0] = c[1] = c[2] = HURDLE; free = this.lastFree; need = 1; }     // hurdle wall: jump
    else if (kind === 3) { c[0] = c[1] = c[2] = BEAM; free = this.lastFree; need = 2; }       // beam wall: slide
    else if (kind === 4) { b = (a + 1 + this.pick(2)) % 3; c[a] = GATE; c[b] = HURDLE; c[3 - a - b] = BEAM; free = b; need = 1; }
    else if (kind === 5) { free = a; c[(a + 1) % 3] = GATE; c[(a + 2) % 3] = GATE; c[a] = HURDLE; need = 1; }
    else { free = a; c[(a + 1) % 3] = GATE; c[(a + 2) % 3] = GATE; c[a] = BEAM; need = 2; }
    // a trail of stars leading into the way through (sometimes a tempting one that ends at a gate)
    var v = speedAt(s), gap = s - this.prevS;
    var lane = free, trap = tier >= 2 && this.pick(100) < 15;
    if (trap) { for (var i = 0; i < 3; i++) if (c[i] === GATE) lane = i; }
    var n = 3 + this.pick(2), step = Math.floor(gap / (n + 3));
    if (step < 5 * v) { n = 2; step = Math.floor(gap / 5); }
    var prevS = s - gap + step;
    for (var j = 1; j <= n; j++) {
      var row = [EMPTY, EMPTY, EMPTY]; row[lane] = STAR;
      this.rows.push({ s: prevS + step * j, c: row, k: -1 });
    }
    if (need === 1 && !trap) { var air = [EMPTY, EMPTY, EMPTY]; air[free] = STAR_AIR; this.rows.push({ s: s, c: c, k: k, air: air }); }
    else this.rows.push({ s: s, c: c, k: k });
    this.lastFree = free;
    this.prevS = s;
    this.nextS = s + gapAt(this.k) * speedAt(s);
  };

  // ---- one ride ----
  function Ride(seed) {
    this.seed = seed >>> 0;
    this.course = new Course(this.seed);
    this.f = 0; this.s = 0; this.lane = 0;
    this.jumpT = 0; this.duckT = 0; this.lastLaneF = -999;
    this.dead = false; this.cause = 0;
    this.points = 0; this.stars = 0; this.streak = 0; this.near = 0; this.best_mult = 1;
    this.ri = 0;                     // next row to resolve
    this.events = [];                // what just happened this frame, for the game to show (not part of the state)
    this.log = [];                   // [frame, action] of every accepted input
  }
  Ride.prototype.mult = function () { var m = 1 + Math.floor(this.streak / STREAK_PER_MULT); return m > MULT_MAX ? MULT_MAX : m; };
  Ride.prototype.score = function () { return Math.floor(this.s / U) + this.points; };
  Ride.prototype.input = function (a) {            // 'L' 'R' 'U' 'D' - applied now, before the next step
    if (this.dead) return false;
    if (a === 'L') { if (this.lane <= -1) return false; this.lane--; this.lastLaneF = this.f; }
    else if (a === 'R') { if (this.lane >= 1) return false; this.lane++; this.lastLaneF = this.f; }
    else if (a === 'U') { if (this.jumpT >= AIR_LO) return false; this.jumpT = JUMP_F; this.duckT = 0; }
    else if (a === 'D') { if (this.jumpT > 4) this.jumpT = 4; this.duckT = DUCK_F; }
    else return false;
    this.log.push([this.f, a]);
    return true;
  };
  Ride.prototype.airborne = function () { return this.jumpT >= AIR_LO && this.jumpT <= AIR_HI; };
  Ride.prototype.sliding = function () { return this.jumpT === 0 && this.duckT > 0; };
  Ride.prototype.step = function () {
    if (this.dead) return;
    this.events.length = 0;
    var prev = this.s;
    this.s += speedAt(this.s);
    this.f++;
    if (this.jumpT > 0) this.jumpT--;
    else if (this.duckT > 0) this.duckT--;
    var rows = this.course.rows;
    this.course.ensure(this.s + 400 * U);
    while (this.ri < rows.length && rows[this.ri].s <= this.s) {
      var row = rows[this.ri++];
      if (row.s <= prev) continue;
      var li = this.lane + 1, cell = row.c[li], m;
      if (row.k < 0) {                              // star row
        if (cell === STAR) { this.collect(row, li); }
        else { if (this.streak >= STREAK_PER_MULT) this.events.push({ t: 'lost' }); this.streak = 0; row.missed = 1; }
        continue;
      }
      if (cell === GATE || (cell === HURDLE && !this.airborne()) || (cell === BEAM && !this.sliding())) {
        this.dead = true; this.cause = cell; this.events.push({ t: 'crash', cell: cell, row: row });
        return;
      }
      if (row.air && row.air[li] === STAR_AIR) this.collect(row, li);
      m = this.mult();
      var gateBeside = (li > 0 && row.c[li - 1] === GATE) || (li < 2 && row.c[li + 1] === GATE);
      if (gateBeside && this.f - this.lastLaneF <= NEAR_F) { this.near++; this.points += 5 * m; this.events.push({ t: 'near', pts: 5 * m }); }
      this.events.push({ t: 'pass', cell: cell });
    }
    if (this.f >= MAX_FRAMES) { this.dead = true; this.cause = 9; this.events.push({ t: 'crash', cell: 9 }); }
  };
  Ride.prototype.collect = function (row, li) {
    this.stars++; this.streak++;
    var m = this.mult(); if (m > this.best_mult) this.best_mult = m;
    this.points += 10 * m;
    row.got = (row.got || 0) | (1 << li);
    this.events.push({ t: 'star', pts: 10 * m, mult: m, streak: this.streak, up: this.streak % STREAK_PER_MULT === 0 && m <= MULT_MAX && this.streak <= STREAK_PER_MULT * (MULT_MAX - 1) });
  };

  // ---- inputs as a short string: <frames since the previous input, base 36><L|R|U|D> ----
  function encode(log) {
    var out = '', last = 0;
    for (var i = 0; i < log.length; i++) { out += (log[i][0] - last).toString(36) + log[i][1]; last = log[i][0]; }
    return out;
  }
  function decode(str) {
    var log = [], f = 0, re = /([0-9a-z]+)([LRUD])/g, m, used = 0;
    while ((m = re.exec(str))) { f += parseInt(m[1], 36); log.push([f, m[2]]); used += m[0].length; }
    if (used !== str.length) throw new Error('bad input string');
    return log;
  }
  // Re-run a ride from its seed and inputs. Returns what really happened.
  function replay(seed, inputs) {
    var log = typeof inputs === 'string' ? decode(inputs) : inputs, r = new Ride(seed), i = 0;
    if (log.length > 20000) throw new Error('too many inputs');
    while (!r.dead) {
      while (i < log.length && log[i][0] === r.f) { r.input(log[i][1]); i++; }
      if (i < log.length && log[i][0] < r.f) throw new Error('inputs out of order');
      r.step();
    }
    return { score: r.score(), frames: r.f, metres: Math.floor(r.s / U), stars: r.stars, near: r.near, mult: r.best_mult, unused: log.length - i };
  }

  var api = { FPS: FPS, U: U, JUMP_F: JUMP_F, DUCK_F: DUCK_F, MULT_MAX: MULT_MAX, STREAK_PER_MULT: STREAK_PER_MULT,
    EMPTY: EMPTY, GATE: GATE, HURDLE: HURDLE, BEAM: BEAM, STAR: STAR, STAR_AIR: STAR_AIR,
    AIR_LO: AIR_LO, AIR_HI: AIR_HI, NEAR_F: NEAR_F, V0: V0, VMAX: VMAX,
    Ride: Ride, Course: Course, speedAt: speedAt, daySeed: daySeed, hashSeed: hashSeed, encode: encode, decode: decode, replay: replay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CometSim = api;
})(typeof self !== 'undefined' ? self : this);
