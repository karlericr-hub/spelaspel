'use strict';
// =====================================================================
// KATTHOPP – en kattunge hoppar över vallgravar och mellan lådor.
// Håll in för att ladda hoppet: ju längre man håller, desto längre hopp.
// Fem banor som blir svårare och svårare, tre liv per omgång.
//
// Spelet låses upp med poäng i SpelaSpel. Startsidan sparar en biljett
// (spelaspel.katthopp-biljett) som här blir en omgång med tre liv. Omgången
// sparas så att den finns kvar om sidan laddas om. När liven är slut (eller
// alla banor är klarade) behövs 230 nya poäng.
// =====================================================================
(function () {

// ---------- Konstanter ----------
const VIEW_W = 320;           // logisk bredd på skärmen (höjden följer skärmen)
const GRAV = 1500;
const ANGLE = 60 * Math.PI / 180;
const COS_A = Math.cos(ANGLE);
const SIN_A = Math.sin(ANGLE);
const V_MIN = 230;            // kortaste hoppet (~30 enheter)
const V_MAX = 665;            // längsta hoppet (~255 enheter)
const CHARGE_TIME = 1.15;     // sekunder till fullt laddat hopp
const CAT_W = 28;
const CAT_H = 30;
const WATER_Y = 620;
const DEATH_Y = WATER_Y + 14;
const STEP = 1 / 120;         // fast tidssteg – samma i spelet och i förhandsberäkningen
const INK = '#3b2314';

const LEVELS = [
  {
    name: 'Trädgården', theme: 'garden', seed: 1101, steps: 12,
    gap: [45, 100], up: 40, down: 45,
    kinds: { ground: 4, post: 4, float: 2 },
    width: [64, 94], groundW: [110, 180],
    minWin: 0.2, maxWin: 9, preview: 1, fishChance: 0.6,
  },
  {
    name: 'Slottsgraven', theme: 'castle', seed: 2202, steps: 15,
    gap: [60, 125], up: 60, down: 60,
    kinds: { ground: 3, post: 4, float: 1, balloon: 2 },
    width: [58, 86], groundW: [100, 160],
    move: { amp: [22, 32], period: [3.8, 4.6], ax: ['x'] },
    minWin: 0.15, maxWin: 0.5, preview: 0.6, fishChance: 0.6,
  },
  {
    name: 'Hamnen', theme: 'harbor', seed: 3303, steps: 17,
    gap: [70, 145], up: 70, down: 70,
    kinds: { ground: 2, post: 2, float: 3, balloon: 3 },
    width: [54, 80], groundW: [90, 150],
    move: { amp: [28, 40], period: [3.2, 3.9], ax: ['x', 'y'] },
    minWin: 0.12, maxWin: 0.38, preview: 0.42, fishChance: 0.8,
  },
  {
    name: 'Takåsen', theme: 'roof', seed: 4404, steps: 19,
    gap: [75, 155], up: 80, down: 80,
    kinds: { ground: 3, post: 3, balloon: 3, pop: 2 },
    width: [50, 76], groundW: [90, 140],
    move: { amp: [32, 46], period: [2.9, 3.5], ax: ['x', 'y'] },
    popDelay: 1.5, minWin: 0.1, maxWin: 0.3, preview: 0.3, fishChance: 0.85,
  },
  {
    name: 'Stjärnnatten', theme: 'night', seed: 5505, steps: 21,
    gap: [80, 165], up: 85, down: 85,
    kinds: { ground: 1, post: 2, float: 1, balloon: 4, pop: 2 },
    width: [46, 68], groundW: [80, 130],
    move: { amp: [36, 50], period: [2.5, 3.1], ax: ['x', 'y'] },
    popDelay: 1.3, minWin: 0.09, maxWin: 0.24, preview: 0.2, fishChance: 0.9,
  },
];

// ---------- Små hjälpfunktioner ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (rnd, r) => lerp(r[0], r[1], rnd());

// ---------- Fysik ----------
// Plattformens position vid tiden t (rörliga lådor svänger fram och tillbaka)
function platformPos(p, t) {
  let x = p.bx;
  let y = p.by;
  if (p.move) {
    const o = p.move.amp * Math.sin((2 * Math.PI * t) / p.move.period + p.move.phase);
    if (p.move.ax === 'x') x += o; else y += o;
  }
  if (p.bob) y += 2.2 * Math.sin(t * 2.1 + p.seed * 6);
  return { x, y };
}

// Ett tidssteg för en katt i luften. Returnerar kroppen som katten landade på.
function physStep(cat, bodies, h) {
  const prevBottom = cat.y;
  cat.vy += GRAV * h;
  cat.x += cat.vx * h;
  cat.y += cat.vy * h;
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.gone) continue;
    const l = cat.x - CAT_W / 2;
    const r = cat.x + CAT_W / 2;
    const top = cat.y - CAT_H;
    const bot = cat.y;
    if (r <= b.x || l >= b.x + b.w || bot <= b.y || top >= b.y + b.h) continue;
    const wasAbove = prevBottom <= b.py + 3;
    const nearTop = bot - b.y <= 12;
    if (cat.vy >= 0 && (wasAbove || nearTop)) {
      cat.y = b.y;
      cat.vy = 0;
      return b;
    }
    const ox = Math.min(r - b.x, b.x + b.w - l);
    const oyBottom = b.y + b.h - top;
    if (ox < oyBottom) {
      // Krock med sidan – studsa lite bakåt och glid ner
      if (cat.x < b.x + b.w / 2) {
        cat.x = b.x - CAT_W / 2 - 0.01;
        cat.vx = Math.min(0, -cat.vx * 0.15);
      } else {
        cat.x = b.x + b.w + CAT_W / 2 + 0.01;
        cat.vx = Math.max(0, -cat.vx * 0.15);
      }
    } else {
      // Slog i huvudet underifrån
      cat.y = b.y + b.h + CAT_H + 0.01;
      cat.vy = Math.max(cat.vy, 60);
    }
  }
  return null;
}

// Räknar fram ett hopp utan att påverka spelet (för siktet och banbyggaren)
function simulateJump(plats, t0, x, y, charge, maxSteps, pathEvery) {
  const v = V_MIN + (V_MAX - V_MIN) * charge;
  const cat = { x, y, vx: v * COS_A, vy: -v * SIN_A };
  const bodies = plats.map((p) => {
    const q = platformPos(p, t0);
    const fy = p.fallY || 0;
    return { p, x: q.x, y: q.y + fy, w: p.w, h: p.h, px: q.x, py: q.y + fy, fy, gone: p.gone };
  });
  let t = t0;
  const path = pathEvery ? [x, y] : null;
  const steps = maxSteps || 260;
  for (let i = 0; i < steps; i++) {
    t += STEP;
    for (let j = 0; j < bodies.length; j++) {
      const b = bodies[j];
      b.px = b.x;
      b.py = b.y;
      const q = platformPos(b.p, t);
      b.x = q.x;
      b.y = q.y + b.fy;
    }
    const hit = physStep(cat, bodies, STEP);
    if (path && i % pathEvery === 0) path.push(cat.x, cat.y);
    if (hit) {
      if (path) path.push(cat.x, cat.y);
      return { plat: hit.p, x: cat.x, y: cat.y, path, t };
    }
    if (cat.y > DEATH_Y) return { plat: null, path, t };
  }
  return { plat: null, path, t };
}

// ---------- Banbyggaren ----------
// Banorna slumpas fram med ett fast frö (samma bana varje gång). Varje
// hopp provas i förväg med samma fysik som spelet så att det alltid går att
// klara – och svårighetsgraden styrs av hur stort "laddfönstret" får vara.
function pickWeighted(rnd, weights) {
  const keys = Object.keys(weights);
  let sum = 0;
  for (const k of keys) sum += weights[k];
  let r = rnd() * sum;
  for (const k of keys) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

function rightReach(p) {
  return p.bx + p.w + (p.move && p.move.ax === 'x' ? p.move.amp : 0);
}

function makePlatform(kind, x, y, w, h, extra) {
  return Object.assign({
    kind, bx: x, by: y, x, y, w, h, px: x, py: y,
    move: null, bob: false, seed: 0,
    fallY: 0, fallV: 0, rot: 0, gone: false,
    triggered: false, popT: 0, popped: false, popDelay: 1.4,
  }, extra || {});
}

function makeCandidate(L, rnd, prev, shrink, isGoal) {
  let kind = isGoal ? 'goal' : pickWeighted(rnd, L.kinds);
  // Ingen rörlig låda direkt efter en ballonglåda som spricker – då hinner
  // man inte vänta in rätt läge.
  if (kind === 'balloon' && prev.kind === 'pop') kind = 'post';
  if (kind === 'pop' && prev.kind === 'pop') kind = 'post';
  const target = prev.by + lerp(-L.up, L.down, rnd());
  let w;
  let top;
  let h;
  let move = null;
  let bob = false;
  switch (kind) {
    case 'goal':
      w = 300;
      top = clamp(target, WATER_Y - 95, WATER_Y - 55);
      h = WATER_Y + 240 - top;
      break;
    case 'ground':
      w = rand(rnd, L.groundW);
      top = clamp(target, WATER_Y - 105, WATER_Y - 45);
      h = WATER_Y + 240 - top;
      break;
    case 'post':
      w = rand(rnd, L.width);
      top = clamp(target, WATER_Y - 235, WATER_Y - 60);
      h = WATER_Y + 240 - top;
      break;
    case 'float':
      if (L.theme === 'garden') {
        w = lerp(74, 92, rnd());
        top = WATER_Y - 8;
        h = 14;
      } else {
        w = Math.max(56, rand(rnd, L.width));
        top = WATER_Y - 32;
        h = 44;
      }
      bob = true;
      break;
    case 'balloon': {
      w = rand(rnd, L.width);
      h = 38;
      const ax = L.move.ax[Math.floor(rnd() * L.move.ax.length)];
      const amp = rand(rnd, L.move.amp) * shrink;
      top = clamp(target, WATER_Y - 230 + (ax === 'y' ? amp : 0), WATER_Y - 90 - (ax === 'y' ? amp : 0));
      move = { ax, amp, period: rand(rnd, L.move.period), phase: rnd() * Math.PI * 2 };
      break;
    }
    case 'pop':
      w = rand(rnd, L.width);
      h = 38;
      top = clamp(target, WATER_Y - 225, WATER_Y - 85);
      break;
    default:
      break;
  }
  const gap = rand(rnd, L.gap) * shrink;
  const x = rightReach(prev) + gap + (move && move.ax === 'x' ? move.amp : 0);
  return makePlatform(kind, x, top, w, h, {
    move, bob, seed: rnd(), popDelay: L.popDelay || 1.4,
  });
}

// Provar alla laddningar 0..1 och returnerar längsta sammanhängande fönster
// som landar på målet.
const CHARGE_SAMPLES = 51;
function landingWindow(prev, cand, offset, t0) {
  const pos = platformPos(prev, t0);
  const sx = pos.x + offset;
  const sy = pos.y;
  let best = 0;
  let run = 0;
  let bestEnd = -1;
  for (let i = 0; i < CHARGE_SAMPLES; i++) {
    const c = i / (CHARGE_SAMPLES - 1);
    const res = simulateJump([prev, cand], t0, sx, sy, c, 240, 0);
    if (res.plat === cand) {
      run++;
      if (run > best) { best = run; bestEnd = i; }
    } else {
      run = 0;
    }
  }
  const step = 1 / (CHARGE_SAMPLES - 1);
  return {
    win: best * step,
    mid: best ? ((bestEnd - (best - 1) / 2) * step) : -1,
    sx, sy, t0,
  };
}

function validateJump(prev, cand, L) {
  const offsets = prev.w >= 100 ? [prev.w - 14, prev.w - 50] : [Math.max(12, prev.w * 0.25), prev.w - 12];
  const moving = prev.move || cand.move;
  const need = cand.kind === 'goal' ? Math.max(0.2, L.minWin) : L.minWin;
  if (!moving) {
    let mainRes = null;
    for (const off of offsets) {
      const r = landingWindow(prev, cand, off, 0);
      if (r.win < need) return null;
      if (!mainRes) mainRes = r;
    }
    return mainRes;
  }
  const period = Math.max(prev.move ? prev.move.period : 0, cand.move ? cand.move.period : 0);
  const PH = 8;
  for (const off of offsets) {
    let ok = 0;
    for (let k = 0; k < PH; k++) {
      const r = landingWindow(prev, cand, off, (k / PH) * period);
      if (r.win >= need * 0.8) ok++;
    }
    if (ok < 3) return null;
  }
  return { win: need, mid: -1 };
}

const levelCache = {};
function buildLevel(idx) {
  if (levelCache[idx]) return cloneLevel(levelCache[idx]);
  const L = LEVELS[idx];
  const rnd = mulberry32(L.seed);
  const plats = [];
  const fish = [];
  const start = makePlatform('ground', -360, WATER_Y - 70, 500, 310, { seed: 0.3, start: true });
  plats.push(start);
  let prev = start;
  for (let i = 0; i <= L.steps; i++) {
    const isGoal = i === L.steps;
    let placed = null;
    let res = null;
    for (let attempt = 0; attempt < 50 && !placed; attempt++) {
      // De första försöken får bara vara lagom svåra (inte för lätta);
      // hittas inget krymps avståndet tills hoppet går att klara.
      const strict = attempt < 25 && !isGoal;
      const shrink = attempt < 25 ? 1 : Math.max(0.35, 1 - (attempt - 25) * 0.04);
      const cand = makeCandidate(L, rnd, prev, shrink, isGoal);
      res = validateJump(prev, cand, L);
      if (res && strict && res.mid >= 0 && res.win > L.maxWin) res = null;
      if (res) placed = cand;
    }
    if (!placed) {
      // Nödlösning: en lätt låda strax intill
      const kind = isGoal ? 'goal' : 'post';
      const top = isGoal ? WATER_Y - 70 : clamp(prev.by, WATER_Y - 200, WATER_Y - 60);
      placed = makePlatform(kind, rightReach(prev) + 45, top, isGoal ? 300 : 70, WATER_Y + 240 - top, { seed: rnd() });
      res = null;
    }
    // Fisk mitt i en bra hoppbana (bara för hopp mellan stillastående lådor)
    if (!isGoal && res && res.mid >= 0 && !prev.move && !placed.move && rnd() < L.fishChance) {
      const sim = simulateJump([prev, placed], 0, res.sx, res.sy, res.mid, 240, 1);
      if (sim.plat === placed && sim.path.length > 8) {
        const n = sim.path.length / 2;
        const k = Math.floor(n * lerp(0.42, 0.55, rnd()));
        fish.push({ x: sim.path[k * 2], y: sim.path[k * 2 + 1] - CAT_H / 2, got: false, seed: rnd() });
      }
    }
    plats.push(placed);
    prev = placed;
  }
  const level = { idx, L, plats, fish, goal: prev };
  levelCache[idx] = level;
  return cloneLevel(level);
}

function cloneLevel(level) {
  const plats = level.plats.map((p) => {
    const q = Object.assign({}, p);
    q.p = q;
    return q;
  });
  return {
    idx: level.idx,
    L: level.L,
    plats,
    fish: level.fish.map((f) => Object.assign({}, f)),
    goal: plats[plats.length - 1],
  };
}

// ---------- Exportera kärnan för test i Node ----------
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS, buildLevel, simulateJump, platformPos, physStep, landingWindow,
    consts: { V_MIN, V_MAX, CHARGE_TIME, WATER_Y, STEP },
  };
}
if (typeof document === 'undefined') return;

// =====================================================================
// Lagring: biljett, pågående omgång och upplåsta banor
// =====================================================================
const TICKET_KEY = 'spelaspel.katthopp-biljett';
const RUN_KEY = 'katthopp.runda';
const UNLOCK_KEY = 'katthopp.upplast';
const SOUND_KEY = 'katthopp.ljud';

const memStore = {};
let storageOk = true;
try {
  const k = '__katthopp_test__';
  localStorage.setItem(k, '1');
  localStorage.removeItem(k);
} catch (e) {
  storageOk = false;
}
const Store = {
  get(k) {
    if (!storageOk) return k in memStore ? memStore[k] : null;
    try { return localStorage.getItem(k); } catch (e) { return null; }
  },
  set(k, v) {
    memStore[k] = v;
    if (!storageOk) return;
    try { localStorage.setItem(k, v); } catch (e) { /* ignorera */ }
  },
  del(k) {
    delete memStore[k];
    if (!storageOk) return;
    try { localStorage.removeItem(k); } catch (e) { /* ignorera */ }
  },
};

// Utan lagring går det inte att spärra – släpp då igenom spelaren (samma
// som Kattdropp gör).
function hasTicket() {
  if (!storageOk) return !('used' in memStore);
  return Store.get(TICKET_KEY) === '1';
}
function useTicket() {
  memStore.used = '1';
  Store.del(TICKET_KEY);
}
function loadRun() {
  const raw = Store.get(RUN_KEY);
  if (!raw) return null;
  try {
    const r = JSON.parse(raw);
    if (r && Number.isInteger(r.level) && r.level >= 0 && r.level < LEVELS.length &&
        Number.isInteger(r.lives) && r.lives > 0 && r.lives <= 3) {
      return { level: r.level, lives: r.lives, fish: Number(r.fish) || 0 };
    }
  } catch (e) { /* trasig data */ }
  return null;
}
function saveRun(run) {
  if (run) Store.set(RUN_KEY, JSON.stringify(run));
  else Store.del(RUN_KEY);
}
function loadUnlocked() {
  const v = Number(Store.get(UNLOCK_KEY));
  return Number.isInteger(v) ? clamp(v, 0, LEVELS.length - 1) : 0;
}
function saveUnlocked(v) {
  Store.set(UNLOCK_KEY, String(clamp(v, 0, LEVELS.length - 1)));
}

// =====================================================================
// Ljud (syntetiserat med WebAudio – inga ljudfiler behövs)
// =====================================================================
const Sound = {
  ctx: null,
  master: null,
  muted: Store.get(SOUND_KEY) === 'av',
  hum: null,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  setMuted(m) {
    this.muted = m;
    Store.set(SOUND_KEY, m ? 'av' : 'pa');
    if (this.master) this.master.gain.value = m ? 0 : 0.8;
  },
  tone(freq, dur, opt) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const o = opt || {};
    const t = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    const vol = o.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },
  noise(dur, opt) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const o = opt || {};
    const t = ctx.currentTime + (o.delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 800, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
  },
  meow(delay, pitch) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const p = pitch || 1;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(560 * p, t);
    osc.frequency.linearRampToValueAtTime(860 * p, t + 0.16);
    osc.frequency.linearRampToValueAtTime(520 * p, t + 0.5);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(1800, t + 0.18);
    f.frequency.linearRampToValueAtTime(900, t + 0.5);
    f.Q.value = 2.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
    g.gain.setValueAtTime(0.35, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(f);
    f.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.6);
  },
  startHum() {
    const ctx = this.ensure();
    if (!ctx || this.muted || this.hum) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 200;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.08);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    this.hum = { osc, g };
  },
  setHum(charge) {
    if (!this.hum) return;
    this.hum.osc.frequency.setTargetAtTime(200 + charge * 520, this.ctx.currentTime, 0.03);
  },
  stopHum() {
    if (!this.hum) return;
    const { osc, g } = this.hum;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.stop(t + 0.1);
    this.hum = null;
  },
  play(name) {
    switch (name) {
      case 'jump':
        this.tone(320, 0.25, { to: 760, glide: 0.18, type: 'sine', vol: 0.25 });
        break;
      case 'land':
        this.noise(0.12, { freq: 500, to: 120, vol: 0.35 });
        this.tone(140, 0.1, { to: 80, vol: 0.18 });
        break;
      case 'fish':
        this.tone(988, 0.12, { type: 'triangle', vol: 0.2 });
        this.tone(1319, 0.25, { type: 'triangle', vol: 0.2, delay: 0.08 });
        break;
      case 'splash':
        this.noise(0.6, { filter: 'bandpass', freq: 2400, to: 300, q: 0.8, vol: 0.45 });
        this.tone(500, 0.35, { to: 150, vol: 0.12 });
        break;
      case 'lose':
        this.tone(523, 0.18, { type: 'triangle', vol: 0.18, delay: 0.25 });
        this.tone(392, 0.18, { type: 'triangle', vol: 0.18, delay: 0.45 });
        this.tone(262, 0.4, { type: 'triangle', vol: 0.18, delay: 0.65 });
        break;
      case 'pop':
        this.noise(0.08, { filter: 'highpass', freq: 1500, vol: 0.5 });
        this.tone(900, 0.08, { to: 200, vol: 0.15 });
        break;
      case 'creak':
        this.tone(180, 0.3, { type: 'sawtooth', to: 140, vol: 0.05 });
        break;
      case 'bonk':
        this.tone(220, 0.12, { type: 'square', to: 110, vol: 0.08 });
        break;
      case 'respawn':
        this.tone(660, 0.12, { type: 'triangle', vol: 0.15 });
        this.tone(880, 0.2, { type: 'triangle', vol: 0.15, delay: 0.09 });
        break;
      case 'win': {
        const notes = [523, 659, 784, 1047, 784, 1047];
        notes.forEach((n, i) => this.tone(n, 0.22, { type: 'triangle', vol: 0.2, delay: i * 0.11 }));
        this.meow(0.75, 1);
        break;
      }
      case 'click':
        this.tone(700, 0.06, { type: 'triangle', vol: 0.12 });
        break;
      default:
        break;
    }
  },
};

// =====================================================================
// Teman och grafik
// =====================================================================
const THEMES = {
  garden: {
    sky: ['#56c3ff', '#a8e5ff', '#fff2c4'], water: ['#62c8f0', '#2b86c6'], foam: '#e6f8ff',
    stage: '#9fdcff', balloons: ['#ff6b6b', '#ffd93d', '#6bcBff'],
  },
  castle: {
    sky: ['#64b2e6', '#bfe0f4', '#ffd6a6'], water: ['#4fae9d', '#215f57'], foam: '#d5f7ec',
    stage: '#9fd0ef', balloons: ['#ff6b6b', '#ffd93d', '#b98cff'],
  },
  harbor: {
    sky: ['#48b4f0', '#9fdbfa', '#e9f8ff'], water: ['#2f9be0', '#134f8f'], foam: '#e1f3ff',
    stage: '#7fcaf5', balloons: ['#ff5f7e', '#ffd93d', '#5ee0a0'],
  },
  roof: {
    sky: ['#4b3a86', '#d6638a', '#ffb066'], water: ['#7a5aa8', '#2d2457'], foam: '#ffd8b8',
    stage: '#b45a8c', balloons: ['#ffd93d', '#5ad1ff', '#ff7aa8'],
  },
  night: {
    sky: ['#060b28', '#17245c', '#3a4c93'], water: ['#25447f', '#0a1533'], foam: '#a9c0ff',
    stage: '#17245c', balloons: ['#ff7aa8', '#ffd93d', '#7af0ff'],
  },
};

const KITTEN = {
  fur: '#f7a24f', dark: '#d9742a', light: '#ffe4c0', inner: '#ffb0b6',
  nose: '#ff7b93', eye: '#2b1a10',
};
const MAMA = {
  fur: '#b9bccb', dark: '#878ba2', light: '#ffffff', inner: '#ffc2c8',
  nose: '#ff8fa3', eye: '#2b1a10',
};

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}
function ellipse(ctx, x, y, rx, ry, rot) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
}
function fillStroke(ctx, fill, lw) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw !== 0) {
    ctx.lineWidth = lw || 2.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}
function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.1, x - s * 0.5, y + s * 0.25);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.25);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.1, x, y, x, y + s * 0.35);
  ctx.closePath();
}

// ---------- Kattungen ----------
function drawLeg(ctx, px, py, angle, len, wid, fill) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  rr(ctx, -wid / 2, -wid / 2, wid, len + wid / 2, wid / 2);
  fillStroke(ctx, fill, 2.2);
  ctx.restore();
}

function drawCat(ctx, o) {
  const P = o.pal;
  const t = o.t || 0;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale((o.flip ? -1 : 1) * o.scale, o.scale);
  if (o.rot) {
    ctx.translate(0, -15);
    ctx.rotate(o.rot);
    ctx.translate(0, 15);
  }
  ctx.scale(o.sx || 1, o.sy || 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const pose = o.pose || 'stand';
  const air = pose === 'jump' || pose === 'fall';

  // Svans
  const sw = Math.sin(t * 2.4) * 4;
  ctx.beginPath();
  if (air) {
    ctx.moveTo(-12, -14);
    ctx.bezierCurveTo(-24, -14, -30, -20 + sw * 0.3, -38, -24 + sw * 0.4);
  } else if (pose === 'sit') {
    ctx.moveTo(-10, -6);
    ctx.bezierCurveTo(-24, -2, -30, -10 + sw * 0.5, -24, -22 + sw);
  } else {
    ctx.moveTo(-12, -13);
    ctx.bezierCurveTo(-24, -15, -30, -28 + sw, -21, -40 + sw);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8.6;
  ctx.stroke();
  ctx.strokeStyle = P.fur;
  ctx.lineWidth = 4.4;
  ctx.stroke();

  // Bortre benen (mörkare)
  let fa = 0, ba = 0, fl = 10, bl = 8;
  if (pose === 'jump') { fa = -1.05; ba = 1.05; fl = 11; bl = 11; }
  else if (pose === 'fall') { fa = -0.45; ba = 0.5; fl = 11; bl = 10; }
  else if (pose === 'crouch') { fa = -0.15; ba = 0.1; fl = 8; bl = 6; }
  const step = o.walk ? Math.sin(o.walk) * 0.5 : 0;
  drawLeg(ctx, 10, -9, fa - 0.12 + step, fl, 5.6, P.dark);
  drawLeg(ctx, -9, -8, ba + 0.1 - step, bl, 6, P.dark);

  // Kropp
  ellipse(ctx, 0, -13, 15.5, 10.5);
  fillStroke(ctx, P.fur, 2.6);
  ellipse(ctx, 4, -9.5, 9, 5.2);
  ctx.fillStyle = P.light;
  ctx.fill();
  // Ränder på ryggen
  ctx.strokeStyle = P.dark;
  ctx.lineWidth = 2.6;
  for (let i = 0; i < 3; i++) {
    const sx = -9 + i * 6;
    ctx.beginPath();
    ctx.moveTo(sx, -23 + Math.abs(i - 1) * 0.6);
    ctx.quadraticCurveTo(sx + 1.5, -19, sx - 0.5, -16);
    ctx.stroke();
  }

  // Närmre benen
  drawLeg(ctx, 6, -9, fa + 0.05 - step, fl, 6, P.fur);
  drawLeg(ctx, -11, -8, ba - step * 0.5, bl, 6.4, P.fur);
  if (!air) {
    // Lår
    ellipse(ctx, -10, -11, 6.5, 6.5);
    fillStroke(ctx, P.fur, 2.4);
    ctx.strokeStyle = P.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-10, -11, 3.2, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();
  }

  // Huvud
  const hx = 13;
  const hy = pose === 'crouch' ? -26 : -29;
  // Öron
  const earT = Math.sin(t * 0.7) > 0.96 ? 1.5 : 0;
  ctx.beginPath();
  ctx.moveTo(hx - 11, hy - 6);
  ctx.quadraticCurveTo(hx - 10, hy - 20 - earT, hx - 7, hy - 21 - earT);
  ctx.quadraticCurveTo(hx - 2, hy - 16, hx + 1, hy - 11);
  ctx.closePath();
  fillStroke(ctx, P.fur, 2.4);
  ctx.beginPath();
  ctx.moveTo(hx + 2, hy - 12);
  ctx.quadraticCurveTo(hx + 8, hy - 19, hx + 11, hy - 20);
  ctx.quadraticCurveTo(hx + 13, hy - 12, hx + 12, hy - 4);
  ctx.closePath();
  fillStroke(ctx, P.fur, 2.4);
  ctx.fillStyle = P.inner;
  ctx.beginPath();
  ctx.moveTo(hx - 9, hy - 9);
  ctx.quadraticCurveTo(hx - 8.5, hy - 17, hx - 7, hy - 17.5);
  ctx.quadraticCurveTo(hx - 4, hy - 14, hx - 2, hy - 11);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + 4, hy - 12);
  ctx.quadraticCurveTo(hx + 8, hy - 16.5, hx + 9.6, hy - 17);
  ctx.quadraticCurveTo(hx + 10.6, hy - 11, hx + 10, hy - 7);
  ctx.closePath();
  ctx.fill();

  ellipse(ctx, hx, hy, 13.2, 12.2);
  fillStroke(ctx, P.fur, 2.6);
  // Kinder (fluff)
  ellipse(ctx, hx + 4, hy + 5, 8.5, 5.2);
  ctx.fillStyle = P.light;
  ctx.fill();
  // Pannränder
  ctx.strokeStyle = P.dark;
  ctx.lineWidth = 2.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(hx + i * 3.4, hy - 11.5);
    ctx.lineTo(hx + i * 3.0 + 0.4, hy - 7.5);
    ctx.stroke();
  }

  // Ögon
  const ex1 = hx - 2.5;
  const ex2 = hx + 6.5;
  const ey = hy - 1;
  if (o.mood === 'happy') {
    ctx.strokeStyle = P.eye;
    ctx.lineWidth = 2.2;
    for (const ex of [ex1, ex2]) {
      ctx.beginPath();
      ctx.arc(ex, ey + 1.5, 3, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else if (o.blink) {
    ctx.strokeStyle = P.eye;
    ctx.lineWidth = 2;
    for (const ex of [ex1, ex2]) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.6, ey);
      ctx.quadraticCurveTo(ex, ey + 1.6, ex + 2.6, ey);
      ctx.stroke();
    }
  } else {
    const big = o.mood === 'scared' ? 1.25 : 1;
    for (const ex of [ex1, ex2]) {
      ellipse(ctx, ex, ey, 3.1 * big, 4.2 * big);
      ctx.fillStyle = P.eye;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 1, ey - 1.6, 1.35, 1.35);
      ctx.fill();
      ellipse(ctx, ex - 0.9, ey + 1.5, 0.65, 0.65);
      ctx.fill();
    }
  }
  // Rosiga kinder
  ctx.fillStyle = 'rgba(255, 110, 130, 0.42)';
  ellipse(ctx, hx - 7, hy + 4, 2.8, 1.9);
  ctx.fill();
  ellipse(ctx, hx + 11.2, hy + 4, 2.2, 1.8);
  ctx.fill();
  // Nos och mun
  ctx.fillStyle = P.nose;
  ctx.beginPath();
  ctx.moveTo(hx + 1.6, hy + 2.6);
  ctx.lineTo(hx + 4.6, hy + 2.6);
  ctx.lineTo(hx + 3.1, hy + 4.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (o.mood === 'scared') {
    ellipse(ctx, hx + 3.1, hy + 7, 1.6, 2);
    ctx.fillStyle = '#7a2a2a';
    ctx.fill();
  } else {
    ctx.moveTo(hx + 0.6, hy + 5.4);
    ctx.quadraticCurveTo(hx + 1.9, hy + 6.8, hx + 3.1, hy + 4.6);
    ctx.quadraticCurveTo(hx + 4.3, hy + 6.8, hx + 5.6, hy + 5.4);
    ctx.stroke();
  }
  // Morrhår
  ctx.strokeStyle = 'rgba(59, 35, 20, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx + 8, hy + 3.5); ctx.lineTo(hx + 17, hy + 1.5);
  ctx.moveTo(hx + 8, hy + 5); ctx.lineTo(hx + 17, hy + 6);
  ctx.moveTo(hx - 3, hy + 4); ctx.lineTo(hx - 11, hy + 3);
  ctx.stroke();

  ctx.restore();
}

// ---------- Små figurer ----------
function drawFish(ctx, x, y, t, seed) {
  const bob = Math.sin(t * 3 + seed * 10) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(Math.sin(t * 2 + seed * 5) * 0.12);
  const glow = 0.25 + Math.sin(t * 4 + seed) * 0.1;
  const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
  gr.addColorStop(0, `rgba(255, 245, 160, ${glow + 0.2})`);
  gr.addColorStop(1, 'rgba(255, 245, 160, 0)');
  ctx.fillStyle = gr;
  ctx.fillRect(-20, -20, 40, 40);
  ctx.lineJoin = 'round';
  // Stjärtfena
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-16, -6.5);
  ctx.quadraticCurveTo(-13, 0, -16, 6.5);
  ctx.closePath();
  fillStroke(ctx, '#ff9f43', 2);
  // Kropp
  ellipse(ctx, 0, 0, 11, 7);
  const g = ctx.createLinearGradient(0, -7, 0, 7);
  g.addColorStop(0, '#ffd06b');
  g.addColorStop(1, '#ff8a3d');
  fillStroke(ctx, g, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, -1, -3, 5, 1.6);
  ctx.fill();
  ctx.fillStyle = INK;
  ellipse(ctx, 5.5, -1.2, 1.5, 1.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59,35,20,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(1, 0, 4, -1.1, 1.1);
  ctx.stroke();
  ctx.restore();
}

function drawBalloon(ctx, x, y, r, color, t, seed) {
  const sway = Math.sin(t * 1.6 + seed * 7) * 2;
  ctx.save();
  ctx.translate(x + sway, y);
  ellipse(ctx, 0, 0, r * 0.86, r);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, color);
  g.addColorStop(1, color);
  fillStroke(ctx, g, 2.4);
  ctx.beginPath();
  ctx.moveTo(-3, r - 0.5);
  ctx.lineTo(3, r - 0.5);
  ctx.lineTo(0, r + 4);
  ctx.closePath();
  fillStroke(ctx, color, 1.8);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ellipse(ctx, -r * 0.35, -r * 0.45, r * 0.16, r * 0.26, -0.5);
  ctx.fill();
  ctx.restore();
  return x + sway;
}

function drawCrate(ctx, x, y, w, h, base, dark) {
  rr(ctx, x, y, w, h, 4);
  fillStroke(ctx, base, 2.6);
  ctx.save();
  rr(ctx, x, y, w, h, 4);
  ctx.clip();
  // Plankor
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  const inset = Math.min(6, w * 0.12);
  ctx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  ctx.beginPath();
  ctx.moveTo(x + inset, y + h - inset);
  ctx.lineTo(x + w - inset, y + inset);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x, y + h - 5, w, 5);
  ctx.restore();
  ctx.fillStyle = INK;
  for (const [nx, ny] of [[x + 3.4, y + 3.4], [x + w - 3.4, y + 3.4], [x + 3.4, y + h - 3.4], [x + w - 3.4, y + h - 3.4]]) {
    ellipse(ctx, nx, ny, 1.2, 1.2);
    ctx.fill();
  }
}

function drawGift(ctx, x, y, w, h, base, ribbon) {
  rr(ctx, x, y, w, h, 4);
  fillStroke(ctx, base, 2.6);
  ctx.fillStyle = ribbon;
  ctx.fillRect(x + w / 2 - 4, y + 1, 8, h - 2);
  ctx.fillRect(x + 1, y + h / 2 - 3, w - 2, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x + 2, y + 2, w - 4, 3);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + w / 2 - 5, y - 3, 5, 3.5, -0.4, 0, Math.PI * 2);
  ctx.ellipse(x + w / 2 + 5, y - 3, 5, 3.5, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = ribbon;
  ctx.fill();
  ctx.stroke();
}

// =====================================================================
// Bakgrunder
// =====================================================================
function cloud(ctx, x, y, s, col, shade) {
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(x, y + 6 * s, 44 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x - 26 * s, y + 2 * s, 14 * s, 0, Math.PI * 2);
  ctx.arc(x - 8 * s, y - 8 * s, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 14 * s, y - 4 * s, 17 * s, 0, Math.PI * 2);
  ctx.arc(x + 30 * s, y + 4 * s, 11 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 26 * s, y + 2 * s, 56 * s, 13 * s);
}

function hills(ctx, camX, f, base, amp, col, seed, freq) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-5, base + 400);
  for (let sx = -5; sx <= VIEW_W + 10; sx += 8) {
    const wx = sx + camX * f;
    const n = Math.sin(wx * freq + seed) * 0.55 + Math.sin(wx * freq * 2.3 + seed * 3) * 0.3 + Math.sin(wx * freq * 0.5 + seed * 7) * 0.4;
    ctx.lineTo(sx, base - amp * (0.6 + n * 0.5));
  }
  ctx.lineTo(VIEW_W + 10, base + 400);
  ctx.closePath();
  ctx.fill();
}

function eachRepeat(camX, f, spacing, margin, fn) {
  const ox = camX * f;
  const i0 = Math.floor((ox - margin) / spacing);
  const i1 = Math.ceil((ox + VIEW_W + margin) / spacing);
  for (let i = i0; i <= i1; i++) fn(i * spacing - ox + (hash(i * 3.1) - 0.5) * spacing * 0.4, i);
}

function drawSky(ctx, th, VH) {
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(0.55, th.sky[1]);
  g.addColorStop(1, th.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VH);
}

function drawSun(ctx, x, y, r, t, col, rays) {
  const gr = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
  gr.addColorStop(0, 'rgba(255, 250, 200, 0.7)');
  gr.addColorStop(1, 'rgba(255, 250, 200, 0)');
  ctx.fillStyle = gr;
  ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  if (rays) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.1);
    ctx.fillStyle = 'rgba(255, 236, 140, 0.45)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(-5, r + 4);
      ctx.lineTo(5, r + 4);
      ctx.lineTo(0, r + 18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ellipse(ctx, x, y, r, r);
  ctx.fillStyle = col;
  ctx.fill();
}

function drawBackground(ctx, theme, camX, camY, VH, t) {
  const th = THEMES[theme];
  drawSky(ctx, th, VH);
  const wy = WATER_Y - camY;
  switch (theme) {
    case 'garden': {
      drawSun(ctx, VIEW_W * 0.78, Math.max(60, wy - 470), 26, t, '#ffe76a', true);
      eachRepeat(camX - t * 6, 0.08, 230, 120, (x, i) => cloud(ctx, x, wy - 420 + hash(i) * 160, 0.7 + hash(i + 9) * 0.5, '#ffffff', 'rgba(150, 200, 235, 0.35)'));
      hills(ctx, camX, 0.12, wy - 90, 90, '#b4e39a', 1, 0.006);
      hills(ctx, camX, 0.22, wy - 55, 70, '#93d47a', 4, 0.009);
      eachRepeat(camX, 0.35, 120, 60, (x, i) => {
        const base = wy - 40;
        const s = 0.8 + hash(i + 2) * 0.5;
        ctx.fillStyle = '#8a5a3b';
        ctx.fillRect(x - 4 * s, base - 46 * s, 8 * s, 46 * s);
        const c1 = hash(i + 5) > 0.5 ? '#5dbb63' : '#6cc56a';
        ctx.fillStyle = '#4a9e50';
        ctx.beginPath();
        ctx.arc(x - 14 * s, base - 52 * s, 18 * s, 0, Math.PI * 2);
        ctx.arc(x + 14 * s, base - 54 * s, 17 * s, 0, Math.PI * 2);
        ctx.arc(x, base - 70 * s, 22 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.arc(x - 15 * s, base - 55 * s, 15 * s, 0, Math.PI * 2);
        ctx.arc(x + 12 * s, base - 57 * s, 14 * s, 0, Math.PI * 2);
        ctx.arc(x - 2 * s, base - 73 * s, 18 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(x - 8 * s, base - 80 * s, 7 * s, 0, Math.PI * 2);
        ctx.fill();
        // Äpplen
        if (hash(i + 11) > 0.5) {
          ctx.fillStyle = '#ff5a5a';
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.arc(x + (hash(i * 7 + k) - 0.5) * 34 * s, base - (50 + hash(i * 5 + k) * 28) * s, 2.6 * s, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      hills(ctx, camX, 0.5, wy - 18, 26, '#7cc463', 9, 0.014);
      break;
    }
    case 'castle': {
      drawSun(ctx, VIEW_W * 0.2, Math.max(60, wy - 440), 24, t, '#fff1a8', false);
      eachRepeat(camX - t * 5, 0.07, 250, 120, (x, i) => cloud(ctx, x, wy - 400 + hash(i) * 150, 0.7 + hash(i + 9) * 0.4, '#ffffff', 'rgba(255, 190, 160, 0.35)'));
      // Berg med snö
      eachRepeat(camX, 0.08, 170, 140, (x, i) => {
        const hgt = 150 + hash(i + 1) * 90;
        const base = wy - 60;
        ctx.fillStyle = '#9fb0cf';
        ctx.beginPath();
        ctx.moveTo(x - 130, base);
        ctx.lineTo(x, base - hgt);
        ctx.lineTo(x + 130, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - 28, base - hgt + 34);
        ctx.lineTo(x, base - hgt);
        ctx.lineTo(x + 28, base - hgt + 34);
        ctx.lineTo(x + 12, base - hgt + 28);
        ctx.lineTo(x + 2, base - hgt + 38);
        ctx.lineTo(x - 12, base - hgt + 28);
        ctx.closePath();
        ctx.fill();
      });
      hills(ctx, camX, 0.15, wy - 60, 40, '#a9d08f', 2, 0.008);
      // Slott
      eachRepeat(camX, 0.22, 520, 200, (x, i) => drawCastleBg(ctx, x, wy - 50, 0.9 + hash(i) * 0.2, t, i));
      hills(ctx, camX, 0.45, wy - 16, 24, '#86bf6c', 6, 0.013);
      break;
    }
    case 'harbor': {
      drawSun(ctx, VIEW_W * 0.75, Math.max(60, wy - 470), 26, t, '#fff4a0', true);
      eachRepeat(camX - t * 8, 0.07, 220, 120, (x, i) => cloud(ctx, x, wy - 430 + hash(i) * 170, 0.6 + hash(i + 3) * 0.6, '#ffffff', 'rgba(140, 200, 240, 0.35)'));
      // Hav vid horisonten
      const hz = wy - 70;
      const sg = ctx.createLinearGradient(0, hz, 0, wy);
      sg.addColorStop(0, '#6cc3f0');
      sg.addColorStop(1, '#3a9ad8');
      ctx.fillStyle = sg;
      ctx.fillRect(0, hz, VIEW_W, wy - hz + 40);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 5; k++) {
        const yy = hz + 8 + k * 12;
        ctx.beginPath();
        for (let sx = -10; sx < VIEW_W + 10; sx += 46) {
          const ox = ((sx - camX * (0.1 + k * 0.05) + t * 6) % 46 + 46) % 46;
          ctx.moveTo(sx + ox, yy);
          ctx.lineTo(sx + ox + 12, yy);
        }
        ctx.stroke();
      }
      // Ö med fyr
      eachRepeat(camX, 0.06, 600, 200, (x) => {
        ctx.fillStyle = '#7fb36a';
        ctx.beginPath();
        ctx.ellipse(x, hz + 2, 70, 16, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - 8, hz - 10);
        ctx.lineTo(x - 5, hz - 58);
        ctx.lineTo(x + 5, hz - 58);
        ctx.lineTo(x + 8, hz - 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff5a5a';
        ctx.fillRect(x - 7.2, hz - 30, 14.4, 7);
        ctx.fillRect(x - 6, hz - 48, 12, 6);
        ctx.fillStyle = '#5a3d2b';
        ctx.fillRect(x - 7, hz - 66, 14, 9);
        ctx.fillStyle = '#ffe16b';
        ctx.fillRect(x - 4, hz - 64, 8, 5);
        ctx.fillStyle = '#ff5a5a';
        ctx.beginPath();
        ctx.moveTo(x - 9, hz - 66);
        ctx.lineTo(x, hz - 76);
        ctx.lineTo(x + 9, hz - 66);
        ctx.closePath();
        ctx.fill();
      });
      // Segelbåtar
      eachRepeat(camX - t * 10, 0.12, 280, 100, (x, i) => {
        const yy = hz + 14 + hash(i) * 30;
        const s = 0.6 + hash(i + 4) * 0.5;
        const rock = Math.sin(t * 1.5 + i) * 0.06;
        ctx.save();
        ctx.translate(x, yy);
        ctx.rotate(rock);
        ctx.scale(s, s);
        ctx.fillStyle = '#b5523b';
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(24, 0);
        ctx.lineTo(16, 9);
        ctx.lineTo(-16, 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(2, -2);
        ctx.lineTo(2, -44);
        ctx.lineTo(22, -2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = hash(i + 6) > 0.5 ? '#ffd93d' : '#ff8fa3';
        ctx.beginPath();
        ctx.moveTo(-2, -2);
        ctx.lineTo(-2, -36);
        ctx.lineTo(-18, -2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      // Måsar
      ctx.strokeStyle = 'rgba(59,35,20,0.7)';
      ctx.lineWidth = 2;
      eachRepeat(camX - t * 30, 0.3, 260, 60, (x, i) => {
        const yy = wy - 300 + hash(i + 2) * 140 + Math.sin(t * 2 + i) * 10;
        const flap = Math.sin(t * 8 + i * 2) * 4;
        ctx.beginPath();
        ctx.moveTo(x - 10, yy - flap);
        ctx.quadraticCurveTo(x - 5, yy - 6, x, yy);
        ctx.quadraticCurveTo(x + 5, yy - 6, x + 10, yy - flap);
        ctx.stroke();
      });
      break;
    }
    case 'roof': {
      // Solnedgång
      const sy = wy - 120;
      const gr = ctx.createRadialGradient(VIEW_W * 0.5, sy, 10, VIEW_W * 0.5, sy, 260);
      gr.addColorStop(0, 'rgba(255, 220, 140, 0.9)');
      gr.addColorStop(1, 'rgba(255, 180, 120, 0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, VIEW_W, VH);
      ellipse(ctx, VIEW_W * 0.5, sy, 54, 54);
      ctx.fillStyle = '#ffdf7a';
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 160, 90, 0.5)';
      for (let k = 0; k < 4; k++) ctx.fillRect(VIEW_W * 0.5 - 60, sy + 8 + k * 11, 120, 3 + k);
      eachRepeat(camX - t * 4, 0.06, 240, 120, (x, i) => cloud(ctx, x, wy - 440 + hash(i) * 180, 0.6 + hash(i + 9) * 0.5, 'rgba(255, 196, 196, 0.85)', 'rgba(150, 80, 140, 0.3)'));
      // Stad långt bort
      eachRepeat(camX, 0.1, 46, 60, (x, i) => {
        const hgt = 60 + hash(i) * 90;
        const w = 30 + hash(i + 1) * 22;
        const base = wy - 40;
        ctx.fillStyle = '#8b5a95';
        ctx.fillRect(x - w / 2, base - hgt, w, hgt + 60);
        if (hash(i + 7) > 0.75) {
          ctx.beginPath();
          ctx.arc(x, base - hgt, w * 0.4, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(x - 1, base - hgt - w * 0.4 - 14, 2, 14);
        }
      });
      // Närmare hus med tända fönster
      eachRepeat(camX, 0.25, 64, 60, (x, i) => {
        const hgt = 50 + hash(i + 3) * 80;
        const w = 46 + hash(i + 4) * 20;
        const base = wy - 20;
        ctx.fillStyle = '#62406f';
        ctx.fillRect(x - w / 2, base - hgt, w, hgt + 40);
        ctx.beginPath();
        ctx.moveTo(x - w / 2 - 4, base - hgt);
        ctx.lineTo(x, base - hgt - 18);
        ctx.lineTo(x + w / 2 + 4, base - hgt);
        ctx.closePath();
        ctx.fill();
        for (let r = 0; r < Math.floor(hgt / 20); r++) {
          for (let c = 0; c < 3; c++) {
            if (hash(i * 13 + r * 3 + c) > 0.55) {
              ctx.fillStyle = hash(i + r + c * 7) > 0.5 ? '#ffd27a' : '#ffb35c';
              ctx.fillRect(x - w / 2 + 7 + c * ((w - 14) / 3), base - hgt + 10 + r * 20, 7, 9);
            }
          }
        }
      });
      break;
    }
    case 'night': {
      // Stjärnor
      for (let i = 0; i < 70; i++) {
        const sx = ((hash(i) * 900 - camX * 0.03) % VIEW_W + VIEW_W) % VIEW_W;
        const syy = hash(i + 100) * (wy - 120);
        const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + hash(i + 7) * 2) + i);
        const r = 0.8 + hash(i + 33) * 1.6;
        ctx.fillStyle = `rgba(255, 250, 220, ${0.35 + tw * 0.65})`;
        if (r > 2) {
          ctx.save();
          ctx.translate(sx, syy);
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const rad = k % 2 ? r * 0.8 : r * 2.4;
            const a = (k * Math.PI) / 4 + t * 0.2;
            ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillRect(sx, syy, r, r);
        }
      }
      // Måne
      const mx = VIEW_W * 0.74;
      const my = Math.max(70, wy - 470);
      const mg = ctx.createRadialGradient(mx, my, 20, mx, my, 120);
      mg.addColorStop(0, 'rgba(255, 250, 210, 0.45)');
      mg.addColorStop(1, 'rgba(255, 250, 210, 0)');
      ctx.fillStyle = mg;
      ctx.fillRect(mx - 120, my - 120, 240, 240);
      ellipse(ctx, mx, my, 30, 30);
      ctx.fillStyle = '#fff6cf';
      ctx.fill();
      ctx.fillStyle = 'rgba(220, 205, 150, 0.6)';
      ellipse(ctx, mx - 9, my - 6, 6, 6); ctx.fill();
      ellipse(ctx, mx + 10, my + 8, 8, 8); ctx.fill();
      ellipse(ctx, mx + 6, my - 13, 3.5, 3.5); ctx.fill();
      // Norrsken
      ctx.save();
      ctx.globalAlpha = 0.25;
      for (let k = 0; k < 2; k++) {
        const ag = ctx.createLinearGradient(0, wy - 420, 0, wy - 260);
        ag.addColorStop(0, 'rgba(120, 255, 200, 0)');
        ag.addColorStop(0.5, k ? 'rgba(160, 120, 255, 0.8)' : 'rgba(120, 255, 200, 0.8)');
        ag.addColorStop(1, 'rgba(120, 255, 200, 0)');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.moveTo(0, wy - 300);
        for (let sx = 0; sx <= VIEW_W; sx += 10) {
          ctx.lineTo(sx, wy - 330 - k * 40 + Math.sin(sx * 0.02 + t * 0.5 + k * 2 - camX * 0.0006) * 30);
        }
        for (let sx = VIEW_W; sx >= 0; sx -= 10) {
          ctx.lineTo(sx, wy - 270 - k * 40 + Math.sin(sx * 0.025 + t * 0.4 + k - camX * 0.0006) * 24);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      hills(ctx, camX, 0.08, wy - 70, 110, '#22336a', 3, 0.007);
      hills(ctx, camX, 0.16, wy - 40, 60, '#1b2a58', 8, 0.01);
      // Granar
      eachRepeat(camX, 0.32, 38, 40, (x, i) => {
        const s = 0.7 + hash(i + 1) * 0.7;
        const base = wy - 22;
        ctx.fillStyle = '#132246';
        ctx.beginPath();
        ctx.moveTo(x, base - 70 * s);
        ctx.lineTo(x + 20 * s, base);
        ctx.lineTo(x - 20 * s, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(220, 235, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x, base - 70 * s);
        ctx.lineTo(x + 6 * s, base - 50 * s);
        ctx.lineTo(x - 6 * s, base - 50 * s);
        ctx.closePath();
        ctx.fill();
      });
      // Eldflugor
      for (let i = 0; i < 14; i++) {
        const fx = ((hash(i + 50) * 700 - camX * 0.6 + Math.sin(t * 0.7 + i) * 30) % (VIEW_W + 40) + VIEW_W + 40) % (VIEW_W + 40) - 20;
        const fy = wy - 30 - hash(i + 60) * 220 + Math.cos(t * 0.9 + i * 2) * 14;
        const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2 + i * 1.7));
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 8);
        fg.addColorStop(0, `rgba(255, 245, 140, ${a})`);
        fg.addColorStop(1, 'rgba(255, 245, 140, 0)');
        ctx.fillStyle = fg;
        ctx.fillRect(fx - 8, fy - 8, 16, 16);
      }
      break;
    }
    default:
      break;
  }
}

function drawCastleBg(ctx, x, base, s, t, seed) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(s, s);
  const wall = '#b9b4cf';
  const shade = '#a19bbb';
  const roof = ['#e8646a', '#6a8fe8', '#e8a24a'][seed % 3 < 0 ? 0 : Math.abs(seed) % 3];
  ctx.fillStyle = shade;
  // Mur med tinnar
  ctx.fillRect(-90, -70, 180, 80);
  for (let k = -90; k < 90; k += 16) ctx.fillRect(k, -80, 9, 12);
  // Torn
  const towers = [[-92, 28, 130], [92, 28, 130], [0, 40, 170]];
  for (const [tx, tw, th] of towers) {
    ctx.fillStyle = wall;
    ctx.fillRect(tx - tw / 2, -th, tw, th + 10);
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(tx - tw / 2 - 5, -th);
    ctx.lineTo(tx, -th - 44);
    ctx.lineTo(tx + tw / 2 + 5, -th);
    ctx.closePath();
    ctx.fill();
    // Flagga
    ctx.strokeStyle = '#6b5a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, -th - 44);
    ctx.lineTo(tx, -th - 62);
    ctx.stroke();
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.moveTo(tx, -th - 62);
    ctx.quadraticCurveTo(tx + 9, -th - 60 + Math.sin(t * 4 + tx) * 2, tx + 16, -th - 57 + Math.sin(t * 4 + tx + 1) * 3);
    ctx.lineTo(tx, -th - 52);
    ctx.closePath();
    ctx.fill();
    // Fönster
    ctx.fillStyle = '#6b6488';
    rr(ctx, tx - 4, -th + 24, 8, 14, 4);
    ctx.fill();
  }
  // Port
  ctx.fillStyle = '#6b6488';
  ctx.beginPath();
  ctx.moveTo(-14, 10);
  ctx.lineTo(-14, -26);
  ctx.arc(0, -26, 14, Math.PI, 0);
  ctx.lineTo(14, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// =====================================================================
// Plattformar
// =====================================================================
function grassCap(ctx, x, y, w, col, light, dark) {
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 3);
  ctx.quadraticCurveTo(x - 4, y - 3, x + 2, y - 3);
  ctx.lineTo(x + w - 2, y - 3);
  ctx.quadraticCurveTo(x + w + 4, y - 3, x + w + 4, y + 3);
  ctx.lineTo(x + w + 4, y + 8);
  const n = Math.max(2, Math.round((w + 8) / 13));
  const sw = (w + 8) / n;
  for (let i = 0; i < n; i++) {
    const x0 = x + w + 4 - i * sw;
    ctx.quadraticCurveTo(x0 - sw / 2, y + 17 + ((i % 2) * 3), x0 - sw, y + 8);
  }
  ctx.closePath();
  fillStroke(ctx, col, 2.6);
  ctx.strokeStyle = light;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 1);
  ctx.lineTo(x + w - 2, y + 1);
  ctx.stroke();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < w / 14; i++) {
    const gx = x + 6 + i * 14;
    ctx.beginPath();
    ctx.moveTo(gx, y - 2);
    ctx.lineTo(gx - 1.5, y - 6);
    ctx.moveTo(gx + 3, y - 2);
    ctx.lineTo(gx + 4, y - 7);
    ctx.stroke();
  }
}

function drawFlower(ctx, x, y, col, t, seed) {
  const sway = Math.sin(t * 2 + seed * 9) * 1.5;
  ctx.strokeStyle = '#3d8a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + sway * 0.5, y - 6, x + sway, y - 12);
  ctx.stroke();
  ctx.fillStyle = col;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    ellipse(ctx, x + sway + Math.cos(a) * 3.4, y - 12 + Math.sin(a) * 3.4, 2.6, 2.6);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd93d';
  ellipse(ctx, x + sway, y - 12, 2, 2);
  ctx.fill();
}

function drawGround(ctx, theme, p, sx, sy, bottom, t) {
  const w = p.w;
  const h = bottom - sy;
  switch (theme) {
    case 'garden': {
      const g = ctx.createLinearGradient(0, sy, 0, bottom);
      g.addColorStop(0, '#b4743f');
      g.addColorStop(1, '#7a4524');
      rr(ctx, sx, sy + 2, w, h, 6);
      fillStroke(ctx, g, 2.6);
      ctx.fillStyle = 'rgba(255, 220, 170, 0.35)';
      for (let k = 0; k < w / 22; k++) {
        const px = sx + 8 + hash(p.seed * 100 + k) * (w - 16);
        const py = sy + 22 + hash(p.seed * 50 + k * 3) * Math.max(10, h - 40);
        ellipse(ctx, px, py, 4 + hash(k + p.seed) * 3, 2.6);
        ctx.fill();
      }
      grassCap(ctx, sx, sy, w, '#7bd34f', '#b2f07a', '#4fa83a');
      const cols = ['#ffffff', '#ff8fb1', '#ffd93d', '#b38cff'];
      for (let k = 0; k < w / 40; k++) {
        if (hash(p.seed * 77 + k) > 0.45) {
          drawFlower(ctx, sx + 12 + k * 40 + hash(k * 9 + p.seed) * 14, sy - 1, cols[k % 4], t, p.seed + k);
        }
      }
      break;
    }
    case 'castle': {
      rr(ctx, sx, sy + 2, w, h, 4);
      fillStroke(ctx, '#aab0bd', 2.6);
      ctx.save();
      rr(ctx, sx, sy + 2, w, h, 4);
      ctx.clip();
      ctx.strokeStyle = '#7f8796';
      ctx.lineWidth = 2;
      for (let r = 0; r * 18 < h; r++) {
        const yy = sy + 14 + r * 18;
        ctx.beginPath();
        ctx.moveTo(sx, yy);
        ctx.lineTo(sx + w, yy);
        const off = r % 2 ? 0 : 14;
        for (let xx = sx + off; xx < sx + w; xx += 28) {
          ctx.moveTo(xx, yy);
          ctx.lineTo(xx, yy + 18);
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(sx, sy, 6, h);
      ctx.fillStyle = 'rgba(70, 120, 60, 0.35)';
      for (let k = 0; k < w / 30; k++) {
        ellipse(ctx, sx + hash(p.seed + k) * w, sy + 30 + hash(k * 3 + p.seed) * 60, 6, 3);
        ctx.fill();
      }
      ctx.restore();
      grassCap(ctx, sx, sy, w, '#6fc24a', '#a5e67a', '#428f34');
      break;
    }
    case 'harbor': {
      // Pir: däck + stolpar
      const deck = 16;
      ctx.fillStyle = '#5c3a22';
      for (let xx = sx + 6; xx < sx + w - 4; xx += 34) {
        rr(ctx, xx, sy + deck - 2, 11, h - deck + 2, 3);
        fillStroke(ctx, '#7a4c2c', 2.2);
      }
      // Krysstag
      ctx.strokeStyle = '#5c3a22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let xx = sx + 6; xx + 34 < sx + w - 4; xx += 34) {
        ctx.moveTo(xx + 8, sy + deck + 4);
        ctx.lineTo(xx + 34 + 3, sy + deck + 32);
      }
      ctx.stroke();
      rr(ctx, sx - 2, sy, w + 4, deck, 4);
      fillStroke(ctx, '#d39457', 2.6);
      ctx.strokeStyle = '#9a6234';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let xx = sx + 22; xx < sx + w; xx += 22) {
        ctx.moveTo(xx, sy + 2);
        ctx.lineTo(xx, sy + deck - 2);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(sx, sy + 2, w, 3);
      // Pollare och rep
      if (w > 100) {
        const bx = sx + w - 22;
        rr(ctx, bx - 6, sy - 12, 12, 13, 4);
        fillStroke(ctx, '#4b5563', 2.2);
        ctx.strokeStyle = '#e8d3a3';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(bx, sy - 6, 8, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'roof': {
      const cols = ['#f2c48d', '#e9967a', '#b9c7e8', '#f5e1a4', '#c7e6b5'];
      const col = cols[Math.floor(p.seed * 997) % cols.length];
      rr(ctx, sx, sy + 6, w, h, 3);
      fillStroke(ctx, col, 2.6);
      ctx.save();
      rr(ctx, sx, sy + 6, w, h, 3);
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(sx + w - 10, sy, 10, h);
      const cols2 = Math.max(1, Math.floor((w - 12) / 30));
      const cw = (w - 12) / cols2;
      for (let r = 0; r * 34 < h - 30; r++) {
        for (let c = 0; c < cols2; c++) {
          const lit = hash(p.seed * 31 + r * 5 + c) > 0.45;
          const wx = sx + 6 + c * cw + cw / 2 - 8;
          const wy = sy + 24 + r * 34;
          rr(ctx, wx, wy, 16, 20, 3);
          fillStroke(ctx, lit ? '#ffd982' : '#6d5a8a', 2);
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(wx + 8, wy);
          ctx.lineTo(wx + 8, wy + 20);
          ctx.moveTo(wx, wy + 10);
          ctx.lineTo(wx + 16, wy + 10);
          ctx.stroke();
        }
      }
      ctx.restore();
      // Takkant med tegel
      rr(ctx, sx - 5, sy - 2, w + 10, 11, 4);
      fillStroke(ctx, '#d0473d', 2.6);
      ctx.fillStyle = '#a8322b';
      for (let xx = sx; xx < sx + w; xx += 10) {
        ellipse(ctx, xx + 5, sy + 7, 4, 2.4);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(sx - 2, sy, w + 4, 2.4);
      // Blomlåda
      if (w > 110) {
        const bx = sx + w * 0.3;
        for (let k = 0; k < 3; k++) drawFlower(ctx, bx + k * 9, sy - 1, ['#ff8fb1', '#ffd93d', '#ffffff'][k], t, p.seed + k);
      }
      break;
    }
    case 'night': {
      const g = ctx.createLinearGradient(0, sy, 0, bottom);
      g.addColorStop(0, '#4a3f66');
      g.addColorStop(1, '#251f3d');
      rr(ctx, sx, sy + 2, w, h, 6);
      fillStroke(ctx, g, 2.6);
      ctx.fillStyle = 'rgba(180, 170, 255, 0.18)';
      for (let k = 0; k < w / 22; k++) {
        ellipse(ctx, sx + 8 + hash(p.seed * 100 + k) * (w - 16), sy + 24 + hash(p.seed * 50 + k * 3) * Math.max(10, h - 40), 4, 2.4);
        ctx.fill();
      }
      grassCap(ctx, sx, sy, w, '#3f9a85', '#6fd6b8', '#2a6e5e');
      // Lysande svampar
      for (let k = 0; k < w / 45; k++) {
        if (hash(p.seed * 41 + k) > 0.4) {
          const mx = sx + 14 + k * 45 + hash(k + p.seed) * 16;
          const glow = 0.5 + 0.3 * Math.sin(t * 2 + k);
          const mg = ctx.createRadialGradient(mx, sy - 8, 0, mx, sy - 8, 16);
          mg.addColorStop(0, `rgba(120, 240, 255, ${glow * 0.6})`);
          mg.addColorStop(1, 'rgba(120, 240, 255, 0)');
          ctx.fillStyle = mg;
          ctx.fillRect(mx - 16, sy - 24, 32, 32);
          ctx.fillStyle = '#e8f6ff';
          ctx.fillRect(mx - 1.5, sy - 8, 3, 7);
          ctx.beginPath();
          ctx.arc(mx, sy - 8, 6, Math.PI, 0);
          ctx.closePath();
          fillStroke(ctx, '#7af0ff', 1.8);
        }
      }
      break;
    }
    default:
      break;
  }
}

function drawPost(ctx, theme, p, sx, sy, bottom, t) {
  const w = p.w;
  const h = bottom - sy;
  switch (theme) {
    case 'garden': {
      // Trädstubbe
      const g = ctx.createLinearGradient(sx, 0, sx + w, 0);
      g.addColorStop(0, '#8d5530');
      g.addColorStop(0.5, '#a8683c');
      g.addColorStop(1, '#7a4526');
      rr(ctx, sx + 2, sy + 2, w - 4, h, 6);
      fillStroke(ctx, g, 2.6);
      ctx.strokeStyle = '#6a3b1f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 1; k < 4; k++) {
        const xx = sx + (w * k) / 4 + (hash(p.seed + k) - 0.5) * 6;
        ctx.moveTo(xx, sy + 12);
        ctx.quadraticCurveTo(xx + 3, sy + 40, xx - 1, sy + h);
      }
      ctx.stroke();
      ellipse(ctx, sx + w / 2, sy + 2, w / 2, 6);
      fillStroke(ctx, '#f0c98f', 2.6);
      ctx.strokeStyle = '#c99a5b';
      ctx.lineWidth = 1.4;
      ellipse(ctx, sx + w / 2, sy + 2, w * 0.32, 3.6);
      ctx.stroke();
      ellipse(ctx, sx + w / 2, sy + 2, w * 0.14, 1.6);
      ctx.stroke();
      // Liten svamp på sidan
      if (hash(p.seed * 9) > 0.4) {
        const mx = sx + w - 4;
        const my = sy + 34;
        ctx.fillStyle = '#fff';
        ctx.fillRect(mx, my - 2, 6, 3);
        ctx.beginPath();
        ctx.arc(mx + 7, my - 2, 6, Math.PI, 0);
        ctx.closePath();
        fillStroke(ctx, '#ff5a5a', 1.8);
        ctx.fillStyle = '#fff';
        ellipse(ctx, mx + 5, my - 5, 1.4, 1.4);
        ctx.fill();
      }
      break;
    }
    case 'castle': {
      rr(ctx, sx + 3, sy + 6, w - 6, h, 3);
      fillStroke(ctx, '#b7bcc8', 2.6);
      ctx.save();
      rr(ctx, sx + 3, sy + 6, w - 6, h, 3);
      ctx.clip();
      ctx.strokeStyle = '#868d9c';
      ctx.lineWidth = 2;
      for (let r = 0; r * 20 < h; r++) {
        const yy = sy + 26 + r * 20;
        ctx.beginPath();
        ctx.moveTo(sx, yy);
        ctx.lineTo(sx + w, yy);
        const xx = sx + w / 2 + (r % 2 ? -10 : 10);
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx, yy + 20);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(sx + 3, sy, 6, h);
      ctx.restore();
      rr(ctx, sx - 3, sy - 2, w + 6, 12, 3);
      fillStroke(ctx, '#d6d9e0', 2.6);
      break;
    }
    case 'harbor': {
      const palette = [['#e85d4f', '#a83a30'], ['#4f8ee8', '#2d5fa8'], ['#5cc27a', '#3a8a52'], ['#f2b84a', '#b07f22']];
      const ch = Math.min(w, 46);
      let k = 0;
      for (let yy = sy; yy < bottom; yy += ch) {
        const c = palette[Math.floor(p.seed * 10 + k) % palette.length];
        drawCrate(ctx, sx, yy, w, ch, c[0], c[1]);
        k++;
      }
      break;
    }
    case 'roof':
      // Smalt hus – katten hoppar mellan taken
      drawGround(ctx, theme, p, sx, sy, bottom, t);
      if (p.w > 54) {
        // Liten skorsten längst bak på taket
        const cx = sx + 4;
        rr(ctx, cx, sy - 16, 12, 16, 2);
        fillStroke(ctx, '#c75a43', 2.2);
        for (let k = 0; k < 3; k++) {
          const ph = (t * 0.5 + k / 3 + p.seed) % 1;
          ctx.fillStyle = `rgba(255, 235, 235, ${0.4 * (1 - ph)})`;
          ellipse(ctx, cx + 6 - ph * 14, sy - 22 - ph * 50, 4 + ph * 9, 4 + ph * 9);
          ctx.fill();
        }
      }
      break;
    case 'night': {
      const g = ctx.createLinearGradient(sx, 0, sx + w, 0);
      g.addColorStop(0, '#4c3a2c');
      g.addColorStop(0.5, '#664e3b');
      g.addColorStop(1, '#3f3024');
      rr(ctx, sx + 2, sy + 2, w - 4, h, 6);
      fillStroke(ctx, g, 2.6);
      ellipse(ctx, sx + w / 2, sy + 2, w / 2, 6);
      fillStroke(ctx, '#a88b6a', 2.6);
      ctx.strokeStyle = '#7d6449';
      ctx.lineWidth = 1.4;
      ellipse(ctx, sx + w / 2, sy + 2, w * 0.3, 3.4);
      ctx.stroke();
      // Lykta
      const lx = sx + w - 2;
      const ly = sy + 26;
      const glow = 0.6 + 0.2 * Math.sin(t * 3 + p.seed * 9);
      const lg = ctx.createRadialGradient(lx + 6, ly + 8, 0, lx + 6, ly + 8, 30);
      lg.addColorStop(0, `rgba(255, 210, 110, ${glow})`);
      lg.addColorStop(1, 'rgba(255, 210, 110, 0)');
      ctx.fillStyle = lg;
      ctx.fillRect(lx - 24, ly - 22, 60, 60);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(lx - 2, ly - 4);
      ctx.lineTo(lx + 6, ly - 4);
      ctx.lineTo(lx + 6, ly + 1);
      ctx.stroke();
      rr(ctx, lx + 1, ly + 1, 10, 14, 3);
      fillStroke(ctx, '#ffd36b', 2);
      break;
    }
    default:
      break;
  }
}

function drawFloat(ctx, theme, p, sx, sy) {
  if (theme === 'garden') {
    // Näckrosblad
    const cx = sx + p.w / 2;
    ctx.beginPath();
    ctx.ellipse(cx, sy + 4, p.w / 2, 8, 0, 0.25, Math.PI * 2 - 0.05);
    ctx.lineTo(cx, sy + 4);
    ctx.closePath();
    fillStroke(ctx, '#5fbf4a', 2.4);
    ctx.strokeStyle = '#3f8f34';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = 0.6 + k * 0.95;
      ctx.moveTo(cx, sy + 4);
      ctx.lineTo(cx + Math.cos(a) * p.w * 0.42, sy + 4 + Math.sin(a) * 6.5);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ellipse(ctx, cx - p.w * 0.2, sy + 1, p.w * 0.16, 2);
    ctx.fill();
    if (p.seed > 0.4) {
      const fx = cx - p.w * 0.3;
      ctx.fillStyle = '#ffb3d1';
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        ellipse(ctx, fx + Math.cos(a) * 3.5, sy + 1 + Math.sin(a) * 2, 3.4, 2, a);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd93d';
      ellipse(ctx, fx, sy + 1, 2, 1.5);
      ctx.fill();
    }
    return;
  }
  const palette = {
    castle: ['#d9a066', '#9a6a3a'], harbor: ['#e85d4f', '#a83a30'],
    roof: ['#d9a066', '#9a6a3a'], night: ['#8a6a4a', '#5a4430'],
  }[theme] || ['#d9a066', '#9a6a3a'];
  drawCrate(ctx, sx, sy, p.w, p.h, palette[0], palette[1]);
}

function drawBalloonBox(ctx, theme, p, sx, sy, t, extraShake) {
  const th = THEMES[theme];
  const w = p.w;
  const cols = th.balloons;
  const shake = extraShake || 0;
  const bx = sx + Math.sin(t * 50) * shake;
  if (p.kind === 'pop') {
    // En stor ballong som spricker efter en stund
    if (!p.popped) {
      const prog = p.triggered ? 1 - Math.max(0, p.popT) / p.popDelay : 0;
      const r = 20 + prog * 7;
      const topY = sy - 92 - prog * 6;
      ctx.strokeStyle = 'rgba(59,35,20,0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx + w / 2, sy);
      ctx.quadraticCurveTo(bx + w / 2 + Math.sin(t * 2) * 6, sy - 40, bx + w / 2, topY + r + 4);
      ctx.stroke();
      drawBalloon(ctx, bx + w / 2, topY, r, '#ff4d5e', t, p.seed);
    }
    ctx.save();
    if (p.popped) {
      ctx.translate(bx + w / 2, sy + p.h / 2);
      ctx.rotate(p.rot);
      ctx.translate(-(bx + w / 2), -(sy + p.h / 2));
    }
    // Pappkartong
    rr(ctx, bx, sy, w, p.h, 3);
    fillStroke(ctx, '#d9a86a', 2.6);
    ctx.fillStyle = '#c4904f';
    ctx.fillRect(bx + w / 2 - 6, sy + 1.5, 12, p.h - 3);
    ctx.strokeStyle = '#9a6a3a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx + 5, sy + p.h * 0.55);
    ctx.lineTo(bx + 12, sy + p.h * 0.45);
    ctx.lineTo(bx + 9, sy + p.h * 0.7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(bx + 2, sy + 2, w - 4, 3);
    // "!"-skylt
    ctx.fillStyle = '#ff4d5e';
    ctx.font = '900 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', bx + w - 9, sy + p.h - 9);
    ctx.restore();
    return;
  }
  // Rörlig låda som hålls uppe av två ballonger
  const b1x = bx + w * 0.22;
  const b2x = bx + w * 0.78;
  const by = sy - 92;
  ctx.strokeStyle = 'rgba(59,35,20,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(bx + 4, sy);
  ctx.quadraticCurveTo(b1x - 8, sy - 40, b1x - 2, by + 22);
  ctx.moveTo(bx + w - 4, sy);
  ctx.quadraticCurveTo(b2x + 8, sy - 40, b2x + 2, by + 18);
  ctx.stroke();
  drawBalloon(ctx, b1x - 2, by, 16, cols[Math.floor(p.seed * 7) % 3], t, p.seed);
  drawBalloon(ctx, b2x + 2, by - 6, 15, cols[(Math.floor(p.seed * 7) + 1) % 3], t, p.seed + 1);
  if (theme === 'night' || theme === 'roof') {
    drawGift(ctx, bx, sy, w, p.h, theme === 'night' ? '#6a5ae0' : '#4fb6a8', '#ffd93d');
  } else {
    drawCrate(ctx, bx, sy, w, p.h, '#e0aa6a', '#9a6a3a');
  }
}

function drawGoal(ctx, theme, p, sx, sy, t, state) {
  // Flaggstång
  const fx = sx + 36;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(fx, sy);
  ctx.lineTo(fx, sy - 92);
  ctx.stroke();
  ctx.strokeStyle = '#f2f2f2';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fx + 1, sy - 90);
  for (let k = 0; k <= 8; k++) {
    ctx.lineTo(fx + 1 + k * 5, sy - 90 + Math.sin(t * 5 - k * 0.7) * 2.5 * (k / 8));
  }
  for (let k = 8; k >= 0; k--) {
    ctx.lineTo(fx + 1 + k * 5, sy - 64 + Math.sin(t * 5 - k * 0.7) * 2.5 * (k / 8));
  }
  ctx.closePath();
  fillStroke(ctx, '#ff5a6e', 2.2);
  ctx.fillStyle = '#fff';
  ctx.font = '900 11px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MÅL', fx + 21, sy - 73 + Math.sin(t * 5 - 3) * 1.2);
  ellipse(ctx, fx, sy - 94, 4, 4);
  fillStroke(ctx, '#ffd93d', 2);

  // Mjölkskål och garnnystan
  const bx = sx + 92;
  ctx.beginPath();
  ctx.moveTo(bx - 14, sy - 10);
  ctx.quadraticCurveTo(bx, sy + 2, bx + 14, sy - 10);
  ctx.closePath();
  fillStroke(ctx, '#5ab0ff', 2.4);
  ellipse(ctx, bx, sy - 10, 14, 3.5);
  fillStroke(ctx, '#ffffff', 2);
  const yx = sx + 70;
  ellipse(ctx, yx, sy - 7, 7, 7);
  fillStroke(ctx, '#c38cff', 2.2);
  ctx.strokeStyle = '#9a62d8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(yx - 2, sy - 7, 5, -1, 1.2);
  ctx.moveTo(yx + 3, sy - 12);
  ctx.arc(yx + 2, sy - 6, 5, -2, 2.6);
  ctx.stroke();

  // Korg med mamma katt
  const kx = sx + 190;
  ctx.fillStyle = '#ffb3c6';
  ellipse(ctx, kx, sy - 26, 40, 10);
  ctx.fill();
  drawCat(ctx, {
    x: kx + 6, y: sy - 18, scale: 1.45, flip: true, pal: MAMA, pose: 'sit', t,
    blink: Math.sin(t * 1.3) > 0.97, mood: state === 'win' ? 'happy' : null,
    sy: 1 + Math.sin(t * 2.2) * 0.012,
  });
  ctx.beginPath();
  ctx.moveTo(kx - 44, sy - 28);
  ctx.quadraticCurveTo(kx - 40, sy, kx - 20, sy);
  ctx.lineTo(kx + 20, sy);
  ctx.quadraticCurveTo(kx + 40, sy, kx + 44, sy - 28);
  ctx.quadraticCurveTo(kx, sy - 18, kx - 44, sy - 28);
  ctx.closePath();
  fillStroke(ctx, '#d39a55', 2.6);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = '#a8733a';
  ctx.lineWidth = 2;
  for (let k = -44; k < 44; k += 8) {
    ctx.beginPath();
    ctx.moveTo(kx + k, sy - 30);
    ctx.lineTo(kx + k + 6, sy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(kx - 44, sy - 12);
  ctx.quadraticCurveTo(kx, sy - 4, kx + 44, sy - 12);
  ctx.stroke();
  ctx.restore();
  if (state !== 'win' && Math.sin(t * 1.4) > 0.3) {
    // Pratbubbla med hjärta
    const hx = kx + 18;
    const hy = sy - 104 + Math.sin(t * 3) * 2;
    ellipse(ctx, hx, hy, 15, 13);
    fillStroke(ctx, '#ffffff', 2.2);
    heartPath(ctx, hx, hy - 6, 12);
    ctx.fillStyle = '#ff5a6e';
    ctx.fill();
  }
}

function drawWater(ctx, theme, camX, camY, VH, t) {
  const th = THEMES[theme];
  const wy = WATER_Y - camY;
  if (wy > VH + 20) return;
  const surf = (sx) => {
    const wx = sx + camX;
    return wy + Math.sin(wx * 0.045 + t * 2.4) * 2.4 + Math.sin(wx * 0.021 - t * 1.3) * 1.6;
  };
  ctx.beginPath();
  ctx.moveTo(-5, VH + 5);
  for (let sx = -5; sx <= VIEW_W + 10; sx += 8) ctx.lineTo(sx, surf(sx));
  ctx.lineTo(VIEW_W + 10, VH + 5);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, wy, 0, Math.min(VH, wy + 200));
  g.addColorStop(0, th.water[0]);
  g.addColorStop(1, th.water[1]);
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = g;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Ytlinje
  ctx.beginPath();
  for (let sx = -5; sx <= VIEW_W + 10; sx += 8) {
    if (sx === -5) ctx.moveTo(sx, surf(sx));
    else ctx.lineTo(sx, surf(sx));
  }
  ctx.strokeStyle = th.foam;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Glitter
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const span = VIEW_W + 60;
    const x = ((hash(i) * 1000 - camX + t * (6 + hash(i + 3) * 8)) % span + span) % span - 30;
    const y = wy + 12 + hash(i + 10) * 70;
    const len = 6 + hash(i + 20) * 14;
    const a = 0.5 + 0.5 * Math.sin(t * 2 + i);
    if (a > 0.3) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
    }
  }
  ctx.stroke();
  // Spegling av sol/måne
  if (theme === 'roof' || theme === 'night') {
    const cx = theme === 'roof' ? VIEW_W * 0.5 : VIEW_W * 0.74;
    ctx.fillStyle = theme === 'roof' ? 'rgba(255, 210, 130, 0.45)' : 'rgba(255, 250, 210, 0.35)';
    for (let k = 0; k < 7; k++) {
      const yy = wy + 10 + k * 11;
      const ww = 50 - k * 4 + Math.sin(t * 3 + k) * 6;
      ctx.fillRect(cx - ww / 2, yy, ww, 3);
    }
  }
}

// =====================================================================
// Spelet
// =====================================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const stage = document.getElementById('stage');
const $ = (id) => document.getElementById(id);
const ui = {
  hud: $('hud'), level: $('hud-level'), lives: $('hud-lives'), fish: $('hud-fish'),
  hint: $('hint'), banner: $('banner'),
  menu: $('menu'), menuLives: $('menu-lives'), menuText: $('menu-text'),
  continueBtn: $('continue-btn'), levels: $('levels'), soundBtn: $('sound-btn'),
  pause: $('pause'), cleared: $('cleared'), gameover: $('gameover'),
  victory: $('victory'), locked: $('locked'),
};

const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C5 16.2 2 12.8 2 9.1 2 6.2 4.3 4 7.1 4c2 0 3.8 1.1 4.9 2.8C13.1 5.1 14.9 4 16.9 4 19.7 4 22 6.2 22 9.1c0 3.7-3 7.1-10 11.9z" fill="#ef5a5a" stroke="#3b2314" stroke-width="2" stroke-linejoin="round"/><ellipse cx="7.5" cy="8.5" rx="2" ry="1.4" fill="#fff" opacity=".7"/></svg>';
const FISH_SVG = '<svg viewBox="0 0 36 24" aria-hidden="true"><path d="M8 12 L1 5 Q4 12 1 19 Z" fill="#ff9f43" stroke="#3b2314" stroke-width="2" stroke-linejoin="round"/><ellipse cx="19" cy="12" rx="13" ry="8.5" fill="#ffb44d" stroke="#3b2314" stroke-width="2"/><circle cx="26" cy="10.5" r="1.8" fill="#3b2314"/></svg>';

const G = {
  state: 'menu',       // menu | play | dying | win | paused | over
  level: null,
  run: null,
  t: 0,
  cat: null,
  cam: { x: 0, y: 0 },
  particles: [],
  fishGot: 0,
  input: { down: false, release: false },
  VH: 600,
  scale: 1,
  dpr: 1,
  hintShown: false,
  jumps: 0,
  timer: 0,
  prevState: null,
};

function newCat(x, y) {
  return {
    x, y, vx: 0, vy: 0, ground: null, charging: false, charge: 0, chargeStart: 0,
    landT: -10, jumpT: -10, blinkT: 2, dead: false, sink: 0, walk: 0,
    respawn: null, bonkT: -10, spawnT: -10,
  };
}

// ---------- Storlek ----------
function resize() {
  const rect = stage.getBoundingClientRect();
  const cssW = Math.max(1, rect.width);
  const cssH = Math.max(1, rect.height);
  G.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(cssW * G.dpr);
  canvas.height = Math.round(cssH * G.dpr);
  G.scale = cssW / VIEW_W;
  G.VH = cssH / G.scale;
}
window.addEventListener('resize', resize);

// ---------- Partiklar ----------
function addParticle(p) {
  G.particles.push(Object.assign({ life: 0, max: 1, vx: 0, vy: 0, g: 0, size: 4, rot: 0, vr: 0 }, p));
}
function burstDust(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    addParticle({
      type: 'dust', x: x + Math.cos(a) * 8, y: y - 2, vx: Math.cos(a) * (40 + Math.random() * 40),
      vy: Math.sin(a) * 30 - 10, max: 0.45, size: 4 + Math.random() * 3, color: col || 'rgba(255,255,255,0.8)',
    });
  }
}
function burstSplash(x) {
  for (let i = 0; i < 18; i++) {
    addParticle({
      type: 'drop', x: x + (Math.random() - 0.5) * 20, y: WATER_Y, vx: (Math.random() - 0.5) * 220,
      vy: -150 - Math.random() * 260, g: 900, max: 1, size: 2.5 + Math.random() * 3,
    });
  }
  addParticle({ type: 'ring', x, y: WATER_Y + 2, max: 0.9, size: 10 });
  addParticle({ type: 'ring', x, y: WATER_Y + 2, max: 1.2, size: 4, delay: 0.15 });
}
function burstSparkle(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const sp = 60 + Math.random() * 90;
    addParticle({
      type: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, max: 0.6 + Math.random() * 0.3,
      size: 3 + Math.random() * 3, color: col || '#ffe36b', vr: 6,
    });
  }
}
function burstHearts(x, y, n) {
  for (let i = 0; i < n; i++) {
    addParticle({
      type: 'heart', x: x + (Math.random() - 0.5) * 40, y: y - Math.random() * 20,
      vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 40, max: 1.6 + Math.random() * 0.8,
      size: 9 + Math.random() * 6, delay: Math.random() * 1.2,
    });
  }
}
function burstConfetti(x, y, n) {
  const cols = ['#ff5a6e', '#ffd93d', '#5ad1ff', '#7be07b', '#c38cff'];
  for (let i = 0; i < n; i++) {
    addParticle({
      type: 'confetti', x: x + (Math.random() - 0.5) * 200, y: y - 200 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 60, vy: 40 + Math.random() * 80, g: 40, max: 3.5,
      size: 4 + Math.random() * 3, color: cols[i % cols.length], vr: (Math.random() - 0.5) * 12,
      delay: Math.random() * 0.8,
    });
  }
}
function burstPop(x, y) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    addParticle({
      type: 'shred', x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 - 40, g: 500, max: 0.8,
      size: 4 + Math.random() * 3, color: '#ff4d5e', vr: (Math.random() - 0.5) * 20,
    });
  }
  addParticle({ type: 'ring', x, y, max: 0.3, size: 14, color: '#ffffff' });
}

function updateParticles(dt) {
  const arr = G.particles;
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.life += dt;
    if (p.life >= p.max) { arr.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.type === 'drop' && p.y > WATER_Y + 4 && p.vy > 0) arr.splice(i, 1);
  }
}

function drawParticles(camX, camY) {
  for (const p of G.particles) {
    if (p.delay > 0) continue;
    const k = p.life / p.max;
    const x = p.x - camX;
    const y = p.y - camY;
    switch (p.type) {
      case 'dust':
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - k;
        ellipse(ctx, x, y, p.size * (1 + k), p.size * (1 + k));
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'drop':
        ctx.fillStyle = '#e8f7ff';
        ellipse(ctx, x, y, p.size * 0.8, p.size);
        ctx.fill();
        break;
      case 'ring':
        ctx.strokeStyle = p.color || 'rgba(255,255,255,0.9)';
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 2.5;
        ellipse(ctx, x, y, p.size + k * 40, (p.size + k * 40) * 0.3);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'star': {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = p.color;
        const s = p.size * (1 - k * 0.5);
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const r = j % 2 ? s * 0.4 : s;
          const a = (j * Math.PI) / 4;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'heart':
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : Math.min(1, k * 6);
        heartPath(ctx, x + Math.sin(p.life * 4) * 4, y, p.size);
        fillStroke(ctx, '#ff5a7e', 1.8);
        ctx.globalAlpha = 1;
        break;
      case 'confetti':
      case 'shred':
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, (1 - k) * 3);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
        ctx.globalAlpha = 1;
        break;
      default:
        break;
    }
  }
}

// ---------- HUD ----------
function renderHearts(el, lives, popIndex) {
  let html = '';
  for (let i = 0; i < 3; i++) {
    let cls = i < lives ? '' : 'lost';
    if (i === popIndex) cls += ' pop';
    html += HEART_SVG.replace('<svg ', `<svg class="${cls.trim()}" `);
  }
  el.innerHTML = html;
}
function updateHud(popIndex) {
  if (!G.level) return;
  ui.level.textContent = `Bana ${G.level.idx + 1}`;
  ui.fish.innerHTML = `${FISH_SVG}<span>${G.fishGot}/${G.level.fish.length}</span>`;
  renderHearts(ui.lives, G.run ? G.run.lives : 3, popIndex);
}

function showOnly(el) {
  for (const o of [ui.menu, ui.pause, ui.cleared, ui.gameover, ui.victory, ui.locked]) {
    o.classList.toggle('hidden', o !== el);
  }
}

function showBanner(idx) {
  ui.banner.classList.add('hidden');
  // Starta om animationen
  void ui.banner.offsetWidth;
  ui.banner.innerHTML = `<div class="b-small">BANA ${idx + 1}</div><div class="b-big">${LEVELS[idx].name}</div>`;
  ui.banner.classList.remove('hidden');
  clearTimeout(showBanner.timer);
  showBanner.timer = setTimeout(() => ui.banner.classList.add('hidden'), 2700);
}

// ---------- Banor ----------
function loadLevel(idx) {
  G.level = buildLevel(idx);
  const start = G.level.plats[0];
  G.cat = newCat(60, start.y);
  G.cat.ground = start;
  G.cat.respawn = { p: start, off: 60 - start.x };
  G.t = 0;
  G.fishGot = 0;
  G.particles = [];
  G.jumps = 0;
  G.cam.x = G.cat.x - VIEW_W * 0.26;
  G.cam.y = camTargetY();
  stage.style.background = THEMES[G.level.L.theme].stage;
  for (const p of G.level.plats) {
    const q = platformPos(p, 0);
    p.x = p.px = q.x;
    p.y = p.py = q.y;
  }
}

function startLevel(idx) {
  loadLevel(idx);
  G.state = 'play';
  G.input.down = false;
  G.input.release = false;
  showOnly(null);
  ui.hud.classList.remove('hidden');
  updateHud();
  showBanner(idx);
  ui.hint.classList.toggle('hidden', !(idx === 0 && !G.hintShown));
}

function camTargetY() {
  const bottomLimit = WATER_Y + 85 - G.VH;
  if (!G.cat) return bottomLimit;
  return Math.min(bottomLimit, G.cat.y - G.VH * 0.5);
}

// ---------- Menyer ----------
function openMenu() {
  G.state = 'menu';
  ui.hud.classList.add('hidden');
  ui.hint.classList.add('hidden');
  Sound.stopHum();
  G.run = loadRun();
  const ticket = hasTicket();
  if (!G.run && !ticket) {
    if (!G.level) loadLevel(0);
    showOnly(ui.locked);
    return;
  }
  showOnly(ui.menu);
  const unlocked = loadUnlocked();
  ui.levels.innerHTML = '';
  const numCols = ['#5cc25a', '#4fa3e0', '#2f8fd1', '#e8648a', '#6a5ae0'];
  if (G.run) {
    renderHearts(ui.menuLives, G.run.lives);
    ui.menuLives.classList.remove('hidden');
    ui.menuText.textContent = `Du har ${G.run.lives} ${G.run.lives === 1 ? 'liv' : 'liv'} kvar.`;
    ui.continueBtn.textContent = `Fortsätt – Bana ${G.run.level + 1}`;
    ui.continueBtn.classList.remove('hidden');
    ui.levels.classList.add('hidden');
    if (!G.level || G.level.idx !== G.run.level) loadLevel(G.run.level);
  } else {
    renderHearts(ui.menuLives, 3);
    ui.menuText.textContent = 'Hjälp kattungen hem till mamma! Välj bana:';
    ui.continueBtn.classList.add('hidden');
    ui.levels.classList.remove('hidden');
    LEVELS.forEach((L, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'level-btn';
      b.disabled = i > unlocked;
      const stars = '★'.repeat(i + 1) + '☆'.repeat(LEVELS.length - 1 - i);
      b.innerHTML = `<span class="num" style="background:${numCols[i]}">${i > unlocked ? '🔒' : i + 1}</span>` +
        `<span class="name">${L.name}<br><span class="diff">${stars}</span></span>`;
      b.addEventListener('click', () => {
        Sound.ensure();
        Sound.play('click');
        if (!hasTicket() && !loadRun()) { openMenu(); return; }
        useTicket();
        G.run = { level: i, lives: 3, fish: 0 };
        saveRun(G.run);
        startLevel(i);
      });
      ui.levels.appendChild(b);
    });
    if (!G.level) loadLevel(0);
  }
}

ui.continueBtn.addEventListener('click', () => {
  Sound.ensure();
  Sound.play('click');
  G.run = loadRun();
  if (!G.run) { openMenu(); return; }
  startLevel(G.run.level);
});

function updateSoundBtn() {
  ui.soundBtn.classList.toggle('muted', Sound.muted);
}
ui.soundBtn.addEventListener('click', () => {
  Sound.setMuted(!Sound.muted);
  updateSoundBtn();
  Sound.ensure();
  Sound.play('click');
});

function pauseGame() {
  if (G.state !== 'play' && G.state !== 'dying') return;
  G.prevState = G.state;
  G.state = 'paused';
  Sound.stopHum();
  if (G.cat) G.cat.charging = false;
  G.input.down = false;
  showOnly(ui.pause);
}
$('pause-btn').addEventListener('click', () => { Sound.play('click'); pauseGame(); });
$('resume-btn').addEventListener('click', () => {
  Sound.play('click');
  showOnly(null);
  G.state = G.prevState || 'play';
});
$('restart-btn').addEventListener('click', () => {
  Sound.play('click');
  if (G.prevState === 'dying') {
    // Mitt i ett plask – låt det bli klart först
    showOnly(null);
    G.state = 'dying';
    return;
  }
  startLevel(G.level.idx);
});
$('menu-btn').addEventListener('click', () => {
  Sound.play('click');
  if (G.prevState === 'dying') finishDying(true);
  openMenu();
});
$('next-btn').addEventListener('click', () => {
  Sound.play('click');
  G.run = loadRun();
  if (G.run) startLevel(G.run.level);
  else openMenu();
});
$('again-btn').addEventListener('click', () => {
  Sound.play('click');
  openMenu();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});

// ---------- Inmatning ----------
function pressStart(e) {
  if (e) e.preventDefault();
  Sound.ensure();
  if (G.state !== 'play') return;
  G.input.down = true;
  const c = G.cat;
  if (c.ground && !c.charging) startCharge();
}
function pressEnd(e) {
  if (e) e.preventDefault();
  if (!G.input.down) return;
  G.input.down = false;
  if (G.state === 'play' && G.cat.charging) G.input.release = true;
}
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== undefined && e.button > 0) return;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignorera */ }
  pressStart(e);
});
canvas.addEventListener('pointerup', pressEnd);
canvas.addEventListener('pointercancel', pressEnd);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
    if (G.state !== 'play') return;
    e.preventDefault();
    if (!e.repeat) pressStart();
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    pauseGame();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') pressEnd(e);
});

function startCharge() {
  const c = G.cat;
  c.charging = true;
  c.charge = 0;
  c.chargeStart = G.t;
  Sound.startHum();
}

// ---------- Spelets logik ----------
function jump() {
  const c = G.cat;
  const v = V_MIN + (V_MAX - V_MIN) * c.charge;
  c.vx = v * COS_A;
  c.vy = -v * SIN_A;
  c.ground = null;
  c.charging = false;
  c.jumpT = G.t;
  G.jumps++;
  Sound.stopHum();
  Sound.play('jump');
  burstDust(c.x, c.y, 5);
  if (G.jumps >= 1 && !ui.hint.classList.contains('hidden')) {
    ui.hint.classList.add('hidden');
    G.hintShown = true;
  }
}

function land(p) {
  const c = G.cat;
  c.ground = p;
  c.vx = 0;
  c.vy = 0;
  c.landT = G.t;
  Sound.play('land');
  burstDust(c.x, c.y, 6, G.level.L.theme === 'night' ? 'rgba(200,210,255,0.6)' : 'rgba(255,255,255,0.85)');
  if (p.kind === 'goal') {
    win();
    return;
  }
  if (p.kind === 'pop' && !p.triggered) {
    p.triggered = true;
    p.popT = p.popDelay;
    Sound.play('creak');
  }
  if (p.kind === 'ground' || p.kind === 'post' || p.kind === 'float') {
    c.respawn = { p, off: clamp(c.x - p.x, 14, p.w - 14) };
  }
  if (G.input.down) startCharge();
}

function die() {
  const c = G.cat;
  G.state = 'dying';
  c.dead = true;
  c.charging = false;
  Sound.stopHum();
  Sound.play('splash');
  Sound.play('lose');
  burstSplash(c.x);
  G.timer = 1.5;
  G.run.lives--;
  if (G.run.lives > 0) saveRun(G.run);
  else saveRun(null);
  updateHud(G.run.lives);
}

function finishDying(silent) {
  if (G.run.lives > 0) {
    respawn(silent);
  } else {
    gameOver();
  }
}

function resetPops() {
  for (const p of G.level.plats) {
    if (p.kind === 'pop') {
      p.triggered = false;
      p.popped = false;
      p.popT = 0;
      p.fallY = 0;
      p.fallV = 0;
      p.rot = 0;
      p.gone = false;
    }
  }
}

function respawn(silent) {
  resetPops();
  const c = G.cat;
  const r = c.respawn;
  const fresh = newCat(r.p.x + r.off, r.p.y);
  fresh.ground = r.p;
  fresh.respawn = r;
  fresh.spawnT = G.t;
  G.cat = fresh;
  G.state = 'play';
  if (!silent) {
    Sound.play('respawn');
    burstSparkle(fresh.x, fresh.y - 16, 12, '#ffffff');
  }
  if (G.input.down) startCharge();
}

function gameOver() {
  G.state = 'over';
  ui.hud.classList.add('hidden');
  $('gameover-text').textContent = `Kattungen kom till bana ${G.level.idx + 1} – ${LEVELS[G.level.idx].name}.`;
  $('again-btn').classList.toggle('hidden', !hasTicket());
  showOnly(ui.gameover);
}

function win() {
  const c = G.cat;
  G.state = 'win';
  c.charging = false;
  Sound.stopHum();
  Sound.play('win');
  G.timer = 0;
  const idx = G.level.idx;
  const last = idx === LEVELS.length - 1;
  G.run.fish = (G.run.fish || 0) + G.fishGot;
  if (last) {
    saveRun(null);
  } else {
    G.run.level = idx + 1;
    saveRun(G.run);
  }
  saveUnlocked(Math.max(loadUnlocked(), Math.min(idx + 1, LEVELS.length - 1)));
  const goal = G.level.goal;
  burstHearts(goal.x + 180, goal.y - 60, 10);
  if (last) burstConfetti(goal.x + 150, goal.y, 80);
}

function showCleared() {
  const idx = G.level.idx;
  const last = idx === LEVELS.length - 1;
  ui.hud.classList.add('hidden');
  if (last) {
    $('victory-fish').innerHTML = `${FISH_SVG}<span>${G.run.fish} fiskar totalt</span>`;
    showOnly(ui.victory);
    return;
  }
  $('cleared-title').textContent = `Bana ${idx + 1} klar!`;
  $('cleared-text').textContent = `Nästa: ${LEVELS[idx + 1].name}`;
  $('cleared-fish').innerHTML = `${FISH_SVG}<span>${G.fishGot} av ${G.level.fish.length}</span>`;
  renderHearts($('cleared-lives'), G.run.lives);
  showOnly(ui.cleared);
}

function updatePlatforms(h) {
  for (const p of G.level.plats) {
    p.px = p.x;
    p.py = p.y;
    const q = platformPos(p, G.t);
    if (p.kind === 'pop') {
      if (p.triggered && !p.popped) {
        p.popT -= h;
        if (p.popT <= 0) {
          p.popped = true;
          p.fallV = 0;
          Sound.play('pop');
          burstPop(p.x + p.w / 2, p.y - 92);
        }
      }
      if (p.popped && !p.gone) {
        p.fallV += GRAV * h;
        p.fallY += p.fallV * h;
        p.rot += h * 1.5;
        if (q.y + p.fallY > WATER_Y + 80) p.gone = true;
      }
    }
    p.x = q.x;
    p.y = q.y + p.fallY;
  }
}

function step(h) {
  G.t += h;
  updatePlatforms(h);
  const c = G.cat;
  if (G.state === 'play') {
    if (G.input.release) {
      G.input.release = false;
      if (c.ground && c.charging) jump();
    }
    if (c.ground) {
      const p = c.ground;
      if (p.popped) {
        c.ground = null;
        c.vy = p.fallV;
        c.vx = 0;
        c.charging = false;
        Sound.stopHum();
      } else {
        c.x += p.x - p.px;
        c.y = p.y;
        const minX = p.x + 10;
        const maxX = p.x + p.w - 10;
        if (c.x < minX) { c.x = Math.min(minX, c.x + 70 * h); c.walk += h * 18; }
        if (c.x > maxX) { c.x = Math.max(maxX, c.x - 70 * h); c.walk += h * 18; }
        if (c.charging) {
          c.charge = Math.min(1, (G.t - c.chargeStart) / CHARGE_TIME);
        }
      }
    }
    if (!c.ground) {
      const near = G.level.plats.filter((p) => !p.gone && p.x < c.x + 200 && p.x + p.w > c.x - 200);
      const hit = physStep(c, near, h);
      if (hit) {
        land(hit);
      } else if (c.vx === 0 && c.vy > 0 && G.t - c.bonkT > 0.5 && G.t - c.jumpT < 1.5) {
        c.bonkT = G.t;
      }
      if (c.y > DEATH_Y && G.state === 'play') die();
    }
    // Fiskar
    for (const f of G.level.fish) {
      if (f.got) continue;
      const dx = f.x - c.x;
      const dy = f.y - (c.y - CAT_H / 2);
      if (dx * dx + dy * dy < 26 * 26) {
        f.got = true;
        G.fishGot++;
        Sound.play('fish');
        burstSparkle(f.x, f.y, 10);
        updateHud();
      }
    }
  } else if (G.state === 'dying') {
    c.sink += h;
    c.y = Math.min(c.y + 60 * h, WATER_Y + 60);
    G.timer -= h;
    if (G.timer <= 0) finishDying(false);
  } else if (G.state === 'win') {
    G.timer += h;
    const goal = G.level.goal;
    const tx = goal.x + 116;
    if (c.x < tx) {
      c.x = Math.min(tx, c.x + 90 * h);
      c.walk += h * 16;
    }
    c.y = goal.y;
    if (G.timer > 0.6 && G.timer - h <= 0.6) burstHearts(goal.x + 150, goal.y - 50, 8);
    if (G.timer > 2.6 && G.timer - h <= 2.6) showCleared();
  }
}

// ---------- Rendering ----------
let lastTime = 0;
let acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;
  if (!G.level) return;
  if (G.state === 'play' || G.state === 'dying' || G.state === 'win') {
    acc += dt;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    if (G.cat.charging) Sound.setHum(G.cat.charge);
  } else if (G.state === 'menu' || G.state === 'over' || G.state === 'paused') {
    // Låt världen leva lite i bakgrunden
    if (G.state === 'menu') {
      G.t += dt;
      updatePlatforms(dt);
      if (G.cat && G.cat.ground) {
        G.cat.y = G.cat.ground.y;
      }
    }
    acc = 0;
  } else {
    acc = 0;
  }
  updateParticles(dt);
  updateCamera(dt);
  render();
}

function updateCamera(dt) {
  const c = G.cat;
  if (!c) return;
  let tx = c.x - VIEW_W * 0.26;
  if (c.charging) tx += c.charge * 60;
  if (G.state === 'win') tx = G.level.goal.x - 40;
  const k = 1 - Math.exp(-dt * 4.5);
  G.cam.x += (tx - G.cam.x) * k;
  const ty = camTargetY();
  G.cam.y += (ty - G.cam.y) * (1 - Math.exp(-dt * 3));
}

function render() {
  const theme = G.level.L.theme;
  const camX = G.cam.x;
  const camY = G.cam.y;
  const VH = G.VH;
  const t = G.t;
  ctx.setTransform(G.scale * G.dpr, 0, 0, G.scale * G.dpr, 0, 0);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawBackground(ctx, theme, camX, camY, VH, t);

  const bottom = WATER_Y + 60 - camY;
  // Plattformar
  for (const p of G.level.plats) {
    if (p.gone) continue;
    const sx = p.x - camX;
    if (sx > VIEW_W + 40 || sx + p.w < -40) {
      if (p.kind !== 'goal' || sx > VIEW_W + 60 || sx + p.w < -60) continue;
    }
    const sy = p.y - camY;
    switch (p.kind) {
      case 'ground':
      case 'goal':
        drawGround(ctx, theme, p, sx, sy, bottom, t);
        if (p.kind === 'goal') drawGoal(ctx, theme, p, sx, sy, t, G.state);
        break;
      case 'post':
        drawPost(ctx, theme, p, sx, sy, bottom, t);
        break;
      case 'float':
        drawFloat(ctx, theme, p, sx, sy);
        break;
      case 'balloon':
      case 'pop': {
        let shake = 0;
        if (p.kind === 'pop' && p.triggered && !p.popped) shake = 1.4 * (1 - p.popT / p.popDelay) + 0.3;
        drawBalloonBox(ctx, theme, p, sx, sy, t, shake);
        break;
      }
      default:
        break;
    }
  }

  // Fiskar
  for (const f of G.level.fish) {
    if (f.got) continue;
    const sx = f.x - camX;
    if (sx < -30 || sx > VIEW_W + 30) continue;
    drawFish(ctx, sx, f.y - camY, t, f.seed);
  }

  // Sikte
  const c = G.cat;
  if (G.state === 'play' && c.charging && c.ground) drawAim(camX, camY);

  // Katten
  drawKitten(camX, camY);

  drawWater(ctx, theme, camX, camY, VH, t);
  drawParticles(camX, camY);

  // Laddmätare
  if (G.state === 'play' && c.charging) drawPowerBar(c.x - camX, c.y - camY);
}

function drawAim(camX, camY) {
  const c = G.cat;
  const near = G.level.plats.filter((p) => !p.gone && p.x < c.x + 420 && p.x + p.w > c.x - 120);
  const sim = simulateJump(near, G.t, c.x, c.y, c.charge, 260, 3);
  const path = sim.path;
  const n = path.length / 2;
  const frac = G.level.L.preview;
  const shown = Math.max(3, Math.floor(n * frac));
  for (let i = 1; i < Math.min(n, shown); i += 2) {
    const k = i / shown;
    const alpha = frac >= 1 ? 0.95 : 0.95 * (1 - k);
    const x = path[i * 2] - camX;
    const y = path[i * 2 + 1] - CAT_H / 2 - camY;
    ctx.globalAlpha = alpha;
    ellipse(ctx, x, y, 3.4, 3.4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (frac >= 1 && sim.plat) {
    // Tassavtryck där katten landar
    const lx = sim.x - camX;
    const ly = sim.y - camY;
    ctx.fillStyle = 'rgba(59,35,20,0.45)';
    ellipse(ctx, lx, ly - 3, 6, 3.4);
    ctx.fill();
    for (let k = -1; k <= 1; k++) {
      ellipse(ctx, lx + k * 5, ly - 9, 2.2, 1.8);
      ctx.fill();
    }
  }
}

function drawPowerBar(x, y) {
  const c = G.cat;
  const w = 56;
  const bx = x - w / 2 + 4;
  const by = y - 74;
  rr(ctx, bx - 2, by - 2, w + 4, 15, 7.5);
  fillStroke(ctx, '#fff7e8', 2.6);
  const fw = Math.max(0, (w - 2) * c.charge);
  if (fw > 1) {
    const g = ctx.createLinearGradient(bx, 0, bx + w, 0);
    g.addColorStop(0, '#5cc25a');
    g.addColorStop(0.55, '#ffd93d');
    g.addColorStop(1, '#ff5a5a');
    rr(ctx, bx + 1, by + 1, fw, 9, 4.5);
    ctx.fillStyle = g;
    ctx.fill();
  }
  if (c.charge >= 1 && Math.sin(G.t * 30) > 0) {
    rr(ctx, bx - 2, by - 2, w + 4, 15, 7.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Liten tass
  ctx.fillStyle = INK;
  ellipse(ctx, bx - 12, by + 6, 4, 3.2);
  ctx.fill();
  for (let k = -1; k <= 1; k++) {
    ellipse(ctx, bx - 12 + k * 3.4, by + 1, 1.5, 1.4);
    ctx.fill();
  }
}

function drawKitten(camX, camY) {
  const c = G.cat;
  const t = G.t;
  let pose = 'stand';
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let mood = null;
  let x = c.x - camX;
  const y = c.y - camY;
  if (G.state === 'win') {
    mood = 'happy';
    const hop = Math.abs(Math.sin(G.timer * 7)) * (G.timer > 0.9 ? 6 : 0);
    sy = 1 + Math.sin(t * 3) * 0.02;
    drawCat(ctx, { x, y: y - hop, scale: 1.05, sx, sy, pal: KITTEN, pose: hop > 1 ? 'jump' : 'stand', t, mood, walk: c.walk });
    return;
  }
  if (c.dead) {
    pose = 'fall';
    mood = 'scared';
    rot = 0.4;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - c.sink * 0.8);
    drawCat(ctx, { x, y, scale: 1.05, rot, pal: KITTEN, pose, t, mood });
    ctx.restore();
    return;
  }
  if (c.ground) {
    if (c.charging) {
      pose = 'crouch';
      sy = 1 - 0.22 * c.charge;
      sx = 1 + 0.12 * c.charge;
      if (c.charge >= 1) x += Math.sin(t * 70) * 0.8;
    } else {
      sy = 1 + Math.sin(t * 3) * 0.015;
    }
    const e = Math.max(0, 1 - (t - c.landT) / 0.18);
    sy *= 1 - 0.22 * e;
    sx *= 1 + 0.16 * e;
    if (c.ground.kind === 'pop' && c.ground.triggered) mood = 'scared';
  } else {
    pose = c.vy < 0 ? 'jump' : 'fall';
    rot = clamp(c.vy / 1500, -0.4, 0.45);
    const e = Math.max(0, 1 - (t - c.jumpT) / 0.2);
    sy = 1 + 0.14 * e;
    sx = 1 - 0.1 * e;
  }
  // Blinka ibland
  const blink = (t % 3.3) < 0.12 && c.ground && !c.charging;
  // Liten "pop" när katten dyker upp igen
  const sp = t - c.spawnT;
  let scale = 1.05;
  if (sp < 0.35) scale *= 0.4 + 0.6 * Math.sin((sp / 0.35) * Math.PI * 0.5) + Math.sin((sp / 0.35) * Math.PI) * 0.15;
  // Skugga
  if (c.ground) {
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ellipse(ctx, x + 2, y + 1, 16 * sx, 3.2);
    ctx.fill();
  }
  drawCat(ctx, { x, y, scale, sx, sy, rot, pal: KITTEN, pose, t, mood, blink, walk: c.walk });
}

// Bygg banorna i förväg när webbläsaren har tid, så att starten går snabbt
function warmLevels(i) {
  if (i >= LEVELS.length) return;
  setTimeout(() => {
    buildLevel(i);
    warmLevels(i + 1);
  }, 120);
}

// ---------- Start ----------
resize();
updateSoundBtn();
openMenu();
warmLevels(0);
requestAnimationFrame((now) => {
  lastTime = now;
  frame(now);
});
// Sidan kan visas från bakåt-cachen – läs om lagringen då
window.addEventListener('pageshow', (e) => {
  if (e.persisted) openMenu();
});

})();
