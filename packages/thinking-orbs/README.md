# thinking-orbs

Liven UI maintains and distributes this component as editable source. The installation includes its licenses and available notices. Imports below assume the `@/components` alias; adjust it to your project.

Dotted thought-orb loading indicators for AI & agent UIs. Nine hand-tuned animated states, each shipped at two purpose-tuned sizes, rendered on a plain 2D canvas — no WebGL, no filters, works identically in Chrome, Safari and Firefox.

[Live demo](https://libraries.dev/orbs) · [Repository](https://github.com/Jakubantalik/Libraries.dev) · [Report an issue](https://github.com/Jakubantalik/Libraries.dev/issues)

## Install

```bash
npx shadcn@latest add http://localhost:3000/r/orbs.json
```

## Quick start

```tsx
import { ThinkingOrb } from '@/components/livenui/orbs';

function Status() {
  return <ThinkingOrb state="searching" size={64} />;
}
```

## States

Nine verbs an agent can be doing, each a distinct animation:

```tsx
<ThinkingOrb state="working" />
<ThinkingOrb state="searching" />
<ThinkingOrb state="solving" />
<ThinkingOrb state="listening" />
<ThinkingOrb state="connecting" />
<ThinkingOrb state="weaving" />
<ThinkingOrb state="composing" />
<ThinkingOrb state="breathing" />
<ThinkingOrb state="shaping" />
```

- `<ThinkingOrb state="working" />`: particles on tilted orbits
- `<ThinkingOrb state="searching" />`: a scan meridian sweeps a dotted globe
- `<ThinkingOrb state="solving" />`: bands scramble, then click back solved
- `<ThinkingOrb state="listening" />`: a waveform rolls through the rings
- `<ThinkingOrb state="connecting" />`: a constellation wires itself
- `<ThinkingOrb state="weaving" />`: three strands plait around the sphere
- `<ThinkingOrb state="composing" />`: an undulating multi-band sash
- `<ThinkingOrb state="breathing" />`: a ring slowly morphing
- `<ThinkingOrb state="shaping" />`: dotted outline: circle → triangle → square

## Sizes

Two tuned presets — separate designs, not a scale factor. `64` for chat-avatar scale, `20` for inline-text scale. Each carries its own dot count, dot size and speed tuning:

```tsx
<ThinkingOrb state="working" size={64} />
<ThinkingOrb state="working" size={20} />
```

## Theme

Strictly monochrome — light ink for dark backgrounds, dark ink for light backgrounds — with the mode picked automatically from the host project:

```tsx
<ThinkingOrb theme="auto" />
<ThinkingOrb theme="dark" />
<ThinkingOrb theme="light" />
```

- `<ThinkingOrb theme="auto" />`: default — detects from the project
- `<ThinkingOrb theme="dark" />`: pin: light dots for dark backgrounds
- `<ThinkingOrb theme="light" />`: pin: dark dots for light backgrounds

`auto` resolves in three layers and updates live when any of them change:

1. an ancestor `data-theme="dark|light"` attribute or `dark`/`light` class (the Tailwind / shadcn convention), watched via `MutationObserver`;
2. otherwise `prefers-color-scheme`, subscribed for live OS theme switches;
3. SSR-safe — the canvas paints only on the client, after the theme has resolved.

## Other props

```tsx
<ThinkingOrb
  state="solving"
  size={20}
  speed={1.5}
  paused={false}
  aria-label="Analysing repository…"
/>
```

- `speed={1.5}`: multiplier on the preset's baked speed
- `paused={false}`: freeze on the current frame
- `aria-label="Analysing repository…"`: overrides the per-state default

All other `<canvas>` props (`className`, `style`, `data-*`, …) pass through.

## Accessibility & performance

- `role="img"` with a sensible per-state `aria-label` out of the box.
- `prefers-reduced-motion: reduce` renders a static representative frame — no animation — and still follows the live theme.
- Every instance pauses automatically when scrolled offscreen (`IntersectionObserver`) or when the tab is hidden, and resumes in phase — all instances share one clock.
- Plain 2D canvas arcs only: no `ctx.filter`, no SVG filters, no WebGL — the same pixels everywhere, cheap on low-end devices. Device-pixel-ratio capped at 2.

## License

MIT © Jakub Antalik
