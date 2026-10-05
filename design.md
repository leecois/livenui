# Liven UI design guide

This is the visual contract for the developer component library, including its agent-maintained UI. Read [architecture](docs/architecture.md) for ownership and [testing](docs/testing.md) for verification.

## Product structure

Keep Fumadocs Glass as the application shell. One page-tree entry owns each navigation destination; do not add a second shortcut that activates for the same route. Overview explains the task each component serves. Examples compare configurations. Component guides show a few starting examples and essential settings. Studio offers complete customization, JSON editing and browser-local saved presets, with a visible starting-point selector.

Preview / Install & Usage is the primary task switch on guides and Studio. Keep Open in Studio and Copy agent prompt beside it. Preview source order is starting examples on guides → preview → controls → current React code; Studio begins with component and starting-point context instead of a showcase. Install & Usage contains the source command, current code, integration guidance and optional API disclosure. Import/export stays in Studio. Switching views preserves configuration and releases hidden preview resources.

Desktop places preview and controls side by side with aligned top and bottom edges; the preview stage absorbs extra height rather than leaving a gap beneath it. Narrow containers stack them in this same order. The preview is a stable stage; controls must not compete with the effect for emphasis. Guides keep administrative tabs and advanced control search out of the quick-settings panel. Their Studio links carry validated props, variant, effective theme when supported and playback.

## Token source

[packages/agent-ui/src/tokens.css](packages/agent-ui/src/tokens.css) is the sole owner of Liven UI emphasis, spacing, control geometry and application type-size constants. Theme-dependent colors map to the existing shell's `--color-fd-*` tokens. Do not introduce a parallel `data-theme` palette or hardcoded light/dark surface colors.

| Token | Value or source | Use |
| --- | --- | --- |
| `--gradient-accent` | 120° blue-to-violet gradient | Bright primary actions and selected accent pills |
| `--foreground` / `--background` | Shell foreground/background | Content and canvas surroundings |
| `--surface` / `--surface-glass` | Shell card / 94% card mix | Cards and preview surfaces |
| `--track` | Shell muted | Neutral tracks, command backgrounds, secondary badges |
| `--muted` / `--border` / `--ring` | Shell muted foreground/border/ring | Supporting text, dividers, focus |
| `--livenui-space-1/2/3/4/5/6/8` | 4/8/12/16/20/24/32px | Spacing scale |
| `--livenui-control-height` | 44px | Form controls, buttons, tabs and actionable pills |
| `--livenui-radius-control` | 9999px | Rounded-full controls |
| `--livenui-radius-panel` | 24px | Panels, preview corners, cards |
| `--livenui-font-body/label/caption` | 14/13/12px | Owned application UI |

SDK scenes can use their documented geometry and typography when those affect rendering. Their aesthetic parameters are not reasons to enlarge ordinary labels, shrink form targets or create new app colors.

## Typography and spacing

Application headings use weight 550, line-height 1.3 and restrained -0.025em tracking. Catalog headings are 24px; panel headings 20–22px; subsection headings 15–16px. The shell owns page H1 and document prose typography. Use 1.5 line-height for labels/controls, 1.6 for help text and 1.8 for code.

Help text has **zero margin by default**, left alignment and a semantic class (`helper-text` or `context-description`). Parents own gaps. `.demo-note` is limited to preview scenes where centered, separated explanatory copy is intentional. Never reuse a margin-bearing preview utility in a toolbar or form row.

Studio's label, select and inline description share the vertical center on wide containers. On narrow containers the label sits above its select and the description moves to a dedicated row. Component labels and selectors must not be scaled by page prose styles. Form labels are 13px; selected text is 13px; selectors are at least 44px high.

Use 24px between primary panels, 20px inside panels, 16px between fields and 8px between label and control. Compact toolbar padding is 12–16px. Maintain quiet whitespace; no giant inherited margins, empty decorative sections or repeated heading blocks.

## Control recipes

- Use the shared `Button` for actions and `Select` for owned dropdowns. Both preserve native props and refs. Select forwards native props (including `className`) and refs to its `select`; its `.select-control` wrapper owns the chevron. It retains native keyboard/mobile selection with an inert decorative chevron and explicit padding; do not replace it with a focusless custom div.
- Primary action: `button button-accent`, gradient fill and white text. Preserve existing accent actions including Copy code, Apply configuration, Save preset and Copy agent prompt.
- Secondary action: neutral surface, border and foreground. Text action: muted text, minimum target height, clear hover/focus state.
- Selected tabs/pills: gradient fill, white text; inactive states remain neutral. A label badge is not a selected control and stays muted.
- Field: visible associated label, 8px gap, rounded-full 44px control. Numeric values use tabular figures. Checkbox labels enlarge the hit target to 44px.
- Short enumerations use native radio inputs inside labeled rounded-full pills. Preserve native arrow-key selection and a visible focus ring. Long lists remain native selects. Human labels such as Idle map to API values without changing exported props; size presets retain their numeric types, and custom values remain visible.
- Search: accessible name, neutral rounded-full track, focus ring around the composed field. Empty results include an actionable reset.
- JSON/code areas: readable monospace, scroll locally. Multiline editors use a 16px radius rather than capsule geometry. API tables scroll inside their container instead of widening the page.
- Feedback: adjacent `role="status"` or `aria-live` text. Invalid JSON must leave the last valid preview/code intact. Do not convey success or failure only through color.

## Responsive behavior

Use the **feature container width**, not viewport width: the Glass sidebar changes usable width.

| Container | Contract |
| --- | --- |
| Below 900px | Gallery becomes two columns |
| Below 760px | Preview/controls stack; control content loses its inner scroll limit; workflow stacks |
| Below 550px | Catalog/gallery cards become one column; guide starting examples use two columns except Liquid's full-width interaction scenes; heading/search stack; Studio context gets a separate help row; command and transfer actions wrap |

At viewport widths 320, 390, 768, 1024 and 1440px, no document overflow is allowed. Image, voice, beam and liquid hosts fit their stage. Native selectors, command text, tabs and long preset names must not force the page wider. Zoom and longer labels are checked manually when changing composition.

## Motion and accessibility

Prefer reduced motion in regression captures; real effects initially pause when reduced motion is requested. Play enables the preview; SDKs may still reduce CSS motion according to the system preference. Replay replaces only the current preview instance. Lazy cards mount around the viewport; do not allocate all 83 GPU scenes at once.

Controls remain keyboard reachable. Tabs implement ArrowLeft/Right and Home/End with one tab stop. Mobile navigation contains focus, supports Escape and restores the opener. Focus rings use `--ring`; visible focus must survive clipping and theme changes. Decorative symbols/chevrons use `aria-hidden` and never become standalone focus targets.

Microphone access starts only through an explicit user action; simulation is separate. Stop tracks and render resources on teardown. Do not add autoplay capture or cloud persistence to local examples.

## CSS ownership and prohibited patterns

The feature's [style entry](apps/docs/features/component-library/styles.css) imports foundation, catalog, playground, integration and preview styles. Each file owns its component selectors. Every rule is scoped to `.agent-libraries`; shell styles remain in `app/global.css`.

Do not append a new override layer to repair an earlier rule. Edit the owning selector and responsive rule. Avoid global styling of every `select`, `details`, `label` or `pre` that can affect SDK children. Do not use `span:last-child` for button icons: a one-span button may contain its primary label. Target explicit decorative attributes instead.

Do not copy reference colors, branding, gradients or spacing. Preserve SDK legal notices separately from public interface copy. Founder/executive/internal team identity display recommendations are skipped. Bright-gradient contrast warnings are accepted design trade-offs in both themes; do not recolor those actions during audits.

## Acceptance

Run the checks described in [testing](docs/testing.md), then review full-page desktop light/dark and mobile light/dark captures. Confirm alignment, typography, long labels, control states, preview quality and source order. Browser layout assertions enforce measurable dimensions; screenshots still require visual review. Update this guide and token contracts together when an intentional design rule changes.
