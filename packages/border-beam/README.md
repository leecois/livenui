# Border Beam

An editable React component with a traveling edge or breathing halo. This implementation uses SVG paths and browser-owned animations; it needs no rendering dependency beyond React.

## Install

```sh
npx shadcn@latest add https://livenui.dev/r/beam.json
```

```tsx
import { BorderBeam } from '@/components/livenui/beam';

export function HighlightCard() {
  return (
    <BorderBeam size="md" colorVariant="ocean" theme="auto">
      <article style={{ padding: 24, borderRadius: 24 }}>
        Make room for ideas.
      </article>
    </BorderBeam>
  );
}
```

Adjust the import to your application's component alias. The wrapper forwards its div ref and standard HTML attributes. Its decorative layers do not intercept input or change the content's opacity.

## Options

| Option | Default | Behavior |
| --- | --- | --- |
| `children` | Required | Content inside the wrapper |
| `size` | `md` | `sm`: short traveling edge; `md`: full-size traveling edge; `line`: bottom edge; `pulse-inner`: contained halo; `pulse-outside`: outward halo |
| `colorVariant` | `colorful` | `colorful`, `mono`, `ocean`, `sunset`, `forest`, `candy`, `ice` or `gold` |
| `theme` | `dark` | `dark`, `light` or `auto`; auto follows system preference |
| `active` | `true` | Play and fade in; false pauses and fades out |
| `duration` | Variant-dependent | Seconds per cycle: 1.96 for traveling borders, 3.1 for line, 2.3 for pulses; bounded to 0.05–3600 |
| `strength` | `1` | Effect opacity, bounded to 0–1 |
| `borderRadius` | Inferred | Pixels; reads the first content element's top-left radius and clamps to half the smaller wrapper dimension |
| `glowSize` | `1` | Halo spread multiplier, bounded to 0–20; blur layers also have fixed upper limits |
| `brightness` | Theme-dependent | 1.3 in dark mode, 0.85 in light mode; bounded to 0–10 |
| `saturation` | `1.2` | Saturation multiplier, bounded to 0–10 |
| `hueRange` | `30` | Hue movement in degrees, bounded to -3600–3600 |
| `staticColors` | `false` | Stop hue movement while retaining edge/pulse motion; mono always uses static colors |
| `css` | None | Optional per-instance CSS; `{id}` becomes the wrapper's identity |
| `onActivate` | None | Called when activation settles, including initial active mounting |
| `onDeactivate` | None | Called when deactivation settles, including initial inactive mounting |
| `className`, `style` | None | Applied to the wrapper |

Non-finite numeric values fall back to defaults. Radius inference tracks resizing, content replacement and the child's class/style changes. Use an explicit `borderRadius` when the content uses asymmetric corners or a radius that changes without a size/class/style change.

The outward halo works with transparent content. Ancestor overflow clipping can still cut it off; leave space around the wrapper when the bloom should remain visible.

## Motion and lifecycle

All five variants pause when outside the viewport or in a hidden document. Reduced motion displays a stationary frame and applies activation immediately. Otherwise activation fades over 180ms. Reversing activation cancels the previous completion callback; unmounting releases animations, observers and listeners. Multiple instances have separate identities and playback.

SVG and the Web Animations, ResizeObserver, IntersectionObserver and MediaQueryList event APIs are the browser integration surface. Server rendering does not access the DOM; effect sizing and motion start after mounting. A browser without `Element.animate` displays the static effect.

## CSS customization

```tsx
<BorderBeam
  css={'[data-beam="{id}"] [data-beam-stroke] { stroke-width: 2; }'}
>
  <button style={{ borderRadius: 24 }}>Continue</button>
</BorderBeam>
```

Use `[data-beam-stroke]`, `[data-beam-glow]` and `[data-beam-bloom]` to target SVG paths. `[data-beam-motion]` groups the moving paths; `[data-beam-color]` owns hue movement. `[data-beam-surface]` owns activation opacity. Scope rules through `[data-beam="{id}"]` to keep instances separate. Pass only trusted application CSS.

The public React prop and export names are retained. Rendering and palette tuning have changed. Earlier pseudo-element selectors, generated keyframe names and internal custom properties are not part of this renderer; migrate those overrides to the SVG layers above.

## Source and license

`src/BorderBeam.tsx` owns React integration and SVG composition, `src/model.ts` owns public types and geometry, and `src/motion.ts` owns animation lifecycle. `src/index.ts` exposes the public API, including `sizePresets`, `sizeThemePresets` and `themeColors`.

The replacement renderer and this guide are authored for Liven UI under [MIT](LICENSE). Historical implementations and retained repository support files keep their applicable original notices. See [the implementation decision](../../docs/decisions/003-original-component-implementations.md) for scope and verification.
