const VERDICTS = {
  G: { color: [106, 168, 79], label: 'Compatible' },
  Y: { color: [241, 194, 50], label: 'Caution' },
  R: { color: [204, 0, 0], label: 'Conflict' }
};

const SPECIES = [
  { name: 'Angelfish',              body: [215, 222, 233], fin: [168, 184, 202], pattern: 'vstripes',     pc: [34, 40, 47],    shape: 'tall',     size: 44, speed: 0.50, iscale: 0.50, band: [0.14, 0.80], row: 'GGRRRGGRYRGR' },
  { name: 'Barb',                   body: [240, 166, 60],  fin: [214, 128, 42],  pattern: 'vstripes',     pc: [35, 39, 44],    shape: 'standard', size: 32, speed: 0.90, iscale: 0.62, band: [0.14, 0.82], row: 'GGRYRGGYYRGY' },
  { name: 'Betta',                  body: [184, 50, 62],   fin: [138, 34, 54],   pattern: 'none',         pc: [0, 0, 0],       shape: 'flow',     size: 34, speed: 0.45, iscale: 0.60, band: [0.14, 0.82], row: 'RRYRRGGRRRRG' },
  { name: 'African Cichlid',        body: [77, 143, 209],  fin: [45, 106, 165],  pattern: 'vstripes',     pc: [27, 74, 122],   shape: 'standard', size: 34, speed: 0.75, iscale: 0.62, band: [0.14, 0.82], row: 'RYRYYRRRYRRR' },
  { name: 'South American Cichlid', body: [138, 154, 91],  fin: [107, 122, 68],  pattern: 'blotches',     pc: [83, 95, 56],    shape: 'standard', size: 40, speed: 0.60, iscale: 0.58, band: [0.14, 0.80], row: 'RRRYYRRRYRRR' },
  { name: 'Cory Catfish',           body: [193, 154, 107], fin: [160, 124, 80],  pattern: 'spots',        pc: [136, 104, 64],  shape: 'cat',      size: 30, speed: 0.60, iscale: 0.66, band: [0.58, 0.86], row: 'GGGRRGGGYRGG' },
  { name: 'Danio / Minnow',         body: [184, 207, 224], fin: [141, 174, 198], pattern: 'hstripes',     pc: [44, 71, 99],    shape: 'slim',     size: 28, speed: 1.10, iscale: 0.70, band: [0.10, 0.55], row: 'GGGRRGGRYRGG' },
  { name: 'Discus',                 body: [232, 134, 46],  fin: [199, 104, 28],  pattern: 'vstripesThin', pc: [31, 143, 122],  shape: 'round',    size: 42, speed: 0.35, iscale: 0.55, band: [0.14, 0.80], row: 'RYRRRGRGYRYR' },
  { name: 'Eel',                    body: [95, 114, 100],  fin: [72, 88, 77],    pattern: 'bands',        pc: [55, 68, 58],    shape: 'eel',      size: 40, speed: 0.50, iscale: 0.60, band: [0.60, 0.84], row: 'YYRYYYYYYRYY' },
  { name: 'Goldfish',               body: [243, 156, 44],  fin: [247, 181, 86],  pattern: 'none',         pc: [0, 0, 0],       shape: 'flow',     size: 38, speed: 0.50, iscale: 0.55, band: [0.14, 0.82], row: 'RRRRRRRRRGRR' },
  { name: 'Gourami',                body: [201, 182, 217], fin: [165, 145, 187], pattern: 'spots',        pc: [244, 238, 250], shape: 'standard', size: 34, speed: 0.45, iscale: 0.62, band: [0.12, 0.78], row: 'GGRRRGGYYRYY' },
  { name: 'Guppy',                  body: [79, 195, 161],  fin: [242, 140, 59],  pattern: 'tailspots',    pc: [211, 84, 0],    shape: 'slim',     size: 24, speed: 1.00, iscale: 0.78, band: [0.12, 0.78], row: 'RYGRRGGRYRYG' }
];

const BODY = {
  tall: [0.55, 0.78],
  round: [0.60, 0.46],
  standard: [0.64, 0.32],
  slim: [0.70, 0.26],
  cat: [0.62, 0.30],
  flow: [0.60, 0.36]
};

const fishes = [];
const bubbles = [];
const ripples = [];
const ICONS = [];
let draggingFish = null;
let hoverFish = null;
let spawn = null;
let highlight = null;
let lastClientX = 0;
let lastClientY = 0;
let canvasEl = null;

function compat(i, j) {
  return i === j ? 'G' : SPECIES[i].row[j];
}

function fl(g, c, a) {
  if (a === undefined) g.fill(c[0], c[1], c[2]);
  else g.fill(c[0], c[1], c[2], a);
}

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function bandFor(si, h) {
  const b = SPECIES[si].band;
  return [h * b[0] + 26, Math.min(h * b[1], h - 26)];
}

function randomSpot(si, w, h) {
  const [y0, y1] = bandFor(si, h);
  return {
    x: 70 + Math.random() * (w - 140),
    y: y0 + Math.random() * Math.max(10, y1 - y0)
  };
}

function bodyDims(sp) {
  const d = BODY[sp.shape];
  return { rx: d[0] * sp.size, ry: d[1] * sp.size };
}

function drawTail(g, sp, jx, wig, amp) {
  const s = sp.size;
  g.noStroke();
  if (sp.shape === 'flow') {
    const layers = [[0.55, 0.30, 0.45, 90], [0.70, 0.36, 0.85, 140], [0.85, 0.42, 1.25, 190]];
    for (const [len, spread, phase, alpha] of layers) {
      const w2 = wig * phase + phase * 0.6;
      fl(g, sp.fin, alpha);
      g.triangle(jx + 2, 0,
        jx - s * len, -s * spread + w2 * amp,
        jx - s * len, s * spread + w2 * amp);
    }
  } else if (sp.shape === 'round') {
    fl(g, sp.fin, 240);
    g.triangle(jx + 2, 0, jx - s * 0.52, -s * 0.30 + wig * amp, jx - s * 0.52, s * 0.30 + wig * amp);
  } else if (sp.name === 'Guppy') {
    fl(g, sp.fin, 235);
    g.triangle(jx + 2, 0, jx - s * 0.62, -s * 0.42 + wig * amp, jx - s * 0.62, s * 0.42 + wig * amp);
    fl(g, sp.pc, 210);
    g.ellipse(jx - s * 0.34, -s * 0.08 + wig * amp * 0.6, s * 0.13);
    g.ellipse(jx - s * 0.44, s * 0.10 + wig * amp * 0.6, s * 0.10);
    g.ellipse(jx - s * 0.22, s * 0.02 + wig * amp * 0.6, s * 0.09);
  } else {
    fl(g, sp.fin, 235);
    g.triangle(jx + 2, 0, jx - s * 0.50, -s * 0.26 + wig * amp, jx - s * 0.40, -s * 0.02 + wig * amp * 0.5);
    g.triangle(jx + 2, 0, jx - s * 0.50, s * 0.26 + wig * amp, jx - s * 0.40, s * 0.02 + wig * amp * 0.5);
  }
}

function drawFins(g, sp, ry, wig, amp) {
  const s = sp.size;
  g.noStroke();
  if (sp.shape === 'tall') {
    fl(g, sp.fin, 220);
    g.triangle(-s * 0.18, -ry, s * 0.14, -ry * 0.92, -s * 0.55, -ry - s * 0.45);
    g.triangle(-s * 0.18, ry, s * 0.14, ry * 0.92, -s * 0.55, ry + s * 0.45);
  } else {
    fl(g, sp.fin, 225);
    g.triangle(-s * 0.12, -ry * 0.9, s * 0.26, -ry * 0.78, s * 0.02, -ry - s * 0.22);
  }
  fl(g, sp.fin, 190);
  g.triangle(s * 0.08, ry * 0.18, s * 0.32, ry * 0.05 + wig * amp * 0.4, s * 0.18, ry * 0.52);
}

function drawPattern(g, sp) {
  const s = sp.size;
  const { rx, ry } = bodyDims(sp);
  const ctx = g.drawingContext;
  g.noStroke();
  fl(g, sp.pc, 190);
  if (sp.pattern === 'vstripes') {
    for (const k of [-0.32, 0, 0.32]) g.rect(k * s - s * 0.055, -ry * 1.15, s * 0.11, ry * 2.3);
  } else if (sp.pattern === 'vstripesThin') {
    for (const k of [-0.4, -0.2, 0, 0.2, 0.4]) g.rect(k * s - s * 0.024, -ry * 1.15, s * 0.048, ry * 2.3);
  } else if (sp.pattern === 'hstripes') {
    for (const k of [-0.10, 0.02, 0.14]) g.rect(-rx * 1.15, k * s, rx * 2.3, s * 0.05);
  } else if (sp.pattern === 'spots') {
    for (const [kx, ky] of [[-0.3, -0.08], [0, -0.14], [0.28, -0.05], [-0.15, 0.1], [0.15, 0.12]]) {
      g.ellipse(kx * s, ky * s, s * 0.11);
    }
  } else if (sp.pattern === 'blotches') {
    g.ellipse(-s * 0.25, -s * 0.05, s * 0.30, s * 0.18);
    g.ellipse(s * 0.14, s * 0.08, s * 0.34, s * 0.19);
    g.ellipse(s * 0.38, -s * 0.10, s * 0.20, s * 0.12);
  }
}

function drawEye(g, ex, ey, s) {
  g.noStroke();
  g.fill(245, 250, 253);
  g.ellipse(ex, ey, s * 0.17);
  g.fill(20, 28, 38);
  g.ellipse(ex + s * 0.02, ey, s * 0.095);
  g.fill(255, 255, 255, 220);
  g.ellipse(ex + s * 0.045, ey - s * 0.03, s * 0.035);
}

function drawFish(g, sp, wig, amp) {
  if (sp.shape === 'eel') return;
  const s = sp.size;
  const { rx, ry } = bodyDims(sp);
  const jx = -rx * 0.82;
  drawTail(g, sp, jx, wig, amp);
  drawFins(g, sp, ry, wig, amp);
  g.stroke(15, 25, 35, 70);
  g.strokeWeight(1);
  fl(g, sp.body);
  g.ellipse(0, 0, rx * 2, ry * 2);
  g.noStroke();
  if (sp.pattern !== 'none' && sp.pattern !== 'bands' && sp.pattern !== 'tailspots') {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    drawPattern(g, sp);
    ctx.restore();
  }
  if (sp.shape === 'cat') {
    g.stroke(90, 66, 40);
    g.strokeWeight(1.4);
    g.line(rx * 0.88, s * 0.03, rx * 1.34, s * 0.12);
    g.line(rx * 0.88, s * 0.07, rx * 1.30, s * 0.26);
    g.noStroke();
  }
  drawEye(g, rx * 0.60, -ry * 0.18, s);
}

function drawEel(g, sp, t, phase) {
  const s = sp.size;
  const segs = 16;
  const x0 = -s * 1.15;
  const x1 = s * 0.5;
  let hy = 0;
  let hr = 0;
  for (let i = 0; i < segs; i++) {
    const u = i / (segs - 1);
    const x = x0 + u * (x1 - x0);
    const y = Math.sin(t * 4.2 - u * 4.6 + phase) * s * 0.20 * (1.05 - 0.45 * u);
    let prof = 1;
    if (u < 0.2) prof = 0.3 + 0.7 * (u / 0.2);
    else if (u > 0.85) prof = 1 - 0.45 * ((u - 0.85) / 0.15);
    const r = s * 0.16 * prof;
    g.noStroke();
    fl(g, i % 2 === 0 ? sp.pc : sp.body, 255);
    g.ellipse(x, y, r * 2);
    if (i === segs - 1) { hy = y; hr = r; }
  }
  drawEye(g, x1 + s * 0.04, hy - hr * 0.35, s * 0.8);
}

class Fish {
  constructor(si, x, y) {
    this.si = si;
    this.x = x;
    this.y = y;
    this.a = Math.random() * Math.PI * 2;
    this.seed = Math.random() * 1000;
    this.phase = Math.random() * Math.PI * 2;
    this.grabbed = false;
    this.grabDX = 0;
    this.grabDY = 0;
  }

  update(p, t) {
    if (this.grabbed) return;
    const sp = SPECIES[this.si];
    const h = p.height;
    this.a += (p.noise(this.seed, t * 0.35) - 0.5) * 0.14;
    const v = sp.speed * 1.25 * (0.7 + 0.3 * Math.sin(t * 0.8 + this.phase));
    const m = 46;
    const [y0, y1] = bandFor(this.si, h);
    if (this.x < m) this.a = lerpAngle(this.a, 0, 0.10);
    if (this.x > p.width - m) this.a = lerpAngle(this.a, Math.PI, 0.10);
    if (this.y < y0) this.a = lerpAngle(this.a, Math.PI / 2, 0.10);
    if (this.y > y1) this.a = lerpAngle(this.a, -Math.PI / 2, 0.10);
    this.x += Math.cos(this.a) * v;
    this.y += Math.sin(this.a) * v;
    this.x = Math.max(24, Math.min(p.width - 24, this.x));
    this.y = Math.max(20, Math.min(h - 20, this.y));
  }

  draw(p, t, ghosted) {
    const sp = SPECIES[this.si];
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.a);
    if (Math.cos(this.a) < 0) p.scale(1, -1);
    if (ghosted) p.drawingContext.globalAlpha = 0.45;
    if (sp.shape === 'eel') {
      drawEel(p, sp, t, this.phase);
    } else {
      const ws = this.grabbed ? 14 : sp.speed * 4 + 3;
      const amp = sp.size * (this.grabbed ? 0.24 : 0.14);
      drawFish(p, sp, Math.sin(t * ws + this.phase), amp);
    }
    p.drawingContext.globalAlpha = 1;
    p.pop();
  }
}

function fishAt(mx, my) {
  for (let i = fishes.length - 1; i >= 0; i--) {
    const f = fishes[i];
    const sp = SPECIES[f.si];
    const r = sp.shape === 'eel' ? sp.size * 0.85 : Math.max(22, sp.size * 0.62);
    if ((mx - f.x) * (mx - f.x) + (my - f.y) * (my - f.y) < r * r) return f;
  }
  return null;
}

function addFish(si, x, y) {
  const [y0, y1] = bandFor(si, canvasH());
  const fx = Math.max(30, Math.min(canvasW() - 30, x));
  const fy = Math.max(y0 - 10, Math.min(y1 + 10, y));
  fishes.push(new Fish(si, fx, fy));
  ripples.push({ x: fx, y: fy, r: 4, a: 150 });
  updateHUD();
}

function removeFish(f, burst) {
  const idx = fishes.indexOf(f);
  if (idx === -1) return;
  if (burst) {
    for (let i = 0; i < 9; i++) {
      bubbles.push({ x: f.x + (Math.random() - 0.5) * 24, y: f.y + (Math.random() - 0.5) * 16, r: 1.5 + Math.random() * 3, v: 0.8 + Math.random() * 1.4, wig: Math.random() * 10 });
    }
  }
  fishes.splice(idx, 1);
  if (draggingFish === f) draggingFish = null;
  if (hoverFish === f) hoverFish = null;
  updateHUD();
}

function canvasW() { return window['_p'] ? window['_p'].width : 600; }
function canvasH() { return window['_p'] ? window['_p'].height : 400; }

function pairList() {
  const pairs = [];
  for (let i = 0; i < fishes.length; i++) {
    for (let j = i + 1; j < fishes.length; j++) {
      pairs.push({ a: fishes[i], b: fishes[j], v: compat(fishes[i].si, fishes[j].si), same: fishes[i].si === fishes[j].si });
    }
  }
  return pairs;
}

function updateHUD() {
  const banner = document.getElementById('banner');
  const report = document.getElementById('report');
  const n = fishes.length;
  const pairs = pairList();
  const conflicts = pairs.filter(p2 => p2.v === 'R');
  const cautions = pairs.filter(p2 => p2.v === 'Y');

  banner.classList.remove('state-empty', 'state-good', 'state-warn', 'state-bad');
  if (n === 0) {
    banner.classList.add('state-empty');
    banner.textContent = 'Your tank is empty — add fish from the store';
  } else if (n === 1) {
    banner.classList.add('state-empty');
    banner.textContent = SPECIES[fishes[0].si].name + ' is waiting for a friend…';
  } else if (conflicts.length > 0) {
    banner.classList.add('state-bad');
    banner.textContent = conflicts.length === 1 ? '1 conflict! These fish cannot live together' : conflicts.length + ' conflicts! These fish cannot live together';
  } else if (cautions.length > 0) {
    banner.classList.add('state-warn');
    banner.textContent = cautions.length === 1 ? 'Careful — 1 pairing needs caution' : 'Careful — ' + cautions.length + ' pairings need caution';
  } else {
    banner.classList.add('state-good');
    banner.textContent = 'Happy tank! All ' + n + ' fish get along';
  }

  report.innerHTML = '';
  if (pairs.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = n < 2 ? 'Add at least two fish to see their pairing.' : '';
    report.appendChild(li);
    return;
  }
  const order = { R: 0, Y: 1, G: 2 };
  pairs.sort((p1, p2) => order[p1.v] - order[p2.v]);
  for (const pr of pairs) {
    const li = document.createElement('li');
    li.className = 'v-' + pr.v.toLowerCase();
    li.innerHTML = '<i class="dot ' + pr.v.toLowerCase() + '"></i><span class="pair">' +
      SPECIES[pr.a.si].name + ' × ' + SPECIES[pr.b.si].name + '</span><span class="tag">' +
      (pr.same ? 'Shoal mates' : VERDICTS[pr.v].label) + '</span>';
    li.addEventListener('click', () => {
      highlight = { a: pr.a.si, b: pr.b.si, until: performance.now() / 1000 + 2.2 };
    });
    report.appendChild(li);
  }
}

function drawWater(p, t) {
  const w = p.width, h = p.height;
  const ctx = p.drawingContext;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#7fd0f0');
  grad.addColorStop(0.45, '#3d93c4');
  grad.addColorStop(1, '#14507a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  p.noStroke();
  p.fill(255, 255, 255, 9);
  for (let k = 0; k < 3; k++) {
    const bx = w * (0.22 + 0.3 * k) + Math.sin(t * 0.25 + k * 2.1) * 34;
    p.quad(bx - 24, 0, bx + 54, 0, bx - 66, h, bx - 140, h);
  }

  p.fill(226, 201, 146);
  p.ellipse(w * 0.5, h * 1.08, w * 1.5, h * 0.38);
  p.fill(206, 178, 122);
  p.ellipse(w * 0.16, h * 0.925, w * 0.07, h * 0.028);
  p.ellipse(w * 0.22, h * 0.945, w * 0.05, h * 0.02);
  p.ellipse(w * 0.86, h * 0.935, w * 0.06, h * 0.024);
  p.ellipse(w * 0.81, h * 0.95, w * 0.04, h * 0.016);

  const clusters = [[0.06, 1], [0.115, 2], [0.9, 1], [0.955, 2]];
  for (const [cx, kind] of clusters) {
    const baseX = w * cx;
    const col = kind === 1 ? [46, 139, 87] : [42, 148, 133];
    for (let j = 0; j < 5; j++) {
      const sway = Math.sin(t * 0.9 + j * 1.3 + cx * 8) * 8;
      const bx = baseX + j * 7;
      const bh = h * (0.16 + (j % 3) * 0.035);
      p.noFill();
      p.stroke(col[0], col[1], col[2], 200);
      p.strokeWeight(4.5 - j * 0.5);
      p.bezier(bx, h * 0.96, bx - sway * 0.4, h * 0.96 - bh * 0.5, bx + sway * 0.5, h * 0.96 - bh * 0.8, bx + sway, h * 0.96 - bh);
    }
  }
  p.noStroke();
}

function drawWarn(p, x, y) {
  p.push();
  p.fill(204, 0, 0);
  p.stroke(255, 255, 255, 230);
  p.strokeWeight(1);
  p.triangle(x, y - 7, x + 6.5, y + 5, x - 6.5, y + 5);
  p.noStroke();
  p.fill(255);
  p.textSize(9);
  p.textStyle(p.BOLD);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('!', x, y + 0.5);
  p.pop();
}

function drawPairLines(p, f, t, base) {
  for (const o of fishes) {
    if (o === f) continue;
    const v = compat(f.si, o.si);
    const c = VERDICTS[v].color;
    const ctx = p.drawingContext;
    p.push();
    if (v === 'R') {
      p.stroke(c[0], c[1], c[2], base);
      p.strokeWeight(3);
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -t * 40;
    } else if (v === 'Y') {
      p.stroke(c[0], c[1], c[2], base * 0.85);
      p.strokeWeight(2);
      ctx.setLineDash([4, 7]);
      ctx.lineDashOffset = -t * 20;
    } else {
      p.stroke(c[0], c[1], c[2], base * 0.55);
      p.strokeWeight(2);
    }
    p.line(f.x, f.y, o.x, o.y);
    ctx.setLineDash([]);
    p.pop();
    if (v === 'R') drawWarn(p, (f.x + o.x) / 2, (f.y + o.y) / 2);
  }
}

function drawTally(p, f) {
  if (fishes.length < 2) return;
  let g = 0, y = 0, r = 0;
  for (const o of fishes) {
    if (o === f) continue;
    const v = compat(f.si, o.si);
    if (v === 'G') g++;
    else if (v === 'Y') y++;
    else r++;
  }
  const label = g + ' compatible · ' + y + ' maybe · ' + r + ' conflict';
  p.textSize(11);
  p.textStyle(p.NORMAL);
  const tw = p.textWidth(label);
  const x = Math.max(8, Math.min(p.width - tw - 26, f.x - tw / 2 - 9));
  const yy = Math.max(8, f.y - SPECIES[f.si].size - 30);
  p.noStroke();
  p.fill(6, 20, 32, 215);
  p.rect(x, yy, tw + 18, 20, 9);
  p.fill(235, 245, 252);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(label, x + 9, yy + 10.5);
}

function overPanel() {
  const r = document.getElementById('panel').getBoundingClientRect();
  return lastClientX >= r.left && lastClientX <= r.right && lastClientY >= r.top && lastClientY <= r.bottom;
}

function placeGhost(x, y) {
  const gh = document.getElementById('ghost');
  gh.style.left = x + 'px';
  gh.style.top = y + 'px';
}

function startSpawn(i, x, y) {
  spawn = { i, x0: x, y0: y, moved: false };
  const gh = document.getElementById('ghost');
  gh.src = ICONS[i];
  gh.hidden = false;
  placeGhost(x, y);
  document.body.classList.add('grabbing');
}

const ICON_SHAPE = {
  tall: { rx: 12, ry: 16, eye: [8, -4] },
  round: { rx: 16, ry: 13, eye: [11, -3] },
  standard: { rx: 17, ry: 10, eye: [11, -2.5] },
  slim: { rx: 19, ry: 8, eye: [13, -2] },
  cat: { rx: 16, ry: 9, eye: [10, -3] },
  flow: { rx: 16, ry: 11, eye: [10, -3] }
};

function iconTail(g, sp, rx) {
  fl(g, sp.fin, 235);
  if (sp.name === 'Guppy') {
    g.triangle(-rx + 3, 0, -rx - 9, -10, -rx - 9, 10);
  } else if (sp.shape === 'flow') {
    fl(g, sp.fin, 120);
    g.triangle(-rx + 3, 0, -rx - 12, -12, -rx - 8, -1);
    g.triangle(-rx + 3, 0, -rx - 12, 12, -rx - 8, 1);
    fl(g, sp.fin, 220);
    g.triangle(-rx + 3, 0, -rx - 10, -7, -rx - 10, 7);
  } else if (sp.shape === 'round' || sp.shape === 'cat') {
    g.triangle(-rx + 3, 0, -rx - 10, -9, -rx - 10, 9);
  } else {
    g.triangle(-rx + 3, 0, -rx - 9, -8, -rx - 5, 0);
    g.triangle(-rx + 3, 0, -rx - 9, 8, -rx - 5, 0);
  }
}

function drawSimpleIcon(g, sp) {
  if (sp.shape === 'eel') {
    for (let i = 0; i < 7; i++) {
      const x = -22 + i * 6.4;
      const y = Math.sin(i * 0.85 + 0.5) * 4 * (1 - i / 10);
      const r = 3.2 + 2.2 * Math.sin((Math.PI * i) / 6);
      fl(g, i % 2 === 0 ? sp.pc : sp.body);
      g.ellipse(x, y, r * 2);
    }
    fl(g, sp.body);
    g.ellipse(17, 0.5, 10);
    drawEye(g, 19, -1.5, 24);
    return;
  }
  const { rx, ry } = ICON_SHAPE[sp.shape];
  iconTail(g, sp, rx);
  fl(g, sp.fin, 225);
  g.triangle(-4, -ry + 1, 5, -ry + 1, 0, sp.shape === 'tall' ? -ry - 10 : -ry - 6);
  if (sp.shape === 'tall') {
    g.triangle(-4, ry - 1, 5, ry - 1, 0, ry + 10);
  }
  fl(g, sp.body);
  g.stroke(15, 25, 35, 60);
  g.strokeWeight(1);
  g.ellipse(2, 0, rx * 2, ry * 2);
  g.noStroke();
  if (sp.pattern !== 'none' && sp.pattern !== 'tailspots') {
    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(2, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    fl(g, sp.pc, 200);
    if (sp.pattern === 'vstripes') {
      for (const k of [-5, 1, 7]) g.rect(k, -ry, 3.4, ry * 2);
    } else if (sp.pattern === 'vstripesThin') {
      for (const k of [-6, -2, 2, 6]) g.rect(k, -ry, 1.7, ry * 2);
    } else if (sp.pattern === 'hstripes') {
      for (const k of [-3.5, -0.5, 2.5]) g.rect(-rx, k, rx * 2, 1.9);
    } else if (sp.pattern === 'spots') {
      for (const [kx, ky] of [[-6, -3], [0, -5], [6, -2], [-2, 3], [5, 4]]) g.ellipse(kx + 2, ky, 4);
    } else if (sp.pattern === 'blotches') {
      g.ellipse(-4, 0, 9, 5.5);
      g.ellipse(7, 3, 10, 5.5);
    }
    ctx.restore();
  } else if (sp.pattern === 'tailspots') {
    fl(g, sp.pc, 220);
    g.ellipse(-rx - 5, -2.5, 5);
    g.ellipse(-rx - 7, 4, 4);
  }
  if (sp.shape === 'cat') {
    g.stroke(110, 82, 50);
    g.strokeWeight(1.1);
    g.line(rx + 1, 2, rx + 7, 5.5);
    g.line(rx + 1, 4, rx + 6, 9);
    g.noStroke();
  }
  drawEye(g, ICON_SHAPE[sp.shape].eye[0] + 2, ICON_SHAPE[sp.shape].eye[1], 28);
}

function makeIcon(p, i) {
  const sp = SPECIES[i];
  const g = p.createGraphics(150, 92);
  g.clear();
  g.push();
  g.translate(75, 46);
  g.scale(1.35);
  g.noStroke();
  drawSimpleIcon(g, sp);
  g.pop();
  const url = g.elt.toDataURL();
  g.remove();
  return url;
}

function buildStore(p) {
  const store = document.getElementById('store');
  SPECIES.forEach((sp, i) => {
    let g = 0, y = 0, r = 0;
    for (let j = 0; j < SPECIES.length; j++) {
      if (j === i) continue;
      const v = compat(i, j);
      if (v === 'G') g++;
      else if (v === 'Y') y++;
      else r++;
    }
    const card = document.createElement('div');
    card.className = 'card';
    card.title = sp.name + ' — compatible with ' + g + ', maybe ' + y + ', conflicts with ' + r;
    const img = document.createElement('img');
    img.src = ICONS[i];
    img.alt = sp.name;
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = sp.name;
    const counts = document.createElement('div');
    counts.className = 'counts';
    counts.innerHTML = '<span><i class="g"></i>' + g + '</span><span><i class="y"></i>' + y + '</span><span><i class="r"></i>' + r + '</span>';
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(counts);
    card.addEventListener('mousedown', e => {
      e.preventDefault();
      startSpawn(i, e.clientX, e.clientY);
    });
    store.appendChild(card);
  });
}

const sketch = (p) => {
  p.setup = () => {
    const host = document.getElementById('tank-canvas');
    p.createCanvas(host.clientWidth, host.clientHeight).parent(host);
    canvasEl = p.canvas;
    window['_p'] = p;
    for (let i = 0; i < SPECIES.length; i++) ICONS.push(makeIcon(p, i));
    buildStore(p);
    updateHUD();
  };

  p.windowResized = () => {
    const host = document.getElementById('tank-canvas');
    p.resizeCanvas(host.clientWidth, host.clientHeight);
  };

  p.draw = () => {
    const t = p.millis() / 1000;
    drawWater(p, t);

    if (p.frameCount % 26 === 0 && Math.random() < 0.7) {
      const w = p.width, h = p.height;
      const px = [0.06, 0.115, 0.9, 0.955][Math.floor(Math.random() * 4)] * w;
      bubbles.push({ x: px + (Math.random() - 0.5) * 30, y: h * 0.9, r: 1.5 + Math.random() * 3, v: 0.5 + Math.random() * 0.9, wig: Math.random() * 10 });
    }

    if (!draggingFish && !hoverFish) {
      const seen = new Set();
      let idx = 0;
      for (let i = 0; i < fishes.length; i++) {
        for (let j = i + 1; j < fishes.length; j++) {
          if (compat(fishes[i].si, fishes[j].si) !== 'R') continue;
          const key = Math.min(i, j) + '-' + Math.max(i, j);
          if (seen.has(key)) continue;
          seen.add(key);
          const a = 95 + 45 * Math.sin(t * 3 + idx * 1.7);
          idx++;
          const ctx = p.drawingContext;
          p.push();
          p.stroke(204, 0, 0, a);
          p.strokeWeight(2.5);
          ctx.setLineDash([7, 7]);
          ctx.lineDashOffset = -t * 26;
          p.line(fishes[i].x, fishes[i].y, fishes[j].x, fishes[j].y);
          ctx.setLineDash([]);
          p.pop();
          drawWarn(p, (fishes[i].x + fishes[j].x) / 2, (fishes[i].y + fishes[j].y) / 2);
        }
      }
    }

    if (highlight) {
      const now = performance.now() / 1000;
      if (now > highlight.until) {
        highlight = null;
      } else {
        const fa = fishes.find(f2 => f2.si === highlight.a);
        const fb = fishes.find(f2 => f2.si === highlight.b);
        if (fa && fb && fa !== fb) {
          const pulse = 140 + 90 * Math.sin(now * 8);
          p.push();
          p.stroke(255, 255, 255, pulse);
          p.strokeWeight(3);
          p.line(fa.x, fa.y, fb.x, fb.y);
          p.noStroke();
          p.fill(255, 255, 255, pulse);
          p.ellipse(fa.x, fa.y, 8);
          p.ellipse(fb.x, fb.y, 8);
          p.pop();
        }
      }
    }

    p.push();
    p.noFill();
    p.stroke(255, 255, 255, 130);
    p.strokeWeight(1.2);
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.v;
      b.x += Math.sin(t * 3 + b.wig) * 0.35;
      p.ellipse(b.x, b.y, b.r * 2);
      if (b.y < p.height * 0.05) bubbles.splice(i, 1);
    }
    p.pop();

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      p.push();
      p.noFill();
      p.stroke(255, 255, 255, r.a);
      p.strokeWeight(1.6);
      p.ellipse(r.x, r.y, r.r * 2);
      p.pop();
      r.r += 2.4;
      r.a -= 6;
      if (r.a <= 0) ripples.splice(i, 1);
    }

    for (const f of fishes) {
      f.update(p, t);
      if (f !== draggingFish) f.draw(p, t, false);
    }

    if (draggingFish) {
      drawPairLines(p, draggingFish, t, 235);
      draggingFish.draw(p, t, overPanel());
      drawTally(p, draggingFish);
    } else if (hoverFish && fishes.length > 1) {
      drawPairLines(p, hoverFish, t, 150);
      drawTally(p, hoverFish);
    }

    if (fishes.length === 0) {
      p.push();
      p.fill(255, 255, 255, 110);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.textStyle(p.BOLD);
      p.text('Drag fish from the store into the tank', p.width / 2, p.height * 0.42);
      p.textStyle(p.NORMAL);
      p.textSize(12);
      p.fill(255, 255, 255, 75);
      p.text('Click a fish card to add it at random, or drag to place it', p.width / 2, p.height * 0.42 + 24);
      p.pop();
    }
  };

  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseY < 0 || p.mouseX > p.width || p.mouseY > p.height) return;
    const f = fishAt(p.mouseX, p.mouseY);
    if (f) {
      draggingFish = f;
      f.grabbed = true;
      f.grabDX = f.x - p.mouseX;
      f.grabDY = f.y - p.mouseY;
      hoverFish = null;
      document.body.classList.add('grabbing', 'remove-mode');
    } else {
      ripples.push({ x: p.mouseX, y: p.mouseY, r: 3, a: 140 });
    }
  };

  p.mouseDragged = () => {
    if (!draggingFish) return;
    const dx = p.mouseX - p.pmouseX;
    const dy = p.mouseY - p.pmouseY;
    if (dx * dx + dy * dy > 4) {
      draggingFish.a = lerpAngle(draggingFish.a, Math.atan2(dy, dx), 0.35);
    }
    draggingFish.x = Math.max(18, Math.min(p.width - 18, p.mouseX + draggingFish.grabDX));
    draggingFish.y = Math.max(16, Math.min(p.height - 16, p.mouseY + draggingFish.grabDY));
  };

  p.doubleClicked = () => {
    const f = fishAt(p.mouseX, p.mouseY);
    if (f) removeFish(f, true);
  };

  p.mouseMoved = () => {
    if (draggingFish) return;
    hoverFish = fishAt(p.mouseX, p.mouseY);
    p.canvas.style.cursor = hoverFish ? 'grab' : 'default';
  };
};

new p5(sketch);

document.addEventListener('mousemove', e => {
  lastClientX = e.clientX;
  lastClientY = e.clientY;
  if (spawn) {
    const dx = e.clientX - spawn.x0;
    const dy = e.clientY - spawn.y0;
    if (dx * dx + dy * dy > 49) spawn.moved = true;
    placeGhost(e.clientX, e.clientY);
  }
});

document.addEventListener('mouseup', e => {
  lastClientX = e.clientX;
  lastClientY = e.clientY;
  if (spawn) {
    const gh = document.getElementById('ghost');
    gh.hidden = true;
    document.body.classList.remove('grabbing');
    if (canvasEl) {
      const r = canvasEl.getBoundingClientRect();
      const inside = e.clientX > r.left + 8 && e.clientX < r.right - 8 && e.clientY > r.top + 8 && e.clientY < r.bottom - 8;
      const p5i = window['_p'];
      if (inside) {
        addFish(spawn.i, e.clientX - r.left, e.clientY - r.top);
      } else if (!spawn.moved) {
        const spot = randomSpot(spawn.i, p5i.width, p5i.height);
        addFish(spawn.i, spot.x, spot.y);
      }
    }
    spawn = null;
    return;
  }
  if (draggingFish) {
    const f = draggingFish;
    f.grabbed = false;
    draggingFish = null;
    document.body.classList.remove('grabbing', 'remove-mode');
    if (overPanel()) {
      removeFish(f, true);
    } else {
      const p5i = window['_p'];
      const [y0, y1] = bandFor(f.si, p5i.height);
      f.x = Math.max(30, Math.min(p5i.width - 30, f.x));
      f.y = Math.max(y0 - 10, Math.min(y1 + 10, f.y));
      ripples.push({ x: f.x, y: f.y, r: 4, a: 150 });
    }
  }
});

document.getElementById('clear').addEventListener('click', () => {
  while (fishes.length > 0) removeFish(fishes[fishes.length - 1], true);
});
