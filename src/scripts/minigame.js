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

const OBSTACLE_SIZE = {
  rock: { w: 40, h: 30 },
  crab: { w: 38, h: 28 },
  wood: { w: 165, h: 24 },
  weed: { w: 46, h: 44 },
};

/**
 * Bir bölümün engellerini ve toplanabilirlerini üretir.
 * Her sırada en az bir şerit boştur ve bir sonraki sıranın boş şeridine,
 * önceki sıranın boş şeridinden en fazla bir şerit kayarak ulaşılabilir.
 */
export function buildLevel(n, rand = Math.random) {
  const p = levelParams(n);
  const obstacles = [];
  const items = [];
  let z = 720;
  let prevFree = [0, 1, 2];

  const pickType = () => {
    const pool = ["rock"];
    if (n >= 2) pool.push("crab", "rock");
    if (n >= 3) pool.push("weed");
    return pool[Math.floor(rand() * pool.length)];
  };

  while (z < p.length - 450) {
    let row = null;

    if (rand() > 0.12) {
      for (let tries = 0; tries < 6 && !row; tries++) {
        const two = rand() < p.doubleChance;
        let blocked;
        let wood = false;
        if (!two) {
          blocked = [Math.floor(rand() * LANES)];
        } else if (n >= 2 && rand() < 0.5) {
          const a = Math.floor(rand() * 2); // 0-1 veya 1-2
          blocked = [a, a + 1];
          wood = true;
        } else {
          const free = Math.floor(rand() * LANES);
          blocked = [0, 1, 2].filter((l) => l !== free);
        }
        const free = [0, 1, 2].filter((l) => !blocked.includes(l));
        const reachable = free.some((f) => prevFree.some((q) => Math.abs(f - q) <= 1));
        if (reachable) row = { blocked, free, wood };
      }
    }

    if (row) {
      if (row.wood) {
        const a = row.blocked[0];
        obstacles.push({
          type: "wood",
          lanes: row.blocked,
          z,
          x: (laneCenter(a) + laneCenter(a + 1)) / 2,
          ...OBSTACLE_SIZE.wood,
          phase: rand() * 6.28,
        });
      } else {
        for (const l of row.blocked) {
          const type = pickType();
          obstacles.push({
            type,
            lanes: [l],
            z,
            x: laneCenter(l),
            ...OBSTACLE_SIZE[type],
            phase: rand() * 6.28,
          });
        }
      }
      prevFree = row.free;
    } else {
      prevFree = [0, 1, 2];
    }

    const gapPx = p.gap * p.speed * (0.9 + rand() * 0.4);

    // Sıra arasına bazen bir kabuk parçası
    if (rand() < 0.4) {
      const pool = prevFree;
      const lane = pool[Math.floor(rand() * pool.length)];
      items.push({ z: z + gapPx / 2, x: laneCenter(lane), lane, taken: false });
    }

    z += gapPx;
  }

  return { params: p, obstacles, items, length: p.length };
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
    pool: 0, // kalan kabuk parçası sayacı (can için)
    invuln: 0,
    slow: 0,
    shake: 0,
    world: null,
  };

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth || W;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(cw * (H / W) * dpr);
    scale = canvas.width / W;
  }

  function start(level) {
    g.level = level;
    g.world = buildLevel(level, rand);
    g.phase = "ready";
    g.phaseT = 0;
    g.d = 0;
    g.lane = 1;
    g.x = laneCenter(1);
    g.hearts = MAX_HEARTS;
    g.parts = 0;
    g.pool = 0;
    g.invuln = 0;
    g.slow = 0;
    opt.onStart && opt.onStart(level);
  }

  function move(dir) {
    if (g.phase !== "run" && g.phase !== "ready") return;
    g.lane = Math.max(0, Math.min(LANES - 1, g.lane + dir));
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
    g.invuln = 1.4;
    g.slow = 0.5;
    g.shake = 0.25;
    if (g.hearts <= 0) {
      g.phase = "over";
      g.phaseT = 0;
      opt.onOver && opt.onOver({ level: g.level });
    }
  }

  function update(dt) {
    g.t += dt;
    g.phaseT += dt;
    g.x += (laneCenter(g.lane) - g.x) * Math.min(1, dt * 18);
    if (g.invuln > 0) g.invuln -= dt;
    if (g.slow > 0) g.slow -= dt;
    if (g.shake > 0) g.shake -= dt;

    if (g.phase === "ready") {
      if (g.phaseT >= 1.1) {
        g.phase = "run";
        g.phaseT = 0;
      }
      return;
    }
    if (g.phase !== "run" && g.phase !== "sea") return;

    g.d += curSpeed() * dt;

    if (g.phase === "run") {
      const py = PY;
      for (const o of g.world.obstacles) {
        const sy = py - (o.z - g.d);
        if (sy < -60 || sy > H + 60) continue;
        let ox = o.x;
        if (o.type === "crab") ox += Math.sin(g.t * 2.2 + o.phase) * LANE_W * 0.3;
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
          if (g.pool >= PARTS_PER_HEART) {
            g.pool = 0;
            g.hearts = Math.min(MAX_HEARTS, g.hearts + 1);
          }
        }
      }
      if (g.d >= g.world.length) {
        g.phase = "sea";
        g.phaseT = 0;
      }
    } else if (g.phase === "sea") {
      if (g.phaseT >= 1.6) {
        g.phase = "done";
        g.phaseT = 0;
        opt.onComplete &&
          opt.onComplete({
            level: g.level,
            parts: g.parts,
            total: g.world.items.length,
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

  function drawSand() {
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#ecdcae");
    grd.addColorStop(1, "#e2cf9b");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    for (const p of sandDots) {
      const y = (p.y + g.d) % H;
      ctx.fillStyle = `rgba(120,95,50,${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, y, p.r, 0, 6.283);
      ctx.fill();
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
    const sy = PY - (40 - g.d);
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
      const cx = Math.sin(g.t * 2.2 + o.phase) * LANE_W * 0.3;
      ctx.translate(cx, 0);
      const wig = Math.sin(g.t * 10 + o.phase) * 2;
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
      ctx.fillStyle = "#8a6a43";
      ctx.strokeStyle = "#5e4627";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-o.w / 2, -10, o.w, 22, 10);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(60,40,20,0.35)";
      ctx.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 22, -8);
        ctx.lineTo(i * 22 + 6, 9);
        ctx.stroke();
      }
      ctx.fillStyle = "#b08a5a";
      ctx.beginPath();
      ctx.ellipse(-o.w / 2 + 6, 1, 5, 9, 0, 0, 6.283);
      ctx.fill();
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

  function drawTurtle(x, y, t, swimming) {
    ctx.save();
    ctx.translate(x, y);
    const f = swimming ? 9 : 14;
    const amp = swimming ? 0.5 : 0.38;
    // ayaklar
    ctx.fillStyle = "#185fa5";
    const flip = [
      [-15, -10, -0.7],
      [15, -10, 0.7],
      [-14, 11, -2.3],
      [14, 11, 2.3],
    ];
    flip.forEach(([fx, fy, rot], i) => {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(rot + Math.sin(t * f + i * 1.6) * amp);
      ctx.beginPath();
      ctx.ellipse(0, -8, 5.5, 12, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    });
    // kuyruk
    ctx.beginPath();
    ctx.moveTo(-4, 17);
    ctx.lineTo(4, 17);
    ctx.lineTo(0, 27);
    ctx.closePath();
    ctx.fill();
    // baş
    ctx.save();
    ctx.translate(0, -23 + Math.sin(t * f * 0.5) * 1.2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 10, 0, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3.2, -3, 1.9, 0, 6.283);
    ctx.arc(3.2, -3, 1.9, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = "#0a2440";
    ctx.beginPath();
    ctx.arc(-3.2, -3.2, 0.9, 0, 6.283);
    ctx.arc(3.2, -3.2, 0.9, 0, 6.283);
    ctx.fill();
    ctx.restore();
    // kabuk
    hexPath(0, 0, 19, Math.PI / 6);
    ctx.fillStyle = "#378ada";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#185fa5";
    ctx.stroke();
    ctx.strokeStyle = "rgba(244,249,253,0.8)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
      ctx.stroke();
    }
    hexPath(0, 0, 8, Math.PI / 6);
    ctx.fillStyle = "#185fa5";
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
    for (let i = 0; i < MAX_HEARTS; i++) heart(W - 20 - i * 24, 25, 1.2, i < g.hearts);
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
    hexPath(W - 14, 54, 7, 0.52);
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
      drawTurtle(laneCenter(1), PY, performance.now() / 1000, false);
      return;
    }
    drawEggshell();

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
      drawTurtle(g.x, py, g.t, sea);
    }

    drawHud();

    if (g.phase === "ready") {
      text(`${S.level} ${g.level}`, W / 2, 250, 42);
      if (g.level === 1) text(S.hint, W / 2, 292, 16, "center", 600);
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
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", fit);
    },
    /** Test ve erişilebilirlik için salt okunur durum. */
    getState() {
      return {
        level: g.level,
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
