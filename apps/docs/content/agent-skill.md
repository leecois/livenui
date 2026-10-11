# Liven UI agent interface libraries

Install editable source from the Liven UI registry. These components are maintained forks with licenses and notices included; no upstream effect SDK is installed. Imports below assume the `@/components` alias; use your configured alias. Image requires Three.js, and Metal retains its shader dependency.

React 18+. Preserve semantic markup, synchronize theme, use existing design tokens and respect reduced motion.

## Border beam
Install source: npx shadcn@latest add https://livenui.dev/r/beam.json
A travelling glow for cards, inputs and buttons. Five beam shapes, eight palettes, endless ways to draw attention.

Import: BorderBeam from '@/components/livenui/beam'
- size: BorderBeamSize. Size/type preset Rotate family: 'sm' (compact), 'md' (full border, default), 'line' (bottom traveling). Pulse family: 'pulse-outside' (outward bloom), 'pulse-inner' (contained breathe).
- colorVariant: BorderBeamColorVariant. Color variant for the beam effect - 'colorful': Full rainbow spectrum (default) - 'mono': Monochromatic grayscale - 'ocean': Blue and purple tones - 'sunset': Warm orange, yellow, and red tones
- theme: BorderBeamTheme. Theme mode - adapts beam/glow colors for dark or light backgrounds 'auto' detects system preference via prefers-color-scheme
- staticColors: boolean. Disable the hue-shift animation for static colors (e.g., monochrome)
- duration: number. Rotation/travel duration in seconds
- active: boolean. Whether the animation is active
- borderRadius: number. Custom border radius in pixels. When omitted, the component auto-detects the border-radius of the first child element. Falls back to the size preset default if detection fails.
- brightness: number. Brightness multiplier for the glow effect. Falls back to the type's preset default (1.3 for most types).
- saturation: number. Saturation multiplier for the glow effect
- glowSize: number. Multiplies the blur radius of every glow layer, so the halo reads tighter (< 1) or wider and softer (> 1). Each layer keeps its own tuned proportion — the core stays tighter than the bloom — because this scales the presets rather than replacing them.
- hueRange: number. Hue rotation range in degrees for the hue-shift animation
- strength: number. Overall strength/opacity of the effect (0-1). Only affects the beam, glow, and bloom layers -- not the children.
- css: string. Extra CSS appended after the beam's own generated stylesheet, so it can override or add layers and keyframes. Write `{id}` wherever the instance id belongs — the root is `[data-beam="{id}"]`, its layers are the `::before` / `::after` pseudo-elements and `[data-beam-bloom]`, and keyframes are named `*-{id}` — and it is substituted per instance.

## Thinking orbs
Install source: npx shadcn@latest add https://livenui.dev/r/orbs.json
Nine particle states give searching, listening and composing a distinct visual language.

Import: ThinkingOrb from '@/components/livenui/orbs'
- state: OrbState. Which animation to show.
- size: OrbSize. Tuned size preset — 64 or 20 CSS px.
- theme: OrbTheme. Theme mode; `auto` detects from the host project.
- speed: number. Animation speed multiplier on top of the preset's baked speed.
- paused: boolean. Freeze the animation on the current frame.
- color: string. Optional ink tint — any `#rgb`, `#rrggbb` or `rgb()` color. The orb's depth-shading ramp is preserved on the tint (fading toward black on dark substrates, toward white on light ones), so colored orbs read with the same 3D language as the grayscale default. Omit for the stock grayscale ink.
- dots: number. Density multiplier for the mode's dot/strand/node counts, applied with the same paired-count scaler the size presets use so the mode keeps its balance. `1` (default) is the tuned look; `0.5` halves density, `2` doubles it. Clamped to a 0.1 floor.
- dotSize: number. Radius multiplier for every dot, applied with the same scaler the size presets use so near/far falloff keeps its proportion. `1` (default) is the tuned mark; `0.7` reads finer, `1.5` bolder.
- opts: ModeOpts. Advanced: raw draw options merged over the resolved preset, last. These are the engine's own knobs, so they reach past the tuned surface — the orbit paths' `ghostA` and `particles` (working), the globe's `scanMul` and `dimBase` (searching), the constellation's `thr`, `signals`, `lineW` and `spread` (connecting), the plait's `turns` (weaving), the sash's `wobMul`, `bandMul` and `spin` (composing, breathing), and the outline's `spread` and `shape` (shaping — `shape` 0 / 1 / 2 holds the circle, triangle or square instead of cycling). Unknown keys are ignored; a key the current state does not read does nothing.
- frame: ModeFrame. Escape hatch below `opts`: replace the state's geometry outright. The function gets `(size, t, opts)` and returns the frame to paint — the same contract every built-in mode implements (see `MODE_FRAMES` and the helpers exported alongside it). The painter, theme, tint, pause and offscreen handling all stay the library's.
- gravity: boolean | GravityOptions. Gravity: the orb pulls at the pointer. As the pointer nears, a raster of the platform's cursor is drawn in its place with its body warped toward the orb — the tip stays put, nothing rotates or scales. Needs the platform's real pointer raster (`gravity.sprite`, or `setGravitySprite`) or it stays off; off automatically under reduced motion, forced colours, coarse pointers, zoom, and over anything but the plain arrow. `true` takes the defaults. See gravity.ts.

## Metal
Install source: npx shadcn@latest add https://livenui.dev/r/metal.json
Liquid metal rings, text and badges with live reflections, cursor light and responsive deformation.

Import: MetalFx from '@/components/livenui/metal'
- variant: MetalFxVariant. Variant — controls the shader sampling scale + ring width. - `button` (default): pill-style ring at 1 px wide, scale 1.6 - `circle`: compact circle with a 2 px ring, scale 1.3
- preset: MetalFxPreset. Color preset. All three presets ship both dark and light mode tunings — `theme` picks the right side at runtime.
- theme: MetalFxTheme. Theme mode. `'auto'` (default) resolves via `matchMedia('(prefers-color-scheme: dark)')` and switches live when the OS theme changes. Pass `'dark'` or `'light'` to pin a specific mode.
- strength: number. Effect strength (0..1). Multiplies the shader bitmap opacity and the glow SVG alpha. The shader continues to animate at full intensity at any value; only the rendered alpha onto the host is scaled. Lighter values let the underlying child surface show through more strongly.
- glowGain: number. Multiplier on the glow only (halo + catch-light), on top of `strength`. Use it when the shader runs at low `strength` but the glow should still read — e.g. metal text. Clamped to 0..1 after multiplying.
- paused: boolean. Pause the shader animation. The visible canvas keeps the last painted frame so the metal silhouette stays on screen.
- borderRadius: number. Optional explicit border radius (CSS px). When omitted, MetalFx reads the computed border-radius of the wrapped child each resize.
- normalizeHostStyles: boolean. When true, MetalFx normalizes the host element's outer chrome (border / outline / box-shadow) so user-provided component styles don't clash with the metal ring. Inner fills, typography, and content remain untouched.
- reflectionTargets: ReadonlyArray<MetalFxReflectionTarget>. Neighbour elements that should receive a soft proximity reflection of the metal effect. Reflections only render when the resolved theme is `dark` — pass-through in light mode (no DOM scan, no per-frame work). Pass refs to the sibling DOM elements you want to receive the reflection (chips next to a send button, search field next to an Upgrade pill, ...). A target that *contains* the wrapped element (its parent card, say) receives the reflection on both the nearest vertical and horizontal inner edges. Pair with `{ ref, strength }` to keep that subtle.
- disableGlow: boolean. Disable the wandering halo overlay. The shader ring still renders.
- innerShadow: boolean | { offsetY?: number; blur?: number; alpha?: number; color?: string }. Light rim along the top inside edge of the ring — an inner shadow from above, like the one on metal text. `true` uses the design defaults (white 90 %, offset 1 px, blur 0.5 px); pass an object to tune.
- shaderScale: number. Override the shader sampling scale. Larger values zoom into the shared shader (visibly bigger pattern features); smaller values zoom out. Defaults to the variant's baseline (1.6 for `'button'`, 1.3 for `'circle'`) multiplied by `scale`.
- ringCssPx: number. Override the ring thickness in CSS pixels. Defaults to the variant's baseline (1 for `'button'`, 2 for `'circle'`) multiplied by `scale`.
- scale: number. Master scale multiplier for every absolute-pixel constant the engine uses internally. Set this when you render the wrapped element at a non-1× size (e.g. inside a CSS `zoom: 2` container, or when you've doubled all your Tailwind sizes by hand). It scales: - shader sampling (so pattern features grow proportionally) - ring thickness on the canvas - glow SVG stroke widths, blur radii, fade-circle radius, and the small inset/outward offsets that position the catch-light - reflection canvas stroke band, border-highlight thickness, and the reference draw width baseline
- mask: MaskFn. Custom alpha mask painter. When set, the shader is kept only where the mask paints (device px, origin at the wrapper's top-left) and the ring punch is skipped — for metal-filled text or glyphs. Pair with `disableGlow`; the glow assumes a ring perimeter.
- glowMode: 'mask' | 'ring'. How the glow is placed when `mask` is set. `'mask'` (default) samples points inside the mask and clips the halo to it — right for metal text. `'ring'` keeps the rounded-rect perimeter behaviour — a halo along the element's edge — for a full-fill mask like a badge.

Import: MetalText from '@/components/livenui/metal'
- font: string. CSS `font` shorthand for the live span, e.g. `500 24px/1 Inter, sans-serif`.
- color: string. Base text colour from the design; the metal composites over it.
- strength: number.
- theme: MetalFxTheme.
- reflectionTargets: ReadonlyArray<MetalFxReflectionTarget>.
- innerShadow: TextInnerShadow | null. Top-edge light rim inside the glyphs. Pass null to disable.
- glow: boolean. Halo on the glyphs. Off by default — the design has none.
- glowGain: number. Glow multiplier when `glow` is on.
- metalOpacity: number. How much metal shows over the base colour (0..1), multiplied with `strength`.
- shaderScale: number. Zoom of the metal inside the glyphs.

Import: MetalBadge from '@/components/livenui/metal'
- strength: number.
- theme: MetalFxTheme.
- scale: number. Size multiplier on the Figma metrics (45×25, 12.222px).
- reflectionTargets: ReadonlyArray<MetalFxReflectionTarget>.
- metalOpacity: number. How much metal shows over the white fill (0..1), multiplied with `strength`.
- shaderScale: number.
- core: MetalBadgeCore.
- gradient: number. Top→bottom white wash strength (0..1).
- glow: number. Inner white glow strength (0..1).
- textColor: string.

## Gooey
Install source: npx shadcn@latest add https://livenui.dev/r/gooey.json
Merge, morph, move, melt and bend. Liquid silhouettes carry crisp, readable content.

Import: Liquid from '@/components/livenui/gooey'
- blur: number. Goo blur sigma in px — how far apart pieces start bridging. Default 6.
- contrast: number. Alpha-contrast slope — how sharp the liquid edge is. Default 18.
- fill: string. Fill of the liquid surface. Any CSS color, `var()` welcome. Default '#fff'.
- shadow: string. `box-shadow` syntax; rendered on the MERGED silhouette. `inset` layers paint inside the liquid edge (inner rings / top highlights).
- filterPadding: number. Extra filter-region slack in px for blobs travelling outside the group box. Default 24.
- waviness: number. Max px the liquid boundary undulates — the silhouette (and its shadows) run through a gentle noise displacement, so edges read as fluid instead of geometric. 0 (default) keeps the calm edge.
- wavinessFreq: number. Noise frequency of the undulation; lower = longer, lazier waves.
- filter: string. Application code only; unavailable in playground JSON, presets or shared links. Escape hatch: raw SVG filter primitives that REPLACE the goo chain (`blur`, `contrast`, `waviness` and the SVG half of `shadow` are then yours to reproduce). The input is `SourceGraphic`; the last primitive's output is what paints. Inset and spread shadows normally read a binarised `shape` result — keep that name if you keep them.
- item: LiquidItemProps. Playground recipe field: props applied to each Liquid.Item child, not to the Liquid group. The generated code places these on the child.

Liquid.Item props:
- effect: LiquidEffect. 'morph' (default) or 'move'.
- morph: MorphTuning. Tuning for effect="morph".
- move: MoveTuning. Tuning for effect="move".
- bend: BendTuning. Tuning for effect="bend".
- melt: ImageMeltOptions & { src?: string }. Tuning for effect="melt": the image source (auto-detected from a child <img> when omitted) plus the melt's physics.
- dissolve: boolean | number | DissolveOptions. Melt this item's imagery into a touching neighbour at the contact point — a liquid warp, not a blur. Orthogonal to `effect`: it describes what your CONTENT does where two surfaces meet, not how the surface moves. `true` for the tuned look, `0..1` to scale it, or the raw `DissolveOptions` for full control (wire `active` to your drag).
- x: number. Component-driven position: the library animates both the element and its liquid in perfect sync. Omit x/y and animate the child yourself (CSS, Framer Motion, …) — the liquid follows automatically when the effect needs it, or with `observe` for plain merge.
- y: number.
- scale: number.
- transition: Transition. Spring preset/config or `{ duration, ease }` for x/y. Default 'smooth'.
- delay: number. Transition delay in ms (stagger).
- observe: boolean. Plain-merge items animated by YOUR code: makes the liquid follow the child's rendered rect. Implied by `morph.shape`, `dissolve` and effect="move".
- radius: number | CornerRadii. Override the measured border-radius for the liquid (px).

## Voice
Install source: npx shadcn@latest add https://livenui.dev/r/voice.json
A glow, dotted landscape or wireframe that rises with your voice. Real microphone input or a controlled level.

Import: VoiceBeam from '@/components/livenui/voice'
- type: VoiceBeamType. Host preset: 'default' (chat input), 'pill' (recording pill) or 'mobile' (bottom of a phone screen). Sets the defaults of the geometry props below for that host; any prop you pass still wins.
- look: VoiceBeamLook. How the voice is drawn: coloured light, or a surface of dots or lines that the voice raises and gravity brings down.
- dotSize: number. Dot radius, as a multiplier on the tuned size. `look="dots"` only.
- dotGap: number. Spacing between dots, as a multiplier — below 1 is a denser, finer surface, above 1 a sparser, coarser one. `look="dots"` only.
- dotShape: VoiceBeamDotShape. The dots' shape: round, or square for a pixel grid. `look="dots"` only.
- lineWidth: number. Line width, as a multiplier on the tuned width (lines thin out into the distance). `look="lines"` only.
- lineGap: number. Spacing between lines, as a multiplier — the rows and the columns alike. `look="lines"` only.
- linePattern: VoiceBeamLinePattern. Which way the lines run: across the surface, into the depth, or both. `look="lines"` only.
- seeThrough: boolean. Draw the lines as a wireframe: those behind a raised ridge show through it instead of being hidden by it. `look="lines"` only.
- texture: number. Organic texture, 0–1: a slow ripple the flow carries across the surface. 0 is a still sheet that only the voice moves. Dots and lines.
- gravity: number. How hard the surface falls when the voice drops, as a multiplier on its gravity. Lower floats down, higher drops like sand. Dots and lines.
- surfaceHeight: number. How tall the surface stands along the bottom, as a multiplier — how far back the sheet runs, and so how much of the host it covers. Dots and lines.
- surfaceCurve: number. How far the surface arcs, as a multiplier: its sides and far edge fall away like a horizon. 0 is a flat sheet; below 0 it cups upward instead. Dots and lines.
- surfaceTail: number. The surface's tails: how far its ends rise toward the corners, as a share of the sheet's height — the ends curl up into the host's corners instead of running flat into its sides. Below 0 they drop away instead. Dots and lines.
- surfaceTailPosition: number. Where the tails start, as a share of the distance from the centre to the side (0.8 = only the last 20%); they reach their full lift at the edge.
- surfaceTailCurve: number. Exponent of the tails' rise: 1 a straight ramp, 2 a parabola, higher a hook that stays low and whips up at the edge.
- surfaceFade: number. How far in from the sides the surface dissolves, as a share of its half-width, 0–1. 0 runs it hard into the edges; 1 fades it from the centre out. Dots and lines.
- scale: number. Size of the whole effect. Multiplies every pixel dimension at once — lobes, their spacing, the visible range, the bend, the band, the core, the bloom blur, the flow speed — so the glow grows or shrinks as one thing, on top of the type preset and the individual geometry props.
- stream: MediaStream | null. Audio to react to. When set, the beam analyses this stream (level plus low / mid / high bands) and ignores `level`. Get one from the `useMicrophone` hook or any `getUserMedia` / WebRTC source.
- level: VoiceBeamLevel. Manual drive, 0–1, used when no `stream` is given. A number re-renders on change; a getter is sampled once per frame without re-rendering.
- sensitivity: number. Input gain on the analysed audio. The default suits a laptop microphone at conversational distance; raise it for quiet sources, lower it for a close or hot one.
- threshold: number. Noise gate, 0–1. Levels below it read as silence, so room hum and fan noise do not keep the beam twitching.
- attack: number. Seconds the glow takes to rise toward a louder level.
- release: number. Seconds the glow takes to settle after the sound drops.
- idle: number. Resting presence, 0–1 — how much the beam breathes while silent so it never looks dead. 0 hides it completely between sounds.
- breatheDuration: number. Period of the idle breathing in seconds.
- reach: number. How tall the glow grows at full level, as a multiple of its resting height. The rise is centered on the bottom edge.
- spread: number. How far the glow widens at full level, as a fraction of its resting width. Side lobes drift outward as well, so a loud sound spreads.
- bands: boolean. Let the low / mid / high bands move the colored lobes independently (center follows the lows, the sides the mids and highs). With a manual `level` the bands are synthesised from the level, so the lobes still dance. Off, every lobe follows the one level.
- flow: number. How fast the spectrum travels sideways, in px per second at full level — the lobes slide left to right while a voice is heard and rest when it stops, so every colour takes a turn at the centre. Negative flows right to left; 0 holds the lobes in place.
- processing: boolean. Processing state — turn it on once the voice has been captured and something is working on it. The lobes gather into one compact beam that travels the glow's range left to right and back, eased at each end and looped — border-beam's `line` type, confined to the voice glow — and the glow is held lit at `processingLevel` so the beam has colour. Both blend in and out smoothly. The distortion settles out in about a quarter second and stays off while processing.
- processingDuration: number. Seconds for one pass of the processing beam (left to right, or back again).
- processingLevel: number. How lit the glow is held while processing, 0–1, as if a voice were speaking at that level.
- processingEase: number. Seconds the morph between the voice glow and the travelling beam takes, in either direction — the gather, the narrowing and the travel ease in and out over it.
- processingTravel: number. How far the processing beam travels to each side, as a multiple of half the lobe ring: 1 sweeps the glow's resting spread, lower keeps it near the centre, higher runs it out to the corners.
- processingCurve: number. How the processing beam eases into each turn of its sweep: 1 runs at a constant speed and turns sharply, 2 slows smoothly into the ends, higher dwells there longer before heading back.
- cornerFollow: number. How much the coloured glow rides the element's corner arcs while processing, 0–1: 0 keeps it flat along the bottom edge, 1 lifts it along the rounded corner as it passes through. The band line follows the corner either way.
- colorVariant: VoiceBeamColorVariant. Color variant for the beam
- colors: string[]. Your own lobe colours, centre first then the pairs outward — up to seven, any CSS hex or rgb. Slots you leave out (or that fail to parse) keep the variant's colour for the theme.
- bandColors: { core?: string; above?: string; mid?: string; below?: string }. The band's colours: the core ridge and its chromatic fringes above, between and below. Any CSS hex or rgb; unset ones keep the theme's defaults (white core with red / green / blue fringes on dark, a pink core with rose / lavender / sky on light).
- theme: VoiceBeamTheme. Theme mode — adapts beam colors for dark or light backgrounds; 'auto' follows prefers-color-scheme
- staticColors: boolean. Disable the slow hue drift for static colors
- hueRange: number. Hue drift range in degrees (the palette wanders ± this far)
- hueDuration: number. Period of the hue drift in seconds
- active: boolean. Whether the effect is on. Off fades the beam out and stops the audio analysis.
- paused: boolean. Freezes the effect where it is — the glow, the band and the audio analysis all hold their last frame — without fading it out. Other props still shape the held frame, and the clocks resume where they stopped.
- borderRadius: number. Custom border radius in pixels. When omitted, the component auto-detects the border-radius of the first child element.
- brightness: number. Brightness multiplier for the glow
- saturation: number. Saturation multiplier for the glow
- glowSize: number. Multiplies the bloom blur radius, so the halo reads tighter (< 1) or wider and softer (> 1).
- strokeOpacity: number. Per-layer opacity multipliers on the theme's own: the crisp edge stroke, the soft inner light and the blurred bloom. The same knobs as the `--voice-stroke-opacity` / `--voice-inner-opacity` / `--voice-bloom-opacity` CSS hooks.
- innerOpacity: number.
- bloomOpacity: number.
- bend: number. Bend — how much, in px, the glow's top contour humps up at the centre at full level. The ceiling the glow is masked to gains that height in the middle and none at the ends, and a faint rim traces the curve, so the glow's outline bows upward with the voice like space bending around it. 0 keeps the contour at its plain ellipse.
- bandStrength: number. Opacity of the band, 0 hides it.
- bandWidth: number. Thickness of the band.
- bandPosition: number. Height of the band's peak as a fraction of the glow's ceiling, 0.1–1.3.
- bandCurve: number. Bell exponent: below 2 an exponential, cusp-like rise; 2 a gaussian; above, a flatter top.
- bandSpread: number. Bell width as a fraction of the glow's half-range: small is a narrow spike with long tails, large a broad dome.
- bandSkew: number. Asymmetry, −0.6–0.6: positive widens the right side and steepens the left.
- bandOffset: number. Vertical shift of the whole band line in px; negative sinks it toward the edge.
- bandTail: number. How far the band's ends rise again toward the corners, as a fraction of its peak, 0–1 — the line opens upward at the edges instead of dying flat.
- bandTailPosition: number. Where the tail's rise starts, as a share of the distance from the beam's centre to the element's edge (0.85 = only the last 15%); it always reaches the full lift exactly at the corner.
- bandTailCurve: number. Exponent of the rise: 1 a straight ramp, 2 a parabola, higher a hook that stays low and whips up at the corner.
- bandTailOverflow: number. Px the band runs past each side of the element, so the hook peaks outside and is cropped by the component's edge. Scales with `scale`.
- bandAberration: number. Chromatic aberration — how far the red and blue fringes split from the core, 0–1.
- distortion: number. Distortion — how much the glow under the band warps sideways, 0–1. A slowly drifting noise field displaces the inner light and the bloom horizontally, stronger as the voice rises, so the colours shimmer and stretch like light through bent space. Only the glow UNDER the band line warps — the layers are split at the line — and it is independent of `bandStrength`, so the line can be invisible and the warp strong. The edge stroke stays crisp. 0 turns the filter off entirely.
- distortionDetail: number. Grain of the distortion's noise: below 1 broad slow waves, above 1 finer ripples.
- glowWidth: number. Width of every colour lobe, all layers — on the dots and lines, the width of each hill.
- glowHeight: number. Height of every colour lobe, all layers.
- lobeSpacing: number. Distance between the lobes (and the ring the flow travels) — on the dots and lines, between the hills.
- rangeWidth: number. Width of the visible ellipse the glow is masked to.
- rangeHeight: number. Height of the visible ellipse the glow is masked to.
- softness: number. Where each lobe fades out — below 1 crisper, above 1 softer.
- coreSize: number. The white hot spot at the centre of the edge.
- coreLight: number. The epicentre: a soft white wash under the band line at the centre of the edge, so the source reads lighter than the band. 0–3: up to 1 the wash's opacity, past 1 its solid white core widens and the whole wash grows, washing out more of the colour beneath.
- coreLightWidth: number. Width of the epicentre wash.
- coreLightHeight: number. Height of the epicentre wash.
- strokeScale: number. Size of the colours painted into the 1px edge stroke.
- innerScale: number. Size of the soft light inside the element.
- innerHeight: number. Extra height of the inner light — how far it reaches into the element.
- bloomScale: number. Size of the blurred halo.
- bloomHeight: number. Extra height of the halo — how far the soft light climbs.
- strength: number. Overall strength/opacity of the effect (0–1). Only affects the beam layers — not the children.
- css: string. Extra CSS appended after the beam's own generated stylesheet. Write `{id}` wherever the instance id belongs — the root is `[data-voice-beam="{id}"]`, its layers the `::before` / `::after` pseudo-elements and `[data-voice-beam-bloom]`, and keyframes are named `*-{id}` — and it is substituted per instance.

## Image
Install source: npx shadcn@latest add https://livenui.dev/r/image.json
An animated pixel mosaic settles into a photograph, with three reveal presets and a complete cycle API.

Import: ImageGeneration from '@/components/livenui/image'
- preset: ImageGenerationPreset. Selects which bundled preset to render. - `pixels-organic` - Chromium Flow rendered as a pixel mosaic. - `pixels-mechanic`- Nebula rendered as a pixel mosaic. - `sweep-gradient` - Gradient Sweep rendered as a pixel mosaic.
- theme: ImageGenerationTheme. Theme mode. `'auto'` resolves via `matchMedia('(prefers-color-scheme: dark)')` and switches live when the OS theme changes.
- strength: number. Effect strength (0..2). In 0..1 it multiplies the shader canvas opacity (the shader keeps animating at full intensity; only the rendered alpha is scaled down) — exactly the historical behavior. Above 1 the canvas stays fully opaque and the shader's palette intensity is boosted instead, making the effect markedly more prominent.
- speed: number. Animation speed multiplier on top of the preset's baked tempo. Scales the effect's whole clock — drift, churn and flicker together — so the character of the motion is preserved. `1` (default) is the preset tempo; `0.5` half speed, `2` double.
- pixelScale: number. Pixel-cell size multiplier for the mosaic effect. Scales the on-screen size of each pixel cell (and the matching reveal dissolve) without touching the preset: - `1` (default) — the preset's authored cell size. - `0.5` — cells at half size (finer grid, effect reads as "zoomed out"). - `2` — cells at double size (chunkier grid, "zoomed in"). Implemented by dividing the shader grid's base cell count by this value, so the shader mosaic and the reveal pixel dissolve stay in lockstep. The grid always keeps a floor of 2 cells, so extreme values are safe.
- cardBg: string. Card background colour. Accepts any CSS colour string the browser can parse — hex (`#rgb` / `#rrggbb` / `#rrggbbaa`), `rgb()` / `rgba()`, `hsl()` / `hsla()`, named colours, modern `color(...)` syntax — and is applied two ways: 1. Verbatim as the wrapper element's CSS `background`, so the original alpha is preserved visually. 2. Parsed to an opaque RGB triple for the shader's `u_cardBg` uniform, which drives colour-proximity / contrast logic so any shader colours that match the card background get faded out and the effect stays visually balanced. Alpha is intentionally dropped when feeding the shader — the renderer has no source for what's behind a translucent card and can't composite correctly. If precise shader behaviour matters under a translucent surface, pass the opaque colour you want the shader to reason against. Useful for keeping colours in sync when the host card surface changes (e.g. dark-mode card swatch). When omitted, the preset's bundled `cardBg` (always opaque hex) is used.
- colors: (string | null | undefined)[]. Optional palette override for the running effect (up to 7 CSS colors, one per shader palette slot). A slot with a value replaces the preset color verbatim; `null` / `undefined` slots keep the preset color. Pass `undefined` (or omit) to use the preset palette. Useful for re-tinting the effect from external data — e.g. colors sampled from the image being regenerated — while keeping the exact same animation and cell grid.
- images: string | string[]. Image pool used by the reveal animation. Pass a single string to reveal the same image every cycle, or an array for random pick (never repeating the previous index).
- autoReveal: boolean. When true, runs the auto-reveal scheduler: shader (random delay) -> reveal -> hold -> hide -> repeat.
- revealDelayRange: [number, number]. Random shader-only delay range in seconds between reveals.
- revealInitialDelay: number | [number, number]. One-time delay applied before the very first reveal (after `autoReveal` is enabled or `triggerReveal` runs the first cycle). Subsequent reveals follow `revealDelayRange`. - `number`: exact seconds. - `[min, max]`: seconds range, randomised once at cycle creation. - `undefined` (default): library picks a small jitter (0-1.5 s) so multiple instances on the same page don't tick in lockstep. Useful for staggering hero cards (e.g. card #2 = `[1, 3]`, card #3 = `[1, 3]`) so they don't all reveal at once.
- revealHoldMs: number | [number, number]. Time the image stays fully visible after the reveal animation completes, before the hide cross-fade kicks in. - `number` — fixed milliseconds. - `[min, max]` — random milliseconds per cycle, picked fresh each reveal.
- revealFadeOutMs: number. ms cross-fade back to the shader.
- borderRadius: number. Optional explicit corner radius (CSS px). When omitted, reads the computed `border-radius` of the wrapped child each resize.
- paused: boolean. Freezes the shader and the auto-reveal scheduler.
- fragmentShader: string. Escape hatch: a replacement fragment shader (GLSL 1.00 syntax, as the bundled one — `gl_FragColor`, `texture2D`). Every uniform the engine uploads keeps its name; the shader is free to interpret them however it likes. The material is shared, so this applies page-wide while set.
- excludeSrcs: () => string[] | Set<string> | null | undefined. Optional callback invoked just before each image pick that returns a list of src strings the cycle MUST avoid this round. Use this to coordinate multiple `<ImageGeneration>` instances that share an image pool so they never display the same image at the same time. The callback runs on every pick (including manual `triggerReveal()`) so it can read live state. If every candidate is excluded, the cycle falls back to a normal random pick so it never gets stuck.

## Bot avatars
Install source: npx shadcn@latest add https://livenui.dev/r/avatars.json
Eighteen living shapes, five materials, expressive states and a wardrobe of playful accessories.

Import: BotAvatar from '@/components/livenui/avatars'
- type: BotAvatarType. Body shape. Default `clover`.
- path: string. A custom body outline: SVG path data in the 100×100 body box, centred on (50, 50), replacing the type's own (and its antennae). The type still sets the face's place, the default colour and the label, so keep the outline solid round the face. Default: the type's outline.
- face: BotAvatarFace. Face kind. Defaults to the type's own.
- state: BotAvatarState. What the bot is doing: `default` (idle), `working` (hopping, spinning) or `sleeping`.
- size: number | string. Rendered size in px, or any CSS length. Default `64`.
- color: string. Body colour. Defaults to the type's palette colour.
- ink: string. Face ink. Defaults to dark, or light on a dark body.
- brightness: number. Lightness of the body colour: 1 as the palette has it, below 1 darker, above 1 lighter (0.5–1.5 is the useful range). Default `1`, or the type's own (the star's is `1.1`).
- saturation: number. Saturation of the body colour: 1 as the palette has it, below 1 duller, above 1 more vivid, 0.5–2.5. Past 1.5, where most of the palette is already as saturated as a screen shows it, the colour is pushed along its own hue toward its most vivid shade (deepening by at most 15% where the screen cannot show it brighter), the shade side grows richer, and `plastic` and `fabric` keep more of it in the light — highlights, sheen, rim and fur tips stay coloured rather than paling toward white. Default `1.5`, or the type's own (the star's is `1.84`).
- speed: number. Multiplier on every animation's speed. Default `1`.
- paused: boolean. Freeze every animation on its current frame.
- seed: number. 0–1. Offsets the blink and glance timing so a row of avatars does not blink in unison. Defaults to a value derived from the instance id.
- shading: BotAvatarShading | boolean. How the body is lit: `fabric` (default), `plastic`, `crisp`, `smooth` or `flat`. `true` and `false` mean crisp and flat.
- hat: BotAvatarHat. A hat, sitting on the top of the head and turning with it: `beret`, `beanie`, `party` or `crown`. Default `none`.
- glasses: BotAvatarGlasses. Glasses over the eyes: `round`, `square` or `shades`. Default `none`.
- headphones: boolean. Headphones over the head, a cup on either side. Default `false`.
- bowTie: boolean. A bow tie under the face. Default `false`.
- accessoryColor: string. Colour of the hat, the headphones and the bow tie. Default a soft black.
- shadow: number. Strength of the shadow side, 0–2. Default `0.35` (`1.15` for `fabric`).
- highlight: number. Strength of the lit side, 0–2. Default `1.3` (`1.45` for `fabric`).
- depth: number. Thickness of the body, 0.2–2: what shows when it turns or flips. Default `0.65`.
- roundness: number. `plastic` and `fabric`: the body's profile through its depth, 0–1. At `1` (default) it is inflated like a cushion or a plush toy — thickest in the middle and rounding off to nothing at the outline all round, so a turn shows a round side; toward `0` it becomes a slab with soft edges.
- furLength: number. `fabric`: length of the pile, 0.3–2.5. Default `1`.
- furDensity: number. `fabric`: how many fibres, 0.3–2. Default `1.6`.
- furFuzz: number. `fabric`: softness of the silhouette — the haze of fine hairs standing past it, 0–1. Default `0.9`.
- furClumps: number. `fabric`: how much the fibres gather into tufts, 0–1. Default `0.4`.
- furCurl: number. `fabric`: how wavy the fibres are, 0 (straight) – 1. Default `0.7`.
- furGravity: number. `fabric`: how much the pile hangs, 0–1 — combed down from a parting at the top, lying over the top edge and hanging off the sides and bottom, rather than standing out evenly all round. Default `0.9`.
- light: number. Where the light comes from, in degrees clockwise from the top. Default `300` (`295` for `fabric`): from the upper left, like a studio key light.
- rim: number. Width of the lit rim in `crisp` shading, strength of the Fresnel rim in `plastic`, of the back light in `fabric` — the bright rim it wraps round the top and sides, and the glow of the edge's hairs — 0–2. Default `0.5` (`0.6` for `fabric`).
- backLight: number. `fabric`: where the back light comes from, in degrees clockwise from the top. Default: above the toy, toward the side away from `light`.
- lightFront: number. `fabric`: how far round to the front the key light sits, in degrees — `0` grazes the toy from the side (dramatic), `85` lights it nearly from the camera (flat). Default `32`.
- shine: number. `fabric`: strength of the highlights along single fibres where the key grazes the pile, 0–2. Default `0` (off: a soft, matte pile).
- sheen: number. `fabric`: the smooth, satin sheen over the body's edge — the key's sheen and the back light's band as even gradients, a material shine rather than the fur's own — 0 (matte, only the fibres shine) – 2. Default `0`.
- backSoftness: number. `fabric`: how soft the back light is, 0–1 — `0` a small source caught on single fibres as crisp bright hairs, `1` a large one, an even glow reaching further in from the edge and fading out gently. Default `1`.
- spread: number. Reach of the soft shading in `smooth`, width of the highlight in `plastic`, how far the light wraps round in `fabric`, 0.4–2.5. Default `1.55` (`1.6` for `fabric`).
- pose: { yaw?: number; pitch?: number; roll?: number }. Holds the body at this orientation, in radians — `yaw` turns it to the viewer's right, `pitch` tips it to look up, `roll` tilts it — in the state's rest pose, overriding the animation's turns, hops and glances (and pointer play) while it is set. For turning an avatar round by hand, as a 3D viewer does; usually with `paused`.
- interactive: boolean. Pointer play: the eyes and head follow a pointer that comes near, and a click makes the avatar hop and turn right round. Default `true`.
- theme: 'auto' | 'dark' | 'light'. The surface the avatar sits on, for touches that have to read against it. `auto` (default) reads an ancestor `data-theme` attribute or `dark` / `light` class, then `prefers-color-scheme`.
- turn: number. How far the head turns from side to side while idle, 0–2: `1` as the library has it, `0` keeps it facing forward. Default `1`.
- whirl: number. The whirl round a spin: its strength, 0–2. Off by default (`0`); `1` turns it on.
- whirlSize: number. Size of the whirl's ring, 0.6–1.6. Default `1`.
- whirlWidth: number. Thickness of the whirl's trail, 0.4–2. Default `1`.
- whirlLength: number. Length of the trail round the ring, 0.4–1.6. Default `1`.
- whirlTilt: number. How flat the ring is seen, 0.5–1.8 (higher is more open). Default `1`.
- jumpHeight: number. The jump (an idle flip, a click): how high, in body units — the body is 100 tall. Default `26`.
- jumpTime: number. Seconds the jump spends in the air. Default `0.68`.
- jumpStretch: number. How much the body stretches in the air, 0–2. Default `1`.
- jumpSquash: number. How much the body squashes on the ground, before take-off and on landing, 0–2. Default `1.15`.
- jumpSquashTime: number. Seconds the landing squash takes, from contact to recovered. Default `0.37`.
- jumpSquashEase: BotAvatarSquashEase. How the landing squash plays out: `sharp` (all at once, then eases off), `pulse` (a quick press that recovers without a wobble, the default), `soft` (eases in and out), `bouncy` (overshoots into a stretch and settles).
- jumpGroundTime: number. Seconds a jump holds its deepest squash on the ground before recovering. Default `0.11`.
- jumpGroundEase: BotAvatarSquashEase. How the weight settles through that hold, in the same shapes as `jumpSquashEase`: the body presses a little deeper and comes back to the held depth, `sharp` at once, `pulse` quickly, `soft` in the middle, `bouncy` with a wobble. Default `pulse`.
- jumpRiseTime: number. Seconds the body takes to rise from its deepest squash back to its own shape. Default `0.33`.
- jumpRiseEase: BotAvatarSquashEase. How it rises: `sharp` lets go at once and eases in to rest, `pulse` leaves quickly with a long settle, `soft` eases out of the squash and into rest, `bouncy` passes rest into a slight stretch and settles back. Default `pulse`.
- jumpClickSquashTime: number. Seconds a click's jump takes for its landing squash (an idle jump's uses `jumpSquashTime`). Default `0.24`.
- jumpSpin: number. Whole turns made in the air, 0–2. Default `1`.
- jumpLean: number. Degrees of lean into a jump. Default `6`.
- jumpEvery: number. Seconds between idle jumps, give or take 40 %; 0 for none. Default `8`.
- jumpLand: number. When the landing squash begins: seconds before touch-down (negative, bracing for the ground) or after it. Default `0`, the moment of contact.
