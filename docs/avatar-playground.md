# Avatar playground

Bot avatars put the native character and its configuration first. The guide starts with the interactive workspace, followed by working React code, starting examples and the agent-list example. Studio retains its component selector, starting point, configuration tabs and transfer workflows.

## Reference and adaptation

The public [Momo playground](https://feralui.dev/momo) was inspected in Chromium on 2026-10-07 at 1440px and 390px. It centers a character and its identity beside a compact panel with outfit choices, expressions and color swatches. On mobile, its Playground action opens the configuration panel over the scene. Outfit and expression controls change the character immediately; color choices retain visible selection.

Liven UI adopts the character-first composition, grouped choices and immediate feedback. Presentation uses the existing semantic surfaces, local spacing, rounded-full controls and accent gradient. The avatar guide keeps configuration in normal document flow on compact screens so it remains available beside its integration code. Public chat, connection state and API-key controls are outside this component-library workflow. No reference artwork, colors or character assets are included.

## Layout and controls

- At a feature width of at least 900px, the preview sits beside a 384px settings panel with a 24px gap. The preview remains sticky with a 24px top inset while the longer settings panel scrolls with the page. Below 900px, preview and settings stack in source order. Each settings panel is an inline-size container, so its fields and navigation respond to its actual width.
- The stage keeps a 448px minimum height, reduced to 340px when the preview frame is narrower than 550px, and centers the configured native avatar above its shape name and activity. Its canvas retains the configured size; the interface does not scale it into a different integration size. Device widths, playback, resizing and renderer ownership retain their existing contracts.
- Shape choices use native radios with paused 32px flat thumbnails rendered by the existing preview adapter. Eight common shapes are initially visible; Browse reveals every catalog shape. A selected shape outside the initial set remains visible after collapsing or importing a configuration. Default omits the type prop. Radio keys preserve native selection and focus.
- Activity, Material and Size keep their existing native choices. Color, Hat and Glasses are available in essential settings. Empty Hat and Glasses props show None, matching SDK defaults, without adding props to exported code.
- Six quick colors come from the existing SDK palette. A selected swatch keeps the accent gradient and white foreground around its actual color sample. The native picker and validated hex/rgb/hsl entry remain available. Choosing a swatch replaces an unfinished color draft; Default restores the shape's own palette color.
- Shape, color and accessory changes update the single playground state. They preserve other props and the main renderer instance. Thumbnails are decorative, inert and paused; expanded thumbnails unmount when collapsed. Full field controls remain keyed under the same grid parent across advanced expansion.

## Ownership and verification

Composition belongs to `views/workbench.tsx`, shape choices to `components/avatar-shape-control.tsx`, color drafts to `components/color-control.tsx` and native rendering to `previews/avatars.tsx`. Essential fields and quick colors belong to `lib/content.ts`. Runtime SDK imports stay in the preview adapter; no rendering engine or package API is replaced.

Run the gates in [testing](testing.md). `e2e/avatar-layout.spec.ts` verifies wide/compact panel geometry, preview/code/example source order, all shape choices, imported/default selection, native radio keys, color draft replacement, accessory retention, renderer identity and containment at 320/768/1024px. Inspect its full-page guide/Studio, accessory, visible example, agent-list and isolated settings captures in desktop/mobile light/dark. Existing mascot raster, device-width, workflow and settings suites remain required. `tests/avatar-content.test.ts` guards quick colors against the retained SDK palette. Browser checks use Chromium with software rendering and synthetic input, not physical devices or deployment.
