# Settings layout

Settings sit directly below the preview and before current integration code. Guides show essential controls; Studio adds advanced search, Saved and JSON. All views continue to use the same playground configuration owner.

## Reference and adaptation

The public [Eclipse customization panel](https://pro.reactbits.dev/docs/components/eclipse) was inspected in Chromium on 2026-10-06. It groups controls into a three-column grid with labels and values inside compact neutral rows, a nearby Reset action, numeric tracks and switches. The reference uses 32px numeric controls; Liven UI keeps its existing 44px native targets. No paid source, reference artwork or external palette is included.

Use the functional layout with local tokens: 20px panel insets, 12px field gaps, rounded-full neutral rows and bright gradient selection. Keep selected tabs/radio pills filled with `--gradient-accent` and white text. Checked switches use the same gradient with a white thumb. Accent contrast warnings remain accepted design trade-offs.

## Control contract

- Group fields under Appearance, Motion and Interaction without creating another configuration store. Essential controls stay concise; advanced search filters the same fields.
- Numbers combine an invisible native range over a neutral filled label track with a separate exact input and a 44px Default action. Show the numeric value once. Dragging updates preview and code live; arrow keys step, Shift steps ten times, Home/End select the drag limits, and Escape or touch cancellation restores the value before the gesture.
- Curated presentation metadata in `lib/controls.ts` defines each numeric field's recommended drag window, step, unit and editing limits. These are not SDK API changes. Metal ring strength is bounded to 0–1; Text/Badge multiply strength by metal opacity and use a soft window. Image strength is bounded to 0–2. Speed can accept exact positive values outside its 0.25–3× drag window; custom values remain visible. Focus reveals a compact drag range and step hint. JSON/import parsing retains existing runtime contracts and can preserve values outside the control's window.
- Exact numeric and color input uses a local draft. Enter or blur applies a valid value; Escape restores the last applied value. Invalid drafts show adjacent text and preserve preview/code. Empty input or Default omits the prop so the SDK resolves its own default; Auto never injects a guessed fallback. Replacement by Reset, import, saved configuration, starting point or component variant discards old field drafts, even when the replacement contains the same value. Editing a draft invalidates pending asynchronous imports.
- Color controls combine a 44px native picker target, swatch and text entry. CSS colors, variables and color-mix stay intact for CSS-rendered fields. Orb tint accepts its native hex/rgb formats; avatar tint also accepts hsl. A picker selection intentionally replaces the expression with a hex value.
- Avatar size presets retain numbers and add Custom for an exact number or CSS length. Fabric fur fields appear only for Fabric; Voice dot/line fields follow the selected look. Hidden values remain in configuration and export.
- Keep visible labels associated with their native controls. Labels can wrap when space is limited. Native selects retain mobile and keyboard behavior; the chevron stays decorative.
- Boolean settings remain native checkboxes with a 44px target and a decorative switch track. Both label clicks and Space toggle the same configuration. Focus is visible around the track.
- Short typed choices remain native radio groups on neutral tracks. Groups with more than three choices span two grid columns, then one on compact containers. Wrap choices without clipping their labels, targets or focus rings; custom values remain visible. Size presets plus Custom fit a single column.
- Place the compact Controls/Saved/JSON track beside the heading on wide containers and on its own row below 550px. Reset remains beside the heading. Guides omit the administrative tabs.
- Keep advanced discovery in the footer, separated by a quiet divider. Search only appears when advanced controls are expanded. Keep Saved input/action together and let JSON actions/help wrap at narrow widths. Validation feedback stays beside the panel.

Field columns follow the feature container: three at 900px or wider, two below 900px and one below 550px. See [design](../design.md) and [development](development.md).

## Verification

[Settings browser contracts](../e2e/settings-layout.spec.ts) check alignment and compact row heights across all seven Studio libraries, guide composition, native number/checkbox/radio behavior, focus, exported values, narrow advanced search and long saved names. Inspect each library's isolated settings capture plus guide/Studio full-page desktop/mobile light/dark captures. Saved and invalid JSON captures cover 320px. [Interaction contracts](../e2e/settings-controls.spec.ts) additionally exercise live dragging, keyboard steps/cancellation, synthetic touch cancellation, draft errors, renderer retention, contextual fields, numeric/CSS size and color expressions. [Domain contracts](../tests/controls.test.ts) cover every numeric variant and the distinction between drag windows and editing limits. Run the complete gates in [testing](testing.md); these checks use Chromium with software rendering, not physical mobile hardware.
