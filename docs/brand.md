# Website identity

The Liven UI mark is an original rounded L with an unfolding leaf. The L anchors the product name; the detached leaf suggests interfaces coming to life and gives the silhouette a recognizable second element. Both shapes remain separated at favicon size. The mark has no embedded animation, texture, shadow or external imagery.

## Research and selection

Research reviewed on 2026-10-06:

| Primary source | Principle studied | Local application |
| --- | --- | --- |
| [Gemini visual design](https://design.google/library/gemini-ai-visual-design) | Simple circle-based geometry, negative space and gradients connect identity with interface elements | Rounded geometry and the existing blue-to-violet accent; an original L and leaf silhouette |
| [Google icon update](https://blog.google/company-news/inside-google/company-announcements/gradient-g-logo-design/) | A consistent gradient identity spans products and surfaces | The same mark and accent stops across navigation, browser icons and sharing images |
| [Linear brand guidelines](https://linear.app/brand) | Clear space; wordmark when space permits and a concise mark in tight layouts | Keep Liven UI text beside the navigation mark and use the mark alone for browser icons |

Three original vector studies compared a plain rounded L, an L with a leaf and a continuous ribbon at 16, 20, 24 and 32px on light and dark backgrounds. The leaf version retains the readable L while giving the mark a more distinctive silhouette. Reference logos, palettes and artwork are not included in the repository.

## Ownership

- [logo.svg](../apps/docs/public/logo.svg) owns vector geometry and accessible standalone description. Its 40-unit square includes four units of clear space on every edge.
- [tokens.css](../packages/agent-ui/src/tokens.css) owns the two accent stops and `--gradient-accent`. SVG gradient endpoints match the existing 120-degree direction.
- [layout.shared.tsx](../apps/docs/lib/layout.shared.tsx) owns the shared navigation title in the desktop sidebar and mobile drawer. The decorative mark uses the canonical SVG as a mask; [brand.css](../apps/docs/app/brand.css) applies `--gradient-accent` at 24px. Visible text supplies the link's accessible name.
- [metadata.ts](../apps/docs/lib/metadata.ts) declares the SVG favicon, multi-resolution ICO fallback and 180px touch icon.
- The [sharing template](../apps/docs/app/og/[...slug]/generate.tsx) embeds the canonical SVG locally, without a network fetch.

The touch icon uses an opaque white canvas with inset artwork, letting the operating system own its presentation. The website mark uses the same accent in both themes. Primary buttons and selected pills retain their gradient and white text; their contrast flags remain accepted design trade-offs.

## Regeneration and verification

Run `bun run scripts/generate-brand-assets.ts` after changing geometry or accent stops. The generator reads the canonical SVG and tokens, refreshes SVG stops and produces 16/32/48px ICO entries plus the touch icon. It uses the image processor included with the existing application framework; it does not download artwork.

Run the gates in [testing](testing.md). [branding.spec.ts](../e2e/branding.spec.ts) checks accessible navigation, gradient/mask styles, decoded icon dimensions, visible accent pixels, unclipped favicon bounds and an actual rendered sharing image. Inspect isolated navigation marks, small icons, sharing output and full-page desktop/mobile captures in both themes. Browser asset caches may retain an old favicon until a reload or cache refresh.
