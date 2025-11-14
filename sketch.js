let max_height, max_width;

// for audio
let song;
let amp;
let fft;
let currentLevel = 0; // overall loudness-ish
let lowEnergy = 0;    // low freq (bass boom)
let highEnergy = 0;   // high freq (treble)


// background triangles color (will react to sound)
let triangleColor;

// stem S-shape wobble vars
let stemWavePhase = 0;       // phase for animation
let stemWaveSpeed = 0.12;    // how fast it wiggles
let stemWaveStrength = 0;    // how strong the wobble (linked to bass)


//load audio first
function preload() {
  song = loadSound('assets/jenZ.mp3'); // remember to put file there or it dies
}


// setup canvas
function setup() {
  max_height = windowHeight;
  max_width = windowWidth;
  createCanvas(max_width, max_height);

  stroke("#BC7653");
  strokeWeight(1);

  // play / pause button in HTML
  const btn = document.getElementById("play-pause");
  btn.addEventListener("click", () => {
    userStartAudio();
    if (song.isPlaying()) song.pause();
    else song.loop(); // I just loop it forever lol
  });

  // overall volume detector
  amp = new p5.Amplitude();
  amp.setInput(song);

  // frequency analyzer so we can get bass/treble
  fft = new p5.FFT(0.8, 1024);
  fft.setInput(song);

  colorMode(RGB);
}


//  main draw loop
function draw() {
  randomSeed(1); // keep bg pattern from going totally crazy every frame

  // ---- audio values ----
  currentLevel = amp ? amp.getLevel() : 0;

  fft.analyze();
  lowEnergy = fft.getEnergy("bass");       // bass part
  highEnergy = fft.getEnergy("treble");    // high part

  let bassNorm = map(lowEnergy, 0, 255, 0, 1);
  let trebleNorm = map(highEnergy, 0, 255, 0, 1);

  // bg color = warm <-> cool depends on sound
  const warmCol = color("#BC7653");
  const coolCol = color("#4B6CD8");
  let tCol = constrain(map(highEnergy - lowEnergy, -80, 80, 0, 1), 0, 1);
  triangleColor = lerpColor(warmCol, coolCol, tCol);

  // tiny brightness change with bass (so it “breathes”)
  let bgBase = map(bassNorm, 0, 1, 7, 20);
  background(bgBase);

  // whole background shaking with bass
  let shakeAmount = map(bassNorm, 0, 1, 0, 30);
  let shakeX = sin(frameCount * 0.08) * shakeAmount;
  let shakeY = cos(frameCount * 0.11) * shakeAmount * 0.5;

  push();
  translate(shakeX, shakeY);

  drawBackgroundTriangles();
  pop();

  // draw the mushroom 
  push();

  const s = min(width, height) / 1200;
  translate(width / 2, height * 0.9);
  scale(s);

  //  mushroom moving accroding bass 
  let breathScale = map(bassNorm, 0, 1, 0.96, 1.12);
  scale(breathScale);

  // stem S-shape wobble, also bass-driven 
  stemWavePhase += stemWaveSpeed;
  stemWaveStrength = lerp(stemWaveStrength, bassNorm * 35, 0.15);
  
  drawStemUniform();  // stem + red dots inside, all warped
  drawCapReplica(0, -650, 880, 360); // big hat

  pop();
}



//  background triangles
function drawBackgroundTriangles() {
  const density = 40;
  const gap = max(max_width, max_height) / density;
  const lines = [];
  let odd = false;

  // make a noisy grid of points
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

  // connect them into triangles (zigzag style)
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


//  single triangle (wobbly edges) 
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


//  mushroom S-shape warp
// change stem x position so it swings
function stemWarpX(y, originalX) {
  // y: from -H (top) to 0 (bottom)
  // closer to top = softer jelly; bottom = more stable
  let norm = map(y, -680, 0, 0, 1);  

  let wave = sin(stemWavePhase + norm * 6.0); // how many waves along stem
  let sway = wave * stemWaveStrength * pow(norm, 0.25);

  return originalX + sway;
}



// stem (red dots + wobble + clipping)
function drawStemUniform() {
  const H = 680;
  const topW = 120;
  const botW = 230;

  // 1. draw white stem shape using sample points
  noStroke();
  fill("#FFF7F4");

  beginShape();
  // go from top(-H) to bottom(0) to draw left side
  for (let ty = 0; ty <= 1.001; ty += 0.02) {
    let y = -H * ty;
    let half = lerp(topW * 0.5, botW * 0.5, ty);
    let left = -half;
    left = stemWarpX(y, left);   // left edge also wobbles
    vertex(left, y);
  }
  // then go back from bottom to top for right side
  for (let ty = 1; ty >= -0.001; ty -= 0.02) {
    let y = -H * ty;
    let half = lerp(topW * 0.5, botW * 0.5, ty);
    let right = half;
    right = stemWarpX(y, right); // same wobble for right edge
    vertex(right, y);
  }
  endShape(CLOSE);

  //  use same outline as a clipping mask (so red dots stay inside)
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();

  let first = true;
  // left outline
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
  // right outline
  for (let ty = 1; ty >= -0.001; ty -= 0.02) {
    let y = -H * ty;
    let half = lerp(topW * 0.5, botW * 0.5, ty);
    let right = half;
    right = stemWarpX(y, right);
    ctx.lineTo(right, y);
  }

  ctx.closePath();
  ctx.clip();

  //  draw red dots inside the stem (size + alpha linked to volume)
  const levelFactor = map(currentLevel, 0, 0.35, 0.8, 1.8);
  const alphaBoost  = map(currentLevel, 0, 0.35, 140, 255);

  noStroke();
  fill(196, 22, 43, alphaBoost);

  const rows = 56;
  const sideCols = 8;
  const stepX = 22;

  let colXs = [0]; // center column
  for (let i = 1; i <= sideCols; i++) {
    colXs.push(i * stepX, -i * stepX); // left/right
  }

  for (let c of colXs) {
    let isCenter = (c === 0);
    for (let j = 0; j < rows; j++) {
      let y = map(j, 0, rows - 1, -H, 0); // from top to bottom
      let x = stemWarpX(y, c);            // column also wobbles

      let d = (isCenter ? 12 : 7) * levelFactor;
      circle(x, y, d);
    }
  }

  ctx.restore();
}




//cap (the mushroom hat) 
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

  // slight bending on Y so it’s not too flat
  function yBend(a) {
    const u = (a - aStart) / (aEnd - aStart);
    const t = u * 2 - 1;
    return -bendAmp * (1 - t * t) + bendTilt * t;
  }

  // wavy red rim
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


  // yellow main body of cap
  noStroke();
  fill("#F3D225");
  beginShape();
  for (const p of upper) vertex(p.x, p.y);
  for (const p of lower) vertex(p.x, p.y);
  endShape(CLOSE);

  // use yellow outline as clip for inner details
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(upper[0].x, upper[0].y);
  for (let i = 1; i < upper.length; i++) ctx.lineTo(upper[i].x, upper[i].y);
  for (let i = 0; i < lower.length; i++) ctx.lineTo(lower[i].x, lower[i].y);
  ctx.closePath();
  ctx.clip();

  // draw yellow seams lines
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

  // purple dot rings
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

  // tiny dots along bottom edge
  noStroke();
  fill("#7C3A6B");
  for (let i = 0; i < lower.length; i += 8) {
    const p = lower[i];
    circle(p.x, p.y - 3, 1);
  }

  // dots along top inner part
  let rr = H * 0.16, dots = 14;
  for (let k = 0; k < dots; k++) {
    let a = lerp(aStart + 0.02, aEnd - 0.02, k / dots);
    let x = cx + (rr * cos(a)) * (W / H) * 0.46;
    let y = cy + rr * sin(a) * 0.46 + yBend(a);
    circle(x, y, 10);
  }
  ctx.restore();

  // red rim on the top
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

  // white beans on the cap
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



//fix window resize
function windowResized() {
  max_height = windowHeight;
  max_width = windowWidth;
  resizeCanvas(windowWidth, windowHeight);
}
