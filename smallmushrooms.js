let mushrooms = [];

// Cap Pattern
const CAP_PATTERN = {
  NONE: "none",
  // Non-overlapping circles in multiple colors
  CIRCLES_MULTI: "circles_multi",
  // Noisy rings around a central ellipse
  NOISY_RINGS: "noisy_rings",
  // Larger circles with optional smaller nested circles
  NESTED: "nested",
  // Non-overlapping circles in one color
  CIRCLES_MONO: "circles_mono"
};

// Stem Pattern
const STEM_PATTERN = {
  NONE: "none",
  // Voronoi polygon texture
  VORONOI: "voronoi_cells",
  // Dot patterns on multiple vertical tracks
  DOT_TRACKS: "dot_tracks",
  // Random dots with size gradient from top to bottom
  DOT_GRADIENT: "dot_gradient"
};

// Base Pattern
const BASE_PART_PATTERN = {
  NONE: "none",
  // Circular tracks in a single color
  TRACKS_MONO: "tracks_mono",
  // Circular tracks with alternating colors
  TRACKS_ALT:  "tracks_alt"
};

//Clip Tool
function withClip(areaPathFn, painterFn) {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  areaPathFn(ctx);
  ctx.clip();
  painterFn();
  ctx.restore();
}

//Calculate the smallest rectangle that completely encloses a polygon
function boundingBox(poly) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of poly) {
    minx = min(minx, p.x); maxx = max(maxx, p.x);
    miny = min(miny, p.y); maxy = max(maxy, p.y);
  }
  return { minx, miny, maxx, maxy };
}

//PatternPainter
const PatternPainter = {
  paint(type, deps, opt = {}) {
    // NONE: No pattern
    if (!type || type === CAP_PATTERN.NONE || type === STEM_PATTERN.NONE || type === BASE_PART_PATTERN.NONE) return;

    //For Cap patterns
    // CIRCLES_MULTI: Non-overlapping circles in multiple colors
    if (type === CAP_PATTERN.CIRCLES_MULTI) {
      return this.circles(deps, Object.assign({}, opt, { mono: false }));
    }
    // CIRCLES_MONO: Non-overlapping circles in one color
    if (type === CAP_PATTERN.CIRCLES_MONO) {
      return this.circles(deps, Object.assign({}, opt, { mono: true }));
    }
    // NESTED: Larger circles with optional smaller nested circles
    if (type === CAP_PATTERN.NESTED) {
      return this.nested(deps, opt);
    }
    // NOISY_RINGS: A central ellipse with multiple noisy ring layers
    if (type === CAP_PATTERN.NOISY_RINGS) {
      return this.noisyRings(deps, opt);
    }

    //For Base patterns
    // TRACKS_MONO: Circular tracks in a single color
    if (type === BASE_PART_PATTERN.TRACKS_MONO) {
      return this.baseTracks(deps, Object.assign({}, opt, { alt: false }));
    }
    //TRACKS_ALT: Circular tracks with alternating colors
    if (type === BASE_PART_PATTERN.TRACKS_ALT) {
      return this.baseTracks(deps, Object.assign({}, opt, { alt: true }));
    }

    //For Stem patterns
    // VORONOI: Voronoi polygon texture
    if (type === STEM_PATTERN.VORONOI) {
      return this.stemVoronoi(deps, opt);
    }
    // DOT_TRACKS: Dot patterns on multiple vertical tracks
    if (type === STEM_PATTERN.DOT_TRACKS) {
      return this.stemDotTracks(deps, opt);
    }
    // DOT_GRADIENT: Random dots with size gradient from top to bottom
    if (type === STEM_PATTERN.DOT_GRADIENT) {
      return this.stemDotGradient(deps, opt);
    }
  },

  //For Cap patterns CIRCLES_MULTI and CIRCLES_MONO
// For Cap patterns CIRCLES_MULTI and CIRCLES_MONO
circles(deps, cfg) {
  const poly = deps.poly;
  const rx = deps.rx || (deps.w ? deps.w * 0.5 : 40);
  const accent1_default = deps.accent1 || color(0, 0, 0);
  const accent2_default = deps.accent2 || color(0, 0, 100);

  // --- Added: allow opt to override accent1 / accent2 ---
  let accent1 = accent1_default;
  let accent2 = accent2_default;

  if (cfg.accent1) {
    accent1 = color(
      cfg.accent1.h,
      cfg.accent1.s,
      cfg.accent1.b,
      cfg.accent1.a != null ? cfg.accent1.a : 100
    );
  }
  if (cfg.accent2) {
    accent2 = color(
      cfg.accent2.h,
      cfg.accent2.s,
      cfg.accent2.b,
      cfg.accent2.a != null ? cfg.accent2.a : 100
    );
  }

  // --- circle placement parameters ---
  let placed = [];
  let count = 0;
  const bb = boundingBox(poly);

  const minR   = cfg.minR   != null ? cfg.minR   : rx * 0.03;
  const maxR   = cfg.maxR   != null ? cfg.maxR   : rx * 0.08;
  const tries  = cfg.tries  != null ? cfg.tries  : 1200;
  const maxCount = cfg.maxCount != null ? cfg.maxCount : 100;
  const gap    = cfg.gap    != null ? cfg.gap    : rx * 0.03;

  // --- main loop: random placement of circles ---
  for (let i = 0; i < tries && count < maxCount; i++) {

    // pick a random point
    const c = createVector(random(bb.minx, bb.maxx), random(bb.miny, bb.maxy));
    const r = random(minR, maxR);

    // avoid overlaps
    let ok = true;
    for (let e of placed) {
      if (p5.Vector.dist(c, e.c) < (r + e.r + gap)) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    // --- draw ---
    noStroke();
    if (cfg.mono) {
      fill(accent1);          // Mono: use accent1 for all
    } else {
      fill(random([accent1, accent2]));  // Multi: random accent1 / accent2
    }
    circle(c.x, c.y, 2 * r);

    placed.push({ c, r });
    count++;
  }
}
,

//For Cap pattern NESTED
nested(deps, cfg = {}) {
  const poly = deps.poly;
  const rx = deps.rx || (deps.w ? deps.w * 0.5 : 40);

  // Previously used deps.accent1/2; now support cfg overrides
  let accent1 = deps.accent1 || color(0, 0, 0);
  let accent2 = deps.accent2 || color(0, 0, 100);

  // Allow overriding colors via cfg.accent1 / cfg.accent2
  if (cfg.accent1) {
    accent1 = color(
      cfg.accent1.h,
      cfg.accent1.s,
      cfg.accent1.b,
      cfg.accent1.a != null ? cfg.accent1.a : 100
    );
  }
  if (cfg.accent2) {
    accent2 = color(
      cfg.accent2.h,
      cfg.accent2.s,
      cfg.accent2.b,
      cfg.accent2.a != null ? cfg.accent2.a : 100
    );
  }

  let placed = [];
  let count = 0;
  const bb = boundingBox(poly);

  const minR = cfg.minR != null ? cfg.minR : rx * 0.028;
  const maxR = cfg.maxR != null ? cfg.maxR : rx * 0.11;
  const tries = cfg.tries != null ? cfg.tries : 1200;
  const maxCount = cfg.maxCount != null ? cfg.maxCount : 145;
  const nestProb = cfg.nestProb != null ? cfg.nestProb : 0.45;

  for (let i = 0; i < tries && count < maxCount; i++) {
    const c = createVector(random(bb.minx, bb.maxx), random(bb.miny, bb.maxy));
    const r = random(minR, maxR);

    let ok = true;
    for (const e of placed) {
      if (p5.Vector.dist(c, e.c) < (r + e.r + rx * 0.01)) { ok = false; break; }
    }
    if (!ok) continue;

    noStroke();
    // Outer circle: accent1
    fill(accent1);
    circle(c.x, c.y, r * 2);

    // Inner nested circle: accent2
    if (random() < nestProb) {
      fill(accent2);
      const rr = r * random(0.4, 0.6);
      circle(c.x, c.y, rr * 2);
    }

    placed.push({ c, r });
    count++;
  }
}
,

// For Cap pattern NOISY_RINGS
noisyRings(deps, cfg = {}) {
  const topPts = deps.topPts || [];
  if (!topPts.length) return;

  const center = cfg.center || topPts[floor(topPts.length / 2)];
  noStroke();

  // First check cfg.ringColor; use it if provided, otherwise randomize
  let ringColor;
  if (cfg.ringColor) {
    if (cfg.ringColor instanceof p5.Color) {
      ringColor = cfg.ringColor;
    } else {
      ringColor = color(
        cfg.ringColor.h,
        cfg.ringColor.s,
        cfg.ringColor.b,
        cfg.ringColor.a != null ? cfg.ringColor.a : 100
      );
    }
  } else {
    ringColor = color(
      random(360),
      random(40, 85),
      random(40, 90)
    );
  }

  fill(ringColor);

  const ellW = random(
    (cfg.ellWRange && cfg.ellWRange[0]) != null ? cfg.ellWRange[0] : 60,
    (cfg.ellWRange && cfg.ellWRange[1]) != null ? cfg.ellWRange[1] : 160
  );
  const ellH = ellW * random(
    (cfg.ellAspectRange && cfg.ellAspectRange[0]) != null ? cfg.ellAspectRange[0] : 0.3,
    (cfg.ellAspectRange && cfg.ellAspectRange[1]) != null ? cfg.ellAspectRange[1] : 0.65
  );
  ellipse(center.x, center.y, ellW, ellH);

  const ellipseOuter = max(ellW, ellH) * 0.5;
  const ringCount = floor(random(
    (cfg.ringCountRange && cfg.ringCountRange[0]) != null ? cfg.ringCountRange[0] : 5,
    (cfg.ringCountRange && cfg.ringCountRange[1]) != null ? cfg.ringCountRange[1] : 9
  ));
  const ringGap = cfg.ringGap != null ? cfg.ringGap : 22;
  const gapArc = cfg.gapArc != null ? cfg.gapArc : 6;

  let rings = [];
  rings[0] = ellipseOuter + ringGap + random(5, 10);
  for (let i = 1; i < ringCount; i++) {
    rings[i] = rings[i - 1] + ringGap + random(8, 14);
  }

  const innerMax  = (cfg.innerMax  != null ? cfg.innerMax  : 30) * 1.25;
  const innerMin  = (cfg.innerMin  != null ? cfg.innerMin  : 16) * 1.10;
  const outerMax  = (cfg.outerMax  != null ? cfg.outerMax  : 12) * 0.60;
  const outerMin  = (cfg.outerMin  != null ? cfg.outerMin  : 6)  * 0.45;
  const noiseFreq = cfg.noiseFreq != null ? cfg.noiseFreq : random(0.6, 1.2);
  const noiseBase = floor(random(1e6));

  for (let idx = 0; idx < rings.length; idx++) {
    const r0 = rings[idx];
    let th = 0;
    let firstD = null;

    const t = idx / max(1, (rings.length - 1));
    const maxD = lerp(innerMax, outerMax, t);
    const minD = lerp(innerMin, outerMin, t);

    while (th < TWO_PI) {
      const n = noise(
        noiseBase + idx * 7777 + cos(th) * noiseFreq,
        noiseBase + idx * 7777 + sin(th) * noiseFreq
      );
      let d = map(n, 0, 1, minD, maxD);

      if (firstD === null) firstD = d;
      else {
        const need = (d + firstD + gapArc) / r0;
        if (TWO_PI - th < need) break;
      }

      const x = center.x + r0 * cos(th);
      const y = center.y + r0 * sin(th);
      circle(x, y, d);

      th += max((d + gapArc) * 1.04 / r0, 0.004);
    }
  }
}
,

// For Base patterns TRACKS_MONO and TRACKS_ALT
baseTracks(deps, cfg = {}) {
  const poly = deps.poly;
  const bb = boundingBox(poly);

  const center = deps.center
    ? (deps.center.copy ? deps.center.copy() : createVector(deps.center.x, deps.center.y))
    : createVector((bb.minx + bb.maxx) * 0.5, bb.maxy);

  let maxR = 0;
  for (const p of poly) {
    maxR = max(maxR, p5.Vector.dist(center, p));
  }

  const trackAngleStep   = radians(10);          // Angle step for each track
  const angleStart       = PI;
  const angleEnd         = TWO_PI;
  const circlesPerTrack  = 12;                   // Number of points per track
  const circleDiameter   = maxR * 0.03;          // diameter of points
  const radialStep       = maxR / (circlesPerTrack + 1);

  const useAlt = !!cfg.alt;  // true = alternate between two colors

  noStroke();
  push();

  // Default two track colors
  const c1_default = color(50, 63, 46);
  const c2_default = color(126, 22, 89);

  // Allow overriding via cfg.accent1 / cfg.accent2
  let c1 = c1_default;
  let c2 = c2_default;

  if (cfg.accent1) {
    if (cfg.accent1 instanceof p5.Color) {
      c1 = cfg.accent1;
    } else {
      c1 = color(
        cfg.accent1.h,
        cfg.accent1.s,
        cfg.accent1.b,
        cfg.accent1.a != null ? cfg.accent1.a : 100
      );
    }
  }

  if (cfg.accent2) {
    if (cfg.accent2 instanceof p5.Color) {
      c2 = cfg.accent2;
    } else {
      c2 = color(
        cfg.accent2.h,
        cfg.accent2.s,
        cfg.accent2.b,
        cfg.accent2.a != null ? cfg.accent2.a : 100
      );
    }
  }

  let trackIndex = 0;
  for (let angle = angleStart; angle <= angleEnd + 1e-6; angle += trackAngleStep) {

    // Mono: all c1; Alt: tracks alternate between c1 and c2
    const trackColor = useAlt
      ? (trackIndex % 2 === 0 ? c1 : c2)
      : c1;

    fill(trackColor);

    for (let i = 1; i <= circlesPerTrack; i++) {
      const r = radialStep * i;
      const x = center.x + r * cos(angle);
      const y = center.y + r * sin(angle);
      circle(x, y, circleDiameter);
    }

    trackIndex++;
  }

  pop();
},

  // Fpr Stem pattern VORONOI
  // depend on p5.voronoi library
stemVoronoi(deps, opt = {}) {
  const poly = deps.poly;
  if (!poly || !poly.length) return;

  const bb = boundingBox(poly);
  const w = bb.maxx - bb.minx;
  const h = bb.maxy - bb.miny;
  if (w <= 0 || h <= 0) return;

  const siteCount = opt.siteCount ?? 80;
  const noiseFreq = opt.noiseFreq ?? 0.02;
  const satRange  = opt.satRange  ?? 10;
  const briRange  = opt.briRange  ?? 10;

  //Funtion to convert color input to p5.Color
  function toP5Color(c, fallback) {
    if (!c) return fallback;
    // If it's already a p5.Color
    if (c instanceof p5.Color) return c;
    // If it's an object with h, s, b (and optional a)
    if (typeof c === "object" && "h" in c && "s" in c && "b" in c) {
      return color(c.h, c.s, c.b, c.a ?? 100);
    }

    return fallback;
  }

  let baseCol = toP5Color(opt.baseColor, deps.accent1 || color(110, 60, 70));
  let baseH = hue(baseCol);
  let baseS = saturation(baseCol);
  let baseB = brightness(baseCol);

  let edgeCol = toP5Color(opt.edgeColor,
    color(baseH, baseS * 0.3, min(baseB + 20, 100))
  );
  let edgeWeight = opt.edgeWeight ?? 1.5;

  // Generate Voronoi sites and compute diagram
  voronoiClearSites();
  for (let i = 0; i < siteCount; i++) {
    voronoiSite(random(w), random(h));
  }
  voronoi(w, h, true);

  const diagram = voronoiGetDiagram();
  if (!diagram || !diagram.cells) return;

  stroke(edgeCol);
  strokeWeight(edgeWeight);

  for (let c of diagram.cells) {
    if (!c.halfedges || c.halfedges.length === 0) continue;

    const site = c.site;
    //Noise for color variation
    const n = noise(site.x * noiseFreq, site.y * noiseFreq);
    const s = constrain(baseS + map(n, 0, 1, -satRange, satRange), 0, 100);
    const b = constrain(baseB + map(n, 0, 1, -briRange, briRange), 0, 100);

    fill(baseH, s, b);

    beginShape();
    for (let he of c.halfedges) {
      const v = he.getStartpoint();
      vertex(bb.minx + v.x, bb.miny + v.y);
    }
    endShape(CLOSE);
  }
},

  //Stem pattern: Dot Tracks
  stemDotTracks(deps, opt = {}) {
  const poly = deps.poly;
  if (!poly || !poly.length) return;

  const bb = boundingBox(poly);
  const width  = bb.maxx - bb.minx;
  const height = bb.maxy - bb.miny;

  const trackCount = opt.trackCount != null ? opt.trackCount : 9;
  const rows       = opt.rows       != null ? opt.rows       : 9;
  const marginX    = opt.marginX    != null ? opt.marginX    : width * 0.05;
  const jitterY    = opt.jitterY    != null ? opt.jitterY    : height * 0.01;
  const edgeScale  = opt.edgeScale  != null ? opt.edgeScale  : 0.5;

  //Base radius: Width and number of tracks
  const baseR = opt.baseRadius != null ? opt.baseRadius : (width / trackCount * 0.3);

  //Funtion to convert color input to p5.Color
  let rawCol = opt.dotColor || deps.accent1 || { h: 116, s: 35, b: 75, a: 100 };
  let dc;
  if (rawCol instanceof p5.Color) {
    dc = rawCol;
  } else {
    dc = color(
      rawCol.h,
      rawCol.s,
      rawCol.b,
      rawCol.a != null ? rawCol.a : 100
    );
  }

  noStroke();
  fill(dc);

  const stepY = height / (rows + 1);

  for (let k = 0; k < trackCount; k++) {

    // Horizontal parameter in [0,1]
    const t = (k + 0.5) / trackCount;
    const x = lerp(bb.minx + marginX, bb.maxx - marginX, t);

    //If the circle is closer to the center -> scale is larger, else smaller
    const centerT = 0.5;
    const dist = abs(t - centerT) / centerT; //center = 0, edge = 1
    const scale = lerp(1.0, edgeScale, dist);

    for (let i = 1; i <= rows; i++) {
      const yBase = bb.miny + stepY * i;
      const y = yBase + random(-jitterY, jitterY);

      const r = baseR * scale * (1 + random(-0.05, 0.05));
      circle(x, y, r * 2);
    }
  }
},

//Stem pattern: Dot Gradient
stemDotGradient(deps, opt = {}) {
  const poly = deps.poly;
  if (!poly || !poly.length) return;

  const bb = boundingBox(poly);
  const width  = bb.maxx - bb.minx;
  const height = bb.maxy - bb.miny;

  const maxCount = opt.maxCount != null ? opt.maxCount : 200;
  const tries    = opt.tries    != null ? opt.tries    : 1200;
  const minR     = opt.minR     != null ? opt.minR     : width * 0.02;
  const maxR     = opt.maxR     != null ? opt.maxR     : width * 0.06;
  const jitterScale = opt.jitterScale != null ? opt.jitterScale : 0.15;
  const gap      = opt.gap      != null ? opt.gap      : minR * 0.2;

  //Funtion to convert color input to p5.Color
  let rawCol = opt.dotColor || deps.accent1 || { h: 40, s: 80, b: 30, a: 100 };
  let dc;

  if (rawCol instanceof p5.Color) {
    dc = rawCol;
  } else {
    dc = color(
      rawCol.h,
      rawCol.s,
      rawCol.b,
      rawCol.a != null ? rawCol.a : 100
    );
  }

  noStroke();
  fill(dc);

  let placed = [];
  let count = 0;

  for (let i = 0; i < tries && count < maxCount; i++) {

    const x = random(bb.minx, bb.maxx);
    const y = random(bb.miny, bb.maxy);

    // 0 ~ 1, Top circle will be larger, bottom circle smaller
    //If y became larger, t become larger
    const t = map(y, bb.miny, bb.maxy, 0, 1);
    let rBase = lerp(minR, maxR, t);

    // Add some jitter to radius
    rBase *= 1 + random(-jitterScale, jitterScale);
    const r = max(1, rBase);

    // Check for overlaps
    let ok = true;
    for (const e of placed) {
      if (p5.Vector.dist(createVector(x, y), e.c) < (r + e.r + gap)) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    circle(x, y, r * 2);
    placed.push({ c: createVector(x, y), r });
    count++;
  }
}

};

// Cap class
class Cap {
  constructor(spec) {
    this.visible = spec.visible != null ? spec.visible : true;

    this.w = spec.w;
    this.h = spec.h;

    this.archTop = spec.archTop;
    this.archBottom = spec.archBottom;
    this.wave = spec.wave;
    this.notch = spec.notch;

    this.baseColor = spec.baseColor;
    this.pattern = spec.pattern || { type: CAP_PATTERN.NOISY_RINGS, opt: {} };

    this.poly = null;
    this.topPts = null;
    this.rx = null;
    this.capColor = null;
    this.accent1 = null;
    this.accent2 = null;
    this.bounds = null;
  }

  buildGeometry() {
    const capWidth = this.w != null ? this.w : random(280, 420);
    const rx = capWidth / 2;
    const archTop = this.archTop != null ? this.archTop : random(100, 160);
    const archBottom = this.archBottom != null ? this.archBottom : random(30, 75);
    const tH = random(0.30, 0.42);

    const L = createVector(-rx, 0);
    const R = createVector(rx, 0);

    const C1_bot = createVector(lerp(L.x, R.x, tH), archBottom);
    const C2_bot = createVector(lerp(L.x, R.x, 1 - tH), archBottom);
    const C1_top = createVector(2 * L.x - C1_bot.x, -archTop);
    const C2_top = createVector(2 * R.x - C2_bot.x, -archTop);

    const steps = 220;

    const ampTop = this.wave && this.wave.ampTop != null ? this.wave.ampTop : random(5, 10);
    const ampBottom = this.wave && this.wave.ampBottom != null ? this.wave.ampBottom : random(2, 6);
    const freqTop = this.wave && this.wave.freqTop != null ? this.wave.freqTop : random(1.1, 2.0);
    const freqBottom = this.wave && this.wave.freqBottom != null ? this.wave.freqBottom : random(0.8, 1.6);
    const phaseTop = this.wave && this.wave.phaseTop != null ? this.wave.phaseTop : random(TWO_PI);
    const phaseBot = this.wave && this.wave.phaseBottom != null ? this.wave.phaseBottom : random(TWO_PI);

    const notchEnabled = this.notch && this.notch.enabled != null ? this.notch.enabled : (random() < 0.55);
    const notchS0 = this.notch && this.notch.s0 != null ? this.notch.s0 : random(0.28, 0.72);
    const notchWidth = this.notch && this.notch.width != null ? this.notch.width : random(0.04, 0.09);
    const notchDepth = this.notch && this.notch.depth != null ? this.notch.depth : random(8, 18);

    const topPts = [];
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      let x = bezierPoint(L.x, C1_top.x, C2_top.x, R.x, s);
      let y = bezierPoint(L.y, C1_top.y, C2_top.y, R.y, s);
      const w = sin(PI * s);
      const waveTop = ampTop * w * sin(TWO_PI * freqTop * s + phaseTop);
      y += waveTop;
      topPts.push(createVector(x, y));
    }

    const botPts = [];
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      let x = bezierPoint(R.x, C2_bot.x, C1_bot.x, L.x, s);
      let y = bezierPoint(R.y, C2_bot.y, C1_bot.y, L.y, s);
      const w = sin(PI * s);
      let waveBot = -ampBottom * w * sin(TWO_PI * freqBottom * s + phaseBot);
      y += waveBot;
      if (notchEnabled) {
        const ds = abs(s - notchS0);
        if (ds < notchWidth) {
          const u = ds / notchWidth;
          const win = 0.5 * (1 + cos(PI * u));
          y -= notchDepth * pow(win, 1.2);
        }
      }
      botPts.push(createVector(x, y));
    }

    const poly = topPts.concat(botPts);

    const baseH = this.baseColor && this.baseColor.h != null ? this.baseColor.h : random(360);
    const capCol = color(
      baseH,
      this.baseColor && this.baseColor.s != null ? this.baseColor.s : random(55, 80),
      this.baseColor && this.baseColor.b != null ? this.baseColor.b : random(60, 85),
      this.baseColor && this.baseColor.a != null ? this.baseColor.a : 100
    );
    const accent1 = color((baseH + random(20, 60)) % 360, random(55, 90), random(60, 95));
    const accent2 = color((baseH + random(180, 240)) % 360, random(40, 75), random(60, 95));

    const bb = boundingBox(poly);

    this.poly = poly;
    this.topPts = topPts;
    this.rx = rx;
    this.capColor = capCol;
    this.accent1 = accent1;
    this.accent2 = accent2;
    this.bounds = { x: bb.minx, y: bb.miny, w: bb.maxx - bb.minx, h: bb.maxy - bb.miny };
  }

  path(ctx) {
    const poly = this.poly;
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
  }

  draw() {
    if (!this.visible) return;
    if (!this.poly) this.buildGeometry();

    noStroke();
    fill(this.capColor);
    const ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    this.path(ctx);
    ctx.fill();
    ctx.restore();

    const deps = {
      poly: this.poly,
      topPts: this.topPts,
      rx: this.rx,
      accent1: this.accent1,
      accent2: this.accent2
    };
    withClip((c) => { this.path(c); }, () => {
      PatternPainter.paint(this.pattern.type, deps, this.pattern.opt || {});
    });
  }
}

// Stem class
class Stem {
  constructor(spec) {
    this.visible = spec.visible != null ? spec.visible : true;
    this.h = spec.h != null ? spec.h : 160;
    const baseW = spec.w != null ? spec.w : 36;
    this.topW = spec.topW != null ? spec.topW : baseW;
    this.bottomW = spec.bottomW != null ? spec.bottomW : this.topW * 1.4;
    this.ryTop = spec.ryTop != null ? spec.ryTop : this.h * 0.18;
    this.ryBottom = spec.ryBottom != null ? spec.ryBottom : this.h * 0.22;
    this.bulge = spec.bulge != null ? constrain(spec.bulge, 0.08, 0.40) : 0.22;
    this.offsetY = spec.offsetY != null ? spec.offsetY : 60;
    this.baseColor = spec.baseColor || { h: 35, s: 30, b: 92, a: 100 };
    this.strokeWidth = spec.strokeWidth != null ? spec.strokeWidth : 0; // 0 = no stroke
    this.strokeColor = spec.strokeColor || null;
    this.pattern = spec.pattern || { type: STEM_PATTERN.NONE, opt: {} };
  }

  path(ctx) {
    const h = this.h;
    const topW = this.topW;
    const bottomW = this.bottomW;
    const ryTop = this.ryTop;
    const ryBottom = this.ryBottom;
    const bulge = this.bulge;

    const topY = 0;
    const botY = h;
    const halfT = topW / 2;
    const halfB = bottomW / 2;

    const topC = topY + ryTop;
    const botC = botY - ryBottom;

    const K = 0.5522847498;

    const LT = { x: -halfT, y: topC };
    const RT = { x: halfT, y: topC };
    const LB = { x: -halfB, y: botC };
    const RB = { x: halfB, y: botC };

    const len = botC - topC;
    const k1 = len * (0.44 + bulge * 0.18);
    const k2 = len * (0.46 + bulge * 0.25);

    ctx.moveTo(LT.x, LT.y);

    ctx.bezierCurveTo(
      -halfT,          topC - K * ryTop,
      -K * halfT,      topC - ryTop,
      0,               topC - ryTop
    );
    ctx.bezierCurveTo(
      K * halfT,       topC - ryTop,
      halfT,           topC - K * ryTop,
      RT.x,            RT.y
    );

    ctx.bezierCurveTo(
      halfT,           topC + k1,
      halfB,           botC - k2,
      RB.x,            RB.y
    );

    ctx.bezierCurveTo(
      halfB,           botC + K * ryBottom,
      K * halfB,       botC + ryBottom,
      0,               botC + ryBottom
    );
    ctx.bezierCurveTo(
      -K * halfB,      botC + ryBottom,
      -halfB,          botC + K * ryBottom,
      LB.x,            LB.y
    );

    ctx.bezierCurveTo(
      -halfB,          botC - k2,
      -halfT,          topC + k1,
      LT.x,            LT.y
    );

    ctx.closePath();
  }

  draw() {
    if (!this.visible) return;

    push();
    translate(0, this.offsetY * (this.parentScale || 1));

    const col = color(
      this.baseColor.h != null ? this.baseColor.h : 35,
      this.baseColor.s != null ? this.baseColor.s : 30,
      this.baseColor.b != null ? this.baseColor.b : 92,
      this.baseColor.a != null ? this.baseColor.a : 100
    );

    const ctx = drawingContext;
    noStroke();
    ctx.save();
    ctx.beginPath();
    this.path(ctx);
    ctx.fillStyle = col.toString();
    ctx.fill();
    ctx.restore();

    //If strokeWidth > 0, draw the stroke
    if (this.strokeWidth > 0) {
      const ctx2 = drawingContext;
      ctx2.save();
      ctx2.beginPath();
      this.path(ctx2);

      //Transform strokeColor object to p5.Color, then to Canvas string
      let sc;
      if (this.strokeColor) {
        sc = color(
          this.strokeColor.h,
          this.strokeColor.s,
          this.strokeColor.b,
          this.strokeColor.a != null ? this.strokeColor.a : 100
        );
      } else {
        sc = color(0, 0, 20);
      }

      ctx2.strokeStyle = sc.toString();
      ctx2.lineWidth = this.strokeWidth;
      ctx2.stroke();
      ctx2.restore();
    }

    //Clip inside the stem shape, then paint pattern driven by rectangle poly
    withClip((ctx2) => this.path(ctx2), () => {
      const bounds = {
        x: -this.bottomW / 2,
        y: 0,
        w: this.bottomW,
        h: this.h
      };

      if (this.pattern && this.pattern.type && this.pattern.type !== STEM_PATTERN.NONE) {
        const poly = [
          createVector(bounds.x, bounds.y),
          createVector(bounds.x + bounds.w, bounds.y),
          createVector(bounds.x + bounds.w, bounds.y + bounds.h),
          createVector(bounds.x, bounds.y + bounds.h)
        ];

        PatternPainter.paint(
          this.pattern.type,
          { poly, rx: this.bottomW * 0.5 },
          this.pattern.opt || {}
        );
      }
    });

    pop();
  }
}

// BasePart class

class BasePart {
  constructor(spec) {
    this.visible = spec.visible != null ? spec.visible : false;

    this.r = spec.r != null ? spec.r : 28;
    this.w = spec.w != null ? spec.w : this.r * 2.4;
    this.h = spec.h != null ? spec.h : this.r * 0.9;

    this.offsetY = spec.offsetY != null ? spec.offsetY : 140;
    this.baseColor = spec.baseColor || { h: 35, s: 20, b: 85, a: 100 };
    this.pattern = spec.pattern || { type: BASE_PART_PATTERN.NONE, opt: {} };

    this.bottomRadius = spec.bottomRadius != null ? spec.bottomRadius : 16;
    this.bottomSag = spec.bottomSag != null ? spec.bottomSag : 0.12; // chin sag slightly larger
    this.bottomTight = spec.bottomTight != null ? spec.bottomTight : 0.18;
    this.sideBulge = spec.sideBulge != null ? spec.sideBulge : 0.66;
    this.topRound = spec.topRound != null ? spec.topRound : 0.96;
  }

  path(ctx) {
    const w = this.w;
    const h = this.h;

    const r         = constrain(this.bottomRadius, 0, 80);
    const sagRatio  = constrain(this.bottomSag, 0, 0.6);
    const sideBulge = constrain(this.sideBulge, 0.35, 0.85);
    const topRound  = constrain(this.topRound, 0.70, 0.98);

    const topY   = -h / 2;
    const domeY  = lerp(topY, 0, 1 - topRound);
    const wideY  = topY + h * 0.56;
    const baseY  =  h / 2;

    const sideX  =  w / 2;
    const ctrlX  =  sideX * sideBulge;

    const footX  = w * 0.44;

    // As the bottom of basepart lookslike a chin, we call it chin.
    const chinDrop = h * sagRatio;
    const chinY    = baseY + chinDrop;
    const midCtrlY = baseY + chinDrop * 0.4;

    //record chin center point (center of tracks)
    this.chinCenter = createVector(0, chinY);

    ctx.moveTo(-footX, baseY - r);

    //"Left ear" to chin
    ctx.bezierCurveTo(
      -footX,        midCtrlY,
      -footX * 0.3,  chinY,
      0,             chinY
    );

    // Chin "Right ear"
    ctx.bezierCurveTo(
      footX * 0.3,   chinY,
      footX,         midCtrlY,
      footX,         baseY - r
    );

    // Right side top
    ctx.bezierCurveTo(
      sideX,        baseY - h * 0.02,
      sideX,        wideY,
      sideX * 0.96, wideY - h * 0.08
    );
    ctx.bezierCurveTo(
      sideX * 0.86, domeY,
      ctrlX,        topY,
      0,            topY
    );

    ctx.bezierCurveTo(
      -ctrlX,        topY,
      -sideX * 0.86, domeY,
      -sideX * 0.96, wideY - h * 0.08
    );
    ctx.bezierCurveTo(
      -sideX, wideY,
      -sideX, baseY - h * 0.02,
      -footX, baseY - r
    );

    ctx.closePath();
  }

  draw() {
    if (!this.visible) return;

    push();
    translate(0, this.offsetY * (this.parentScale || 1));

    const col = color(
      this.baseColor.h != null ? this.baseColor.h : 35,
      this.baseColor.s != null ? this.baseColor.s : 20,
      this.baseColor.b != null ? this.baseColor.b : 85,
      this.baseColor.a != null ? this.baseColor.a : 100
    );

    const ctx = drawingContext;
    noStroke();
    ctx.save();
    ctx.beginPath();
    this.path(ctx);
    ctx.fillStyle = col.toString();
    ctx.fill();
    ctx.restore();

    withClip((ctx2) => this.path(ctx2), () => {
      const bounds = {
        x: -this.w * 0.5,
        y: -this.h * 0.5,
        w: this.w,
        h: this.h
      };
      if (this.pattern && this.pattern.type && this.pattern.type !== BASE_PART_PATTERN.NONE) {
        const poly = [
          createVector(bounds.x, bounds.y),
          createVector(bounds.x + bounds.w, bounds.y),
          createVector(bounds.x + bounds.w, bounds.y + bounds.h),
          createVector(bounds.x, bounds.y + bounds.h)
        ];

        const baseH = this.baseColor.h != null ? this.baseColor.h : 35;
        const baseS = this.baseColor.s != null ? this.baseColor.s : 20;
        const baseB = this.baseColor.b != null ? this.baseColor.b : 85;
        const baseA = this.baseColor.a != null ? this.baseColor.a : 100;

        const accent1 = color(
          baseH,
          baseS + 15,
          min(baseB + 5, 100),
          baseA
        );
        const accent2 = color(
          (baseH + 40) % 360,
          baseS + 10,
          min(baseB + 10, 100),
          baseA
        );

        PatternPainter.paint(
          this.pattern.type,
          {
            poly,
            rx: this.w * 0.5,
            accent1,
            accent2,
            center: this.chinCenter
          },
          this.pattern.opt || {}
        );
      }
    });

    pop();
  }
}

// Mushroom class with Cap, Stem, BasePart, anchor and layout
class Mushroom {
  constructor(spec) {
    this.id   = spec.id || "m";
    this.seed = (spec.seed != null) ? spec.seed : Math.floor(Math.random() * 1e9);

    this.pose  = spec.pose || {};
    this.scale = (this.pose.scale != null) ? this.pose.scale : 1;
    this.rot   = this.pose.rot || 0;

    // Anchor point for the whole mushroom (center)
    this.anchor = spec.anchor || { x: (this.pose.x || 0), y: (this.pose.y || 0) };

    // Relative offsets for the three parts (relative to the anchor)
    this.layout = spec.layout || {
      capOffset:  { x: 0,  y: 0   },
      stemOffset: { x: 0,  y: 80  },
      baseOffset: { x: 0,  y: 140 }
    };

    // If absolute positions are not provided, keep null (use anchor + offsets at runtime)
    this.capPos  = spec.capPos  || null;
    this.stemPos = spec.stemPos || null;
    this.basePos = spec.basePos || null;

    this.cap  = new Cap(spec.cap || {});
    this.stem = new Stem(spec.stem || {});
    this.base = new BasePart(spec.base || {});
  }

   draw() {
    // 确保每一帧的细节（点的位置、noise）是稳定的
    randomSeed(this.seed);
    noiseSeed(this.seed);

    // ========= 音频驱动的 scale + 摇摆 =========
    let bassNorm = 0;
    let trebleNorm = 0;

    // 这些全局变量是从 sketch.js 里来的
    // 安全起见先判断一下有没有定义
    if (typeof lowEnergy !== "undefined") {
      bassNorm = constrain(map(lowEnergy, 0, 255, 0, 1), 0, 1);
    }
    if (typeof highEnergy !== "undefined") {
      trebleNorm = constrain(map(highEnergy, 0, 255, 0, 1), 0, 1);
    }

    // 整体“呼吸”放大缩小（跟 bass 走）
    const breathScale = 1 + bassNorm * 0.18; // 最大大约 +18%

    // 左右轻微摇摆（跟 treble + 时间走）
    const sway =
      sin(frameCount * 0.03 + this.seed) * (0.04 + trebleNorm * 0.05);

    // 原本的 scale / rot 基础上叠加音频动画
    const s = this.scale * breathScale;
    const r = this.rot + sway;

    // ========= 下面是你原来就有的位置信息 =========
    const ax = this.anchor.x;
    const ay = this.anchor.y;

    const offCap = this.layout.capOffset || { x: 0, y: 0 };
    const offStem = this.layout.stemOffset || { x: 0, y: 80 };
    const offBase = this.layout.baseOffset || { x: 0, y: 140 };

    // 绝对位置优先；否则用 anchor + offset
    const capX = this.capPos ? this.capPos.x : ax + offCap.x;
    const capY = this.capPos ? this.capPos.y : ay + offCap.y;
    const stemX = this.stemPos ? this.stemPos.x : ax + offStem.x;
    const stemY = this.stemPos ? this.stemPos.y : ay + offStem.y;
    const baseX = this.basePos ? this.basePos.x : ax + offBase.x;
    const baseY = this.basePos ? this.basePos.y : ay + offBase.y;

    // ========= 按照“底—柄—伞盖”的顺序画 =========

    // — Base
    if (this.base && this.base.visible) {
      push();
      translate(baseX, baseY);
      rotate(r);
      scale(s);
      this.base.parentScale = s;
      this.base.draw();
      pop();
    }

    // — Stem
    if (this.stem && this.stem.visible) {
      push();
      translate(stemX, stemY);
      rotate(r);
      scale(s);
      this.stem.parentScale = s;
      this.stem.draw();
      pop();
    }

    // — Cap
    if (this.cap && this.cap.visible) {
      push();
      translate(capX, capY);
      rotate(r);
      scale(s);
      this.cap.parentScale = s;
      this.cap.draw();
      pop();
    }
  }

}

//Scene class to hold multiple mushrooms and draw them together
class Scene {
  constructor() {
    this.items = [];
  }
  add(m) { this.items.push(m); }
  draw() {
    for (const m of this.items) m.draw();
  }
}

//Type library to define different mushroom types
const TYPE_LIBRARY = {
  default: {
    cap: {
      visible: true,
      w: 360,
      baseColor: { h: 258, s: 52, b: 71, a: 100 },
      pattern: { type: CAP_PATTERN.NESTED, opt: {} }
    },
    stem: {
      visible: true,
      h: 480,
      w: 40,
      // moved down a bit (smaller value = lower)
      offsetY: 70,            // was -100
      topW: 80,
      bottomW: 150,
      ryTop: 20,
      ryBottom: 60,
      bulge: 0.24,
      baseColor: { h: 116, s: 35, b: 75, a: 100 },
      strokeWidth: 5,
      strokeColor: { h: 116, s: 35, b: 75, a: 100 },
      pattern: {
        type: STEM_PATTERN.DOT_GRADIENT,
        opt: {
          maxCount: 220,
          tries: 1500,
          minR: 3,
          maxR: 10,
          jitterScale: 0.15,
          gap: 1.5,
          dotColor: { h: 110, s: 60, b: 90, a: 100 }
        }
      }
    },
    base: {
      visible: true,
      r: 36,
      // also moved down a bit (increase distance between cap bottom and stem top)
      offsetY: -20,           // previously -140
      w: 320,
      h: 80,
      bottomRadius: 16,
      bottomSag: 0.90,
      bottomTight: 0.18,
      sideBulge: 0.66,
      topRound: 0.96,
      baseColor: { h: 50, s: 85, b: 90, a: 100 },
      pattern: { type: BASE_PART_PATTERN.TRACKS_MONO, opt: {} }
    },
    // The three parts still share the same anchor; no extra layout offsets
    layout: {
      capOffset:  { x: 0, y: 0 },
      stemOffset: { x: 0, y: 0 },
      baseOffset: { x: 0, y: 0 }
    }
  },
  withoutBasePart: {
    cap: {
      visible: true,
      w: 360,
      baseColor: { h: 258, s: 52, b: 71, a: 100 },
      pattern: { type: CAP_PATTERN.NESTED, opt: {} }
    },
    stem: {
      visible: true,
      h: 250,
      w: 40,
      // moved down a bit (smaller value = lower)
      offsetY: 70,            // was -100
      topW: 80,
      bottomW: 150,
      ryTop: 20,
      ryBottom: 60,
      bulge: 0.24,
      baseColor: { h: 116, s: 35, b: 75, a: 100 },
      strokeWidth: 5,
      strokeColor: { h: 116, s: 35, b: 75, a: 100 },
      pattern: {
        type: STEM_PATTERN.DOT_GRADIENT,
        opt: {
          maxCount: 220,
          tries: 1500,
          minR: 3,
          maxR: 10,
          jitterScale: 0.15,
          gap: 1.5,
          dotColor: { h: 110, s: 60, b: 90, a: 100 }
        }
      }
    },
    base: {
      visible: false,
    },
    // The three parts still share the same anchor; no extra layout offsets
    layout: {
      capOffset:  { x: 0, y: 0 },
      stemOffset: { x: 0, y: 0 },
      baseOffset: { x: 0, y: 0 }
    }
  }
};

// Scene layout definition array to instantiate mushrooms
const SCENE_LAYOUT = [

{
  id: "m_greenL",
  type: "default",
  seed: 31007,
  anchor: { x: 184, y: 597 },
  pose: { scale: 0.50, rot: 0 },

  capOverride: {
    w: 360,
    archTop: 150,
    archBottom: 52,
    baseColor: { h: 354, s: 100, b: 77, a: 100 },
    pattern: {
      type: CAP_PATTERN.NESTED,
      opt: {
        accent1: { h: 44, s: 8, b: 88, a: 100},  // first accent color
        accent2: { h: 139, s: 94, b: 52, a: 100 }, // second accent color
      }
    }
  },

  stemOverride: {
    h: 220,
    baseColor: { h: 120, s: 80, b: 80, a: 100 },  // green
    offsetY: 110,
    strokeColor:  { h: 132, s: 91, b: 44, a: 100 },
    pattern: {
      type: STEM_PATTERN.VORONOI,
      opt: {
        siteCount: 80,
        baseColor: { h: 120, s: 80, b: 80, a: 100 },   // yellowish texture
        edgeColor: { h: 132, s: 91, b: 44, a: 100 },  // dark green edge
        edgeWeight: 1.2
      }
    }
  },

  baseOverride: {
    baseColor: { h: 50, s: 85, b: 90, a: 100 }
  }
}
,

  {
    id: "m_smallBL",
    type: "withoutBasePart",
    seed: 31008,
    anchor: { x: 244, y: 820 },
    pose: { scale: 0.40, rot: 0 },
    capOverride: {
      w: 320,
      archTop: 200,
      archBottom: 100,
      baseColor: { h: 54, s: 92, b: 89, a: 100 },   // cap color
      pattern: {
        type: CAP_PATTERN.NOISY_RINGS,
        opt: {
          ringColor: { h: 183, s: 99, b: 38, a: 100 }
        }
      }
    },
    stemOverride: {
      // Keep shape parameters unchanged (use your values)
      h: 380,
      topW: 100,
      bottomW: 200,
      ryTop: 24,
      ryBottom: 60,
      bulge: 0.30,

      baseColor: { h: 0, s: 100, b: 85, a: 100 },
      strokeColor:  { h: 0, s: 100, b: 85, a: 100 },
      // Pattern: vertical white dots
      pattern: {
        type: STEM_PATTERN.DOT_TRACKS,
        opt: {
          trackCount: 11,        // Higher = denser, you can tweak
          rows: 15,             // Number of vertical points (try ~142)
          dotColor: { h: 0, s: 0, b: 100, a: 100 },  // white dots
          edgeScale: 0.4,       // dots get smaller toward edges
          jitterY: 2,           // small random vertical jitter for dots
          baseRadius: 10        // base radius for dots (center dots larger)
        }
      }
    }

  },

  {
    id: "m_midY",
    type: "default",
    seed: 31002,
    anchor: { x: 631, y: 654 },
    pose: { scale: 0.60, rot: 0 },
    // Change cap top height / color
    capOverride: {
      w: 360,              // cap width (optional)
      archTop: 160,        // cap top higher and rounder
      archBottom: 50,      // bottom arc curvature
      baseColor: { h: 315, s: 45, b: 52, a: 100 }, // cap color (HSB)
      pattern: {
        type: CAP_PATTERN.NESTED,
        opt: {
              accent1: { h: 53, s: 93, b: 92, a: 100},  // first color
              accent2: { h: 78, s: 79, b: 74, a: 100 }, // second color
            } // spot style (optional)
      }
    },
    stemOverride: {
      h: 500,
      topW: 90,
      bottomW: 180,
      ryTop: 26,
      ryBottom: 80,
      bulge: 0.3,
      baseColor: { h: 70, s: 99, b: 76, a: 100 }, // stem color
      pattern: {
      type: STEM_PATTERN.VORONOI,
      opt: {
        siteCount: 80,
        baseColor: { h: 95, s: 85, b: 75, a: 100 },   // yellowish texture
        edgeColor: {  h: 61, s: 85, b: 84  },  // dark green edge
        edgeWeight: 1.2
      }
    }
    },
    baseOverride: {
      baseColor: { h: 50, s: 85, b: 90, a: 100 }   // base (underside) color
    }
  },

{
  id: "m_purple",
  type: "withoutBasePart",
  seed: 31003,
  anchor: { x: 844, y: 363 },
  pose: { scale: 0.45, rot: 0 },

  capOverride: {
    w: 340,              // cap width param should be 'w'
    archTop: 230,
    archBottom: 120,
    baseColor: { h: 168, s: 96, b: 41, a: 100 }, // cap color
    pattern: {
      type: CAP_PATTERN.CIRCLES_MONO,
      opt: {
        minR: 8,
        maxR: 20,
        accent1: { h: 337, s: 68, b: 85, a: 100 }
      }
    }
  },

  stemOverride: {
    visible: true,
    h: 250,
    topW: 100,
    bottomW: 140,
    ryTop: 26,
    ryBottom: 30,
    bulge: 0.20,
    baseColor: { h: 52, s: 80, b: 92, a: 100 },
    strokeColor:  { h: 52, s: 80, b: 92, a: 100 },
    pattern: {
      type: STEM_PATTERN.DOT_TRACKS,
      opt: {
        trackCount: 9,
        rows: 10,
        dotColor: { h: 154, s: 77, b: 37, a: 100 },  // white
        edgeScale: 0.5,
        jitterY: 2,
        baseRadius: 6
      }
    }
  },

}
,

  {
    id: "m_cluster1",
    type: "withoutBasePart",
    seed: 31006,
    anchor: { x: 748, y: 866 },
    pose: { scale: 0.2, rot: -Math.PI/9 },
    capOverride: {
      w: 260,
      archTop: 200,
      archBottom: 60,
      baseColor: { h: 357, s: 99, b: 75, a: 100 },  // cap color
      pattern: {
        type: CAP_PATTERN.CIRCLES_MONO,
        opt: {
           accent1: { h: 1, s: 5, b: 100, a: 100 },
           minR: 16,
           maxR: 20
          }
      }
    },
    stemOverride: {
      h: 400,
      topW: 120,
      bottomW: 200,
      ryTop: 22,
      ryBottom: 70,
      bulge: 0.3,
      baseColor: { h: 343, s: 58, b: 64, a: 100 },  // stem color
      strokeColor:  { h: 343, s: 58, b: 64, a: 100 },
      pattern: {
      type: STEM_PATTERN.DOT_TRACKS,
      opt: {
        trackCount: 9,                            // number of vertical tracks
        rows: 18,                                 // points per track
        marginX: 5,                               // horizontal margin
        jitterY: 2,                               // small vertical jitter
        edgeScale: 0.3,                           // dots get smaller toward edges
        baseRadius: 11,                           // base radius for center dots
        dotColor: { h: 348, s: 76, b: 60, a: 100 }
      }
    }
    },
  },

  {
    id: "m_cluster3",
    type: "withoutBasePart",
    seed: 31006,
    anchor: { x: 890, y: 746 },
    pose: { scale: 0.35, rot: -Math.PI / 36 },
    capOverride: {
      w: 400,
      archTop: 280,
      archBottom: 60,
      baseColor: { h: 38, s: 12, b: 90, a: 100 },  // cap color
      pattern: {
        type: CAP_PATTERN.NESTED,
        opt: {
          accent1: { h: 356, s: 99, b: 79, a: 100 },  // first accent color
          accent2: { h: 52, s: 99, b: 92, a: 100 }, // second accent color
          maxCount: 100,
          maxR: 40,
          minR: 10,
        }
      }
    },
    stemOverride: {
      h: 530,
      topW: 100,
      bottomW: 200,
      ryTop: 22,
      ryBottom: 100,
      bulge: 0.3,
      baseColor: { h: 53, s: 97, b: 91, a: 100 },  // stem color
      strokeColor:  { h: 53, s: 97, b: 91, a: 100 },
      pattern: {
      type: STEM_PATTERN.DOT_TRACKS,
      opt: {
        trackCount: 11,                            // number of vertical tracks
        rows: 15,                                 // points per track
        marginX: 5,                               // horizontal margin
        jitterY: 2,                               // small vertical jitter
        edgeScale: 0.4,                            // dots get smaller toward edges
        baseRadius: 10,                           // base radius for dots (center dots larger)
        dotColor: { h: 348, s: 54, b: 57, a: 100 }
      }
    }
    },
  },

  {
    id: "m_cluster2",
    type: "withoutBasePart",
    seed: 31006,
    anchor: { x: 818, y: 796 },
    pose: { scale: 0.35, rot: -Math.PI/18 },
    capOverride: {
      w: 280,
      archTop: 180,
      archBottom: 50,
      baseColor: { h: 355, s: 99, b: 74, a: 100 },  // cap color
      pattern: {
        type: CAP_PATTERN.NESTED,
        opt: {
          accent1: { h: 341, s: 90, b: 35, a: 100 },  // first accent color
          accent2: { h: 318, s: 55, b: 47, a: 100 }, // second accent color
          maxCount: 25,
          maxR: 30,
          minR: 10,
        }
      }
    },
    stemOverride: {
      h: 300,
      topW: 100,
      bottomW: 220,
      ryTop: 22,
      ryBottom: 70,
      bulge: 0.3,
      baseColor: { h: 27, s: 12, b: 93, a: 100 },  // stem color
      strokeColor:  { h: 27, s: 12, b: 93, a: 100 },
      pattern: {
      type: STEM_PATTERN.DOT_TRACKS,
      opt: {
        trackCount: 9,                            // number of vertical tracks
        rows: 12,                                 // points per track
        marginX: 5,                              // horizontal margin
        jitterY: 2,                               // small vertical jitter
        edgeScale: 0.3,                           // dots get smaller toward edges
        baseRadius: 10,                            // base radius for center dots
        dotColor: { h: 356, s: 92, b: 73, a: 100 }
      }
    }
    },
  },

{
  id: "m_cluster5",
  type: "withoutBasePart",
  seed: 31006,
  anchor: { x: 1040, y: 856 },
  pose: { scale: 0.24, rot: Math.PI/9 },

  capOverride: {
    w: 280,
    archTop: 250,
    archBottom: 40,
    baseColor: { h: 163, s: 89, b: 34, a: 100 },
    pattern: {
      type: CAP_PATTERN.NOISY_RINGS,
      opt: {
        ringCountRange: [10, 15],
        ringColor: { h: 56, s: 99, b: 80, a: 100 }
      }
    }
  },

  stemOverride: {
    baseColor: { h: 0, s: 0, b: 100, a: 100 },  // white base
    strokeColor:  { h: 0, s: 0, b: 100, a: 100 },
    h: 360,
    bottomW: 180,
    pattern: {
      type: STEM_PATTERN.DOT_GRADIENT,
      opt: {
        minR: 3,                      // min radius
        maxR: 10,                     // max radius
        dotColor: { h: 205, s: 85, b: 70, a: 100 },   // dark blue
        maxCount: 150                 // controls point density (adjustable)
      }
    }
  }
}
,
{
    id: "m_cluster4",
    type: "withoutBasePart",
    seed: 31006,
    anchor: { x: 988, y: 786 },
    pose: { scale: 0.35, rot: Math.PI/18 },
    capOverride: {
      w: 320,
      archTop: 220,
      archBottom: 80,
      baseColor: { h: 38, s: 12, b: 90, a: 100 },  // cap color
      pattern: {
        type: CAP_PATTERN.NOISY_RINGS,
        opt: {
          ringCountRange: [10, 15] ,
          ringColor: { h: 337, s: 71, b: 43, a: 100 }

        }
      }
    },
    stemOverride: {
      h: 400,
      topW: 100,
      bottomW: 200,
      ryTop: 22,
      ryBottom: 70,
      bulge: 0.3,
      baseColor: { h: 0, s: 100, b: 85, a: 100 },  // stem color
      strokeColor:  { h: 0, s: 100, b: 85, a: 100 },
      pattern: {
        type: STEM_PATTERN.DOT_TRACKS,
        opt: {
          trackCount: 11,        // higher = denser, tweakable
          rows: 15,             // vertical points (try ~14–22)
          marginX: 10,      // horizontal margin
          dotColor: { h: 0, s: 0, b: 100, a: 100 },  // white
          edgeScale: 0.4,       // dots get smaller toward edges
          jitterY: 2,           // small random jitter in dot positions
          baseRadius: 10         // base radius for dots (center dots larger)
        }
      }
    },
  }
,
{
  id: "m_redR",
  type: "default",
  seed: 31004,
  anchor: { x: 1034, y: 470 },
  pose: { scale: 0.50, rot: Math.PI / 3 },

  capOverride: {
    w: 340,
    archTop: 120,
    archBottom: 50,
    baseColor: { h: 359, s: 90, b: 80, a: 100 }, // cap red
    pattern: {
      type: CAP_PATTERN.CIRCLES_MULTI,
      opt: {
        accent1: { h: 40, s: 6, b: 89, a: 100 },  // first accent color
        accent2: { h: 75, s: 66, b: 80, a: 100 }, // second accent color
        minR: 6,
        maxR: 14
       }
    }
  },
  stemOverride: {
    h: 220,
    topW: 80,
    bottomW: 100,
    ryTop: 24,
    ryBottom: 40,
    bulge: 0.24,
    baseColor: { h: 0, s: 0, b: 100, a: 100 },
    strokeColor:  { h: 0, s: 0, b: 100, a: 100 },
    offsetY: 130,
    pattern: {
      type: STEM_PATTERN.DOT_TRACKS,
      opt: {
        trackCount: 5,                            // number of vertical tracks
        rows: 12,                                 // points per track
        marginX: 5,                              // horizontal margin
        jitterY: 2,                               // small vertical jitter
        edgeScale: 0.3,                           // dots get smaller toward edges
        baseRadius: 8,                            // base radius for center dots
        dotColor: { h: 0, s: 80, b: 80, a: 100 }
      }
    }
  },

  // 🟡 Base: light yellow-green underside + two-color mixed tracks
  baseOverride: {
    baseColor: { h: 68, s: 56, b: 84, a: 100 },   // light yellow-green base (underside)

    // use TRACKS_ALT + two custom colors
    pattern: {
      type: BASE_PART_PATTERN.TRACKS_ALT,
      opt: {
        accent1: { h: 0, s: 61, b: 42, a: 100 }, // darker green
        accent2: { h: 46, s: 11, b: 91, a: 100 }  // slightly orange-brown
      }
    }
  }
}
,

{
  id: "m_blueTop",
  type: "default",
  seed: 31005,
  anchor: { x: 1054, y: 112 },
  pose: { scale: 0.40, rot: 45 }, // Note: rot is in radians by default (unless angleMode(DEGREES) is set)

  capOverride: {
    w: 350,
    archTop: 140,
    archBottom: 50,
    baseColor: { h: 201, s: 99, b: 69, a: 100 }, // blue cap
    offsetY: -20,
    pattern: {
      type: CAP_PATTERN.CIRCLES_MONO,
      opt: {
        minR: 6,         // min dot radius
        maxR: 20,        // max dot radius (large circles)
        maxCount: 110,   // number of dots
        gap: 6,          // minimum spacing between dots (avoid crowding)
        accent1: { h: 0, s: 0, b: 100, a: 100 }  // white dots
      }
    }
  },

  stemOverride: {
    h: 300,
    topW: 70,
    bottomW: 110,
    ryTop: 20,
    ryBottom: 44,
    bulge: 0.18,
    offsetY: 180,
    baseColor: { h: 0, s: 0, b: 100, a: 100 },
    strokeColor:  { h: 0, s: 0, b: 100, a: 100 },
    pattern: {
      type: STEM_PATTERN.DOT_TRACKS,
      opt: {
        trackCount: 7,                             // number of vertical tracks
        rows: 15,                                  // points per track
        baseRadius: 6,                             // base radius for middle column of dots
        edgeScale: 0.3,                            // dots get smaller toward edges
        jitterY: 2,                                // small vertical jitter
        dotColor: { h: 201, s: 99, b: 69, a: 100 } // blue
      }
    }
  },

  baseOverride: {
    baseColor: { h: 0, s: 0, b: 100, a: 100 },    // white underside

    pattern: {
      type: BASE_PART_PATTERN.TRACKS_ALT,
      opt: {
        accent1: { h: 201, s: 40, b: 95, a: 100 }, // light blue (small)
        accent2: { h: 250, s: 9, b: 71, a: 100 } // white base color
      }
    }
  }
}

];

// Mushroom factory to create Mushroom instances from layout definitions
function makeMushroomFromLayout(layout) {
  const typeSpec = TYPE_LIBRARY[layout.type];
  if (!typeSpec) {
    console.warn("Unknown mushroom type:", layout.type);
    return null;
  }

  const mergedCap  = Object.assign({}, typeSpec.cap  || {}, layout.capOverride  || {});
  const mergedStem = Object.assign({}, typeSpec.stem || {}, layout.stemOverride || {});
  const mergedBase = Object.assign({}, typeSpec.base || {}, layout.baseOverride || {});
  const mergedLayout = Object.assign(
    {
      capOffset:  { x: 0, y: 0 },
      stemOffset: { x: 0, y: 80 },
      baseOffset: { x: 0, y: 150 }
    },
    typeSpec.layout || {},
    layout.partLayoutOverride || {}
  );

  const anchor = layout.anchor || { x: (layout.pose?.x || 0), y: (layout.pose?.y || 0) };

  return new Mushroom({
    id: layout.id,
    seed: layout.seed,
    anchor,
    pose: layout.pose || {},
    cap: mergedCap,
    stem: mergedStem,
    base: mergedBase,
    layout: mergedLayout
  });
}

// ========== 提供给 sketch.js 调用的工具函数 ==========

// 在主 sketch.js 的 setup() 里调用：生成所有小蘑菇实例
function initSmallMushrooms() {
  mushrooms = [];
  for (const layout of SCENE_LAYOUT) {
    const m = makeMushroomFromLayout(layout);
    if (m) mushrooms.push(m);
  }
}

// 在主 sketch.js 的 draw() 里调用：画出所有小蘑菇
function drawSmallMushrooms() {
  if (!mushrooms || mushrooms.length === 0) return;
  for (const m of mushrooms) {
    m.draw();
  }
}
