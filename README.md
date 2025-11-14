# yzha0190_GroupA_JenZHANG_IndividualTask

Group A Audio part JenZHANG (yzha0190)

1. Overview

This repository contains my individual interactive prototype based on our group’s chosen artwork: a stylised organic mushroom inspired by hand-painted patterns and natural curvature.
My individual submission focuses on transforming the static drawing into an audio-reactive, dynamically deforming system using p5.js and the p5.sound library.

All animated behaviours — background triangles, mushroom stem, cap textures, and global motion — are driven by different components of the audio signal (amplitude, bass energy, treble energy). The result is a cohesive and multi-layered visual response.

2. How to Interact With the Prototype

Open index.html in a browser.

Click the “Play / Pause” button to start the audio track.

Once the audio begins, the entire composition becomes reactive:

The mushroom scales up and down according to amplitude (breathing effect).

The stem deforms in an S-shaped motion based on bass energy.

The red dots on the stem change size and opacity depending on amplitude.

The background triangle network changes colour according to treble energy.

The scene experiences subtle shaking driven by low-frequency energy.

The prototype requires no mouse interaction; the animation responds purely to sound.

3. Individual Animation Approach

My chosen driver for this task is audio analysis using the p5.sound library.
I used three major audio features:

Audio Feature	p5.js Function	Usage in Animation
Amplitude (loudness)	p5.Amplitude.getLevel()	Breathing scale; dot size; dot opacity
Bass energy	p5.FFT.getEnergy("bass")	S-shaped deformation of the stem; camera shake
Treble energy	p5.FFT.getEnergy("treble")	Background triangle colour interpolation

Additionally, I used Perlin noise to generate natural irregularity for cap dots, and parametric sinusoidal functions to create continuous, elastic organic motion.

This ensures that each part of the mushroom responds to the audio in a distinct but coherent manner.

4. How My Work Differs From Group Members

To ensure sufficient differentiation:

My animation focuses on organic geometric deformation rather than colour cycling or simple time-based animation.

The stem exhibits audio-driven S-shaped movement, which is unique to my version.

I implemented a breathing behaviour based on amplitude.

The background triangle mesh responds to frequency-dependent colour shifts, not only time.

The dot textures on both the stem and the cap incorporate noise-based irregularities and dynamic scaling.

Overall, my work emphasises structural transformation and multi-layered audio responsiveness, which differs from group members who are focusing on alternative interaction modes or more static visual changes.

5. Design Inspiration

The design is guided by two sources:

Organic structures

Mushrooms possess soft and elastic forms. This guided my decision to:

deform the stem using smooth sinusoidal curves,

apply breathing-like global scaling,

allow cap dots to jitter using noise to reflect natural imperfections.

Computational references

The triangular background is inspired by Delaunay/Voronoi generative patterns, but implemented manually using jittered grid points.
Noise-based texture and audio-reactive principles are adapted from p5.js documentation but applied to the mushroom’s unique silhouette.

6. Technical Explanation
6.1 Amplitude-driven global scaling

Using:

amp = new p5.Amplitude();
currentLevel = amp.getLevel();


The amplitude level (0–1) is mapped to a scale range, producing the breathing effect.
Amplitude also controls dot opacity and diameter.

6.2 FFT bass energy driving stem deformation

Low-frequency energy is extracted using:

fft = new p5.FFT();
lowEnergy = fft.getEnergy("bass");


The stem’s x-coordinates are modified using a sinusoidal function:

x = originalX + sin(phase + norm * frequency) * strength;


The deformation strength is proportional to bass intensity, creating soft-body motion.

6.3 Treble energy controlling background colour

The background triangle mesh interpolates between warm and cool tones using:

triangleColor = lerpColor(warmCol, coolCol, t);


The interpolation factor is derived from the difference between high and low frequency energy.

6.4 Perlin noise for cap dot variation

Perlin noise introduces natural variability to dot sizes:

d = baseSize * (1 + 0.14 * noise(r, k));

This avoids mechanical repetition and adds organic texture.

6.5 Custom shapes using parametric sampling
Both stem and cap outlines are drawn using:

beginShape();
vertex(...);
endShape(CLOSE);

This allows precise control of mushroom curvature, sagging geometry, and clipped shading regions.

7. Changes Made to Group Code
My individual implementation required substantial extensions and modifications:
Reorganised drawing order to ensure background draws before the mushroom.
Encapsulated mushroom transformation using push() / pop().
Added amplitude-driven global scale transformation.
Replaced original stem with a fully parametric, audio-reactive S-shaped version.
Introduced noise-based variation for cap dots.
Added background shake based on bass energy.
Added colour interpolation to background triangles based on treble energy.
Centralised audio analysis logic (FFT + amplitude) at the start of draw().
These changes were necessary to achieve the desired audio-reactive behaviour and clearly differentiate my individual work from the group version.

8. References
p5.js Sound Library
p5.js. “p5.Amplitude.” p5.js Reference. https://p5js.org/reference/#/p5.Amplitude
p5.js. “p5.FFT.” p5.js Reference. https://p5js.org/reference/#/p5.FFT
p5.js. “getEnergy().” p5.js Reference. https://p5js.org/reference/#/p5.FFT/getEnergy
p5.js. “userStartAudio().” https://p5js.org/reference/#/p5/userStartAudio
p5.js Core
p5.js. “noise().” https://p5js.org/reference/#/p5/noise
p5.js. “beginShape().” https://p5js.org/reference/#/p5/beginShape
p5.js. “vertex().” https://p5js.org/reference/#/p5/vertex
p5.js. “endShape().” https://p5js.org/reference/#/p5/endShape
p5.js. “lerpColor().” https://p5js.org/reference/#/p5/lerpColor
p5.js. “map().” https://p5js.org/reference/#/p5/map
p5.js. “sin().” https://p5js.org/reference/#/p5/sin
External Technical References

MDN Web Docs. “CanvasRenderingContext2D.clip.” https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip

MDN Web Docs. “addEventListener.” https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
