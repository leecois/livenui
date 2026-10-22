# Preview layout and responsive controls

On guides, the component preview occupies the content width. Customization follows in a responsive field grid, then the current integration snippet. Studio uses a persistent central preview beside its inspector, stacking the two in compact windows; see [Studio workspace](studio-workspace.md). Navigation, installation and Studio transfers retain their existing owners and contracts.

## Reference findings

The supplied [Tech Text page](https://www.reactbits.dev/c/text-animations/tech-text) capture places Preview/Code and device controls above a large demo, with Customize below. Its [demo source](https://github.com/DavidHDev/react-bits/blob/main/src/demo/TextAnimations/TechTextDemo.jsx) confirms preview → customization → props ordering. Its [tab layout](https://github.com/DavidHDev/react-bits/blob/main/src/components/common/TabsLayout.jsx) uses Desktop as full width, Tablet at 768px and Mobile at 375px; presets wider than the available panel are omitted. Its [resizer](https://github.com/DavidHDev/react-bits/blob/main/src/components/common/Preview/PreviewResizer.jsx) supports dragging and keyboard changes, while a [ResizeObserver hook](https://github.com/DavidHDev/react-bits/blob/main/src/hooks/usePreviewFrame.js) measures available space. These are container widths, not isolated browser viewports.

The exact supplied URL could not be opened by the research browser. Findings are grounded in the supplied screenshot and the public source inspected on 2026-10-06. No reference artwork, styles or source implementations were copied.

## Local adaptation

- Keep all three device choices accessible, even when the host is narrow. Cap the frame to the space available and show its actual width with a fit indicator. Preserve the requested preset when the host grows again.
- Group device presets and icon-only playback in a centered toolbar above the stage, with named 44px targets, native tooltips and one vertical separator. Keep all five targets on one row at 320px; no enclosing toolbar panel is needed.
- Use a left-aligned frame with a vertical drag grip on its right edge, a compact icon group on a neutral track and a width badge inside the stage. Keep local panel radii and the existing selected gradient. Replace the earlier bottom slider with direct edge resizing.
- Reserve the 44px hit area plus 8px inside the stage's right padding while resizing is available. The handle must not overlap scene hosts or buttons, including compact Voice and Image actions. Remove this reserve when the grip is hidden at widths of at most 320px.
- Capture the primary pointer so mouse/touch dragging continues beyond the handle. Clamp widths between 320px and available space; hide the grip when resizing has no useful range. Double-click or Desktop resets to full width. Arrow keys use 10px steps, Shift uses 50px, Home/End select the limits. Escape and pointer cancellation restore the original request. Release capture on completion; leaving a guide Preview or switching Studio components removes the capture target without global listeners or document styles.
- Preserve the preview instance on resize, including held images and active interactions. Width is presentation state owned by the workbench; it survives Preview/Install switches but is not serialized into consumer code or saved props.
- On guides, place customization below the stable 340px minimum stage. Use three/two/one field columns according to the feature container, with ordinary document scrolling instead of an inner settings scroll region.
- Use local neutral surfaces, rounded-full 44px controls and the existing accent gradient with white selected text. Existing accent contrast warnings remain accepted design trade-offs.

The nested preview frame establishes an inline-size container for scene styles. It changes available component space, without changing the page viewport, browser engine, pixel ratio or input hardware. SDK rendering, microphone permission and Replay ownership remain unchanged. Team-profile promotion is a skipped requirement; no reference sponsor or team content is added.

## Verification

Run `bun run check`, build current production output and run `bun run test:ui`. The [width browser contracts](../e2e/preview-width.spec.ts) verify presets, compact widths, native keyboard input, retained state and code equality. Inspect full-page guide/Studio light/dark captures at desktop and mobile widths, plus isolated frames. See [testing](testing.md) and [design](../design.md).

Pointer tests exercise dragging outside the stage, lower clamping, double-click reset, Escape and focus. Touch input is dispatched through Chromium's debugging protocol to verify width changes, no page scroll and pointer cancellation. This is synthetic input coverage, not a physical touchscreen test.
