# yzha0190_GroupA_JenZHANG_IndividualTask
 Audio-Reactive Toadstools | Individual Functioning Prototype
 Tut 2, Group A, Audio part, Jen ZHANG (yzha0190)


# 1.Interaction Instructions

Click the music button to start or pause the audio track.

![An image of button](assets/button.png)

Once the audio begins, the mushrooms becomes reactive.


# 2.Individual Approach Detail
## 2.1 I chose audio to drive my individual code.
This repository contains my individual functional prototype based on our group’s artwork result.
![An image of result](assets/mushrooms.png)
## 2.2 Unique Animated Visual Properties
In my version, the mushrooms move based on the music instead of the user. I mainly animate three things:

- Mushrooms grow and shrink gently with the volume
The whole mushroom scales up and down like breathing when the music gets loud or soft.

- Stems wiggle more when the drum beats hit
Low sounds make the stems bend side to side, so it looks like the mushrooms are dancing to the beat.

- The background becomes brighter when the music gets sharper
Higher sounds make the background glow a bit more, so the whole scene feels more alive.

Compared to other group members, my animation does not need any clicking or dragging. One teammate focuses on path-based movement with bouncing mushrooms, and another lets users move the mushrooms around freely. My version keeps everything moving on its own and reacts only to sound.


## 2.3 Design Inspiration

### 2.3.1 Organic structures
Yayoi Kusama's mushrooms are characterized by their soft, slightly exaggerated shapes and repetitive dots. Therefore, in the animation, I gave the caps a slightly natural distortion and the dots a subtle, random tremor to create a sense of organic life.

At the same time, I wanted the mushrooms to be lively and rhythmic, like a musical performance group, similar to some fun mushroom animations online. 

[Eat Your Vegetables Rap Song Vocal Music](https://www.youtube.com/watch?v=ep5-w-UFIHI). This was one of the reference videos I wanted to achieve.

### 2.3.2 The audio track 
I used the song Pueblo Mágico by Quincas Moreira for my audio input.
[Pueblo Magic by Quincas Moreira](https://www.youtube.com/watch?v=RWRI6xUi7A0) has a gentle rhythm and clear layers, which makes the mushroom’s movements feel more organic. The bass drives the stem’s wobble, the mid-range affects the breathing motion, and the higher frequencies make the background colours shift.

## 2.4 Technical explanation
## 2.4.1 Changes Made to Group Code
I did not make major structural changes to the group code. The existing geometry system, dot patterns, and Voronoi stem textures remain intact. My changes mainly extend the behaviour inside the update and drawing functions so each mushroom receives the audio values and animates in response.

Amplitude controls the global scale of each mushroom, so they appear to expand and contract like breathing.

Bass energy extracted from the FFT drives the wobble of the stems, creating an S-shaped dancing movement that reacts to strong beats.

Treble energy influences the brightness of the background, causing subtle glowing changes when higher frequencies become more prominent.This transforms the static group illustration into a performance-like scene that reacts continuously to music.

The p5.sound audio analysis features (Amplitude and FFT) are part of the p5.js library, but using them for this level of visual animation required learning beyond the basic usage taught in class. I referred to the official documentation to understand how to extract bass and treble values for controlling different visual components.

## 2.4.2 External Libraries Used
Our group code also uses a Voronoi pattern system which relies on two external libraries not covered in the course content. I did not modify or implement these algorithms myself; I simply continued using them as part of the existing design.

Javascript-Voronoi by Raymond Hill — https://github.com/gorhill/Javascript-Voronoi

p5.voronoi by Francisco Moreira — https://github.com/Dozed12/p5.voronoi

## 2.4.3 Support and AI-assisted Learning
I also used ChatGPT as a learning and debugging tool during development. It helped me understand how to apply amplitude and FFT values from the p5.sound library to visual animation. I did not copy large portions of code directly. Instead, I asked questions, reviewed the suggestions, and then integrated and modified the logic myself to fit our group structure.

This support mainly helped me with:

- Passing audio data into each mushroom instance
- Mapping different frequency ranges to different animation properties
- Fixing small errors when combining sound analysis with our existing update functions

By using AI in this way, I was able to learn faster and maintain full understanding and control over the final code.

# 3. Conclusion
This task helped me explore audio-reactive animation and also taught me how to collaborate through GitHub for the first time. I learned how to use amplitude and FFT data to make the mushrooms react to music, and how to add new behaviour on top of our group’s code without breaking anything. It feels great to see the artwork come alive with sound, and I now understand the audio part much better than before.
