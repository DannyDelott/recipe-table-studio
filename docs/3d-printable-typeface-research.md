# Typeface research for small raised FDM recipe text

## Recommendation

Use **Archivo Condensed ExtraBold** for the raised recipe text.

Use **Roboto Condensed Bold** as the fallback if Archivo's tighter counters prove too dense in a physical test print.

This recommendation is for the current Recipe Table Studio target:

- Bambu Lab P1S
- stock 0.4 mm nozzle
- 0.20 mm layer height
- approximately 3.8 mm text size
- 0.4 mm raised relief
- white PLA card with black PLA text and borders

Archivo Condensed ExtraBold is the best balance of print-safe stroke width and compact labels. At the current text size, its measured narrow stems are approximately 0.55 mm and the interior width of its lowercase `o` is approximately 0.52 mm. It is also about 39% narrower than the current Helvetiker Regular across representative recipe labels. That gives it useful margin over a typical 0.45 mm single extrusion without forcing the generator to squeeze long labels as aggressively.

Roboto Condensed Bold is a close second: approximately 0.52 mm minimum measured stems, a slightly more open 0.58 mm lowercase `o` counter, and only about 4% more average label width than Archivo Condensed ExtraBold.

No candidate reviewed here has first-party evidence that it was designed specifically for FDM printing. The recommendation therefore rests on measurements of the official font outlines against official nozzle guidance, not on an unsupported “3D-print font” claim.

## Why Helvetiker Regular is failing

The P1S includes a 0.4 mm nozzle. Bambu lists 0.2, 0.6, and 0.8 mm as optional nozzle sizes in the [official P1S quick-start specifications](https://cdn1.bambulab.com/documentation/quick-start-59b0cefdc0fc4/P1S/English%20version-Quick%20Start%20Guide%20for%20P1S.pdf).

Prusa's official modeling guidance gives a useful geometry threshold that applies to FDM generally: a 0.4 mm nozzle commonly produces an approximately 0.45 mm extrusion, and walls thinner than one perimeter are not printable. It also warns that thin-wall detection cannot repair geometry below that one-perimeter threshold. See [Modeling with 3D printing in mind](https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135?product=core-one).

The current regular-weight Helvetiker outlines put several narrow glyph strokes close to that threshold before any horizontal fitting is applied. When a long label is compressed to fit a table cell, those strokes become even narrower. The slicer is then forced into fragile single-line paths or drops portions of the glyph.

The 0.4 mm relief height is not the source of the XY detail problem. At a 0.20 mm layer height it provides two raised layers. Official Prusa guidance notes that layer height changes vertical resolution, while embossed text parallel to the bed needs a smaller nozzle or better XY geometry for greater planar detail. See [Layers and perimeters](https://help.prusa3d.com/article/layers-and-perimeters_1748?product=cw1).

## Measurement method

The numbers below are derived measurements, not claims made by the font designers.

1. Downloaded each official TTF from its upstream project or the official Google Fonts repository.
2. Instantiated Roboto Condensed at weight 700 from its official variable font.
3. Rasterized the official outlines at 2,000 pixels per em for measurement.
4. Scaled measurements to a 3.8 mm Three.js text size.
5. Used median central scan-line widths for `I`, `l`, `i`, `1`, and `t` as practical narrow-stem proxies.
6. Measured the enclosed horizontal counter of lowercase `o` as a simple counter-space proxy.
7. Summed the fonts' advance widths, without kerning, for four representative recipe strings. This matches Three.js `Font` layout, which advances by each glyph's `ha` value.

Representative strings:

- `2 teaspoons baking powder`
- `1/2 cup chocolate chips`
- `Mix until just combined`
- `Bake 1 hour at 325 degrees in greased loaf pan`

The current Helvetiker Regular averages approximately 72.7 mm across those four strings at the same nominal size.

## Candidate comparison

| Candidate | Narrow-stem proxy at 3.8 mm | Lowercase `o` counter width | Average sample-label width | Character clarity | Three.js and license fit | Assessment |
| --- | ---: | ---: | ---: | --- | --- | --- |
| **Archivo Condensed ExtraBold** | **0.55 mm** | **0.52 mm** | **44.6 mm** | Conventional grotesque forms; less explicitly differentiated than Atkinson or B612 | Static TTF; SIL OFL 1.1; direct conversion | **Best overall.** Thick enough for a 0.4 mm nozzle, narrow enough to avoid destructive horizontal fitting, and still has a counter wider than one typical extrusion. |
| **Roboto Condensed Bold** | 0.52 mm | 0.58 mm | 46.3 mm | Official description calls out friendly, open curves and a natural reading rhythm | Official variable TTF; SIL OFL 1.1; instantiate weight 700 or convert at build time | **Best fallback.** Slightly thinner and wider than Archivo, but its counters are more forgiving. |
| **Atkinson Hyperlegible Bold** | 0.57 mm | 0.82 mm | 55.0 mm | Explicitly designed for unambiguous character recognition, including `1`, `I`, and `l`, with opened counterspaces | Static TTF; SIL OFL 1.1; direct conversion | Excellent human legibility and generous counters, but the wider labels are more likely to trigger horizontal squeezing in narrow recipe cells. |
| **B612 Bold** | 0.60 mm | 0.82 mm | 56.3 mm | Designed and tested for cockpit displays, degraded contexts, mixed capitals/numbers, and reduced visual fatigue | Static TTF; SIL OFL 1.1; direct conversion | Strongest raw stems and large counters, but widest candidate. Better for titles or short labels than dense recipe cells. |

### Individual sample widths at 3.8 mm

| Candidate | Baking powder | Chocolate chips | Mix until combined | Long bake instruction |
| --- | ---: | ---: | ---: | ---: |
| Archivo Condensed ExtraBold | 40.7 mm | 35.0 mm | 34.4 mm | 68.2 mm |
| Roboto Condensed Bold | 41.7 mm | 36.3 mm | 35.6 mm | 71.7 mm |
| Atkinson Hyperlegible Bold | 49.6 mm | 42.7 mm | 42.4 mm | 85.4 mm |
| B612 Bold | 50.0 mm | 44.4 mm | 43.5 mm | 87.5 mm |
| Current Helvetiker Regular | 66.1 mm | 58.2 mm | 53.4 mm | 113.0 mm |

## Candidate source evidence

### Archivo Condensed ExtraBold

The upstream Archivo project says the family was designed for both print and online use and supplies Condensed weights from Thin through Black. The repository includes the static [Archivo Condensed ExtraBold TTF](https://github.com/Omnibus-Type/Archivo/blob/master/fonts/ttf/ArchivoCondensed-ExtraBold.ttf), source files, and an [SIL Open Font License 1.1](https://github.com/Omnibus-Type/Archivo/blob/master/OFL.txt). See the [official Archivo repository](https://github.com/Omnibus-Type/Archivo).

Why ExtraBold rather than Bold or Black:

- Bold measured only about 0.46 mm at the narrowest stem proxy, leaving almost no tolerance.
- Black increased the stem proxy to about 0.66 mm but reduced the lowercase `o` counter to about 0.41 mm, which risks closing counters with a 0.4 mm nozzle.
- ExtraBold kept both sides of the geometry above approximately 0.5 mm.

### Roboto Condensed Bold

Google Fonts describes Roboto as combining a mechanical skeleton and geometric forms with friendly, open curves, and identifies Roboto Condensed as the condensed companion family. See its [official description](https://github.com/google/fonts/blob/main/ofl/robotocondensed/DESCRIPTION.en_us.html), [variable TTF](https://github.com/google/fonts/blob/main/ofl/robotocondensed/RobotoCondensed%5Bwght%5D.ttf), and [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/robotocondensed/OFL.txt).

The measured candidate is the weight-700 instance of that official variable font.

### Atkinson Hyperlegible Bold

The Braille Institute project explicitly designed Atkinson Hyperlegible for improved character recognition. Its upstream documentation calls out distinctions such as `B` versus `8`, `1` versus `L` versus `l` versus `I`, and expanded open counterspaces. See the [official project repository](https://github.com/googlefonts/atkinson-hyperlegible), [official Google Fonts description](https://github.com/google/fonts/blob/main/ofl/atkinsonhyperlegible/DESCRIPTION.en_us.html), [Bold TTF](https://github.com/google/fonts/blob/main/ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Bold.ttf), and [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/atkinsonhyperlegible/OFL.txt).

### B612 Bold

B612 was designed and tested for aircraft cockpit screens. Its official description says it was optimized for degraded contexts, mixed capitals and numbers, lists, long and abbreviated text, and reduced visual fatigue. The upstream project says its design maximizes distance between character forms. See the [official B612 repository](https://github.com/polarsys/b612), [official Google Fonts description](https://github.com/google/fonts/blob/main/ofl/b612/DESCRIPTION.en_us.html), [Bold TTF](https://github.com/google/fonts/blob/main/ofl/b612/B612-Bold.ttf), and [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/b612/OFL.txt).

B612 Mono should not be used for these cards. Monospacing spends the same horizontal space on narrow and wide characters, which works against dense recipe labels.

## Integration with the existing Three.js geometry

All four recommended files are outline TTFs, so none requires changing the fundamental vector-text approach.

Three.js's official [`TTFLoader`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/TTFLoader.js) loads a TTF and converts it to the typeface JSON consumed by `THREE.Font`. The official [`FontLoader`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/FontLoader.js) then generates vector shapes, and [`TextGeometry`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/geometries/TextGeometry.js) extrudes those shapes.

Practical bundling path:

1. Bundle the official static `ArchivoCondensed-ExtraBold.ttf`.
2. Convert it once during development/build to typeface JSON, or load it through `TTFLoader`.
3. Keep the upstream copyright notice and OFL text with the distributed font asset.
4. Continue extruding the generated shapes at 0.4 mm relief.

Pre-converting the TTF to typeface JSON is preferable for this application because it avoids parsing the font on every card export and keeps the geometry deterministic.

## Geometry guardrails to pair with the font

A new font alone will not make arbitrary fitting safe. The generator should observe these constraints when the font is implemented:

- Keep body text at **3.8 mm or larger** for the 0.4 mm nozzle profile.
- Do not horizontally scale Archivo Condensed ExtraBold below **0.90×**. At that scale, its measured 0.55 mm stem and 0.52 mm `o` counter become approximately 0.50 mm and 0.47 mm.
- Wrap long labels instead of squeezing them below that limit.
- Preserve the existing **0.4 mm relief**, which gives two raised layers at 0.20 mm.
- Use a flat, unbeveled extrusion; bevels consume already-limited stroke and counter width.
- Validate the change with a small physical test coupon containing `1 I l i`, `8 B`, `a e o`, fractions, and the longest recipe labels before treating the choice as final.

## Decision

Adopt **Archivo Condensed ExtraBold** for the next local prototype and slice it using the P1S 0.4 mm nozzle profile. Keep **Roboto Condensed Bold** ready as the fallback if the physical test shows Archivo's counters closing or small bowls filling.

Atkinson Hyperlegible Bold and B612 Bold remain useful reference faces for maximum visual distinction, but their additional width is a material disadvantage in the narrow, merged cells that define these recipe tables.
