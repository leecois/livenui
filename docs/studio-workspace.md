# Studio workspace

Studio is the focused component editor at `/studio`. Guides keep discovery, starting examples, essential controls and installation in reading order. Studio removes the repeated document navigation from the editing surface while retaining the Glass shell and its existing route underneath.

## Anatomy

The header identifies the current component, links back to its guide, names a saved preset, switches theme and copies the current React code. Compact headers use labeled icon actions. Theme changes retain the renderer and update the active component theme in exported code; explicit imported theme props are respected by the preview. At widths of at least 1100px, Components occupies 256px on the left, the live preview fills the center, and the 352px inspector occupies the right. Component links, starting examples and browser-local presets scroll together in the left panel. Starting examples always use full-width stacked chips beneath their label, including short lists of two or three; option count must not switch them into a segmented track. Customize / Code remains outside the inspector's scrolling content.

From 700px to 1099px, preview and inspector remain side by side; Components opens as a native modal drawer. Below 700px, preview and inspector share the available height in two rows. Settings scroll independently, allowing a drag to update the visible preview. Components and presets remain in the drawer. Escape closes the drawer and restores its opener. Changing a component or selecting an example closes it. The fullscreen outer dialog clips overflow, contains keyboard focus and keeps its header anchored.

Scrolling panels have no focus outline around their perimeter. Links and form controls retain their existing focus cues; panel focus does not add a new tab stop or change scrolling and drawer behavior.

The server-delivered shell opens its native dialog before hydration. Initial navigation and reload cover the document while the validated configuration fragment and SDK adapter load. Desktop component navigation is already available in the shell. Code copying and preset editing become available when configuration is ready.

Customize reuses the existing field dispatch and draft gestures. Essential settings come first; expanded settings retain Appearance, Motion and Interaction groups. JSON is an explicit button disclosure with validation next to the editor. Import/export and the API reference remain contextual disclosures. Code contains installation, package-manager choices, the configured React snippet and the agent prompt. Bright actions and selected pills retain the shared accent gradient with white text in both themes; contrast flags remain accepted design trade-offs.

Each task has one label. The header omits a tagline, component navigation omits explanatory prose, and Customize omits a repeated heading above Reset. Preview captions retain width and the interaction hint; playback state is shown by the action. JSON and transfer disclosures omit explanatory subtitles. Presets place a compact Save action beside the heading and a full-width name field below, with 12px spacing. Enter in the name field uses the same save action; browser-local storage is described through the field's accessible hint, Save tooltip and confirmation. Saved names wrap in quiet rows; an empty list adds no spacing. Code shows the command and snippet first, with alias, compatibility and component-specific requirements inside Integration notes.

## State and lifecycle

There is one active `usePlayground` owner and one central preview. Customize / Code changes inspector presentation without remounting the renderer or stopping microphone capture. Pause, Replay, component navigation and leaving Studio retain their explicit resource boundaries. Guides still unmount their preview on Install & Usage, stopping capture before returning.

The workbench keeps an in-memory snapshot for each component during the current Studio visit. It contains committed props, component variant, playback, JSON draft/disclosure, advanced search, preset-name draft, package manager and preview width. Returning to a component validates its committed props before restoring them. Numeric/color field text that has not committed is owned by the field and is discarded when its component unmounts. Snapshots never keep renderer instances, streams or pending file reads. Component navigation releases the departing preview and invalidates its pending imports.

An explicit example or configuration fragment takes precedence over retained state. Fragment imports use the existing `parseConfiguration` boundary and never become server query data. Reload starts from the URL configuration or component defaults. Only explicitly saved presets persist in `livenui-presets`; the temporary snapshots add no storage key or remote request.

## Owners and acceptance

[Studio composition](../apps/docs/features/component-library/views/studio-workspace.tsx) owns the fullscreen shell, responsive panel layout and inspector tabs. [Workbench](../apps/docs/features/component-library/views/workbench.tsx) owns temporary snapshots and preview width. [Playground state](../apps/docs/features/component-library/hooks/use-playground.ts) owns initialization, validation, configuration and export. Presentation belongs in [Studio styles](../apps/docs/features/component-library/styles/studio.css); all seven SDK adapters and registry contracts remain unchanged.

[Workspace browser checks](../e2e/studio-workspace.spec.ts) cover viewport geometry, independent scrolling, native drawer focus, keyboard tabs, renderer retention, component restoration, unapplied JSON drafts and entry/reload before hydration. Existing settings, width, microphone, handoff, examples, import/export and preset tests exercise the new anatomy. Run `bun run check` and `bun run test:ui` against freshly built production output, then inspect full-page desktop/mobile light/dark captures as required by [testing](testing.md). These checks use Chromium with software rendering and synthetic microphone input, not physical hardware or deployment.
