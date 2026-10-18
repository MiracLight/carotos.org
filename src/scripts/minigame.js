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
const SHIELD_TIME = 6.5; // kalkan süresi (sn)
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

/** Yengeçler bu bölümden itibaren bazen üç şeridin tamamını tarar. */
export const SWEEP_FROM = 6;
/** O bölümlerde bir yengecin üç şeridi tarama ihtimali (kalanı iki şeritte gezer). */
export const SWEEP_CHANCE = 0.5;

/** Yengecin o anki x konumu: şeritler arasında salınır (amp: yarı genişlik). */
export function crabX(o, t) {
  return o.x + Math.sin(t * o.freq + o.phase) * (o.amp || LANE_W / 2);
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
  pool: { w: 46, h: 34 },
  jellyfish: { w: 38, h: 38 },
  coral: { w: 40, h: 40 },
  anemone: { w: 38, h: 34 },
  bonfire: { w: 40, h: 38 },
  crate: { w: 40, h: 36 },
  wave: { w: 165, h: 26 },
  buoy: { w: 30, h: 38 },
  tire: { w: 44, h: 34 },
  barrel: { w: 34, h: 38 },
  dune: { w: 50, h: 36 },
  reed: { w: 44, h: 44 },
};

/**
 * Her bölümün 9 ayrı düzeni var. Düzen; engel seti, dizilim mantığı, zemin
 * rengi ve hava durumunu birlikte değiştirir. Her denemede, o bölümde
 * açılmış olanlar arasından rastgele biri seçilir.
 *   0 Kumsal         serpiştirilmiş engeller, yengeç ve kütük satırları
 *   1 Kayalık        slalom, boş şerit sağa sola kayar
 *   2 Sürüntü        kütük ve yengeç geçitleri, arada kabuk izleri
 *   3 Gelgit Havuzu  havuzlar ve denizanaları, sık ikili satırlar
 *   4 Mercan Kıyısı  zikzak koridor
 *   5 Gece Kumsalı   karanlık kumsal, ateş ve sandıklar
 *   6 Fırtına Kıyısı yağmur, dalga satırları ve şamandıralar
 *   7 Atık Kıyısı    lastik, varil ve bol plastik atık
 *   8 Kumul Rüzgârı  dalgalı koridor, kumullar ve kuru otlar
 */
export const VARIANT_COUNT = 9;
/** Düzenlerin ilk açıldığı bölüm */
export const VARIANT_MIN = [1, 1, 1, 2, 2, 3, 3, 4, 4];
export const variantsFor = (level) =>
  VARIANT_MIN.map((m, i) => (m <= level ? i : -1)).filter((i) => i >= 0);

// [tür, ilk göründüğü bölüm, ağırlık]
const SINGLES = [
  [["rock", 1, 3], ["starfish", 1, 2], ["sandcastle", 1, 2], ["weed", 3, 2]],
  [["rock", 1, 4], ["urchin", 1, 2], ["net", 2, 2]],
  [["bottle", 1, 3], ["net", 1, 2], ["weed", 1, 2], ["starfish", 2, 1]],
  [["pool", 1, 4], ["jellyfish", 1, 3], ["starfish", 1, 1]],
  [["coral", 1, 4], ["anemone", 1, 3], ["urchin", 1, 1]],
  [["bonfire", 1, 2], ["crate", 1, 3], ["rock", 1, 2]],
  [["buoy", 1, 3], ["rock", 1, 2], ["weed", 1, 1]],
  [["tire", 1, 3], ["barrel", 1, 3], ["bottle", 1, 2], ["net", 1, 1]],
  [["dune", 1, 3], ["reed", 1, 3], ["rock", 1, 1]],
];
// Geniş (iki şerit kaplayan) engel türü olan düzenler
const WIDE = { 0: "wood", 2: "wood", 5: "wood", 6: "wave" };

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
 * Yengeç ve geniş engel satırlarında kapalı sayılan şeritler engel ya da
 * yengecin süpürdüğü iki şerittir. SWEEP_FROM'dan sonra yengeç üç şeridi de
 * tarar: sabit bir kapalı şerit yoktur, bunun yerine öncesinde ve sonrasında
 * dinlenme boşluğu bırakılır, hız da düşük tutulur.
 */
export function buildLevel(n, rand = Math.random, variant = 0) {
  const p = levelParams(n);
  const obstacles = [];
  const items = [];
  let z = 720;
  let prevFree = [0, 1, 2];
  let lastBlocked = 0;
  let sinceCrab = 0;
  let lastPower = -9999;
  let lastPlastic = -9999;

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
  const wide = (a) => {
    const type = WIDE[variant] || "wood";
    obstacles.push({
      type,
      lanes: [a, a + 1],
      z,
      x: (laneCenter(a) + laneCenter(a + 1)) / 2,
      ...OBSTACLE_SIZE[type],
      phase: rand() * 6.28,
    });
  };
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
  // Süpüren yengeç: soldan sağa, üç şeridin hepsini kat eder (yavaş ve okunaklı)
  const sweepCrab = () =>
    obstacles.push({
      type: "crab",
      sweep: true,
      lanes: [0, 1, 2],
      z,
      x: laneCenter(1),
      amp: LANE_W,
      ...OBSTACLE_SIZE.crab,
      phase: rand() * 6.28,
      freq: Math.min(1.5 + 0.12 * (n - SWEEP_FROM), 2.6),
    });

  const pickLane = () => Math.floor(rand() * LANES);
  const twoSingles = () => {
    const fr = pickLane();
    const bl = [0, 1, 2].filter((l) => l !== fr);
    return { blocked: bl, build: () => bl.forEach(single) };
  };
  const wideRow = () => {
    const a = rand() < 0.5 ? 0 : 1;
    return { blocked: [a, a + 1], build: () => wide(a) };
  };
  const sweepRow = () => ({ blocked: [], sweep: true, crab: true, build: sweepCrab });
  // SWEEP_FROM'dan sonra yengeçlerin yarısı üç şeridi tarar, yarısı iki şeritte kalır
  const crabRow = () => {
    if (n >= SWEEP_FROM && rand() < SWEEP_CHANCE) return sweepRow();
    const side = rand() < 0.5 ? 0 : 2;
    return { blocked: [1, side], crab: true, build: () => crab(side) };
  };
  const oneSingle = () => {
    const l = pickLane();
    return { blocked: [l], build: () => single(l) };
  };

  // --- serpiştirilmiş düzenler: 0 Kumsal, 3 Gelgit, 5 Gece, 7 Atık ---
  const MIXED = {
    0: { crab: (k) => Math.min(0.35, 0.18 + 0.03 * (k - 2)), dbl: 1, skip: 0.12 },
    3: { crab: () => 0.1, dbl: 1.5, skip: 0.16 },
    5: { crab: (k) => Math.min(0.32, 0.2 + 0.02 * (k - 2)), dbl: 1.2, skip: 0.14 },
    7: { crab: () => 0.1, dbl: 1.3, skip: 0.14 },
  };
  const mixed = () => {
    const c = MIXED[variant];
    if (n >= 2 && rand() < c.crab(n)) return crabRow();
    if (rand() < Math.min(0.7, p.doubleChance * c.dbl)) {
      return n >= 2 && WIDE[variant] && rand() < 0.5 ? wideRow() : twoSingles();
    }
    return oneSingle();
  };

  // --- koridorlar: 1 Kayalık (slalom), 4 Mercan (zikzak), 8 Kumul (dalgalı) ---
  let f = 1;
  let zig = 0;
  const corridor = () => {
    let nf;
    if (variant === 4) {
      zig = (zig + 1) % 4;
      nf = [0, 1, 2, 1][zig];
    } else {
      const cand = [];
      if (variant === 8) cand.push(f);
      if (f > 0) cand.push(f - 1);
      if (f < 2) cand.push(f + 1);
      nf = cand[Math.floor(rand() * cand.length)];
    }
    f = nf;
    if (n >= 3 && (nf === 0 || nf === 2) && rand() < 0.22) {
      if (n >= SWEEP_FROM && rand() < SWEEP_CHANCE) return sweepRow();
      const side = nf === 0 ? 2 : 0; // boş kalan şerit nf
      return { blocked: [1, side], crab: true, build: () => crab(side) };
    }
    const others = [0, 1, 2].filter((l) => l !== nf);
    const base = variant === 1 ? 0.35 : variant === 4 ? 0.45 : 0.5;
    const both = n >= 2 && rand() < Math.min(0.92, base + 0.13 * (n - 1));
    const bl = both ? others : [others[Math.floor(rand() * 2)]];
    return { blocked: bl, build: () => bl.forEach(single) };
  };

  // --- geçitler: 2 Sürüntü, 6 Fırtına ---
  let step = 0;
  const gates = () => {
    step += 1;
    if (variant === 6) {
      const ph = step % 5;
      if (ph === 0) return null;
      if (ph === 1 || ph === 3) return n >= 2 ? wideRow() : twoSingles();
      return ph === 2 ? oneSingle() : twoSingles();
    }
    const ph = step % 4;
    if (ph === 0) return null; // nefes alma sırası
    if (ph === 1) return n >= 2 ? wideRow() : twoSingles();
    if (ph === 2) return n >= 2 ? crabRow() : twoSingles();
    return oneSingle();
  };

  let rowNo = 0;
  while (z < p.length - 450) {
    rowNo += 1;
    let spec = null;
    if (variant === 1 || variant === 4 || variant === 8) {
      if (rowNo % 5 !== 0) spec = corridor();
    } else if (variant === 2 || variant === 6) {
      spec = gates();
    } else if (rand() > MIXED[variant].skip) {
      spec = mixed();
    }
    // Her düzende yengeçler zamanla mutlaka görünür
    if (n >= SWEEP_FROM && sinceCrab >= 6) spec = crabRow();

    if (spec && !reach(freeOf(spec.blocked))) spec = oneSingle();

    const gapPx = p.gap * p.speed * (0.9 + rand() * 0.4);

    if (spec) {
      // Süpüren yengeçten önce dinlenme boşluğu: önceki sıra iki şeridi kapattıysa
      if (spec.sweep && lastBlocked >= 2) z += gapPx * 0.8;
      spec.build();
      prevFree = freeOf(spec.blocked);
      lastBlocked = spec.blocked.length;
      sinceCrab = spec.crab ? 0 : sinceCrab + 1;
      if (spec.sweep) {
        z += gapPx * 0.8; // süpürme sonrası dinlenme
        lastBlocked = 0;
      }
    } else {
      prevFree = [0, 1, 2];
      lastBlocked = 0;
      sinceCrab += 1;
      // Nefes sırasında kabuk izi (sürüntü düzeninde daha sık)
      if (variant === 2 && rand() < 0.75) {
        const lane = pickLane();
        for (const k of [-1, 0, 1]) {
          items.push({ kind: "shell", z: z + gapPx / 2 + k * 38, x: laneCenter(lane), lane, taken: false });
        }
      }
    }

    // Sıra arasına bazen tek bir kabuk parçası
    const mid = z + gapPx / 2;
    let shellLane = -1;
    if (rand() < 0.4) {
      shellLane = prevFree[Math.floor(rand() * prevFree.length)];
      items.push({ kind: "shell", z: mid, x: laneCenter(shellLane), lane: shellLane, taken: false });
    }
    const otherLanes = () => {
      const o = prevFree.filter((l) => l !== shellLane);
      return o.length ? o : prevFree;
    };
    // Güçlendirici: aralıklı ve nadir
    if (mid - lastPower > 950 && rand() < 0.15) {
      const r = rand();
      const kind = r < 0.36 ? "shield" : r < 0.68 ? "magnet" : "surf";
      const ls = otherLanes();
      const lane = ls[Math.floor(rand() * ls.length)];
      items.push({ kind, z: mid, x: laneCenter(lane), lane, taken: false });
      lastPower = mid;
    } else if (
      n >= 2 &&
      mid - lastPlastic > 520 &&
      mid - lastPower > 140 &&
      rand() < (variant === 7 ? 0.34 : 0.13)
    ) {
      // Yavaşlatan plastik atık: boş şeritlerden birinde, isteğe bağlı
      const ls = otherLanes();
      const lane = ls[Math.floor(rand() * ls.length)];
      items.push({ kind: "plastic", z: mid + (rand() < 0.5 ? -24 : 24), x: laneCenter(lane), lane, taken: false });
      lastPlastic = mid;
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
  const PU = Object.assign(
    { shield: "Kalkan", shieldBreak: "Kalkan koruyor!", magnet: "Mıknatıs", surf: "Dalga ritmi", plastic: "Plastik: ağırlaştın" },
    S.pu || {},
  );
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const vibrate = (ms) => {
    try {
      if (!reduceMotion && navigator.vibrate) navigator.vibrate(ms);
    } catch (_) {
      /* yok say */
    }
  };
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
    shield: 0, // kalkan: kalan süre; sürerken bir çarpmayı yok sayar
    magnet: 0, // mıknatıs süresi
    surf: 0, // dalga ritmi süresi
    drag: 0, // plastik ağırlaşması süresi
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
    power: () => [523, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.09, 0, i * 0.06)),
    shield: () => {
      tone(880, 0.12, "triangle", 0.09, 0.5);
      tone(440, 0.2, "sine", 0.08, 0.6, 0.05);
    },
    bad: () => {
      tone(300, 0.22, "square", 0.05, 0.5);
      tone(200, 0.28, "square", 0.05, 0.6, 0.1);
    },
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

  // 1. bölüm her zaman Kumsal. Sonrakilerde art arda aynı düzen gelmez; yalnızca açılmış düzenler çıkar
  function pickVariant(level) {
    if (opt.variant != null) return opt.variant;
    if (level === 1) return 0; // oyun her zaman Kumsal ile başlar
    const prev = g.lastVariant[level];
    const pool = variantsFor(level);
    const cand = pool.length > 1 ? pool.filter((v) => v !== prev) : pool;
    const v = cand[Math.floor(rand() * cand.length)];
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
    g.shield = 0;
    g.magnet = 0;
    g.surf = 0;
    g.drag = 0;
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
  const shellTotal = () => g.world.items.filter((i) => i.kind === "shell").length;

  function curSpeed() {
    const base = g.world.params.speed;
    if (g.phase === "ready") return 0;
    if (g.phase === "run") {
      const ramp = Math.min(1, 0.45 + g.phaseT / 0.9);
      const slowF = Math.min(g.slow > 0 ? 0.6 : 1, g.drag > 0 ? 0.62 : 1);
      return base * ramp * slowF * (g.surf > 0 ? 1.35 : 1);
    }
    if (g.phase === "sea") return base * Math.max(0.3, 1 - g.phaseT * 0.55);
    return 0;
  }

  function hit() {
    if (g.shield > 0) {
      g.shield = 0;
      g.invuln = 1.0;
      g.shake = reduceMotion ? 0 : 0.12;
      burst(g.x, PY, 18, ["#bfdcff", "#ffffff", "#60a5fa"], 190, 0.6, { grav: 120 });
      floater(g.x, PY - 44, PU.shieldBreak);
      sfx.shield();
      vibrate(25);
      return;
    }
    g.hearts -= 1;
    g.hits += 1;
    g.invuln = 1.4;
    g.slow = 0.5;
    g.shake = reduceMotion ? 0 : 0.25;
    g.squash = 1;
    g.heartFlash = 1;
    g.vig = 1;
    burst(g.x, PY, 16, ["#fff6e0", "#ff9a8a", "#ffd36b", "#8a6a43"], 170, 0.6, { grav: 260 });
    sfx.hit();
    vibrate(g.hearts <= 0 ? [60, 40, 90] : 55);
    if (g.hearts <= 0) {
      g.phase = "over";
      g.phaseT = 0;
      sfx.over();
      opt.onOver && opt.onOver({ level: g.level });
    }
  }

  function collect(it, sy) {
    if (it.kind === "shell") {
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
      return;
    }
    if (it.kind === "plastic") {
      g.drag = 3.5;
      g.parts = Math.max(0, g.parts - 1);
      g.pool = Math.max(0, g.pool - 1);
      burst(it.x, sy, 12, ["#cfd6dc", "#8b95a0", "#ff7a4d"], 120, 0.6, { world: true });
      floater(g.x, PY - 44, PU.plastic);
      sfx.bad();
      vibrate(30);
      return;
    }
    const col = { shield: ["#bfdcff", "#60a5fa", "#fff"], magnet: ["#ffc0cc", "#fb7185", "#fff"], surf: ["#b6f0f5", "#22b8cf", "#fff"] }[it.kind];
    burst(it.x, sy, 16, col, 150, 0.7, { world: true });
    if (it.kind === "shield") g.shield = SHIELD_TIME;
    else if (it.kind === "magnet") g.magnet = 7;
    else if (it.kind === "surf") g.surf = 2.6; // yalnızca hızlandırır, dokunulmazlık vermez
    floater(g.x, PY - 44, PU[it.kind]);
    sfx.power();
  }

  function update(dt) {
    g.t += dt;
    g.phaseT += dt;
    const targetX = laneCenter(g.lane);
    g.x += (targetX - g.x) * Math.min(1, dt * (g.drag > 0 ? 7 : 18));
    const leanTarget = Math.max(-1, Math.min(1, (targetX - g.x) / 45)) * 0.42;
    g.lean += (leanTarget - g.lean) * Math.min(1, dt * 14);
    if (g.invuln > 0) g.invuln -= dt;
    if (g.slow > 0) g.slow -= dt;
    if (g.magnet > 0) g.magnet -= dt;
    if (g.shield > 0) g.shield -= dt;
    if (g.drag > 0) g.drag -= dt;
    if (g.surf > 0) g.surf -= dt;
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
        let sy = py - (it.z - g.d);
        // mıknatıs: yakındaki kabuk parçaları kaplumbağaya doğru akar
        if (g.magnet > 0 && it.kind === "shell" && Math.abs(py - sy) < 240) {
          it.x += (g.x - it.x) * Math.min(1, dt * 7);
          it.z += (g.d - it.z) * Math.min(1, dt * 5);
          sy = py - (it.z - g.d);
        }
        if (Math.abs(g.x - it.x) < 26 && Math.abs(py - sy) < 30) {
          it.taken = true;
          collect(it, sy);
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
            total: shellTotal(),
            hits: g.hits,
            stars: starsFor(g.hits, g.parts, shellTotal()),
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

  // düzene göre zemin rengi
  const PALETTE = [
    { top: "#ecdcae", bot: "#e2cf9b", dot: "120,95,50", big: 1, wet: "#cdb882" }, // 0 Kumsal
    { top: "#dcd4c0", bot: "#cbc1a8", dot: "80,80,92", big: 1.7, wet: "#b3aa93" }, // 1 Kayalık
    { top: "#dcc796", bot: "#c9b07a", dot: "96,70,36", big: 1.2, wet: "#b39a63" }, // 2 Sürüntü
    { top: "#d8c9a2", bot: "#c0ab7f", dot: "70,100,130", big: 1.1, wet: "#a8946a" }, // 3 Gelgit Havuzu
    { top: "#f2e3d1", bot: "#e6cdb3", dot: "200,110,120", big: 1.1, wet: "#d6b99a" }, // 4 Mercan Kıyısı
    {
      top: "#33436c",
      bot: "#212d4d",
      dot: "190,205,255",
      big: 1,
      night: true,
      wet: "#16213f",
      sea: ["#050f2a", "#0d2d5e", "#2f5f94"],
      foam: "190,215,245",
    }, // 5 Gece
    {
      top: "#c5cbd0",
      bot: "#aab3ba",
      dot: "60,78,96",
      big: 1.3,
      wet: "#8e99a2",
      sea: ["#1a334b", "#2f5878", "#7c9fb8"],
      foam: "236,243,250",
    }, // 6 Fırtına
    { top: "#d8d1bf", bot: "#c4bba4", dot: "70,66,60", big: 1.5, wet: "#aaa18b" }, // 7 Atık
    { top: "#f1dca8", bot: "#e4c485", dot: "140,100,40", big: 1, wet: "#cfb06e" }, // 8 Kumul
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
    if (g.variant === 3) {
      // ıslak kumdaki su parıltıları
      for (let k = 0; k < 7; k++) {
        const y = ((k * 127 + g.d * 0.55) % (H + 80)) - 40;
        const x = (k * 61 + 20) % W;
        ctx.fillStyle = "rgba(120,175,215,0.2)";
        ctx.beginPath();
        ctx.ellipse(x, y, 30, 8, 0, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.ellipse(x - 8, y - 2, 10, 2, 0, 0, 6.283);
        ctx.fill();
      }
    } else if (g.variant === 8) {
      // rüzgârın savurduğu kum çizgileri
      ctx.lineWidth = 2;
      for (let k = 0; k < 12; k++) {
        const y = (k * 59 + 17 + g.d * 0.3) % H;
        const x = ((g.t * 150 + k * 83) % (W + 120)) - 60;
        ctx.strokeStyle = `rgba(255,246,220,${0.22 + (k % 3) * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 40 + (k % 4) * 14, y - 2);
        ctx.stroke();
      }
    } else if (g.variant === 5) {
      // ay ışığında pırıldayan kum
      for (let k = 0; k < 18; k++) {
        const tw = 0.5 + 0.5 * Math.sin(g.t * 2 + k * 1.9);
        const y = ((k * 73 + g.d * 0.5) % (H + 20)) - 10;
        const x = (k * 47 + 13) % W;
        ctx.fillStyle = `rgba(235,242,255,${0.12 + tw * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + tw * 0.9, 0, 6.283);
        ctx.fill();
      }
    }
  }

  // fırtına: yağmur ve ara sıra şimşek
  function drawRain() {
    ctx.strokeStyle = "rgba(225,238,252,0.5)";
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    for (let k = 0; k < 70; k++) {
      const x = (k * 53 + g.t * 60) % (W + 40);
      const y = (k * 97 + g.t * 560) % (H + 30);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 15);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(20,36,60,0.1)";
    ctx.fillRect(0, 0, W, H);
    const ph = g.t % 7.3;
    if (!reduceMotion && ph < 0.14) {
      ctx.fillStyle = `rgba(255,255,255,${(0.14 - ph) * 1.7})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawSea() {
    const shoreY = PY - (g.world.length - g.d);
    if (shoreY <= -10) return;
    const pal = PALETTE[g.variant] || PALETTE[0];
    const sea = pal.sea || ["#185fa5", "#378ada", "#a9cfea"];
    const foam = pal.foam || "244,249,253";
    // ıslak kum: zeminle yumuşak geçiş
    const ws = ctx.createLinearGradient(0, shoreY, 0, shoreY + 64);
    const wet = pal.wet || "#cdb882";
    const wrgb = [1, 3, 5].map((k) => parseInt(wet.slice(k, k + 2), 16)).join(",");
    ws.addColorStop(0, wet);
    ws.addColorStop(0.55, wet);
    ws.addColorStop(1, `rgba(${wrgb},0)`);
    ctx.fillStyle = ws;
    ctx.fillRect(0, Math.max(0, shoreY), W, 64);
    // su
    const wg = ctx.createLinearGradient(0, 0, 0, Math.max(shoreY, 1));
    wg.addColorStop(0, sea[0]);
    wg.addColorStop(0.6, sea[1]);
    wg.addColorStop(1, sea[2]);
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
      ctx.strokeStyle = `rgba(${foam},${al})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 9 + (i % 3) * 3, sy);
      ctx.stroke();
    }
    // köpük
    ctx.strokeStyle = `rgba(${foam},0.95)`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const y = shoreY + Math.sin(x * 0.045 + g.t * 2.4) * 5;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(${foam},0.4)`;
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
      ctx.strokeStyle = o.sweep ? "rgba(190,70,40,0.1)" : "rgba(120,95,50,0.13)";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.beginPath();
      const am = o.amp || LANE_W / 2;
      ctx.moveTo(-am, 4);
      ctx.lineTo(am, 4);
      ctx.stroke();
      ctx.strokeStyle = o.sweep ? "rgba(190,70,40,0.35)" : "rgba(120,95,50,0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 9]);
      ctx.beginPath();
      ctx.moveTo(-am, 4);
      ctx.lineTo(am, 4);
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
      const rg = ctx.createLinearGradient(-18, -14, 14, 14);
      rg.addColorStop(0, "#a3afba");
      rg.addColorStop(0.55, "#7d8a96");
      rg.addColorStop(1, "#5d6a77");
      ctx.fillStyle = rg;
      ctx.strokeStyle = "#47535f";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-21, 7);
      ctx.quadraticCurveTo(-21, -6, -14, -11);
      ctx.quadraticCurveTo(-6, -17, 3, -15);
      ctx.quadraticCurveTo(14, -15, 18, -7);
      ctx.quadraticCurveTo(23, 1, 20, 8);
      ctx.quadraticCurveTo(10, 15, -2, 14);
      ctx.quadraticCurveTo(-14, 14, -21, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // alt gölge yüzü
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "rgba(30,40,55,0.2)";
      ctx.beginPath();
      ctx.moveTo(-22, 6);
      ctx.quadraticCurveTo(0, 2, 24, 4);
      ctx.lineTo(24, 20);
      ctx.lineTo(-22, 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // çatlaklar ve yüzey
      ctx.strokeStyle = "rgba(40,52,66,0.55)";
      ctx.lineWidth = 1.3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(4, -14);
      ctx.lineTo(2, -6);
      ctx.lineTo(7, -1);
      ctx.moveTo(-12, 0);
      ctx.lineTo(-6, 4);
      ctx.lineTo(-7, 9);
      ctx.stroke();
      // ışık
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.moveTo(-13, -7);
      ctx.quadraticCurveTo(-6, -13, 1, -11);
      ctx.quadraticCurveTo(-3, -6, -10, -3);
      ctx.closePath();
      ctx.fill();
      // yosun lekesi
      ctx.fillStyle = "rgba(95,174,134,0.8)";
      ctx.beginPath();
      ctx.ellipse(13, 9, 5, 2.2, -0.2, 0, 6.283);
      ctx.ellipse(10, 11, 3, 1.6, 0.1, 0, 6.283);
      ctx.fill();
    } else if (o.type === "crab") {
      // yürüyüş hızıyla bacak ve kıskaç hareketi
      const wig = Math.sin(g.t * (o.freq * 5 + 6) + o.phase) * 2.5;
      const clap = Math.sin(g.t * 3.2 + o.phase) * 0.18;
      const shellC = "#e0643a";
      const dark = "#9a3a1c";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // bacaklar: iki eklemli
      for (const s of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const y0 = -1 + i * 5.5;
          const kx = s * (14 + i * 0.6);
          const ky = y0 + 3 + wig * s * 0.4;
          const fx = s * (19 - i * 1.2);
          const fy = y0 + 9 + wig * s;
          ctx.strokeStyle = dark;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(s * 8, y0);
          ctx.lineTo(kx, ky);
          ctx.lineTo(fx, fy);
          ctx.stroke();
          ctx.strokeStyle = "#cf5a30";
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
      }
      // kollar ve kıskaçlar
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(s * 9, -5);
        ctx.strokeStyle = dark;
        ctx.lineWidth = 4.4;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(s * 5, -6);
        ctx.stroke();
        ctx.strokeStyle = "#cf5a30";
        ctx.lineWidth = 2.6;
        ctx.stroke();
        ctx.translate(s * 6, -10);
        ctx.rotate(s * 0.35);
        // iki parçalı kıskaç
        for (const k of [-1, 1]) {
          ctx.save();
          ctx.rotate(k * (0.28 + clap));
          ctx.fillStyle = shellC;
          ctx.strokeStyle = dark;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-3.2, 2);
          ctx.quadraticCurveTo(-5.6, -6, 0, -11);
          ctx.quadraticCurveTo(5.6, -6, 3.2, 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      // gövde
      const cg = ctx.createRadialGradient(-4, -3, 2, 0, 2, 15);
      cg.addColorStop(0, "#f58a5e");
      cg.addColorStop(1, shellC);
      ctx.fillStyle = cg;
      ctx.strokeStyle = dark;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 2, 13.5, 10.5, 0, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.ellipse(-5, -3, 5, 2.2, -0.4, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "rgba(154,58,28,0.55)";
      for (const [bx, by] of [[-5, 6], [0, 8], [5, 6]]) {
        ctx.beginPath();
        ctx.arc(bx, by, 1.2, 0, 6.283);
        ctx.fill();
      }
      // gözler: saplı
      for (const s of [-1, 1]) {
        ctx.strokeStyle = dark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s * 4, -5);
        ctx.lineTo(s * 4.4, -9);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = dark;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(s * 4.4, -10, 3, 0, 6.283);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#1a0e08";
        ctx.beginPath();
        ctx.arc(s * 4.4, -9.4, 1.5, 0, 6.283);
        ctx.fill();
      }
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
      ctx.lineJoin = "round";
      const sg = ctx.createRadialGradient(-4, -5, 2, 0, 0, 20);
      sg.addColorStop(0, "#ffae72");
      sg.addColorStop(1, "#ee7f3f");
      ctx.fillStyle = sg;
      ctx.strokeStyle = "#b5551f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 8.5 : 19.5;
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // kol ortası çizgileri ve benekler
      ctx.strokeStyle = "rgba(181,85,31,0.45)";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 5, Math.sin(ang) * 5);
        ctx.lineTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffe0bf";
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        for (const r of [8, 12, 16]) {
          for (const off of [-0.16, 0.16]) {
            ctx.beginPath();
            ctx.arc(Math.cos(ang + off) * r, Math.sin(ang + off) * r, 1.15, 0, 6.283);
            ctx.fill();
          }
        }
      }
      ctx.fillStyle = "#d9692f";
      ctx.beginPath();
      ctx.arc(0, 0, 3.4, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(-5, -8, 3.2, 1.6, -0.9, 0, 6.283);
      ctx.fill();
    } else if (o.type === "bottle") {
      ctx.rotate((o.phase % 1) - 0.5);
      ctx.lineJoin = "round";
      const bg = ctx.createLinearGradient(0, -8, 0, 8);
      bg.addColorStop(0, "rgba(120,205,165,0.95)");
      bg.addColorStop(1, "rgba(58,150,108,0.95)");
      ctx.strokeStyle = "#2d7a5a";
      ctx.lineWidth = 1.8;
      ctx.fillStyle = bg;
      // boyun
      ctx.beginPath();
      ctx.roundRect(6, -4.2, 14, 8.4, 3);
      ctx.fill();
      ctx.stroke();
      // gövde
      ctx.beginPath();
      ctx.roundRect(-21, -8, 29, 16, 6);
      ctx.fill();
      ctx.stroke();
      // kapak
      const cap = ctx.createLinearGradient(0, -5, 0, 5);
      cap.addColorStop(0, "#e6c050");
      cap.addColorStop(1, "#b88a22");
      ctx.fillStyle = cap;
      ctx.strokeStyle = "#8a6616";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(19, -5, 5, 10, 1.5);
      ctx.fill();
      ctx.stroke();
      // etiket ve dalga deseni
      ctx.fillStyle = "rgba(244,249,253,0.9)";
      ctx.fillRect(-12, -6, 13, 12);
      ctx.strokeStyle = "rgba(45,122,90,0.7)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10.5, -1);
      ctx.quadraticCurveTo(-8, -3.5, -5.5, -1);
      ctx.quadraticCurveTo(-3, 1.5, -0.5, -1);
      ctx.moveTo(-10.5, 3);
      ctx.quadraticCurveTo(-8, 0.5, -5.5, 3);
      ctx.quadraticCurveTo(-3, 5.5, -0.5, 3);
      ctx.stroke();
      // parlama
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-18, -4.5);
      ctx.lineTo(-14, -5.5);
      ctx.moveTo(7, -2);
      ctx.lineTo(16, -2);
      ctx.stroke();
    } else if (o.type === "urchin") {
      ctx.rotate(Math.sin(g.t * 1.6 + o.phase) * 0.12);
      ctx.lineCap = "round";
      for (let i = 0; i < 24; i++) {
        const ang = (i * 2 * Math.PI) / 24;
        const r2 = i % 2 ? 17 : 21;
        const x1 = Math.cos(ang) * 9;
        const y1 = Math.sin(ang) * 9;
        const x2 = Math.cos(ang) * r2;
        const y2 = Math.sin(ang) * r2;
        ctx.strokeStyle = "#2c2150";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.strokeStyle = "#6a58a8";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = "#c9bdf2";
        ctx.beginPath();
        ctx.arc(x2, y2, 0.9, 0, 6.283);
        ctx.fill();
      }
      const ug = ctx.createRadialGradient(-4, -4, 1, 0, 0, 13);
      ug.addColorStop(0, "#8a77c8");
      ug.addColorStop(1, "#4a3a86");
      ctx.fillStyle = ug;
      ctx.strokeStyle = "#2c2150";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11.5, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(-4.5, -5, 3.6, 2, -0.7, 0, 6.283);
      ctx.fill();
      // öfkeli iki göz çizgisi: tehlikeli olduğu belli olsun
      ctx.strokeStyle = "#e9e1ff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, 1);
      ctx.lineTo(-1.5, 2.2);
      ctx.moveTo(5, 1);
      ctx.lineTo(1.5, 2.2);
      ctx.stroke();
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
      const netShape = () => {
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
      };
      netShape();
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
      netShape();
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
    } else if (o.type === "pool") {
      // gelgit havuzu: kıyısı sivri taşlı, dalgalanan su
      const rx = 21;
      const ry = 14;
      ctx.lineJoin = "round";
      ctx.fillStyle = "#a8916a";
      ctx.strokeStyle = "#7a6643";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 1, rx + 4, ry + 3, 0, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      const wgp = ctx.createRadialGradient(-5, -4, 2, 0, 0, rx);
      wgp.addColorStop(0, "#c4ebf8");
      wgp.addColorStop(1, "#4d9fd6");
      ctx.fillStyle = wgp;
      ctx.beginPath();
      ctx.ellipse(0, 1, rx, ry, 0, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "#2f77ad";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      for (const k of [0, 0.5]) {
        const r = (g.t * 0.7 + k + o.phase) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - r)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 1, rx * 0.2 + rx * 0.7 * r, ry * 0.2 + ry * 0.7 * r, 0, 0, 6.283);
        ctx.stroke();
      }
      ctx.fillStyle = "#6f7b86";
      ctx.strokeStyle = "#47525d";
      ctx.lineWidth = 1.3;
      for (const [ang, sz] of [[-2.6, 5], [-1.6, 6.5], [-0.5, 5], [0.6, 6], [2.0, 5], [2.9, 4.5]]) {
        const bx = Math.cos(ang) * (rx + 2);
        const by = 1 + Math.sin(ang) * (ry + 1);
        ctx.beginPath();
        ctx.moveTo(bx - 3, by + 2);
        ctx.lineTo(bx + Math.cos(ang) * 2, by + Math.sin(ang) * sz - 3);
        ctx.lineTo(bx + 3, by + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (o.type === "jellyfish") {
      // karaya vurmuş denizanası
      const pulse = Math.sin(g.t * 3 + o.phase);
      ctx.lineCap = "round";
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 6; i++) {
        const tx = -10 + i * 4;
        ctx.strokeStyle = i % 2 ? "rgba(214,140,232,0.9)" : "rgba(240,175,250,0.9)";
        ctx.beginPath();
        ctx.moveTo(tx, 3);
        ctx.quadraticCurveTo(tx + Math.sin(g.t * 3 + i) * 4, 12, tx + Math.sin(g.t * 3 + i + 1) * 3, 19);
        ctx.stroke();
      }
      ctx.save();
      ctx.scale(1 + pulse * 0.05, 1 - pulse * 0.05);
      const jg = ctx.createRadialGradient(-4, -9, 2, 0, -2, 20);
      jg.addColorStop(0, "rgba(255,225,250,0.95)");
      jg.addColorStop(1, "rgba(200,120,225,0.9)");
      ctx.fillStyle = jg;
      ctx.strokeStyle = "#9a55ad";
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-18, 4);
      ctx.bezierCurveTo(-19, -20, 19, -20, 18, 4);
      for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(18 - i * 6 - 1.5, 9, 18 - (i + 1) * 6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(-7, -9, 5, 2.4, -0.5, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "rgba(154,85,173,0.35)";
      for (const [dx, dy] of [[-5, -3], [4, -5], [8, -1], [-9, 0]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, 1.6, 0, 6.283);
        ctx.fill();
      }
      ctx.restore();
    } else if (o.type === "coral") {
      ctx.lineCap = "round";
      const branch = (x, y, ang, len, w, d) => {
        const x2 = x + Math.cos(ang) * len;
        const y2 = y + Math.sin(ang) * len;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (d > 0) {
          branch(x2, y2, ang - 0.55, len * 0.74, w * 0.78, d - 1);
          branch(x2, y2, ang + 0.55, len * 0.74, w * 0.78, d - 1);
        } else {
          tips.push([x2, y2]);
        }
      };
      const tips = [];
      for (const [col, extra] of [["#b93a52", 2.4], ["#ff7d92", 0]]) {
        ctx.strokeStyle = col;
        tips.length = 0;
        branch(0, 15, -Math.PI / 2, 11, 5 + extra, 2);
        branch(-9, 15, -Math.PI / 2 - 0.6, 8, 4 + extra, 1);
        branch(9, 15, -Math.PI / 2 + 0.6, 8, 4 + extra, 1);
      }
      ctx.fillStyle = "#ffd6a8";
      for (const [tx, ty] of tips) {
        ctx.beginPath();
        ctx.arc(tx, ty, 2.1, 0, 6.283);
        ctx.fill();
      }
      ctx.fillStyle = "#9a8f7c";
      ctx.strokeStyle = "#6d6455";
      ctx.lineWidth = 1.2;
      for (const [bx, br] of [[-8, 3.2], [0, 3.6], [8, 3]]) {
        ctx.beginPath();
        ctx.ellipse(bx, 16, br, br * 0.7, 0, 0, 6.283);
        ctx.fill();
        ctx.stroke();
      }
    } else if (o.type === "anemone") {
      ctx.lineCap = "round";
      for (let i = 0; i < 13; i++) {
        const a = -Math.PI + (Math.PI * (i + 0.5)) / 13;
        const sw = Math.sin(g.t * 2.6 + i * 0.9 + o.phase) * 3;
        const bx = Math.cos(a) * 8;
        const by = 6 + Math.sin(a) * 4;
        const tx = Math.cos(a) * 17 + sw;
        const ty = 4 + Math.sin(a) * 15;
        ctx.strokeStyle = "#a24f9a";
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo((bx + tx) / 2 + sw * 0.5, (by + ty) / 2, tx, ty);
        ctx.stroke();
        ctx.fillStyle = i % 2 ? "#ffa6d1" : "#9be8c4";
        ctx.beginPath();
        ctx.arc(tx, ty, 2.4, 0, 6.283);
        ctx.fill();
      }
      const ag = ctx.createLinearGradient(0, 2, 0, 15);
      ag.addColorStop(0, "#9b5bb0");
      ag.addColorStop(1, "#6a3a86");
      ctx.fillStyle = ag;
      ctx.strokeStyle = "#4a2563";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 9, 11, 7, 0, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.ellipse(-4, 6.5, 4, 1.7, -0.3, 0, 6.283);
      ctx.fill();
    } else if (o.type === "bonfire") {
      const fl = Math.sin(g.t * 11 + o.phase);
      const fl2 = Math.sin(g.t * 7.3 + o.phase * 2);
      const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 44);
      gl.addColorStop(0, "rgba(255,170,70,0.5)");
      gl.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#8a929b";
      ctx.strokeStyle = "#4f565e";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) {
        const a = (i * 6.283) / 9;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 15, 4 + Math.sin(a) * 10, 5.6, 4.2, a, 0, 6.283);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = "#5c3d22";
      ctx.strokeStyle = "#2f1f10";
      for (const rot of [-0.5, 0.5]) {
        ctx.save();
        ctx.translate(0, 4);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.roundRect(-14, -3, 28, 6, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      const flame = (sz, c1, c2, off) => {
        const gr = ctx.createLinearGradient(0, 4, 0, -sz);
        gr.addColorStop(0, c1);
        gr.addColorStop(1, c2);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(-8 * (sz / 20), 4);
        ctx.bezierCurveTo(-10 * (sz / 20), -sz * 0.35, -3 + off, -sz * 0.6, off, -sz);
        ctx.bezierCurveTo(4 + off, -sz * 0.55, 10 * (sz / 20), -sz * 0.3, 8 * (sz / 20), 4);
        ctx.closePath();
        ctx.fill();
      };
      flame(22 + fl * 2.5, "#ff7a1a", "#ffd05a", fl2 * 2);
      flame(14 + fl2 * 2, "#ffb02e", "#fff2a8", -fl * 1.5);
      ctx.fillStyle = "#ffd98a";
      for (let i = 0; i < 4; i++) {
        const u = (g.t * 0.9 + i * 0.27 + o.phase) % 1;
        ctx.globalAlpha = 1 - u;
        ctx.beginPath();
        ctx.arc(Math.sin(i * 2.3 + g.t) * 7, -10 - u * 26, 1.3, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (o.type === "crate") {
      ctx.lineJoin = "round";
      const cgd = ctx.createLinearGradient(-17, -15, 17, 15);
      cgd.addColorStop(0, "#c89a5c");
      cgd.addColorStop(1, "#9a6e3a");
      ctx.fillStyle = cgd;
      ctx.strokeStyle = "#5b3f1e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-17, -15, 34, 31, 2.5);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(70,45,20,0.6)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-17, -5);
      ctx.lineTo(17, -5);
      ctx.moveTo(-17, 6);
      ctx.lineTo(17, 6);
      ctx.stroke();
      ctx.strokeStyle = "#7a5530";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-14, -12);
      ctx.lineTo(14, 13);
      ctx.moveTo(14, -12);
      ctx.lineTo(-14, 13);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,230,180,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-14, -11);
      ctx.lineTo(13, 12);
      ctx.stroke();
      ctx.fillStyle = "#3a2a16";
      for (const [nx, ny] of [[-13, -11], [13, -11], [-13, 12], [13, 12]]) {
        ctx.beginPath();
        ctx.arc(nx, ny, 1.4, 0, 6.283);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(-15, -13, 30, 2.6);
      ctx.strokeStyle = "#4a9c78";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(10, 14);
      ctx.quadraticCurveTo(12, 20, 8, 22);
      ctx.stroke();
    } else if (o.type === "wave") {
      const hw = o.w / 2;
      const wgw = ctx.createLinearGradient(0, -12, 0, 12);
      wgw.addColorStop(0, "rgba(130,200,245,0.95)");
      wgw.addColorStop(1, "rgba(38,106,186,0.95)");
      const crest = (x) => -5 + Math.sin(x * 0.09 + g.t * 3 + o.phase) * 3.2;
      ctx.beginPath();
      ctx.moveTo(-hw, 11);
      for (let x = -hw; x <= hw; x += 6) ctx.lineTo(x, crest(x));
      ctx.lineTo(hw, 11);
      for (let x = hw; x >= -hw; x -= 8) ctx.lineTo(x, 11 + Math.sin(x * 0.12 + g.t * 2) * 2);
      ctx.closePath();
      ctx.fillStyle = wgw;
      ctx.fill();
      ctx.strokeStyle = "#1d5a9c";
      ctx.lineWidth = 1.6;
      ctx.lineJoin = "round";
      ctx.stroke();
      // köpük
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 3.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = -hw; x <= hw; x += 6) (x === -hw ? ctx.moveTo(x, crest(x)) : ctx.lineTo(x, crest(x)));
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 12; i++) {
        const bx = -hw + 10 + i * ((o.w - 20) / 11);
        ctx.beginPath();
        ctx.arc(bx, crest(bx) + 4 + (i % 3) * 2, 1.6 + (i % 2), 0, 6.283);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = -hw + 6; x <= hw - 6; x += 6) (x === -hw + 6 ? ctx.moveTo(x, 4 + Math.sin(x * 0.08 - g.t * 2.4) * 2) : ctx.lineTo(x, 4 + Math.sin(x * 0.08 - g.t * 2.4) * 2));
      ctx.stroke();
    } else if (o.type === "buoy") {
      ctx.rotate(Math.sin(g.t * 2 + o.phase) * 0.08);
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#5a6068";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.quadraticCurveTo(-6, 18, 0, 22);
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 2, 13, 0, 6.283);
      ctx.clip();
      ctx.fillStyle = "#f6f6f2";
      ctx.fillRect(-14, -12, 28, 28);
      ctx.fillStyle = "#d8353f";
      for (const y of [-8, 6]) ctx.fillRect(-14, y, 28, 7);
      const bsh = ctx.createRadialGradient(-5, -4, 1, 0, 2, 15);
      bsh.addColorStop(0, "rgba(255,255,255,0.4)");
      bsh.addColorStop(1, "rgba(20,10,30,0.28)");
      ctx.fillStyle = bsh;
      ctx.fillRect(-14, -12, 28, 28);
      ctx.restore();
      ctx.strokeStyle = "#7d1d26";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 13, 0, 6.283);
      ctx.stroke();
      ctx.strokeStyle = "#5a6068";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, -17);
      ctx.stroke();
      const lg = (Math.sin(g.t * 6 + o.phase) + 1) / 2;
      ctx.fillStyle = `rgba(255,214,90,${0.55 + lg * 0.45})`;
      ctx.beginPath();
      ctx.arc(0, -19, 3.2, 0, 6.283);
      ctx.fill();
    } else if (o.type === "tire") {
      ctx.fillStyle = "#2d3138";
      ctx.strokeStyle = "#13161a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, 6.283);
      ctx.arc(0, 0, 7.5, 0, 6.283, true);
      ctx.fill("evenodd");
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, 6.283);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, 6.283);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 22; i++) {
        const a = (i * 6.283) / 22;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 12.5, Math.sin(a) * 12.5);
        ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 3.6, 4.7);
      ctx.stroke();
      ctx.strokeStyle = "rgba(95,174,134,0.8)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(10, 11);
      ctx.quadraticCurveTo(15, 9, 16, 4);
      ctx.stroke();
    } else if (o.type === "barrel") {
      const bgd = ctx.createRadialGradient(-5, -5, 2, 0, 0, 18);
      bgd.addColorStop(0, "#5b93c9");
      bgd.addColorStop(1, "#2f5f94");
      ctx.fillStyle = bgd;
      ctx.strokeStyle = "#1b3f66";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16.5, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 12.5, 0, 6.283);
      ctx.stroke();
      ctx.strokeStyle = "rgba(15,40,70,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, 6.283);
      ctx.stroke();
      ctx.fillStyle = "#1b3f66";
      for (const [bx, by, br] of [[-5, -4, 2.4], [5, 4, 2.8]]) {
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, 6.283);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(176,83,47,0.72)";
      ctx.beginPath();
      ctx.ellipse(9, -8, 4.5, 2.4, 0.6, 0, 6.283);
      ctx.ellipse(-10, 8, 3.6, 2, -0.4, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(-8, -9, 5, 2, -0.7, 0, 6.283);
      ctx.fill();
    } else if (o.type === "dune") {
      ctx.lineJoin = "round";
      const dg = ctx.createLinearGradient(-26, -18, 20, 12);
      dg.addColorStop(0, "#f4dda5");
      dg.addColorStop(1, "#c79a55");
      ctx.fillStyle = dg;
      ctx.strokeStyle = "#a9803f";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-26, 11);
      ctx.bezierCurveTo(-20, -14, 8, -22, 26, 11);
      ctx.quadraticCurveTo(0, 17, -26, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "rgba(120,80,30,0.26)";
      ctx.beginPath();
      ctx.moveTo(-4, -22);
      ctx.quadraticCurveTo(8, -4, 4, 18);
      ctx.lineTo(30, 18);
      ctx.lineTo(30, -22);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(120,80,30,0.38)";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      for (const [y0, x0] of [[4, -16], [8, -10], [0, -6]]) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x0 + 8, y0 - 3, x0 + 17, y0);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,246,220,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -8);
      ctx.quadraticCurveTo(-6, -15, 3, -14);
      ctx.stroke();
    } else if (o.type === "reed") {
      ctx.lineCap = "round";
      ctx.fillStyle = "#d9b877";
      ctx.strokeStyle = "#a9803f";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 15, 14, 5, 0, 0, 6.283);
      ctx.fill();
      ctx.stroke();
      for (let pass = 0; pass < 2; pass++) {
        for (let i = -4; i <= 4; i++) {
          const sw = Math.sin(g.t * 2.2 + i + o.phase) * 2.6;
          const tx = i * 4.2 + sw * 1.6;
          const ty = -21 + Math.abs(i) * 2.6;
          ctx.strokeStyle = pass ? "#b9c86e" : "#65792f";
          ctx.lineWidth = pass ? 1.4 : 3.4;
          ctx.beginPath();
          ctx.moveTo(i * 2.6 - (pass ? 0.7 : 0), 15);
          ctx.quadraticCurveTo(i * 5 + sw - (pass ? 0.7 : 0), -2, tx - (pass ? 0.7 : 0), ty);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#cfa94f";
      ctx.strokeStyle = "#8f6f26";
      ctx.lineWidth = 1;
      for (const i of [-4, -2, 0, 2, 4]) {
        const sw = Math.sin(g.t * 2.2 + i + o.phase) * 2.6;
        ctx.beginPath();
        ctx.ellipse(i * 4.2 + sw * 1.6, -22 + Math.abs(i) * 2.6, 1.9, 4.2, sw * 0.08, 0, 6.283);
        ctx.fill();
        ctx.stroke();
      }
    } else if (o.type === "weed") {
      ctx.lineCap = "round";
      const blades = [
        [-3, "#35735a"], [3, "#35735a"], [-2, "#3f8467"], [2, "#3f8467"], [0, "#4a9474"],
      ];
      for (let pass = 0; pass < 2; pass++) {
        for (let i = -3; i <= 3; i++) {
          const sway = Math.sin(g.t * 3 + i + o.phase) * 3;
          const tx = i * 4 + sway * 1.5;
          const ty = -20 + Math.abs(i) * 3;
          ctx.strokeStyle = pass ? "#5fae86" : "#2f6a52";
          ctx.lineWidth = pass ? 2.2 : 5.4;
          const off = pass ? 0.8 : 0;
          ctx.beginPath();
          ctx.moveTo(i * 5 - off, 14);
          ctx.quadraticCurveTo(i * 7 + sway - off, 0, tx - off, ty);
          ctx.stroke();
        }
      }
      void blades;
      // taban taşları
      ctx.fillStyle = "#9a8f7c";
      ctx.strokeStyle = "#6d6455";
      ctx.lineWidth = 1.2;
      for (const [bx, br] of [[-9, 3.2], [-2, 2.4], [8, 3]]) {
        ctx.beginPath();
        ctx.ellipse(bx, 15, br, br * 0.7, 0, 0, 6.283);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Güçlendirici ve uyarı simgeleri (dünyada ve ekran göstergesinde ortak)
  function drawGlyph(kind, r) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (kind === "shield") {
      const sg = ctx.createLinearGradient(-r, -r, r, r);
      sg.addColorStop(0, "#7db6ff");
      sg.addColorStop(1, "#2f66d0");
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.9, -r * 0.8, r * 0.9, -r * 0.2, r * 0.8, r * 0.2);
      ctx.quadraticCurveTo(r * 0.6, r * 0.75, 0, r);
      ctx.quadraticCurveTo(-r * 0.6, r * 0.75, -r * 0.8, r * 0.2);
      ctx.bezierCurveTo(-r * 0.9, -r * 0.2, -r * 0.9, -r * 0.8, 0, -r);
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.lineWidth = Math.max(1, r * 0.16);
      ctx.strokeStyle = "#1e4fa8";
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(1.2, r * 0.22);
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, 0);
      ctx.lineTo(-r * 0.05, r * 0.32);
      ctx.lineTo(r * 0.38, -r * 0.3);
      ctx.stroke();
    } else if (kind === "magnet") {
      ctx.lineCap = "butt";
      const u = () => {
        ctx.beginPath();
        ctx.moveTo(-r * 0.55, r * 0.8);
        ctx.lineTo(-r * 0.55, -r * 0.05);
        ctx.arc(0, -r * 0.05, r * 0.55, Math.PI, 0);
        ctx.lineTo(r * 0.55, r * 0.8);
      };
      u();
      ctx.lineWidth = r * 0.78;
      ctx.strokeStyle = "#8d1f25";
      ctx.stroke();
      u();
      ctx.lineWidth = r * 0.5;
      ctx.strokeStyle = "#ef4d54";
      ctx.stroke();
      ctx.lineWidth = r * 0.5;
      ctx.strokeStyle = "#f4f9fd";
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * r * 0.55, r * 0.46);
        ctx.lineTo(sx * r * 0.55, r * 0.8);
        ctx.stroke();
      }
    } else if (kind === "surf") {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(1.4, r * 0.3);
      for (const dy of [-0.3, 0.38]) {
        ctx.beginPath();
        for (let x = -r * 0.85; x <= r * 0.85; x += r * 0.12) {
          const y = Math.sin((x / r) * 3.4) * r * 0.26 + dy * r;
          x === -r * 0.85 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (kind === "plastic") {
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.1);
      ctx.lineTo(-r * 0.8, r * 0.55);
      ctx.quadraticCurveTo(-r * 0.4, r * 0.95, 0, r * 0.82);
      ctx.quadraticCurveTo(r * 0.5, r * 0.95, r * 0.8, r * 0.5);
      ctx.lineTo(r * 0.5, -r * 0.1);
      ctx.closePath();
      ctx.fillStyle = "rgba(238,243,247,0.92)";
      ctx.fill();
      ctx.lineWidth = Math.max(1, r * 0.13);
      ctx.strokeStyle = "#7c8793";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.25, -r * 0.1, r * 0.3, Math.PI, 0);
      ctx.arc(r * 0.25, -r * 0.1, r * 0.3, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = "rgba(124,135,147,0.6)";
      ctx.lineWidth = Math.max(0.8, r * 0.09);
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, r * 0.15);
      ctx.lineTo(-r * 0.1, r * 0.6);
      ctx.moveTo(r * 0.25, r * 0.1);
      ctx.lineTo(r * 0.4, r * 0.55);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Toplanabilir: parlayan, havada süzülen, rozetli. Engeller yerde durur,
  // gölgesi vardır ve hiçbir zaman ışıldamaz; ayrım buradan okunur.
  function drawPickup(it, sy) {
    const bob = Math.sin(g.t * 3.2 + it.z) * 4;
    const bad = it.kind === "plastic";
    const col = { shield: "96,165,250", magnet: "251,113,133", surf: "34,184,207", plastic: "255,90,54" }[it.kind];
    ctx.save();
    ctx.translate(it.x, sy + bob - 4);
    ctx.fillStyle = "rgba(90,70,30,0.16)";
    ctx.beginPath();
    ctx.ellipse(0, 24 - bob * 0.4, 10, 3.5, 0, 0, 6.283);
    ctx.fill();
    const pulse = 0.65 + 0.35 * Math.sin(g.t * 5 + it.z);
    const gl = ctx.createRadialGradient(0, 0, 6, 0, 0, 32);
    gl.addColorStop(0, `rgba(${col},${0.5 * pulse})`);
    gl.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, 6.283);
    ctx.fill();
    if (bad) {
      ctx.save();
      ctx.rotate(g.t * 1.3);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#ff5a36";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, 6.283);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.rotate(Math.sin(g.t * 3 + it.z) * 0.18);
      drawGlyph("plastic", 13);
      ctx.restore();
    } else {
      const bg = ctx.createRadialGradient(-5, -6, 2, 0, 0, 19);
      bg.addColorStop(0, "rgba(255,255,255,0.75)");
      bg.addColorStop(1, `rgba(${col},0.4)`);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = `rgba(${col},0.9)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 15.5, 0, 6.283);
      ctx.stroke();
      drawGlyph(it.kind, 10.5);
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 3; i++) {
        const a = g.t * 1.8 + i * 2.094;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 24, Math.sin(a) * 24, 1.7, 0, 6.283);
        ctx.fill();
      }
    }
    // rozet: yeşil artı (iyi) / kırmızı eksi (kötü)
    ctx.fillStyle = bad ? "#e5482d" : "#2fa56e";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(14, -14, 6, 0, 6.283);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(11.2, -14);
    ctx.lineTo(16.8, -14);
    if (!bad) {
      ctx.moveTo(14, -16.8);
      ctx.lineTo(14, -11.2);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSurfAura(py) {
    ctx.save();
    ctx.translate(g.x, py);
    const gl = ctx.createRadialGradient(0, 0, 10, 0, 0, 52);
    gl.addColorStop(0, "rgba(34,184,207,0.4)");
    gl.addColorStop(1, "rgba(34,184,207,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, 6.283);
    ctx.fill();
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i++) {
      const x = -26 + i * 10.4;
      const len = 28 + ((g.t * 320 + i * 41) % 46);
      ctx.strokeStyle = `rgba(190,244,252,${0.6 - (len - 28) / 110})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 26);
      ctx.lineTo(x, 26 + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShield(py) {
    const pulse = 0.6 + 0.4 * Math.sin(g.t * 5);
    ctx.save();
    ctx.translate(g.x, py);
    // süre bitmeye yaklaşırken kalkan yanıp söner
    if (g.shield < 1.5 && Math.floor(g.t * 9) % 2 === 0) ctx.globalAlpha = 0.35;
    const gr = ctx.createRadialGradient(-8, -10, 4, 0, 0, 38);
    gr.addColorStop(0, "rgba(220,238,255,0.35)");
    gr.addColorStop(1, `rgba(96,165,250,${0.16 + 0.08 * pulse})`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 2, 38, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = `rgba(200,225,255,${0.7 + 0.25 * pulse})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 2, 31, 3.6, 4.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawMagnetRing(py) {
    ctx.save();
    ctx.translate(g.x, py);
    for (let i = 0; i < 2; i++) {
      const u = ((g.t * 0.9 + i * 0.5) % 1);
      ctx.strokeStyle = `rgba(251,113,133,${0.6 * (1 - u)})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 64 - u * 34, 0, 6.283);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDragBag(py) {
    ctx.save();
    ctx.translate(g.x + 13, py + 30);
    ctx.rotate(Math.sin(g.t * 9) * 0.3);
    drawGlyph("plastic", 9);
    ctx.restore();
  }

  function drawItem(it, sy) {
    if (it.kind && it.kind !== "shell") return drawPickup(it, sy);
    const bob = Math.sin(g.t * 4 + it.z) * 2;
    ctx.save();
    ctx.translate(it.x, sy + bob);
    ctx.fillStyle = "rgba(90,70,30,0.15)";
    ctx.beginPath();
    ctx.ellipse(0, 13 - bob * 0.5, 10 - bob * 0.3, 4, 0, 0, 6.283);
    ctx.fill();
    // yumuşak ışıltı
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    glow.addColorStop(0, "rgba(169,219,196,0.5)");
    glow.addColorStop(1, "rgba(169,219,196,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, 6.283);
    ctx.fill();
    ctx.lineJoin = "round";
    const ig = ctx.createLinearGradient(-8, -10, 8, 10);
    ig.addColorStop(0, "#d3f3e4");
    ig.addColorStop(1, "#8fd0b4");
    hexPath(0, 0, 12, 0.52);
    ctx.fillStyle = ig;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#3f9272";
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = 0.52 + (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
      ctx.stroke();
    }
    hexPath(0, 0, 5, 0.52);
    ctx.fillStyle = "#3f9272";
    ctx.fill();
    // kıvılcım
    const tw = (Math.sin(g.t * 5 + it.z) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + tw * 0.5})`;
    ctx.beginPath();
    ctx.arc(-5, -6, 1.1 + tw * 0.7, 0, 6.283);
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
    const skin = "#1f72c0";
    const skinLight = "#58a2e6";
    const skinDark = "#124a85";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

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
      ctx.moveTo(-3.8, 0);
      ctx.bezierCurveTo(-9, -len * 0.45, -6.5, -len, 0, -len - 3.5);
      ctx.bezierCurveTo(6.5, -len, 9, -len * 0.45, 3.8, 0);
      ctx.closePath();
      const fg = ctx.createLinearGradient(-6, 0, 6, -len);
      fg.addColorStop(0, skin);
      fg.addColorStop(1, skinLight);
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = skinDark;
      ctx.stroke();
      ctx.strokeStyle = "rgba(18,74,133,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -len + 1.5, 3.2, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-2, -len * 0.55, 1.4, len * 0.28, 0.12, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }

    // kuyruk
    ctx.beginPath();
    ctx.moveTo(-4, 17);
    ctx.quadraticCurveTo(-2.5, 24, 0, 30);
    ctx.quadraticCurveTo(2.5, 24, 4, 17);
    ctx.closePath();
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = skinDark;
    ctx.stroke();

    // boyun ve baş
    const bob = Math.sin(t * f * 0.5) * 1.1;
    ctx.beginPath();
    ctx.ellipse(0, -17, 5.6, 7, 0, 0, 6.283);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = skinDark;
    ctx.stroke();
    ctx.save();
    ctx.translate(lean * 4, -26 + bob);
    const hg = ctx.createRadialGradient(-3, -5, 1, 0, 0, 12);
    hg.addColorStop(0, skinLight);
    hg.addColorStop(0.6, skin);
    hg.addColorStop(1, "#1a63ad");
    ctx.beginPath();
    ctx.ellipse(0, 0, 9.4, 10.6, 0, 0, 6.283);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = skinDark;
    ctx.stroke();
    // yanaklar
    ctx.fillStyle = "rgba(255,139,139,0.38)";
    for (const sx of [-6.3, 6.3]) {
      ctx.beginPath();
      ctx.ellipse(sx, 3, 2.3, 1.5, 0, 0, 6.283);
      ctx.fill();
    }
    // gözler
    for (const sx of [-4.4, 4.4]) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(sx, -2.4, 3.4, 0, 6.283);
      ctx.fill();
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(10,36,64,0.6)";
      ctx.stroke();
      ctx.fillStyle = "#0a2440";
      ctx.beginPath();
      ctx.arc(sx + lean * 2, -2.9, 1.9, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(sx + lean * 2 - 0.55, -3.7, 0.7, 0, 6.283);
      ctx.arc(sx + lean * 2 + 0.7, -2.2, 0.35, 0, 6.283);
      ctx.fill();
    }
    // burun delikleri ve gülümseme
    ctx.fillStyle = "rgba(10,36,64,0.4)";
    for (const sx of [-1.2, 1.2]) {
      ctx.beginPath();
      ctx.arc(sx, 1.4, 0.55, 0, 6.283);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(10,36,64,0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 3.2, 3, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // kabuk gölgesi (gövdeye oturması için)
    hexPath(0, 1.6, 21.5, Math.PI / 6);
    ctx.fillStyle = "rgba(10,36,64,0.22)";
    ctx.fill();

    // kabuk kenar pulları: dış halka
    const R = 20.5;
    hexPath(0, 0, R + 2.2, Math.PI / 6);
    ctx.fillStyle = "#1d5fa8";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = skinDark;
    ctx.stroke();

    // kabuk: gradyanlı, logodaki gibi altıgen + altı dilim
    const shell = ctx.createRadialGradient(-6, -8, 2, 0, 0, R + 2);
    shell.addColorStop(0, "#8cc6f6");
    shell.addColorStop(0.5, "#3f93e0");
    shell.addColorStop(1, "#2a72c2");
    hexPath(0, 0, R, Math.PI / 6);
    ctx.fillStyle = shell;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#185fa5";
    ctx.stroke();
    // dilimlere hafif ton farkı: ışık sol üstten
    for (let i = 0; i < 6; i++) {
      const a0 = Math.PI / 6 + (Math.PI / 3) * i;
      const a1 = a0 + Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * 8.5, Math.sin(a0) * 8.5);
      ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
      ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R);
      ctx.lineTo(Math.cos(a1) * 8.5, Math.sin(a1) * 8.5);
      ctx.closePath();
      const mid = (a0 + a1) / 2;
      const lit = -Math.cos(mid + 2.2);
      ctx.fillStyle = lit > 0 ? `rgba(255,255,255,${0.06 + lit * 0.1})` : `rgba(10,36,64,${-lit * 0.12})`;
      ctx.fill();
      ctx.fillStyle = "rgba(244,249,253,0.28)";
      ctx.beginPath();
      ctx.arc(Math.cos(mid) * 14.7, Math.sin(mid) * 14.7, 1.3, 0, 6.283);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(244,249,253,0.92)";
    ctx.lineWidth = 1.7;
    for (let i = 0; i < 6; i++) {
      const ang = Math.PI / 6 + (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 8.5, Math.sin(ang) * 8.5);
      ctx.lineTo(Math.cos(ang) * R, Math.sin(ang) * R);
      ctx.stroke();
    }
    const core = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9);
    core.addColorStop(0, "#2c78c4");
    core.addColorStop(1, "#154f8e");
    hexPath(0, 0, 8.5, Math.PI / 6);
    ctx.fillStyle = core;
    ctx.fill();
    ctx.strokeStyle = "rgba(244,249,253,0.92)";
    ctx.lineWidth = 1.7;
    ctx.stroke();
    // parlama
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.beginPath();
    ctx.ellipse(-9, -11.5, 6.5, 2.8, -0.7, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(-4.5, -15.2, 1.1, 0, 6.283);
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
    // etkin güçlendirici ve ağırlaşma göstergeleri
    const act = [];
    if (g.shield > 0) act.push(["shield", g.shield / SHIELD_TIME, "96,165,250"]);
    if (g.magnet > 0) act.push(["magnet", g.magnet / 7, "251,113,133"]);
    if (g.surf > 0) act.push(["surf", g.surf / 2.6, "34,184,207"]);
    if (g.drag > 0) act.push(["plastic", g.drag / 3.5, "255,90,54"]);
    act.forEach(([kind, fr, col], i) => {
      const cx = 26 + i * 34;
      const cy = 62;
      ctx.fillStyle = "rgba(10,36,64,0.5)";
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = `rgb(${col})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, 14, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.max(0.02, fr));
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      drawGlyph(kind, 8);
      ctx.restore();
    });
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
      if (!sea && g.surf > 0) drawSurfAura(py);
      drawTurtle(g.x, py, g.t, sea, g.lean, g.squash);
      if (!sea) {
        if (g.shield > 0) drawShield(py);
        if (g.magnet > 0) drawMagnetRing(py);
        if (g.drag > 0) drawDragBag(py);
      }
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

    if (g.variant === 6 && g.phase !== "idle") drawRain();

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
        hits: g.hits,
        shield: g.shield,
        magnet: g.magnet,
        surf: g.surf,
        drag: g.drag,
        obstacles: g.world
          ? g.world.obstacles.map((o) => ({
              lanes: o.lanes,
              z: o.z,
              type: o.type,
              sweep: !!o.sweep,
              x: o.type === "crab" ? crabX(o, g.t) : o.x,
              w: o.w,
            }))
          : [],
        items: g.world ? g.world.items.filter((i) => !i.taken).map((i) => ({ kind: i.kind, z: i.z, lane: i.lane })) : [],
      };
    },
  };
}

export { LANE_MOVE_TIME };
