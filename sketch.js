// =============== 全局变量 ===============
let max_height, max_width;

// 音频相关
let song;
let amp;
let fft;
let currentLevel = 0; // 振幅（整体音量）
let lowEnergy = 0;    // 低频能量（bass）
let highEnergy = 0;   // 高频能量（treble）

// 背景三角的颜色（会随高低频变化）
let triangleColor;

// 柄体 S 形扭动参数
let stemWavePhase = 0;       // 波相位（动画）
let stemWaveSpeed = 0.12;    // 速度
let stemWaveStrength = 0;    // 扭动强度（随 bass）


// =============== 预加载音频 ===============
function preload() {
  song = loadSound('assets/jenZ.mp3');
}


// =============== 初始化 ===============
function setup() {
  max_height = windowHeight;
  max_width = windowWidth;
  createCanvas(max_width, max_height);

  stroke("#BC7653");
  strokeWeight(1);

  // ===== 点击按钮控制音频 =====
  const btn = document.getElementById("play-pause");
  btn.addEventListener("click", () => {
    userStartAudio();
    if (song.isPlaying()) song.pause();
    else song.loop();
  });

  // 音量
  amp = new p5.Amplitude();
  amp.setInput(song);

  // 频谱
  fft = new p5.FFT(0.8, 1024);
  fft.setInput(song);

  colorMode(RGB);
}


// =============== 主绘制循环 ===============
function draw() {
  randomSeed(1); // 稳定背景结构

  // ---- 音频分析 ----
  currentLevel = amp ? amp.getLevel() : 0;

  fft.analyze();
  lowEnergy = fft.getEnergy("bass");       // 低频
  highEnergy = fft.getEnergy("treble");    // 高频

  let bassNorm = map(lowEnergy, 0, 255, 0, 1);
  let trebleNorm = map(highEnergy, 0, 255, 0, 1);

  // ---- 背景颜色随频率变化 ----
  const warmCol = color("#BC7653");
  const coolCol = color("#4B6CD8");
  let tCol = constrain(map(highEnergy - lowEnergy, -80, 80, 0, 1), 0, 1);
  triangleColor = lerpColor(warmCol, coolCol, tCol);

  // ---- 背景亮度随 bass 微变 ----
  let bgBase = map(bassNorm, 0, 1, 7, 20);
  background(bgBase);

  // ---- 背景整体震动（低频驱动）----
  let shakeAmount = map(bassNorm, 0, 1, 0, 30);
  let shakeX = sin(frameCount * 0.08) * shakeAmount;
  let shakeY = cos(frameCount * 0.11) * shakeAmount * 0.5;

  push();
  translate(shakeX, shakeY);

  drawBackgroundTriangles();
  pop();

  // ================== 绘制蘑菇 ==================
  push();

  const s = min(width, height) / 1200;
  translate(width / 2, height * 0.9);
  scale(s);

  // === 整体呼吸效果（bass 驱动） ===
  let breathScale = map(bassNorm, 0, 1, 0.96, 1.12);
  scale(breathScale);

  // === 柄体 S 形扭动（bass 驱动） ===
  stemWavePhase += stemWaveSpeed;
  stemWaveStrength = lerp(stemWaveStrength, bassNorm * 35, 0.15);
  // 说明：
  // 数字 35 = "B 强度选择 B（明显摇摆）" 的数值

  drawStemUniform();  // ← 柄体 + 红点由内部使用扭动函数
  drawCapReplica(0, -650, 880, 360);

  pop();
}



// =============== 背景三角形 =================
function drawBackgroundTriangles() {
  const density = 40;
  const gap = max(max_width, max_height) / density;
  const lines = [];
  let odd = false;

  for (let y = 0; y <= max_height + gap; y += gap) {
    odd = !odd;
    const row = [];
    const oddFactor = odd ? gap / 2 : 0;

    for (let x = 0; x <= max_width + gap; x += gap) {
      row.push({
        x: x + (random() * 0.8 - 0.4) * gap + oddFactor,
        y: y + (random() * 0.8 - 0.4) * gap
      });
    }
    lines.push(row);
  }

  odd = true;
  for (let y = 0; y < lines.length - 1; y++) {
    odd = !odd;
    const dotLine = [];
    for (let i = 0; i < lines[y].length; i++) {
      dotLine.push(odd ? lines[y][i] : lines[y + 1][i]);
      dotLine.push(odd ? lines[y + 1][i] : lines[y][i]);
    }
    for (let i = 0; i < dotLine.length - 2; i++) {
      drawTriangle(dotLine[i], dotLine[i + 1], dotLine[i + 2]);
    }
  }
}


// =============== 三角形绘制（颜色已被音频驱动） ===============
function drawTriangle(a, b, c) {
  fill(triangleColor);
  stroke(triangleColor);

  bezier(a.x, a.y,
    (a.x + b.x) / 2 + random(-2, 2), (a.y + b.y) / 2 + random(-5, 5),
    (a.x + b.x) / 2 + random(-2, 2), (a.y + b.y) / 2 + random(-5, 5),
    b.x, b.y);

  bezier(b.x, b.y,
    (b.x + c.x) / 2 + random(-2, 2), (b.y + c.y) / 2 + random(-5, 5),
    (b.x + c.x) / 2 + random(-2, 2), (b.y + c.y) / 2 + random(-5, 5),
    c.x, c.y);

  bezier(c.x, c.y,
    (c.x + a.x) / 2 + random(-2, 2), (c.y + a.y) / 2 + random(-5, 5),
    (c.x + a.x) / 2 + random(-2, 2), (c.y + a.y) / 2 + random(-5, 5),
    a.x, a.y);

  fill("#070C08");
  stroke(triangleColor);
  beginShape();
  vertex(a.x, a.y);
  vertex(b.x, b.y);
  vertex(c.x, c.y);
  endShape(CLOSE);
}
// =============== S 型扭动函数（核心） ===============
// 让柄体的 x 值左右摆动
function stemWarpX(y, originalX) {
  // y 从 -H（顶部）到 0（底部）
  let norm = map(y, -680, 0, 0, 1);  
  // norm 越靠近 1 → 越接近底部 → Deform 越弱
  // norm 越靠近 0 → 越接近上部 → Deform 越强（像软体）

  let wave = sin(stemWavePhase + norm * 6.0); // 波段数量
  let sway = wave * stemWaveStrength * pow(norm, 0.25);

  return originalX + sway;
}



/* ====================== 伞柄（红点 + S 型扭动 + 正确剪裁） ====================== */
function drawStemUniform() {
  const H = 680;
  const topW = 120;
  const botW = 230;

  // -------- 1. 白色柄体：用采样点 + 扭动来画轮廓 --------
  noStroke();
  fill("#FFF7F4");

  beginShape();
  // 上半边：从顶部(-H)一路走到底(0)，画左边轮廓
  for (let ty = 0; ty <= 1.001; ty += 0.02) {
    let y = -H * ty;
    let half = lerp(topW * 0.5, botW * 0.5, ty);
    let left = -half;
    left = stemWarpX(y, left);   // 左边经过 S 型扭动
    vertex(left, y);
  }
  // 下半边：从底部回到顶部，画右边轮廓
  for (let ty = 1; ty >= -0.001; ty -= 0.02) {
    let y = -H * ty;
    let half = lerp(topW * 0.5, botW * 0.5, ty);
    let right = half;
    right = stemWarpX(y, right); // 右边也扭动
    vertex(right, y);
  }
  endShape(CLOSE);

  // -------- 2. 用同一套轮廓做剪裁路径（保证红点不会跑出去） --------
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();

  let first = true;
  // 左边轮廓
  for (let ty = 0; ty <= 1.001; ty += 0.02) {
    let y = -H * ty;
    let half = lerp(topW * 0.5, botW * 0.5, ty);
    let left = -half;
    left = stemWarpX(y, left);
    if (first) {
      ctx.moveTo(left, y);
      first = false;
    } else {
      ctx.lineTo(left, y);
    }
  }
  // 右边轮廓
  for (let ty = 1; ty >= -0.001; ty -= 0.02) {
    let y = -H * ty;
    let half = lerp(topW * 0.5, botW * 0.5, ty);
    let right = half;
    right = stemWarpX(y, right);
    ctx.lineTo(right, y);
  }

  ctx.closePath();
  ctx.clip();

  // -------- 3. 在剪裁范围内画红色圆点（依旧跟音量联动） --------
  const levelFactor = map(currentLevel, 0, 0.35, 0.8, 1.8);
  const alphaBoost  = map(currentLevel, 0, 0.35, 140, 255);

  noStroke();
  fill(196, 22, 43, alphaBoost);

  const rows = 56;
  const sideCols = 8;
  const stepX = 22;

  let colXs = [0];
  for (let i = 1; i <= sideCols; i++) {
    colXs.push(i * stepX, -i * stepX);
  }

  for (let c of colXs) {
    let isCenter = (c === 0);
    for (let j = 0; j < rows; j++) {
      let y = map(j, 0, rows - 1, -H, 0); // 从顶部到柄底
      let x = stemWarpX(y, c);            // 列的 x 同样扭动

      let d = (isCenter ? 12 : 7) * levelFactor;
      circle(x, y, d);
    }
  }

  ctx.restore();
}




// ================== 伞盖（完整不变） ==================
function drawCapReplica(cx, cy, W, H) {
  const rimThk = 54;
  const topW = W * 1.05, topH = H * 0.95;
  const innerW = topW - rimThk * 2, innerH = topH - rimThk * 2;

  const aStart = PI + 0.04;
  const aEnd   = TWO_PI - 0.04;
  const step   = 0.012;

  const offsetDown = 56;
  const bumpAmp    = 105;
  const upperLift  = -16;
  const joinDip    = 55;
  const joinSigma  = 0.20;

  const edgeWin = 0.14;
  const len = aEnd - aStart;
  const smooth = t => t * t * (3 - 2 * t);

  const bendAmp  = 18;
  const bendTilt = 0;

  function yBend(a) {
    const u = (a - aStart) / (aEnd - aStart);
    const t = u * 2 - 1;
    return -bendAmp * (1 - t * t) + bendTilt * t;
  }

  function rimWave(a) {
    const u = (a - aStart) / (aEnd - aStart);
    const t = u * 2 - 1;

    let bigWave   = -20 * sin(u * PI * 1.1);
    let centerDip =  8 * exp(-(t * t) / (2 * 0.35 * 0.35));
    let tinyNoise =  3 * sin(u * PI * 6.0);

    return bigWave - centerDip + tinyNoise;
  }

  let upper = [];
  for (let a = aStart; a <= aEnd; a += step) {
    upper.push(createVector(
      cx + (innerW * 0.5) * cos(a),
      cy + upperLift + (innerH * 0.5) * sin(a) + yBend(a)
    ));
  }

  let lower = [];
  const loW = W * 0.52;
  const loH = H * 0.44;

  const wave1 = 32, wave2 = 14, bumpSharp = 2.6, sideTuck = -6;

  for (let a = aEnd; a >= aStart; a -= step) {
    const tMid = (a - aStart) / len;

    const wL = smooth(constrain(tMid / edgeWin, 0, 1));
    const wR = smooth(constrain((1 - tMid) / edgeWin, 0, 1));
    const w  = min(wL, wR);

    const tt = map(a, PI, TWO_PI, -1, 1);
    const base  = loH * sin(a);
    const droop = (
      wave1 * sin(a * 5.0) +
      wave2 * sin(a * 9.0) +
      offsetDown +
      bumpAmp * exp(-bumpSharp * tt * tt) +
      sideTuck * cos(2 * a) +
      joinDip * exp(-(tt * tt) / (2 * joinSigma * joinSigma))
    );

    const edgeLift = 20 * (1 - sin(tMid * PI));

    const x = cx + loW * cos(a);
    const y = cy + base + w * droop + yBend(a) - edgeLift;

    lower.push(createVector(x, y));
  }


  // 黄色主体
  noStroke();
  fill("#F3D225");
  beginShape();
  for (const p of upper) vertex(p.x, p.y);
  for (const p of lower) vertex(p.x, p.y);
  endShape(CLOSE);

  // 用黄色轮廓裁剪纹理
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(upper[0].x, upper[0].y);
  for (let i = 1; i < upper.length; i++) ctx.lineTo(upper[i].x, upper[i].y);
  for (let i = 0; i < lower.length; i++) ctx.lineTo(lower[i].x, lower[i].y);
  ctx.closePath();
  ctx.clip();

  // 黄色缝线放射线
  stroke("#E7BA0E");
  strokeWeight(3);
  for (let i = 0; i < 17; i++) {
    let a = lerp(aStart, aEnd, i / 16), prev = null;
    for (let s = 0; s < 32; s++) {
      let r = lerp(H * 0.02, H * 0.90, s / 31);
      let x = cx + (r * cos(a)) * (W / H) * 0.46;
      let y = cy + r * sin(a) * 0.46 + 3 * sin(s * 0.6 + i * 0.4) + yBend(a);
      if (prev) line(prev.x, prev.y, x, y);
      prev = createVector(x, y);
    }
  }

  // 紫点弧圈
  noStroke();
  fill("#7C3A6B");

  const rings = 20;
  for (let r = 0; r < rings; r++) {
    let t = r / (rings - 1);
    let rr = lerp(H * 0.2, H * 1.6, t);
    let dots = int(lerp(22, 56, t));

    for (let k = 0; k < dots; k++) {
      let a = lerp(aStart - 0.04, aEnd + 0.04, k / dots);

      let x = cx + (rr * cos(a)) * (W / H) * 0.46;
      let y = cy + rr * sin(a) * 0.95
                + 2.2 * sin(k * 0.7 + r * 0.95)
                + yBend(a);

      let d = lerp(16, 7.5, t) * (0.92 + 0.14 * noise(r * 0.3, k * 0.6));
      circle(x, y, d);
    }
  }

  // 下缘补点
  noStroke();
  fill("#7C3A6B");
  for (let i = 0; i < lower.length; i += 8) {
    const p = lower[i];
    circle(p.x, p.y - 3, 1);
  }

  // 顶沿补点
  let rr = H * 0.16, dots = 14;
  for (let k = 0; k < dots; k++) {
    let a = lerp(aStart + 0.02, aEnd - 0.02, k / dots);
    let x = cx + (rr * cos(a)) * (W / H) * 0.46;
    let y = cy + rr * sin(a) * 0.46 + yBend(a);
    circle(x, y, 10);
  }
  ctx.restore();

  // 红顶边
  noStroke();
  fill("#D81E25");
  beginShape();
  for (let a = aStart - 0.02; a <= aEnd + 0.02; a += step) {
    vertex(
      cx + (topW * 0.5) * cos(a),
      cy - 6 + (topH * 0.5) * sin(a) + yBend(a) + rimWave(a)
    );
  }
  for (let a = aEnd; a >= aStart; a -= step) {
    vertex(
      cx + (innerW * 0.5) * cos(a),
      cy - 6 + (innerH * 0.5) * sin(a) + yBend(a)
    );
  }
  endShape(CLOSE);

  // 白豆点
  ctx.save();
  ctx.beginPath();
  for (let a = aStart; a <= aEnd; a += step) {
    ctx.lineTo(
      cx + (topW * 0.5) * cos(a),
      cy - 6 + (topH * 0.5) * sin(a) + yBend(a) + rimWave(a)
    );
  }
  for (let a = aEnd; a >= aStart; a -= step) {
    ctx.lineTo(
      cx + (innerW * 0.5) * cos(a),
      cy - 6 + (innerH * 0.5) * sin(a) + yBend(a)
    );
  }
  ctx.closePath();
  ctx.clip();

  fill(255);
  const beans = 22;
  for (let i = 0; i < beans; i++) {
    const a = lerp(aStart + 0.03, aEnd - 0.03, i / (beans - 1));
    const rx = ((topW + innerW) / 4) * cos(a);
    const ry = ((topH + innerH) / 4) * sin(a);
    const midWave = rimWave(a) * 0.5;

    push();
    translate(cx + rx, cy - 6 + ry + yBend(a) + midWave);
    rotate(random(-0.35, 0.35));
    ellipse(0, 0, random(26, 44), random(16, 26));
    pop();
  }
  ctx.restore();
}



// =============== 自适应画布 ===============
function windowResized() {
  max_height = windowHeight;
  max_width = windowWidth;
  resizeCanvas(windowWidth, windowHeight);
}
