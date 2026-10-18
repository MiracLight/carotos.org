/**
 * Gizli mini oyun: yavru kaplumbağa denize koşuyor.
 *
 * Saf JavaScript, bağımlılık yok. Mantık (bölüm üretimi) ile çizim ve girdi
 * ayrı tutuldu; bölüm üretimi tarayıcısız test edilebilir.
 *
 * Koordinatlar 360x640 mantıksal alanda; canvas CSS ile ölçeklenir.
 */

export const W = 360;
export const H = 640;
export const LANES = 3;
export const LANE_W = W / LANES;
export const PY = 500; // kaplumbağanın ekrandaki sabit y konumu
export const laneCenter = (i) => LANE_W * (i + 0.5);

const MAX_HEARTS = 3;
const PARTS_PER_HEART = 5;
const LANE_MOVE_TIME = 0.11; // bir şerit değiştirme süresi (test için referans)

/** Küçük, tohumlanabilir rastgele sayı üreteci. */
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bölüm parametreleri: her bölüm biraz daha hızlı, uzun ve sık. */
export function levelParams(n) {
  return {
    speed: Math.min(190 + 24 * (n - 1), 400),
    length: Math.min(2600 + 1300 * (n - 1), 15000),
    gap: Math.max(0.6, 1.2 - 0.07 * (n - 1)), // iki sıra arası süre (sn)
    doubleChance: n < 2 ? 0 : Math.min(0.55, 0.12 * (n - 1)),
  };
}

/** Yengecin o anki x konumu: iki şeridin merkezleri arasında salınır. */
export function crabX(o, t) {
  return o.x + Math.sin(t * o.freq + o.phase) * (LANE_W / 2);
}

const OBSTACLE_SIZE = {
  rock: { w: 40, h: 30 },
  crab: { w: 38, h: 28 },
  wood: { w: 165, h: 24 },
  weed: { w: 46, h: 44 },
  starfish: { w: 40, h: 36 },
  bottle: { w: 46, h: 22 },
  urchin: { w: 38, h: 38 },
  sandcastle: { w: 44, h: 38 },
  net: { w: 50, h: 34 },
};

/**
 * Her bölümün 3 ayrı düzeni var. Düzen; engel seti, dizilim mantığı ve zemin
 * rengini birlikte değiştirir. Her denemede rastgele biri seçilir.
 *   0 Kumsal  : serpiştirilmiş engeller, yengeç ve kütük satırları
 *   1 Kayalık : slalom, boş şerit sağa sola kayar
 *   2 Sürüntü : kütük ve yengeç geçitleri, arada kabuk izleri
 */
export const VARIANT_COUNT = 3;

// [tür, ilk göründüğü bölüm, ağırlık]
const SINGLES = [
  [["rock", 1, 3], ["starfish", 1, 2], ["weed", 3, 2]],
  [["rock", 1, 3], ["sandcastle", 1, 2], ["urchin", 2, 2], ["net", 3, 2]],
  [["bottle", 1, 3], ["net", 1, 2], ["weed", 1, 2], ["starfish", 2, 1]],
];

function pickSingle(variant, n, rand) {
  const pool = SINGLES[variant].filter((t) => n >= t[1]);
  const total = pool.reduce((a, t) => a + t[2], 0);
  let r = rand() * total;
  for (const t of pool) {
    r -= t[2];
    if (r < 0) return t[0];
  }
  return pool[0][0];
}

/**
 * Bir bölümün engellerini ve toplanabilirlerini üretir.
 * Her sırada en az bir şerit boştur ve bir sonraki sıranın boş şeridine,
 * önceki sıranın boş şeridinden en fazla bir şerit kayarak ulaşılabilir.
 * Yengeç ve kütük satırlarında kapalı sayılan şeritler engel ya da
 * yengecin süpürdüğü iki şerittir.
 */
export function buildLevel(n, rand = Math.random, variant = 0) {
  const p = levelParams(n);
  const obstacles = [];
  const items = [];
  let z = 720;
  let prevFree = [0, 1, 2];

  const freeOf = (blocked) => [0, 1, 2].filter((l) => !blocked.includes(l));
  const reach = (free) => free.some((a) => prevFree.some((q) => Math.abs(a - q) <= 1));

  const single = (lane) => {
    const type = pickSingle(variant, n, rand);
    obstacles.push({
      type,
      lanes: [lane],
      z,
      x: laneCenter(lane),
      ...OBSTACLE_SIZE[type],
      phase: rand() * 6.28,
    });
  };
  const wood = (a) =>
    obstacles.push({
      type: "wood",
      lanes: [a, a + 1],
      z,
      x: (laneCenter(a) + laneCenter(a + 1)) / 2,
      ...OBSTACLE_SIZE.wood,
      phase: rand() * 6.28,
    });
  // Yengeç: orta şerit ile bir yan şerit arasında gidip gelir
  const crab = (side) =>
    obstacles.push({
      type: "crab",
      lanes: [1, side],
      z,
      x: (laneCenter(1) + laneCenter(side)) / 2,
      ...OBSTACLE_SIZE.crab,
      phase: rand() * 6.28,
      freq: Math.min(2.2 + 0.15 * Math.max(0, n - 2), 4),
    });
  const pickLane = () => Math.floor(rand() * LANES);
  const twoSingles = () => {
    const fr = pickLane();
    const bl = [0, 1, 2].filter((l) => l !== fr);
    return { blocked: bl, build: () => bl.forEach(single) };
  };
  const woodRow = () => {
    const a = rand() < 0.5 ? 0 : 1;
    return { blocked: [a, a + 1], build: () => wood(a) };
  };
  const crabRow = () => {
    const side = rand() < 0.5 ? 0 : 2;
    return { blocked: [1, side], build: () => crab(side) };
  };

  // --- 0 Kumsal: serpiştirilmiş ---
  const scatter = () => {
    if (n >= 2 && rand() < Math.min(0.35, 0.18 + 0.03 * (n - 2))) return crabRow();
    if (rand() < p.doubleChance) return n >= 2 && rand() < 0.5 ? woodRow() : twoSingles();
    const l = pickLane();
    return { blocked: [l], build: () => single(l) };
  };

  // --- 1 Kayalık: slalom ---
  let f = 1;
  const slalom = () => {
    const cand = [];
    if (f > 0) cand.push(f - 1);
    if (f < 2) cand.push(f + 1);
    const nf = cand[Math.floor(rand() * cand.length)];
    f = nf;
    if (n >= 3 && (nf === 0 || nf === 2) && rand() < 0.25) {
      const side = nf === 0 ? 2 : 0; // boş kalan şerit nf
      return { blocked: [1, side], build: () => crab(side) };
    }
    const others = [0, 1, 2].filter((l) => l !== nf);
    const both = n >= 2 && rand() < Math.min(0.9, 0.35 + 0.15 * (n - 1));
    const bl = both ? others : [others[Math.floor(rand() * 2)]];
    return { blocked: bl, build: () => bl.forEach(single) };
  };

  // --- 2 Sürüntü: geçitler ---
  let step = 0;
  const gates = () => {
    step += 1;
    const ph = step % 4;
    if (ph === 0) return null; // nefes alma sırası
    if (ph === 1) return n >= 2 ? woodRow() : twoSingles();
    if (ph === 2) return n >= 2 ? crabRow() : twoSingles();
    const l = pickLane();
    return { blocked: [l], build: () => single(l) };
  };

  let rowNo = 0;
  while (z < p.length - 450) {
    rowNo += 1;
    let spec = null;
    if (variant === 0) {
      if (rand() > 0.12) spec = scatter();
    } else if (variant === 1) {
      if (rowNo % 5 !== 0) spec = slalom();
    } else {
      spec = gates();
    }

    if (spec && !reach(freeOf(spec.blocked))) {
      const l = pickLane();
      spec = { blocked: [l], build: () => single(l) };
    }

    const gapPx = p.gap * p.speed * (0.9 + rand() * 0.4);

    if (spec) {
      spec.build();
      prevFree = freeOf(spec.blocked);
    } else {
      prevFree = [0, 1, 2];
      // Nefes sırasında kabuk izi (sürüntü düzeninde daha sık)
      if (variant === 2 && rand() < 0.75) {
        const lane = pickLane();
        for (const k of [-1, 0, 1]) {
          items.push({ z: z + gapPx / 2 + k * 38, x: laneCenter(lane), lane, taken: false });
        }
      }
    }

    // Sıra arasına bazen tek bir kabuk parçası
    if (rand() < 0.4) {
      const lane = prevFree[Math.floor(rand() * prevFree.length)];
      items.push({ z: z + gapPx / 2, x: laneCenter(lane), lane, taken: false });
    }

    z += gapPx;
  }

  return { params: p, obstacles, items, length: p.length, variant };
}

/**
 * Bölüm yıldızı:
 *   1 yıldız  bölümü bitirmek
 *   2 yıldız  en fazla 1 çarpma
 *   3 yıldız  hiç çarpmadan ve kabuk parçalarının en az yarısı
 */
export function starsFor(hits, parts, total) {
  if (hits === 0 && parts >= Math.ceil(total * 0.5)) return 3;
  if (hits <= 1) return 2;
  return 1;
}

/** Gizli oyunu bir canvas üzerinde başlatır. */
export function createGame(canvas, opt) {
  const ctx = canvas.getContext("2d");
  const S = opt.strings;
  const rand = opt.seed != null ? mulberry32(opt.seed) : Math.random;

  let raf = 0;
  let last = 0;
  let alive = true;
  let scale = 1;

  const sandDots = Array.from({ length: 90 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.8 + Math.random() * 1.6,
    a: 0.08 + Math.random() * 0.14,
  }));

  const g = {
    level: 1,
    phase: "idle", // idle | ready | run | sea | done | over
    d: 0,
    t: 0,
    phaseT: 0,
    lane: 1,
    x: laneCenter(1),
    hearts: MAX_HEARTS,
    parts: 0,
    hits: 0, // bu bölümdeki çarpma sayısı
    pool: 0, // kalan kabuk parçası sayacı (can için)
    invuln: 0,
    slow: 0,
    shake: 0,
    world: null,
    lean: 0, // şerit değiştirirken yana yatma
    squash: 0, // çarpınca ezilme
    variant: 0,
    lastVariant: {}, // bölüm -> son oynanan düzen
    heartFlash: 0,
    partsBump: 0,
    vig: 0, // çarpma kızıllığı
    prints: [], // kumdaki ayak izleri
    printT: 0,
    printSide: 1,
    dustT: 0,
    fx: [], // parçacıklar ve uçan yazılar
    splashed: false,
  };

  // ---------- Ses (küçük, sentezlenmiş; ilk dokunuştan sonra) ----------
  let ac = null;
  let muted = !!opt.muted;
  function tone(freq, dur, type = "sine", vol = 0.08, slide = 0, when = 0) {
    if (muted || !ac) return;
    const t0 = ac.currentTime + when;
    const o = ac.createOscillator();
    const gn = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    gn.gain.setValueAtTime(vol, t0);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn);
    gn.connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  const sfx = {
    move: () => tone(440, 0.05, "sine", 0.025),
    collect: () => {
      tone(660, 0.09, "triangle", 0.09);
      tone(990, 0.15, "triangle", 0.09, 0, 0.07);
    },
    heart: () => [523, 659, 784].forEach((f, i) => tone(f, 0.12, "triangle", 0.08, 0, i * 0.07)),
    hit: () => {
      tone(190, 0.28, "sawtooth", 0.11, 0.4);
      tone(90, 0.3, "sine", 0.14, 0.5);
    },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.1, 0, i * 0.11)),
    over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, "sine", 0.1, 0, i * 0.15)),
    tick: () => tone(520, 0.08, "sine", 0.05),
    go: () => tone(780, 0.18, "triangle", 0.08),
  };

  // ---------- Parçacıklar ----------
  function burst(x, y, n, colors, speed, life, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = opts.up ? -Math.PI / 2 + (Math.random() - 0.5) * 2.2 : Math.random() * 6.283;
      const v = speed * (0.4 + Math.random() * 0.8);
      g.fx.push({
        kind: "dot",
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        r: 1.6 + Math.random() * 2.4,
        life: life * (0.6 + Math.random() * 0.6),
        max: life,
        c: colors[(Math.random() * colors.length) | 0],
        grav: opts.grav || 0,
        world: !!opts.world,
      });
    }
  }
  function floater(x, y, str) {
    g.fx.push({ kind: "text", x, y, vx: 0, vy: -46, life: 0.9, max: 0.9, str, world: false });
  }

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth || W;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(cw * (H / W) * dpr);
    scale = canvas.width / W;
  }

  // Aynı bölümde art arda aynı düzen gelmez
  function pickVariant(level) {
    if (opt.variant != null) return opt.variant;
    const prev = g.lastVariant[level];
    let v;
    do {
      v = Math.floor(rand() * VARIANT_COUNT);
    } while (v === prev && VARIANT_COUNT > 1);
    g.lastVariant[level] = v;
    return v;
  }

  function start(level, variant) {
    g.level = level;
    g.variant = variant != null ? variant : pickVariant(level);
    g.world = buildLevel(level, rand, g.variant);
    g.phase = "ready";
    g.phaseT = 0;
    g.d = 0;
    g.lane = 1;
    g.x = laneCenter(1);
    g.hearts = MAX_HEARTS;
    g.parts = 0;
    g.hits = 0;
    g.pool = 0;
    g.invuln = 0;
    g.slow = 0;
    g.prints = [];
    g.fx = [];
    g.splashed = false;
    g.lean = 0;
    g.squash = 0;
    if (!ac && !opt.noSound) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ac = new AC();
      } catch (_) {
        ac = null;
      }
    }
    if (ac && ac.state === "suspended") ac.resume();
    opt.onStart && opt.onStart(level);
  }

  function move(dir) {
    if (g.phase !== "run" && g.phase !== "ready") return;
    const next = Math.max(0, Math.min(LANES - 1, g.lane + dir));
    if (next !== g.lane) sfx.move();
    g.lane = next;
  }

  // ---------- Girdi ----------
  const onKey = (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      move(-1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      move(1);
      e.preventDefault();
    }
  };

  let ptr = null;
  const onDown = (e) => {
    ptr = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {
      /* yok say */
    }
  };
  const onMove = (e) => {
    if (!ptr) return;
    const dx = e.clientX - ptr.x;
    if (Math.abs(dx) > 28) {
      move(dx > 0 ? 1 : -1);
      ptr.x = e.clientX;
      ptr.moved = true;
    }
  };
  const onUp = (e) => {
    if (!ptr) return;
    if (!ptr.moved && performance.now() - ptr.t < 350) {
      const r = canvas.getBoundingClientRect();
      move(e.clientX - r.left < r.width / 2 ? -1 : 1);
    }
    ptr = null;
  };

  window.addEventListener("keydown", onKey);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", () => (ptr = null));
  window.addEventListener("resize", fit);

  // ---------- Mantık ----------
  function curSpeed() {
    const base = g.world.params.speed;
    if (g.phase === "ready") return 0;
    if (g.phase === "run") {
      const ramp = Math.min(1, 0.45 + g.phaseT / 0.9);
      return base * ramp * (g.slow > 0 ? 0.6 : 1);
    }
    if (g.phase === "sea") return base * Math.max(0.3, 1 - g.phaseT * 0.55);
    return 0;
  }

  function hit() {
    g.hearts -= 1;
    g.hits += 1;
    g.invuln = 1.4;
    g.slow = 0.5;
    g.shake = 0.25;
    g.squash = 1;
    g.heartFlash = 1;
    g.vig = 1;
    burst(g.x, PY, 16, ["#fff6e0", "#ff9a8a", "#ffd36b", "#8a6a43"], 170, 0.6, { grav: 260 });
    sfx.hit();
    if (g.hearts <= 0) {
      g.phase = "over";
      g.phaseT = 0;
      sfx.over();
      opt.onOver && opt.onOver({ level: g.level });
    }
  }

  function update(dt) {
    g.t += dt;
    g.phaseT += dt;
    const targetX = laneCenter(g.lane);
    g.x += (targetX - g.x) * Math.min(1, dt * 18);
    const leanTarget = Math.max(-1, Math.min(1, (targetX - g.x) / 45)) * 0.42;
    g.lean += (leanTarget - g.lean) * Math.min(1, dt * 14);
    if (g.invuln > 0) g.invuln -= dt;
    if (g.slow > 0) g.slow -= dt;
    if (g.shake > 0) g.shake -= dt;
    if (g.squash > 0) g.squash = Math.max(0, g.squash - dt * 2.6);
    if (g.heartFlash > 0) g.heartFlash = Math.max(0, g.heartFlash - dt * 2.2);
    if (g.partsBump > 0) g.partsBump = Math.max(0, g.partsBump - dt * 4);
    if (g.vig > 0) g.vig = Math.max(0, g.vig - dt * 2.4);

    // parçacıkları ilerlet
    const sp = curSpeed();
    for (const f of g.fx) {
      f.x += f.vx * dt;
      f.y += f.vy * dt + (f.world ? sp * dt : 0);
      if (f.grav) f.vy += f.grav * dt;
      f.life -= dt;
    }
    g.fx = g.fx.filter((f) => f.life > 0);

    if (g.phase === "ready") {
      const n = 3 - Math.min(2, Math.floor(g.phaseT / 0.5));
      if (g.lastCount !== n) {
        g.lastCount = n;
        sfx.tick();
      }
      if (g.phaseT >= 1.5) {
        g.phase = "run";
        g.phaseT = 0;
        g.lastCount = 0;
        sfx.go();
      }
      return;
    }
    if (g.phase !== "run" && g.phase !== "sea") return;

    g.d += curSpeed() * dt;

    if (g.phase === "run") {
      const py = PY;
      // ayak izi ve toz
      g.printT += dt;
      if (g.printT > 0.2) {
        g.printT = 0;
        g.printSide *= -1;
        g.prints.push({ z: g.d, x: g.x + g.printSide * 10, side: g.printSide });
        if (g.prints.length > 40) g.prints.shift();
      }
      g.dustT += dt;
      if (g.dustT > 0.06) {
        g.dustT = 0;
        g.fx.push({
          kind: "dot",
          x: g.x + (Math.random() - 0.5) * 18,
          y: PY + 26,
          vx: (Math.random() - 0.5) * 24,
          vy: 20 + Math.random() * 20,
          r: 2 + Math.random() * 2,
          life: 0.45,
          max: 0.45,
          c: "#d8c590",
          grav: 0,
          world: false,
        });
      }
      for (const o of g.world.obstacles) {
        const sy = py - (o.z - g.d);
        if (sy < -60 || sy > H + 60) continue;
        let ox = o.x;
        if (o.type === "crab") ox = crabX(o, g.t);
        const hw = (o.w / 2) * 0.82 + 10;
        const hh = (o.h / 2) * 0.85 + 14;
        if (g.invuln <= 0 && Math.abs(g.x - ox) < hw && Math.abs(py - sy) < hh) {
          hit();
          break;
        }
      }
      for (const it of g.world.items) {
        if (it.taken) continue;
        const sy = py - (it.z - g.d);
        if (Math.abs(g.x - it.x) < 26 && Math.abs(py - sy) < 30) {
          it.taken = true;
          g.parts += 1;
          g.pool += 1;
          g.partsBump = 1;
          burst(it.x, sy, 9, ["#a9dbc4", "#f4f9fd", "#4a9c78"], 110, 0.5, { world: true });
          if (g.pool >= PARTS_PER_HEART) {
            g.pool = 0;
            if (g.hearts < MAX_HEARTS) {
              g.hearts += 1;
              g.heartFlash = 1;
              floater(g.x, PY - 40, "+♥");
              sfx.heart();
            } else {
              floater(g.x, PY - 40, "+1");
              sfx.collect();
            }
          } else {
            floater(g.x, PY - 40, "+1");
            sfx.collect();
          }
        }
      }
      if (g.d >= g.world.length) {
        g.phase = "sea";
        g.phaseT = 0;
        burst(g.x, PY - 10, 26, ["#f4f9fd", "#a9cfea", "#6db2f0"], 190, 0.9, { up: true, grav: 340 });
      }
    } else if (g.phase === "sea") {
      if (g.phaseT >= 1.6) {
        g.phase = "done";
        g.phaseT = 0;
        sfx.win();
        opt.onComplete &&
          opt.onComplete({
            level: g.level,
            parts: g.parts,
            total: g.world.items.length,
            hits: g.hits,
            stars: starsFor(g.hits, g.parts, g.world.items.length),
          });
      }
    }
  }

  // ---------- Çizim ----------
  function hexPath(cx, cy, r, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = rot + (Math.PI / 3) * i;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  // düzene göre zemin: kumsal, kayalık, ıslak sürüntü kumu
  const PALETTE = [
    { top: "#ecdcae", bot: "#e2cf9b", dot: "120,95,50", big: 1 },
    { top: "#dcd4c0", bot: "#cbc1a8", dot: "80,80,92", big: 1.7 },
    { top: "#dcc796", bot: "#c9b07a", dot: "96,70,36", big: 1.2 },
  ];

  function drawSand() {
    const pal = PALETTE[g.variant] || PALETTE[0];
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, pal.top);
    grd.addColorStop(1, pal.bot);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    for (const p of sandDots) {
      const y = (p.y + g.d) % H;
      ctx.fillStyle = `rgba(${pal.dot},${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, y, p.r * pal.big, 0, 6.283);
      ctx.fill();
    }
    // Rüzgârın kumda bıraktığı hafif dalgalar
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    for (let k = 0; k < 9; k++) {
      const y = ((k * 83 + g.d * 0.55) % (H + 60)) - 30;
      const x = (k * 97) % (W - 60);
      ctx.strokeStyle = "rgba(255,248,225,0.32)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 28, y - 7, x + 60, y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(120,95,50,0.07)";
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.quadraticCurveTo(x + 30, y - 2, x + 56, y + 4);
      ctx.stroke();
    }
    // Şerit çizgileri çok silik
    ctx.strokeStyle = "rgba(120,95,50,0.07)";
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 18]);
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(LANE_W * i, 0);
      ctx.lineTo(LANE_W * i, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawSea() {
    const shoreY = PY - (g.world.length - g.d);
    if (shoreY <= -10) return;
    // ıslak kum
    ctx.fillStyle = "#cdb882";
    ctx.fillRect(0, Math.max(0, shoreY), W, 34);
    // su
    const wg = ctx.createLinearGradient(0, 0, 0, Math.max(shoreY, 1));
    wg.addColorStop(0, "#185fa5");
    wg.addColorStop(0.6, "#378ada");
    wg.addColorStop(1, "#a9cfea");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    for (let x = W; x >= 0; x -= 12) {
      ctx.lineTo(x, shoreY + Math.sin(x * 0.045 + g.t * 2.4) * 5);
    }
    ctx.closePath();
    ctx.fill();
    // su pırıltıları
    for (let i = 0; i < 16; i++) {
      const sy = (i * 41) % Math.max(shoreY - 20, 1);
      const sx = (i * 59 + g.t * (6 + (i % 4) * 3)) % W;
      const al = 0.25 + 0.3 * Math.sin(g.t * 2.6 + i * 1.7);
      if (al <= 0.05) continue;
      ctx.strokeStyle = `rgba(244,249,253,${al})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 9 + (i % 3) * 3, sy);
      ctx.stroke();
    }
    // köpük
    ctx.strokeStyle = "rgba(244,249,253,0.95)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const y = shoreY + Math.sin(x * 0.045 + g.t * 2.4) * 5;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(244,249,253,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const y = shoreY - 16 + Math.sin(x * 0.06 - g.t * 1.8) * 4;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  function drawEggshell() {
    // Bölüm 1'in başında yumurta kabuğu yarımları
    if (g.level !== 1) return;
    const sy = PY - (-38 - g.d); // kaplumbağanın arkasında kalır
    if (sy > H + 40) return;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(laneCenter(1) + s * 24, sy);
      ctx.rotate(s * 0.4);
      ctx.fillStyle = "#fbf6ea";
      ctx.strokeStyle = "#cbb98a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI);
      ctx.lineTo(-20, 0);
      for (let i = 0; i < 5; i++) ctx.lineTo(-20 + (i + 1) * 8, i % 2 ? 0 : -7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawObstacle(o, sy) {
    ctx.save();
    ctx.translate(o.x, sy);
    if (o.type === "crab") {
      // devriye yolu: iki şerit arasında silik bir iz
      ctx.strokeStyle = "rgba(120,95,50,0.13)";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-LANE_W / 2, 4);
      ctx.lineTo(LANE_W / 2, 4);
      ctx.stroke();
      ctx.strokeStyle = "rgba(120,95,50,0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 9]);
      ctx.beginPath();
      ctx.moveTo(-LANE_W / 2, 4);
      ctx.lineTo(LANE_W / 2, 4);
      ctx.stroke();
      ctx.setLineDash([]);
      // gölge ve yengeç birlikte kayar
      ctx.translate(crabX(o, g.t) - o.x, 0);
    }
    // gölge
    ctx.fillStyle = "rgba(90,70,30,0.18)";
    ctx.beginPath();
    ctx.ellipse(3, 8, o.w / 2, o.h / 2.4, 0, 0, 6.283);
    ctx.fill();

    if (o.type === "rock") {
      ctx.fillStyle = "#7d8a96";
      ctx.strokeStyle = "#566370";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, 8);
      ctx.lineTo(-15, -10);
      ctx.lineTo(0, -15);
      ctx.lineTo(16, -9);
      ctx.lineTo(20, 8);
      ctx.lineTo(0, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.moveTo(-12, -7);
      ctx.lineTo(0, -12);
      ctx.lineTo(6, -6);
      ctx.lineTo(-8, -2);
      ctx.closePath();
      ctx.fill();
    } else if (o.type === "crab") {
      // yürüyüş hızıyla bacak hareketi
      const wig = Math.sin(g.t * (o.freq * 5 + 6) + o.phase) * 2.5;
      ctx.strokeStyle = "#c2512f";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(s * 8, -2 + i * 6);
          ctx.lineTo(s * 17, 2 + i * 6 + wig * s);
          ctx.stroke();
        }
        // kıskaç
        ctx.fillStyle = "#e0643a";
        ctx.beginPath();
        ctx.arc(s * 15, -14, 6, 0, 6.283);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 9, -6);
        ctx.lineTo(s * 14, -12);
        ctx.stroke();
      }
      ctx.fillStyle = "#e0643a";
      ctx.beginPath();
      ctx.ellipse(0, 2, 13, 10, 0, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-4, -6, 2.2, 0, 6.283);
      ctx.arc(4, -6, 2.2, 0, 6.283);
      ctx.fill();
    } else if (o.type === "wood") {
      const hw = o.w / 2;
      // gövde: yukarıdan aşağıya koyulaşan kabuk
      const bark = ctx.createLinearGradient(0, -11, 0, 12);
      bark.addColorStop(0, "#a9835a");
      bark.addColorStop(0.5, "#86653f");
      bark.addColorStop(1, "#5f4528");
      ctx.fillStyle = bark;
      ctx.strokeStyle = "#4a351d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hw + 6, -10);
      ctx.bezierCurveTo(-hw * 0.5, -13, -hw * 0.1, -9, hw * 0.3, -12);
      ctx.bezierCurveTo(hw * 0.6, -13, hw * 0.85, -10, hw - 6, -9);
      ctx.lineTo(hw - 6, 10);
      ctx.bezierCurveTo(hw * 0.7, 13, hw * 0.3, 10, -hw * 0.1, 12);
      ctx.bezierCurveTo(-hw * 0.5, 13, -hw * 0.8, 10, -hw + 6, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // boyuna kabuk oluklar
      ctx.strokeStyle = "rgba(40,26,12,0.5)";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      for (const y of [-5, 0, 5]) {
        for (let x = -hw + 14; x < hw - 24; x += 38) {
          ctx.beginPath();
          ctx.moveTo(x + (y + 5) * 2, y);
          ctx.quadraticCurveTo(x + 16, y + 2, x + 30, y - 1);
          ctx.stroke();
        }
      }
      // budaklar
      for (const [kx, ky, kr] of [[-hw * 0.35, -1, 4.2], [hw * 0.4, 3, 3.6]]) {
        ctx.fillStyle = "#4a351d";
        ctx.beginPath();
        ctx.ellipse(kx, ky, kr, kr * 0.8, 0, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = "rgba(200,170,120,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(kx, ky, kr + 2, kr * 0.8 + 2, 0, 0, 6.283);
        ctx.stroke();
      }
      // kırık dal
      ctx.fillStyle = "#7a5b37";
      ctx.strokeStyle = "#4a351d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hw * 0.05, -10);
      ctx.lineTo(hw * 0.02, -20);
      ctx.lineTo(hw * 0.14, -19);
      ctx.lineTo(hw * 0.13, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#cfae7a";
      ctx.beginPath();
      ctx.ellipse(hw * 0.08, -19.5, 6, 2.6, 0, 0, 6.283);
      ctx.fill();
      // iki ucu: kesik yüzey, halkalar
      for (const sx of [-1, 1]) {
        const ex = sx * (hw - 6);
        ctx.fillStyle = "#cfae7a";
        ctx.strokeStyle = "#4a351d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(ex, 0, 6.5, 10.5, 0, 0, 6.283);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#a07c4a";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(ex, 0, 3.8, 6.5, 0, 0, 6.283);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(ex, 0, 1.4, 2.4, 0, 0, 6.283);
        ctx.stroke();
      }
      // üstüne takılmış yosun
      ctx.strokeStyle = "#4a9c78";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.6, 8);
      ctx.quadraticCurveTo(-hw * 0.62, 16, -hw * 0.5, 18);
      ctx.moveTo(-hw * 0.55, 9);
      ctx.quadraticCurveTo(-hw * 0.5, 14, -hw * 0.42, 14);
      ctx.stroke();
    } else if (o.type === "starfish") {
      ctx.rotate(o.phase * 0.5);
      ctx.fillStyle = "#f08a4b";
      ctx.strokeStyle = "#c4622a";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 7.5 : 19;
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffd3a8";
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        for (const r of [6, 11, 15]) {
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, 1.3, 0, 6.283);
          ctx.fill();
        }
      }
    } else if (o.type === "bottle") {
      ctx.rotate((o.phase % 1) - 0.5);
      ctx.strokeStyle = "#2d7a5a";
      ctx.lineWidth = 1.8;
      ctx.fillStyle = "rgba(78,170,128,0.92)";
      ctx.beginPath();
      ctx.roundRect(-20, -7.5, 28, 15, 6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(6, -4, 14, 8, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#c9a23a";
      ctx.fillRect(19, -4.5, 4.5, 9);
      ctx.fillStyle = "rgba(244,249,253,0.85)";
      ctx.fillRect(-11, -5.5, 12, 11);
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(-13, -4);
      ctx.stroke();
    } else if (o.type === "urchin") {
      ctx.rotate(Math.sin(g.t * 1.6 + o.phase) * 0.12);
      ctx.strokeStyle = "#3a2c63";
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      for (let i = 0; i < 22; i++) {
        const ang = (i * 2 * Math.PI) / 22;
        const r2 = i % 2 ? 17 : 20;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 9, Math.sin(ang) * 9);
        ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.fillStyle = "#5b4a94";
      ctx.beginPath();
      ctx.arc(0, 0, 11.5, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(-4, -4, 3.2, 0, 6.283);
      ctx.fill();
    } else if (o.type === "sandcastle") {
      ctx.fillStyle = "#e0bf78";
      ctx.strokeStyle = "#a98b4a";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.roundRect(-20, -4, 40, 20, 3);
      ctx.fill();
      ctx.stroke();
      for (const [tx, tw, th] of [[-22, 12, 28], [10, 12, 28], [-8, 16, 34]]) {
        ctx.beginPath();
        ctx.roundRect(tx, 14 - th, tw, th, 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#a98b4a";
        for (let k = 0; k < 3; k++) ctx.fillRect(tx + 1 + k * (tw / 3), 14 - th - 3, tw / 3 - 1, 3.5);
        ctx.fillStyle = "#e0bf78";
      }
      ctx.fillStyle = "#8a6d3a";
      ctx.beginPath();
      ctx.moveTo(-4, 16);
      ctx.lineTo(-4, 9);
      ctx.quadraticCurveTo(0, 3, 4, 9);
      ctx.lineTo(4, 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8a6d3a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, -29);
      ctx.stroke();
      ctx.fillStyle = "#e0643a";
      ctx.beginPath();
      ctx.moveTo(0, -29);
      ctx.lineTo(9, -26);
      ctx.lineTo(0, -23);
      ctx.closePath();
      ctx.fill();
    } else if (o.type === "net") {
      ctx.beginPath();
      ctx.moveTo(-23, -4);
      ctx.lineTo(-14, -15);
      ctx.lineTo(6, -17);
      ctx.lineTo(22, -8);
      ctx.lineTo(24, 8);
      ctx.lineTo(8, 16);
      ctx.lineTo(-14, 15);
      ctx.lineTo(-24, 6);
      ctx.closePath();
      ctx.fillStyle = "rgba(120,150,170,0.28)";
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(76,104,124,0.9)";
      ctx.lineWidth = 1.3;
      for (let k = -40; k <= 40; k += 8) {
        ctx.beginPath();
        ctx.moveTo(k - 20, -20);
        ctx.lineTo(k + 20, 20);
        ctx.moveTo(k + 20, -20);
        ctx.lineTo(k - 20, 20);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "#4c687c";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      for (const [fx, fy] of [[-18, -9], [14, -13], [18, 11]]) {
        ctx.fillStyle = "#ff8a3d";
        ctx.beginPath();
        ctx.arc(fx, fy, 4.4, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(fx - 1.3, fy - 1.3, 1.3, 0, 6.283);
        ctx.fill();
      }
    } else if (o.type === "weed") {
      ctx.strokeStyle = "#3f7f5e";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      for (let i = -3; i <= 3; i++) {
        const sway = Math.sin(g.t * 3 + i + o.phase) * 3;
        ctx.beginPath();
        ctx.moveTo(i * 5, 14);
        ctx.quadraticCurveTo(i * 7 + sway, 0, i * 4 + sway * 1.5, -20 + Math.abs(i) * 3);
        ctx.stroke();
      }
      ctx.strokeStyle = "#5fae86";
      ctx.lineWidth = 2.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 6, 12);
        ctx.quadraticCurveTo(i * 8, -2, i * 5, -16);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawItem(it, sy) {
    const bob = Math.sin(g.t * 4 + it.z) * 2;
    ctx.save();
    ctx.translate(it.x, sy + bob);
    ctx.fillStyle = "rgba(90,70,30,0.15)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 10, 4, 0, 0, 6.283);
    ctx.fill();
    hexPath(0, 0, 12, 0.52);
    ctx.fillStyle = "#a9dbc4";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#4a9c78";
    ctx.stroke();
    hexPath(0, 0, 5, 0.52);
    ctx.fillStyle = "#4a9c78";
    ctx.fill();
    ctx.restore();
  }

  function drawTurtle(x, y, t, swimming, lean = 0, squash = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    const sq = squash > 0 ? Math.sin(squash * Math.PI) * 0.2 : 0;
    ctx.scale(1 + sq, 1 - sq);

    if (!swimming) {
      // zemin gölgesi
      ctx.save();
      ctx.rotate(-lean);
      ctx.fillStyle = "rgba(90,70,30,0.22)";
      ctx.beginPath();
      ctx.ellipse(4, 9, 23, 27, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }

    const f = swimming ? 8 : 13;
    const amp = swimming ? 0.55 : 0.4;
    const skin = "#1b6bb8";
    const skinLight = "#4a97e0";

    // ayaklar: çapraz yürüyüş (sol ön + sağ arka birlikte)
    const flippers = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    for (const [side, row] of flippers) {
      const px = side * (row < 0 ? 15 : 13);
      const py = row < 0 ? -9 : 13;
      const base = side * (row < 0 ? 0.95 : 2.25);
      const phase = t * f + (side * row > 0 ? 0 : Math.PI);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(base + Math.sin(phase) * amp);
      const len = row < 0 ? 15 : 11;
      ctx.beginPath();
      ctx.moveTo(-3.5, 0);
      ctx.bezierCurveTo(-8, -len * 0.5, -5, -len, 0, -len - 3);
      ctx.bezierCurveTo(5, -len, 8, -len * 0.5, 3.5, 0);
      ctx.closePath();
      ctx.fillStyle = skin;
      ctx.fill();
      ctx.fillStyle = skinLight;
      ctx.beginPath();
      ctx.ellipse(-1.2, -len * 0.55, 1.8, len * 0.32, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }

    // kuyruk
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-3.5, 18);
    ctx.quadraticCurveTo(0, 22, 0, 29);
    ctx.quadraticCurveTo(0, 22, 3.5, 18);
    ctx.closePath();
    ctx.fill();

    // boyun ve baş
    const bob = Math.sin(t * f * 0.5) * 1.1;
    ctx.beginPath();
    ctx.ellipse(0, -17, 5, 6.5, 0, 0, 6.283);
    ctx.fill();
    ctx.save();
    ctx.translate(lean * 4, -26 + bob);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 10.5, 0, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = skinLight;
    ctx.beginPath();
    ctx.ellipse(-2.5, -5.5, 4.2, 2.4, -0.3, 0, 6.283);
    ctx.fill();
    // gözler
    for (const sx of [-4.4, 4.4]) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(sx, -2.4, 3.2, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#0a2440";
      ctx.beginPath();
      ctx.arc(sx + lean * 2, -3.0, 1.7, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(sx + lean * 2 - 0.5, -3.7, 0.65, 0, 6.283);
      ctx.fill();
    }
    // gülümseme
    ctx.strokeStyle = "rgba(10,36,64,0.55)";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 3.2, 3, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // kabuk: gradyanlı, logodaki gibi altıgen + altı dilim
    const R = 20.5;
    const shell = ctx.createRadialGradient(-6, -8, 2, 0, 0, R + 2);
    shell.addColorStop(0, "#7ebdf3");
    shell.addColorStop(0.55, "#378ada");
    shell.addColorStop(1, "#2a72c2");
    hexPath(0, 0, R, Math.PI / 6);
    ctx.fillStyle = shell;
    ctx.fill();
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#185fa5";
    ctx.stroke();
    ctx.strokeStyle = "rgba(244,249,253,0.9)";
    ctx.lineWidth = 1.7;
    for (let i = 0; i < 6; i++) {
      const ang = Math.PI / 6 + (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 8.5, Math.sin(ang) * 8.5);
      ctx.lineTo(Math.cos(ang) * R, Math.sin(ang) * R);
      ctx.stroke();
    }
    hexPath(0, 0, 8.5, Math.PI / 6);
    ctx.fillStyle = "#185fa5";
    ctx.fill();
    ctx.strokeStyle = "rgba(244,249,253,0.9)";
    ctx.lineWidth = 1.7;
    ctx.stroke();
    // parlama
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(-8.5, -11, 6.5, 3, -0.7, 0, 6.283);
    ctx.fill();
    ctx.restore();
  }

  function heart(x, y, s, full) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-10, -2, -6, -9, 0, -4);
    ctx.bezierCurveTo(6, -9, 10, -2, 0, 5);
    ctx.fillStyle = full ? "#ff6b6b" : "rgba(255,255,255,0.25)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(10,36,64,0.55)";
    ctx.stroke();
    ctx.restore();
  }

  function text(str, x, y, size, align = "center", weight = 700) {
    ctx.font = `${weight} ${size}px Archivo, "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, size / 5);
    ctx.strokeStyle = "rgba(10,36,64,0.75)";
    ctx.strokeText(str, x, y);
    ctx.fillStyle = "#f4f9fd";
    ctx.fillText(str, x, y);
  }

  function drawHud() {
    text(`${S.level} ${g.level}`, 14, 30, 17, "left");
    for (let i = 0; i < MAX_HEARTS; i++) {
      const pulse = 1 + 0.35 * Math.sin(g.heartFlash * Math.PI);
      heart(W - 20 - i * 24, 25, 1.2 * (i < g.hearts ? pulse : 1), i < g.hearts);
    }
    // ilerleme çubuğu
    const prog = Math.min(1, g.d / g.world.length);
    const bx = 92;
    const bw = 150;
    ctx.fillStyle = "rgba(10,36,64,0.35)";
    ctx.beginPath();
    ctx.roundRect(bx, 22, bw, 7, 4);
    ctx.fill();
    ctx.fillStyle = "#a9dbc4";
    ctx.beginPath();
    ctx.roundRect(bx, 22, Math.max(7, bw * prog), 7, 4);
    ctx.fill();
    // parça sayacı
    hexPath(W - 14, 54, 7 * (1 + g.partsBump * 0.5), 0.52);
    ctx.fillStyle = "#a9dbc4";
    ctx.fill();
    text(String(g.parts), W - 28, 60, 14, "right");
  }

  function render() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (g.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
    drawSand();
    if (!g.world) {
      // Oyun başlamadan önce bekleyen yavru
      drawTurtle(laneCenter(1), PY, performance.now() / 1000, false, 0, 0);
      return;
    }
    drawEggshell();

    // ayak izleri
    for (const pr of g.prints) {
      const sy = PY - (pr.z - g.d);
      if (sy < PY - 5 || sy > H + 10) continue;
      const al = Math.max(0, 1 - (sy - PY) / 240) * 0.3;
      ctx.fillStyle = `rgba(110,85,45,${al})`;
      ctx.beginPath();
      ctx.ellipse(pr.x, sy, 2.8, 5.2, pr.side * 0.4, 0, 6.283);
      ctx.fill();
    }

    for (const it of g.world.items) {
      if (it.taken) continue;
      const sy = PY - (it.z - g.d);
      if (sy > -30 && sy < H + 30) drawItem(it, sy);
    }
    for (const o of g.world.obstacles) {
      const sy = PY - (o.z - g.d);
      if (sy > -60 && sy < H + 60) drawObstacle(o, sy);
    }
    drawSea();

    // kaplumbağa
    const sea = g.phase === "sea" || g.phase === "done";
    const py = sea ? PY - 150 * Math.min(1, g.phaseT / 1.2) : PY;
    const blink = g.invuln > 0 && Math.floor(g.invuln * 12) % 2 === 0;
    if (!blink) {
      if (sea) {
        ctx.fillStyle = "rgba(244,249,253,0.35)";
        for (let i = 0; i < 3; i++) {
          const r = 22 + ((g.phaseT * 40 + i * 16) % 48);
          ctx.strokeStyle = `rgba(244,249,253,${0.5 - r / 140})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(g.x, py, r, r * 0.7, 0, 0, 6.283);
          ctx.stroke();
        }
      }
      drawTurtle(g.x, py, g.t, sea, g.lean, g.squash);
    }

    // parçacıklar
    for (const f of g.fx) {
      const k = Math.max(0, f.life / f.max);
      if (f.kind === "text") {
        ctx.globalAlpha = Math.min(1, k * 1.6);
        text(f.str, f.x, f.y, 20);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = Math.min(1, k * 1.4);
        ctx.fillStyle = f.c;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (0.5 + 0.5 * k), 0, 6.283);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // kenarlarda hafif karartma, çarpınca kırmızı parlama
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78);
    vg.addColorStop(0, "rgba(10,36,64,0)");
    vg.addColorStop(1, "rgba(10,36,64,0.22)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (g.vig > 0) {
      ctx.fillStyle = `rgba(255,70,70,${g.vig * 0.28})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawHud();

    if (g.phase === "ready") {
      const n = 3 - Math.min(2, Math.floor(g.phaseT / 0.5));
      const fr = (g.phaseT % 0.5) / 0.5;
      text(`${S.level} ${g.level}`, W / 2, 200, 34);
      if (S.variants && S.variants[g.variant]) text(S.variants[g.variant], W / 2, 230, 17, "center", 600);
      ctx.globalAlpha = Math.min(1, 1.4 - fr);
      text(String(n), W / 2, 300, 84 * (1 + 0.28 * (1 - fr)));
      ctx.globalAlpha = 1;
      if (g.level === 1) text(S.hint, W / 2, 346, 16, "center", 600);
    }
    if (g.phase === "sea" && g.phaseT > 0.25) {
      text(S.reached, W / 2, 210, 30);
    }
  }

  function frame(ts) {
    if (!alive) return;
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
    last = ts;
    if (g.world) update(dt);
    render();
    raf = requestAnimationFrame(frame);
  }

  fit();
  raf = requestAnimationFrame(frame);

  return {
    start,
    fit,
    setMuted(m) {
      muted = !!m;
    },
    destroy() {
      if (ac) {
        try {
          ac.close();
        } catch (_) {
          /* yok say */
        }
        ac = null;
      }
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", fit);
    },
    /** Test ve erişilebilirlik için salt okunur durum. */
    getState() {
      return {
        level: g.level,
        variant: g.variant,
        phase: g.phase,
        lane: g.lane,
        hearts: g.hearts,
        parts: g.parts,
        progress: g.world ? g.d / g.world.length : 0,
        d: g.d,
        obstacles: g.world
          ? g.world.obstacles.map((o) => ({ lanes: o.lanes, z: o.z, type: o.type }))
          : [],
      };
    },
  };
}

export { LANE_MOVE_TIME };
