# Preview layout and responsive controls

The component preview occupies the content width. Customization follows in a responsive field grid, then the current integration snippet. Navigation, installation and Studio transfers retain their existing owners and contracts.

## Reference findings

The supplied [Tech Text page](https://www.reactbits.dev/c/text-animations/tech-text) capture places Preview/Code and device controls above a large demo, with Customize below. Its [demo source](https://github.com/DavidHDev/react-bits/blob/main/src/demo/TextAnimations/TechTextDemo.jsx) confirms preview → customization → props ordering. Its [tab layout](https://github.com/DavidHDev/react-bits/blob/main/src/components/common/TabsLayout.jsx) uses Desktop as full width, Tablet at 768px and Mobile at 375px; presets wider than the available panel are omitted. Its [resizer](https://github.com/DavidHDev/react-bits/blob/main/src/components/common/Preview/PreviewResizer.jsx) supports dragging and keyboard changes, while a [ResizeObserver hook](https://github.com/DavidHDev/react-bits/blob/main/src/hooks/usePreviewFrame.js) measures available space. These are container widths, not isolated browser viewports.

The exact supplied URL could not be opened by the research browser. Findings are grounded in the supplied screenshot and the public source inspected on 2026-10-06. No reference artwork, styles or source implementations were copied.

## Local adaptation

- Keep all three device choices accessible, even when the host is narrow. Cap the frame to the space available and show its actual width with a fit indicator. Preserve the requested preset when the host grows again.
- Use a native width slider for intermediate sizes rather than introducing pointer-drag machinery. Disable it when the host cannot accommodate the 320px minimum. Desktop resets to full width.
- Preserve the preview instance on resize, including held images and active interactions. Width is presentation state owned by the workbench; it survives Preview/Install switches but is not serialized into consumer code or saved props.
- Place customization below the stable 340px minimum stage. Use three/two/one field columns according to the feature container, with ordinary document scrolling instead of an inner settings scroll region.
- Use local neutral surfaces, rounded-full 44px controls and the existing accent gradient with white selected text. Existing accent contrast warnings remain accepted design trade-offs.

The nested preview frame establishes an inline-size container for scene styles. It changes available component space, without changing the page viewport, browser engine, pixel ratio or input hardware. SDK rendering, microphone permission and Replay ownership remain unchanged. Team-profile promotion is a skipped requirement; no reference sponsor or team content is added.

## Verification

Run `bun run check`, build current production output and run `bun run test:ui`. The [width browser contracts](../e2e/preview-width.spec.ts) verify presets, compact widths, native keyboard input, retained state and code equality. Inspect full-page guide/Studio light/dark captures at desktop and mobile widths, plus isolated frames. See [testing](testing.md) and [design](../design.md).
