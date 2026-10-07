# Liven UI design guide

This is the visual contract for the developer component library, including its agent-maintained UI. Read [architecture](docs/architecture.md) for ownership and [testing](docs/testing.md) for verification.

## Product structure

Keep Fumadocs Glass as the application shell. One page-tree entry owns each navigation destination; do not add a second shortcut that activates for the same route. Overview explains the task each component serves. Examples compare configurations. Component guides show a few starting examples and essential settings. Studio offers complete customization, JSON editing and browser-local saved presets, with a visible starting-point selector.

Preview / Install & Usage is the primary task switch on guides and Studio. Keep Open in Studio and Copy agent prompt beside it. Preview source order is starting examples on guides → preview → controls → current React code; Bot avatars initially open the complete local chat playground; Component preview returns to preview and controls, followed by code and starting examples; Studio begins with component and starting-point context instead of a showcase. Install & Usage contains the source command, current code, integration guidance and optional API disclosure. Import/export stays in Studio. Switching views preserves configuration and releases hidden preview resources.

Preview spans the available content width, followed by customization and current code. The Bot avatars component editor uses a character-first workspace with preview beside a 384px settings panel at feature widths of at least 900px; narrower containers stack them. Its preview stays sticky while settings scroll with the page. The fullscreen chat uses 256px examples and 320px settings columns beside a flexible conversation at container widths of at least 1100px; narrower containers use modal overlays. Chat headers are 64px, panels scroll independently and the composer stays below the feed. Native dialogs contain focus and make covered content inert. See [avatar playground](docs/avatar-playground.md). Fields use three columns on wide containers, two below 900px and one below 550px. The stage keeps a stable minimum height instead of stretching to the number of settings. Guides keep administrative tabs and advanced control search out of the quick-settings panel. Their Studio links carry validated props, variant, effective theme when supported and playback.

Desktop, Tablet (768px) and Mobile (375px) presets form an icon group on a neutral rounded-full track beside playback. The preview frame starts at the left edge, with a vertical grip at its right boundary for pointer/touch dragging. The grip has a 44px hit area, visible focus and a width badge inside the stage. Reserve the grip's width plus 8px in the scene's right padding when resizing is available, so it never covers hosts or interaction buttons. Arrow keys change width by 10px, Shift increases the step to 50px, Home/End select the limits and double-click returns to full width. Escape or pointer cancellation restores the width before dragging. All presets remain accessible on compact screens; the stage caps its width to available space and reports its actual size. The grip hides when the available width is at most 320px. Device selection survives task switches, changes neither SDK props nor exported code, and does not remount the renderer. This is a container-width preview, not browser or hardware emulation. See [preview layout research](docs/preview-layout.md).

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

## Website identity

The website identity uses an original rounded L and unfolding leaf, documented in [brand ownership and research](docs/brand.md). Keep the navigation mark at 24px with its intrinsic clear space, the wordmark at 15px/600 and -0.025em tracking, and the mark filled with `--gradient-accent` in both themes. The icon is decorative beside the visible product name. Preserve its silhouette and use the canonical SVG for favicon and sharing artwork.

## Typography and spacing

Application headings use weight 550, line-height 1.3 and restrained -0.025em tracking. Catalog headings are 24px; panel headings 20–22px; subsection headings 15–16px. The shell owns page H1 and document prose typography. Use 1.5 line-height for labels/controls, 1.6 for help text and 1.8 for code.

Help text has **zero margin by default**, left alignment and a semantic class (`helper-text` or `context-description`). Parents own gaps. `.demo-note` is limited to preview scenes where centered, separated explanatory copy is intentional. Never reuse a margin-bearing preview utility in a toolbar or form row.

Studio's label, select and inline description share the vertical center on wide containers. On narrow containers the label sits above its select and the description moves to a dedicated row. Component labels and selectors must not be scaled by page prose styles. Form labels are 13px; selected text is 13px; selectors are at least 44px high.

Use 24px between primary panels and 20px inside panels. Essential settings use a single dense grid with 12px field gaps. Expanded Studio settings group Appearance, Motion and Interaction with 20px between groups. Choice and switch rows align labels beside compact controls; below 550px their labels move above with an 8px gap. Selects, numeric dials, color and text fields place labels and values inside 54px shells with 4px insets and a 1px border around 44px native targets. Joined radio tracks have no gaps or insets: their 44px targets and 1px border make a 46px strip that grows when choices wrap. Numeric values appear once. Compact toolbar padding is 12–16px. Maintain quiet whitespace; no giant inherited margins, empty decorative sections or repeated heading blocks. See [settings layout](docs/settings-layout.md).

## Control recipes

- Use the shared `Button` for actions and `Select` for owned dropdowns. Both preserve native props and refs. Select forwards native props (including `className`) and refs to its `select`; its `.select-control` wrapper owns the chevron. It retains native keyboard/mobile selection with an inert decorative chevron and explicit padding; do not replace it with a focusless custom div.
- The chat helper picker uses the shared Button and a native auto popover containing a grouped listbox with role descriptions and a selection mark. Keep its options at least 44px high with native button activation, ArrowUp/Down, Home/End, Escape and light dismissal. Show helper selection and New bot only in an empty conversation. Chat avatars use 128px at welcome, 64px above the composer's left edge and 24px in replies; those scene sizes leave exported size unchanged. Shape selection belongs to Playground; component size belongs to the component editor. See [avatar playground](docs/avatar-playground.md).
- Chat settings reuse that popover for Outfit in one 54px compound row, with one trigger focus ring. Place Shape, Outfit and Color in Character; keep Activity beside playback and simulated connection/reply choices in Chat demo. Its two-option native radios use joined tracks beside 80px labels. Customize/Code use equal 44px targets in a 46px joined strip outside the scrolling panel content. Tabs and chat choices use a single 2px inset shadow in `--ring` for visible keyboard focus without overflowing the strip. See [avatar playground](docs/avatar-playground.md).
- Primary action: `button button-accent`, gradient fill and white text. Preserve existing accent actions including Copy code, Apply configuration, Save preset and Copy agent prompt.
- Secondary action: neutral surface, border and foreground. Text action: muted text, minimum target height, clear hover/focus state.
- Selected tabs/pills: gradient fill, white text; inactive states remain neutral. A label badge is not a selected control and stays muted.
- Field: visible associated label and a 44px native target. Choice and switch rows align a 112px label column beside compact controls with a 12px gap; below 550px labels move above with an 8px gap. Selects keep label and value inside one 54px rounded-full row at every width. Numeric dials place the label, drag-window caption, tabular exact input, contextual unit and 44px Default action inside the same shell. A full-area neutral fill shows the numeric position. The native range covers the shell including the displayed value, except the Default action and a focused exact editor. Pressing does not change the value; after 4px of horizontal movement, pointer position maps across the full field to its drag limits. Clicking the value focuses the exact editor. Double-click or Default omits the prop; Escape, pointer cancellation or lost capture restores the value before dragging. Per-field drag windows and editing limits live in pure control metadata; soft windows do not cap valid custom input. Exact edits commit on Enter/blur; Escape cancels; invalid drafts preserve the last valid preview. Auto omits the prop. Keep step instructions in the accessible hint and tooltip. Numeric, color, text and select inputs share one shell focus ring; focus never inserts content or shifts layout. Color and text labels share the inline row, with an 80px label column; exact inputs stay flexible and expose the complete value in a tooltip. Color fields pair a native swatch picker with validated expression entry; avatar Custom size accepts numeric pixels and CSS lengths. Relevant material/look fields hide without deleting values. Native checkboxes use a decorative switch track, a 44px target and visible focus; checked tracks keep the accent gradient and white thumb.
- Short enumerations of up to six options use native radio inputs in one joined neutral strip sized to its contents, without gaps or track insets. Selected options remain rounded-full gradient pills with white text. Categorical controls occupy two columns at 900px or wider and one below; groups with more than three options span the whole row. Numeric, color and text fields occupy a separate three/two/one-column grid, with a quiet divider when categorical controls precede them. Preserve native arrow-key selection and a visible focus ring. Long lists remain native selects; avatar shapes use the thumbnail radio grid described in the avatar playground. Human labels such as Idle map to API values without changing exported props; size presets retain their numeric types, and custom values remain visible.
- Search: accessible name, neutral rounded-full track, focus ring around the composed field. Empty results include an actionable reset.
- JSON/code areas: readable monospace, scroll locally. Multiline editors use a 16px radius rather than capsule geometry. API tables scroll inside their container instead of widening the page.
- Feedback: adjacent `role="status"` or `aria-live` text. Invalid JSON must leave the last valid preview/code intact. Do not convey success or failure only through color.

## Responsive behavior

Use the **owning container width**, not viewport width. Settings panels establish their own inline-size container; the feature container owns workspace composition: the Glass sidebar changes usable width.

| Container | Contract |
| --- | --- |
| Below 900px | Gallery becomes two columns |
| Below 900px | Customization fields become two columns |
| Below 550px | Customization fields and catalog/gallery cards become one column; configuration tabs move below the heading; device controls keep accessible icon labels; guide starting examples use two columns except Liquid's full-width interaction scenes; heading/search stack; Studio context gets a separate help row; command and transfer actions wrap |

At viewport widths 320, 390, 768, 1024 and 1440px, no document overflow is allowed. Image, voice, beam and liquid hosts fit their stage. Native selectors, command text, tabs and long preset names must not force the page wider. Zoom and longer labels are checked manually when changing composition.

## Motion and accessibility

Prefer reduced motion in regression captures; real effects initially pause when reduced motion is requested. Play enables the preview; SDKs may still reduce CSS motion according to the system preference. Replay replaces only the current preview instance. Lazy cards mount around the viewport; do not allocate all 87 GPU scenes at once.

Controls remain keyboard reachable. Tabs implement ArrowLeft/Right and Home/End with one tab stop. Mobile navigation contains focus, supports Escape and restores the opener. Focus rings use `--ring`; visible focus must survive clipping and theme changes. Decorative symbols/chevrons use `aria-hidden` and never become standalone focus targets.

Sidebar destinations use 18px decorative SVG icons with consistent strokes and 44px row targets. Icon detail motion follows each destination's function, runs once for hover or keyboard focus and settles within 840ms. Selecting a destination adds a short appearance cue. Keep labels and row positions stationary, retain the shell's navigation colors and disable all icon animation for reduced motion. Avoid perpetual sidebar effects or extra render engines.

The mobile drawer keeps its header and theme footer outside the scrollable destination list. Keyboard focus must reveal the whole destination row at compact heights; fixed controls must never cover it.

Microphone access starts only through an explicit user action; simulation is separate. Stop tracks and render resources on teardown. Do not add autoplay capture or cloud persistence to local examples.

## CSS ownership and prohibited patterns

The feature's [style entry](apps/docs/features/component-library/styles.css) imports foundation, catalog, playground, integration and preview styles. Each file owns its component selectors. Every rule is scoped to `.agent-libraries`; shell styles remain in `app/global.css`.

Do not append a new override layer to repair an earlier rule. Edit the owning selector and responsive rule. Avoid global styling of every `select`, `details`, `label` or `pre` that can affect SDK children. Do not use `span:last-child` for button icons: a one-span button may contain its primary label. Target explicit decorative attributes instead.

Do not copy reference colors, branding, gradients or spacing. Preserve SDK legal notices separately from public interface copy. Founder/executive/internal team identity display recommendations are skipped. Bright-gradient contrast warnings are accepted design trade-offs in both themes; do not recolor those actions during audits.

## Acceptance

Run the checks described in [testing](docs/testing.md), then review full-page desktop light/dark and mobile light/dark captures. Confirm alignment, typography, long labels, control states, preview quality and source order. Browser layout assertions enforce measurable dimensions; screenshots still require visual review. Update this guide and token contracts together when an intentional design rule changes.
