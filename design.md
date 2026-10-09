# Liven UI design guide

Liven UI is a developer component library. Design the shortest useful path: **find a component → interact with it → configure it → copy working integration code**. The rendered component leads; controls explain how to change it.

This is the implemented interface contract. Read [architecture](docs/architecture.md) for ownership, [development](docs/development.md) for change recipes and [testing](docs/testing.md) for acceptance. The public-reference review is recorded in [interface research](docs/interface-research.md).

## Design direction

Use quiet shell surfaces, restrained borders, small section labels and direct controls. Put choices where they can be compared before selection. A control should reveal its purpose, current state and available actions without opening a menu. Whitespace separates tasks; decorative containers should not create extra steps.

Remove copy that repeats a tab, heading, action or visible state. Use one label per task and let the component demonstrate its behavior. Keep interaction hints, ambiguous defaults, validation and local-only notices; reveal integration requirements in contextual notes. Studio has no header tagline, component-description paragraph or second Customize heading. Do not replace removed prose with decorative badges or icon-only controls that hide an unfamiliar action.

Inline expansion uses “All N” and “Show fewer” within its labeled group; accessible names retain the group context. Preview hints name the gesture rather than narrating the configuration workflow.

The reference catalog's strongest patterns are the object-first demos, visible chip families, parameter dials, contextual side panels and motion tied to gestures. Adapt these patterns with Liven UI's tokens and native behavior. Keep original artwork, product identity, SDK effects and legal attribution.

## Clean labels

A label names one action, property or state. Prefer one to three familiar words in sentence case, keeping any qualifier needed to avoid ambiguity. Actions use verbs such as Save or Replay; properties use nouns such as Color or Duration; feedback names the result, such as Copied or Copy failed. Preserve product and API capitalization.

Let the surrounding group supply context once. Keep the full meaning in accessible names and contextual hints; required instructions, errors and recovery actions stay visible. Do not shorten a label until different actions or states become indistinguishable.

| Context | Compact presentation | Retained meaning |
| --- | --- | --- |
| Presets form | Save | Accessible name Save preset; browser-local storage hint |
| Installation command | Copy icon | Accessible name Copy command; tooltip and live feedback |
| Clipboard feedback | Copied / Copy failed | Actual outcome of the current request |

An optional icon reinforces the text only when it helps recognition. Keep decorative icons hidden from assistive technology, align them consistently and use `--livenui-space-2` for the icon/text gap. Use the existing label typography; code fonts belong to code. Long labels wrap rather than overlap or lose their meaning through truncation.

Passive status labels fit their content, remain non-interactive and use neutral shell tokens with rounded-full geometry. Text carries the meaning; color and icons support it. Interactive choices retain their existing track/grid geometry, native semantics, 44px targets and focus feedback. Primary actions and selected pills retain `--gradient-accent` with white text. A static status-label reference does not establish hover, focus or animation behavior.

Default, Custom and effective switch states use quiet 12px status labels with 14px decorative icons, 4px/8px padding and an 8px icon/text gap. Default retains the full component-default explanation in the group's accessible description. Studio starting points omit repeated component suffixes from visible labels while retaining complete example names and IDs. Palette and Glow are presentation names; exported props remain `colorVariant` and `glowSize`.

Contextual actions use Copy, Apply, Advanced, Essential and Open Studio, with complete accessible names. Playback uses decorative SVG icons alongside Play, Pause and Replay. Text copy buttons reserve space for their label and failure feedback, so Copied/Copy failed never resize the target. The disabled Studio copy action uses the same geometry before configuration loads. Compact Studio headers visually hide the entire text reservation while retaining live feedback and a centered icon within the 44px target.

## Choose the right control

| User task | Control | Contract |
| --- | --- | --- |
| Switch between two or three modes | Balanced segmented track | Native radios, equal cells, neutral track and one moving selected pill |
| Compare four or more finite variants | Visible chip grid | Separate rounded-full targets; no wrapping capsule or floating menu |
| Browse a long enum or preset family | Chip grid with inline expansion | Show the first eight options; retain a selected option outside that subset; reveal the complete list in place |
| Choose a component in Studio | Visible navigation links | All seven destinations remain discoverable; one current route |
| Choose an installation runner | Three compact native radio chips | npm, pnpm and Bun remain visible without an enclosing track or redundant visible label |
| Save or restore a configuration | Presets inspector tab | Name, save, load and delete browser-local presets beside the live preview |
| Choose a starting example | Inline preset choices | Full-width stacked chips even for two or three examples; show six initially; selection loads the existing example; current custom configuration remains explicit |
| Choose a bot shape | Native thumbnail radios | Eight featured shapes, expandable to the complete catalog; selected shape stays visible after collapse |
| Choose a chat outfit | Inline outfit chips | Six initially, all eighteen through expansion; descriptions in tooltips; custom accessory combinations remain explicit |
| Tune a number | Full-field drag dial plus exact entry | Pointer position reaches both limits inside the field; exact editing and cancellation remain available |
| Enable a feature | Native checkbox with a decorative switch | A visible label and effective On/Off state; Auto remains explicit |
| Choose a color | Swatches plus exact expression | Native color picker and validated text; retain documented CSS/RGB/HSL forms |
| Enter text, JSON or code | Native editor | Visible label, local overflow and nearby validation feedback |

Owned configuration, installation, Studio context and Liquid behavior controls use direct choices. Do not introduce dropdowns for an existing finite enum. The shared native `Select` remains available for a future genuinely large search-oriented domain; using it requires a documented reason and keyboard/mobile verification. Never replace a native control with a focusless clickable div.

Every enum keeps its original typed value. Display names such as Idle are presentation only. Default actions omit the prop rather than invent a new enum value. A missing optional enum shows Default with a “Using component default” accessible description; imported custom values stay visible. Numeric avatar size presets retain numeric values; Custom continues to accept pixels and CSS lengths.

## Tokens and identity

[packages/agent-ui/src/tokens.css](packages/agent-ui/src/tokens.css) owns emphasis, spacing, geometry, type sizes and control motion. Theme colors come from the shell's `--color-fd-*` tokens. Do not add a second light/dark palette.

| Token | Value | Use |
| --- | --- | --- |
| `--gradient-accent` | Existing 120° blue-to-violet gradient | Primary actions and selected accent controls |
| `--foreground` / `--background` | Shell foreground/background | Content and canvas surroundings |
| `--surface` / `--surface-glass` | Shell card / 94% card mix | Panels and preview surfaces |
| `--track` | Shell muted surface | Inset tracks and command backgrounds |
| `--muted` / `--border` / `--ring` | Shell semantic colors | Help text, dividers and focus |
| `--livenui-space-1/2/3/4/5/6/8` | 4/8/12/16/20/24/32px | Contextual spacing |
| `--livenui-control-height` | 44px | Minimum interactive height |
| `--livenui-radius-control` | 9999px | Buttons, chips and tracks |
| `--livenui-radius-panel` | 24px | Panels, cards and preview corners |
| `--livenui-font-body/label/caption` | 14/13/12px | Application text |
| `--livenui-font-input` | 13px; 16px with a coarse primary pointer | Editable values; body-size editors use the larger body/input token |
| `--livenui-motion-feedback` | 160ms | Hover, border and pressed feedback |
| `--livenui-focus-width/offset` | 2px / -2px | Focus indicators inside the target boundary |
| `--livenui-motion-selection` | 240ms | Selected indicator movement |
| `--livenui-ease-selection` | cubic-bezier(0.22, 1, 0.36, 1) | Finite control motion |

Keep bright accent actions and selected pills filled with `--gradient-accent` and white text in both themes. Accent contrast warnings are accepted design trade-offs. Secondary actions use neutral surfaces and borders; text actions use muted text with a full-height target. Badges that do not select anything remain neutral.

The original rounded L and unfolding leaf use the canonical SVG. Keep the navigation mark 24px and wordmark 15px/600 with -0.025em tracking. The website mark uses the shell foreground: white in dark mode and dark ink in light mode. Standalone SVG follows the embedding color scheme; raster icons use a light mark on a neutral dark canvas. Reserve the accent gradient for primary actions and selected controls. See [brand ownership](docs/brand.md). Preserve legal licenses and attribution. Public copy, metadata and UI must not expose founder, executive or internal team identities; team-profile recommendations are skipped requirements.

## Page anatomy

Keep the Glass shell and a single page-tree destination for each route. Overview explains component use cases, Gallery compares configurations, guides provide essential controls, and Studio offers all controls, JSON and browser-local saved presets.

On guides, Preview / Install & Usage is the main task switch. Keep Open in Studio and Copy prompt nearby. Ordinary guides show starting examples, preview, quick settings and current code in reading order. Studio opens a fullscreen workspace: component links and starting examples on the left, persistent live preview in the center, and Customize / Presets / Code on the right. At 1100px these columns are 256px, flexible and 352px. Below 1100px, Components becomes a native drawer; below 700px, preview and inspector stack in two viewport rows with independent scrolling. Header and inspector tabs stay outside scroll regions. JSON is a disclosure in Customize; installation lives in Code. See [Studio workspace](docs/studio-workspace.md). Installation combines the source command, current configured code, integration guidance and optional API reference. Package manager choices and the icon copy action sit above the complete command. Import/export remains in Studio.

Bot avatars initially open the local chat playground. The server-delivered HTML opens its native dialog before hydration, so entry and reload do not flash the covered guide. Its responsive columns and composer occupy the same positions while the native renderer loads. Component preview leads with the character workspace, followed by code and starting examples. At feature widths of at least 900px, the preview sits beside a 384px settings panel and stays sticky; narrower containers stack them. The fullscreen chat uses 256px Examples and 320px Playground columns beside the conversation at widths of at least 1100px. Smaller containers use native modal overlays. Headers are 64px, panel contents scroll independently, and Customize/Code stays outside the scrolling content. The composer stays below the feed. See [avatar playground](docs/avatar-playground.md).

The stage keeps a stable minimum height instead of growing with settings. Fullscreen chat clips overflow at its outer dialog; only the sidebars and message feed scroll, so wheel input or focus cannot move the entire layout offscreen. Guide configuration survives task switches while hidden render resources release. Studio inspector tabs retain the live renderer. Component navigation releases the departing scene and retains its validated configuration, playback, JSON draft and preview width for the current Studio visit. Explicit examples/fragments take precedence; only saved presets persist across reload. Guides avoid Saved/JSON tabs and advanced search inside quick settings. Studio handoff carries validated configuration and effective playback/theme through the existing mechanism.

## Settings composition

Installation puts npm, pnpm and Bun in three separate 44px rounded-full chips with 4px gaps and 8px inline padding, retaining the accessible Package manager group name. The selected chip keeps the white-text accent gradient. A neutral 44px icon-only Copy command button sits beside the group, with an 18px decorative icon, tooltip and live success/failure feedback. The command occupies the complete row below with 16px spacing; it wraps without truncation or horizontal scrolling. React code wraps long lines within its vertically scrollable viewer. Visual wrapping never inserts characters into copied commands or snippets. Changing the command clears old copy feedback; stale clipboard responses cannot report success for a replacement command.

Use 24px between primary panels, 20px panel padding and 12px between fields. Advanced Studio groups use Appearance, Motion and Interaction with restrained headings and 20px separation. Categoricals precede a quiet divider and the numeric/color/text grid. DOM order must match reading order; do not repair ordering with CSS.

Two- or three-option rows align labels in a 112px column beside a track; below 550px, labels sit above with an 8px gap. The track has 4px padding, 4px gaps, a 1px border and equal 44px cells, giving a 54px single row. Selected text stays white. `SelectionTrack` measures native selected targets without owning configuration. Initial layout and resize snap directly; selection animates. It is for single-row choices, tabs and device groups.

Larger enums put the heading above a two- or three-column grid with 8px gaps. Each chip has its own neutral surface/border and at least 44px height. The grid background stays transparent. Long labels wrap within their cell. Chips use local color/border feedback; do not animate an indicator across grid rows. Inline expansion keeps the chosen item visible and the complete list reachable. Expand/collapse does not create a popup or move keyboard focus away from its control.

Shape thumbnails have four columns in wider settings containers and two below 550px. Chat keeps its compact shape/outfit grids at two columns. Thumbnails render retained SDK silhouettes in a paused boundary. The main avatar renderer does not remount when choosing appearance.

Numeric, color and text rows place labels and values inside a 54px shell, with 4px insets around 44px native targets. Values appear once. Numeric dials include the label, drag-window caption, tabular exact input, unit and Default action. The range covers the complete shell except Default and a focused exact editor. Pressing does not jump; after 4px horizontal movement, pointer position maps across the field to its limits. Clicking the value enters exact editing; double-click/Default omits the prop. Escape, cancellation or lost capture restores the original value. Enter/blur commits valid exact edits; invalid drafts preserve the last valid preview. Soft drag windows do not cap valid SDK custom values. See [settings layout](docs/settings-layout.md).

Numeric dials reveal a neutral ruler on range hover, keyboard focus and active dragging. Keep minor/major ticks in the upper 4px inset, above the label and exact value, with a foreground marker aligned to the committed progress fill. Auto and custom values outside the drag window have no marker. The decorative layer is hidden from assistive technology, cannot intercept input, and fades using the 160ms feedback token; reduced motion snaps it. Do not add labels, resize the field or change its drag window.

Color/text labels use an 80px column and flexible exact entries. Focus creates one inset shell ring without resizing or inserting content. Contextual controls can hide while preserving their values. The same state drives controls, preview, transfer and code.

In Studio’s Presets tab, the New preset form uses a 14px heading, 13px field/action text and a compact 44px Save target. The name field occupies the full row below; do not split its width with the action. Use 12px spacing and a native form so Enter saves. Keep local-storage context in the accessible field hint, native Save tooltip and confirmation instead of a separate visible paragraph. Empty lists add no padding; saved names wrap without squeezing their delete targets.

## Typography and responsive layout

Application headings use weight 550, line-height 1.3 and -0.025em tracking. Catalog headings are 24px, panels 20–22px, subsections 15–16px. The shell owns page H1 and prose. Labels/controls use 13px and 1.5 line-height, help text 12px and 1.6, code 1.8. Help text has zero margin; parents own spacing. Do not reuse margin-bearing scene notes in a toolbar or form.

Editable text uses the input token, which increases to 16px on touch devices without enlarging labels or changing control geometry. Preserve native pinch zoom. Fullscreen chat follows the visual viewport height and vertical offset while the keyboard is open; its composer and Send target remain above the keyboard. Side panels and bot creation use the same visible bounds, while their contents scroll locally. Pinch zoom keeps native viewport behavior rather than resizing the application to cancel magnification.

Use the owning container width. The Glass sidebar changes available space, and settings panels establish their own inline-size containers. Numeric/color/text fields use three columns at 900px or wider, two below 900px and one below 550px. Categorical fields use two columns on wide settings and one below 900px. Each enum grid fits its field; shape grids span the complete row. Gallery becomes two columns below 900px and one below 550px. Heading/search and task actions wrap on compact layouts.

At 320, 390, 768, 1024 and 1440px, controls, preset names, commands, API tables and scenes must not widen the document. Editors/tables scroll locally. Multiline editors use a 16px radius rather than capsule geometry. Check longer labels and 200% zoom after composition changes.

## Preview and avatar interaction

Gooey previews contain the active liquid scene and its gesture hint. Liquid behavior belongs to Quick settings or Studio Customize, with four native chips in two equal columns and 8px gaps. Starting points load complete configurations; behavior changes preserve other group and item tuning. Do not repeat configuration selectors inside the scene.

Desktop, Tablet (768px) and Mobile (375px) form a labeled icon group beside playback. A right-edge separator provides a 44px pointer/touch target, visible focus and an actual-width badge. Reserve the grip width plus 8px in the scene padding. Arrows change width by 10px, Shift uses 50px, Home/End choose limits, double-click restores full width and cancellation restores the previous request. Below 320px available width, hide the grip while retaining presets. Width stays capped to the container and survives task switches without changing exported props or remounting the renderer. These are container previews, not hardware/browser emulation. See [preview layout](docs/preview-layout.md).

Chat Shape, Outfit and Color belong to Character. Activity and playback belong to Animation; connection/reply modes belong to Chat demo. Advanced appearance/motion uses contextual disclosure. Helper selection and New bot appear only in the empty conversation. The welcome avatar is 128px, composer avatar 64px, reply avatar 24px; these presentation sizes do not alter exported size. The existing helper popover is a named-profile picker, with grouped descriptions and keyboard/light-dismiss behavior, not a substitute for settings choices. Replies remain scripted and local.

The avatar playground's Examples header uses the complete Liven UI mark and wordmark as one native link to All components, with a 44px height, rounded-full target and 8px inline padding. Do not add a separate sidebar Back arrow or replace the mark on hover. The link stays foreground-colored, reveals a neutral track on hover and keeps contained keyboard focus. Its tooltip and accessible name describe the destination. Compact conversation headers retain an 18px Back arrow in a 44px native link, so navigation remains reachable while the sidebar is closed. Keep navigation outside scrolling lists. Headers below 550px use 8px inline padding and 4px gaps around the 44px targets.

Chat sidebar headers and content share a 16px inline inset. Keep New chat in the fixed toolbar, 16px below the header, while Chats and Examples scroll separately. Its 44px neutral row shares 13px text, a 32px decorative icon slot and an 8px gap with the list rows. Chats and Examples use paused 32px flat native avatars in that slot; New chat keeps its 16px plus. History and visited examples retain their saved bot identity. Unvisited examples show the current shape with their outfit and color preset. Thumbnails preserve face, color and accessories while ignoring scene size, motion and material; they add no focus target. The brand mark keeps its 24px size. The first scrolling group has no extra top margin; subsequent groups retain 20px separation.

## Motion and accessibility

Motion explains a gesture or state change. A selection pill travels to the newly selected cell; a pressed action compresses to 0.98 and returns; grid options change local emphasis. Do not add bouncing labels, animated panel height, diagonal selection flights or perpetual control decoration. Feedback must settle and keep the layout stationary. Never apply control animations to SDK scene children.

Reduced motion snaps control transitions and initially pauses effects. Play is explicit; Replay replaces only the current preview. Lazy cards mount near the viewport instead of allocating every gallery scene. Native SDK materials, state and pointer interactions remain intact. Release frames, observers and microphone resources at their existing teardown boundaries.

Use native radios, checkboxes, inputs and buttons. Radios retain native arrow-key selection. Tabs implement ArrowLeft/Right and Home/End with one tab stop. Selected state must be semantic, not only visual. Every owned focus indicator stays inside its target: 2px `--ring` with a -2px outline offset, or an equivalent inset shadow for segmented cells and grid chips. Compound editors transfer the indicator to their shell and suppress the nested input outline. The chat composer indicates textarea focus; its send button owns a separate indicator. Pointer clicks on ordinary buttons follow native `:focus-visible` heuristics; text entry keeps a visible editing cue. Focus must remain visible without clipping, duplicate halos or layout shifts.

Action buttons, standalone pills and Default actions use the 160ms feedback token and compress to 0.98 while pressed. Segmented targets stay stationary so the selected indicator remains aligned. Disabled actions do not compress; reduced motion removes compression. Selected gradient fills and white text survive hover, focus and press.

Studio's structural scroll regions have no focus outline. Focus cues belong to their interactive children: links, buttons, radios and editors retain the shared ring or their compound field indicator. Do not add panel tab stops, redirect focus or change native scrolling to hide a container frame.

Dialogs contain focus, support Escape and restore their opener. The mobile drawer keeps header/footer outside its scrolling destination list; focused rows must be fully visible. Decorative icons are `aria-hidden` and unfocusable. Sidebar icons are 18px with 44px rows; their finite detail motion settles within 840ms and disappears under reduced motion.

Search has an accessible name and an actionable empty-state reset. Feedback stays adjacent with `role="status"`/`aria-live`; invalid configuration preserves working preview/code. Microphone access requires an explicit action and simulation stays separate.

## Ownership and acceptance

Shared tokens/native primitives belong in `packages/agent-ui/src`. `ChoiceField` owns radio presentation and inline expansion; `FieldControl` owns dispatch; the existing numeric/color controls own draft gestures. Feature CSS is scoped to `.agent-libraries` and split by its owning component family. Edit the owning selector instead of appending an override layer. Do not globally restyle every select, label, details or pre, and target decorative icons explicitly rather than `span:last-child`.

A UI change is complete after `bun run check`, browser acceptance against a fresh production build, and full-page desktop/mobile light/dark inspection. Verify target geometry, keyboard/default behavior, long labels, expansion, zoom, code parity and renderer/resource retention. Report actual browser scope and local commit status. A compilation pass alone is insufficient.
