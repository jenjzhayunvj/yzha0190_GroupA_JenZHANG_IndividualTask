# yzha0190_GroupA_JenZHANG_IndividualTask
 Audio-Reactive Toadstools | Individual Functioning Prototype
 Tut 2, Group A, Audio part, Jen ZHANG (yzha0190)


# 1.Interaction Instructions

Click the “🎵” button to start the audio track.
![An image of button](assets/button.png)
Once the audio begins, the entire composition becomes reactive:
- The mushroom scales up and down according to amplitude.
- The stem deforms in an S-shaped motion based on bass energy.
- The red dots on the stem change size and opacity depending on amplitude.
- The background triangle network changes colour according to treble energy.
The prototype requires no mouse interaction; the animation responds purely to sound.

# 1.Overview
This repository contains my individual interactive prototype based on our group’s chosen artwork: Toadstools by Yayoi KUSAMA.
![An image of toadstools](https://artlogic-res.cloudinary.com/w_1000,c_limit,f_auto,fl_lossy,q_auto/ws-artlogicwebsite1680/usr/images/feature_panels/image/items/71/7156e99e34ff482383a5d142d611d7c7/toadstools-1990.png)
My individual part focuses on transforming the static drawing into an audio-reactive, dynamically deforming system using p5.js and the p5.sound library. 

All animated behaviours are driven by different components of the audio signal (amplitude, bass energy, treble energy).The result is a clear and responsive visual animation that reacts smoothly to the music.

# 3.Individual Animation Approach

My chosen driver for this task is audio analysis using the p5.sound library.
I used three major audio features:

Audio Feature	p5.js Function	Usage in Animation
Amplitude (loudness)	p5.Amplitude.getLevel()	Breathing scale; dot size; dot opacity
Bass energy	p5.FFT.getEnergy("bass")	S-shaped deformation of the stem; camera shake
Treble energy	p5.FFT.getEnergy("treble")	Background triangle colour interpolation

Additionally, I used Perlin noise to generate natural irregularity for cap dots, and parametric sinusoidal functions to create continuous, elastic organic motion.
This ensures that each part of the mushroom responds to the audio in a distinct but coherent manner.

# 4.How My Work Differs From Group Members

My section mainly focuses on making the mushroom react to the audio. The stem and cap change shape based on the music — for example, the S-shaped wobble, the breathing effect, and the frequency-based colour changes in the background. The dots on the mushroom also grow and shrink with the sound, so the whole thing feels alive and tied closely to the audio.

In our group, other members are working on completely different features, like input interactions or more static visuals. So my part is mainly about audio responsiveness, while theirs focuses on user actions or other functions.

# 5.Design Inspiration

## 1. Organic structures
I want to create an animation that feels like a mushroom saxophone band.[Eat Your Vegetables Rap Song Vocal Music](https://www.youtube.com/watch?v=ep5-w-UFIHI).

Mushrooms have soft, stretchy, and slightly irregular shapes. Because of this, I let the stem deform with smooth S-curves, added a breathing-like scaling effect, and let the cap dots jitter using noise to show natural imperfections.

## 2. The audio track 
I used the song Pueblo Mágico by Quincas Moreira for my audio input.
[Pueblo Magic by Quincas Moreira](https://www.youtube.com/watch?v=RWRI6xUi7A0) has a gentle rhythm and clear layers, which makes the mushroom’s movements feel more organic. The bass drives the stem’s wobble, the mid-range affects the breathing motion, and the higher frequencies make the background colours shift.

# 6. Technical Explanation
## 6.1 Amplitude-driven global scaling
Reference:

[p5.Amplitude/getLevel](https://p5js.org/reference/p5.AudioIn/getLevel/)

[p5.Amplitude](https://p5js.org/reference/p5.sound/p5.Amplitude/)

amp = new p5.Amplitude();
currentLevel = amp.getLevel();

The amplitude level (0–1) is mapped to a scale range, producing the breathing effect.
Amplitude also controls dot opacity and diameter.

## 6.2 FFT bass energy driving stem deformation
Reference:

[p5.FFT](https://p5js.org/reference/p5.sound/p5.FFT/)

[p5.FFT/getEnergy](https://p5js.org/reference/p5.FFT/getEnergy/)

Low-frequency energy is extracted using:
fft = new p5.FFT();
lowEnergy = fft.getEnergy("bass");

The stem’s x-coordinates are modified using a sinusoidal function:
x = originalX + sin(phase + norm * frequency) * strength;

The deformation strength is proportional to bass intensity, creating soft-body motion.

## 6.3 Treble energy controlling background colour
Reference:

[p5/lerpColor](https://p5js.org/reference/p5/lerpColor/)

The background triangle mesh interpolates between warm and cool tones using:

triangleColor = lerpColor(warmCol, coolCol, t);

The interpolation factor is derived from the difference between high and low frequency energy.

## 6.4 Perlin noise for cap dot variation
Reference:

[p5/noise](https://p5js.org/reference/p5/noise/)

Perlin noise introduces natural variability to dot sizes:

d = baseSize * (1 + 0.14 * noise(r, k));

This avoids mechanical repetition and adds organic texture.

## 6.5 Custom shapes using parametric sampling
Reference:

[p5/beginShape/](https://p5js.org/reference/p5/beginShape/)

Both stem and cap outlines are drawn using:

beginShape();

vertex(...);

endShape(CLOSE);

This allows precise control of mushroom curvature, sagging geometry, and clipped shading regions.

# 7. Changes Made to Group Code
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

# 8. References
- p5.js Sound Library

  - p5.js. “p5.Amplitude.” p5.js Reference. [p5.Amplitude](https://p5js.org/reference/p5.sound/p5.Amplitude/)

  - p5.js. “p5.FFT.” p5.js Reference. [//p5js.org/reference/#/p5.FFT](https://p5js.org/reference/p5.sound/p5.FFT/)

  - p5.js. “getEnergy().” p5.js Reference. [https://p5js.org/reference/#/p5.FFT/getEnergy](https://p5js.org/reference/p5.FFT/getEnergy/)

  - p5.js. “userStartAudio().” [https://p5js.org/reference/#/p5/userStartAudio](https://p5js.org/reference/p5/userStartAudio/)

- p5.js Core

    -  p5.js. “noise().”p5.js Reference. [p5.js. “noise().”](https://p5js.org/reference/p5/noise/)

    -  p5.js. “beginShape().”p5.js Reference.[p5.js. “beginShape().”](https://p5js.org/reference/p5/beginShape/)

    -  p5.js. “vertex().”p5.js Reference.[p5.js. “vertex().”](https://p5js.org/reference/p5/vertex/)
   
    -  p5.js. “endShape().”p5.js Reference.[p5.js. “endShape().”](https://p5js.org/reference/p5/beginShape/)
      
    -  p5.js. “lerpColor().”p5.js Reference.[p5.js. “lerpColor().”](https://p5js.org/reference/p5/lerpColor/)
      
    -  p5.js. “map().”p5.js Reference.[p5.js. “map().”](https://p5js.org/reference/p5/map/)
      
    -  p5.js. “sin().”p5.js Reference.[p5.js. “sin().”](https://p5js.org/reference/p5/sin/)

## External Technical References

- [MDN Web Docs. “CanvasRenderingContext2D.clip.”](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip)

- [MDN Web Docs. “addEventListener.”](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
