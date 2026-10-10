# Decision 003: Original component implementations

Status: Border Beam implemented and verified. Owner approved its commit and continuation through all remaining replacements on 2026-10-10.

## Scope

Replace the inherited rendering implementations in this order: Border Beam, Thinking Orbs, Voice, Image, Gooey, Bot Avatars and Metal. Preserve useful public integration contracts while designing the rendering code independently. Each component must pass source, installation, lifecycle and visual acceptance before replacing its predecessor. Existing licenses remain applicable to any retained inherited source, assets and historical revisions.

Compatibility is specified by public type declarations, documented behavior, application adapters and observable interactions. The implementation must not be a line-by-line translation, renaming or rearrangement of inherited code. Record the design, dependencies and remaining attribution for each replacement. Passing a similarity check is not certification of legal independence.

## Border Beam specification

- Keep the named/default React export, forwarded div ref, standard div attributes and public option/preset type names.
- Wrap content without intercepting its pointer or keyboard interaction. Effects do not change content opacity or layout.
- Support a full traveling border, compact traveling border, bottom traveling line, contained breathing border and outward breathing halo.
- Retain the eight named palette choices, explicit/system theme, strength, duration, radius, brightness, saturation, halo size and optional hue movement.
- Infer the first content element's corner radius when no explicit radius is provided. Track container size and content replacement.
- Fade activation changes and report only completed activation/deactivation transitions; cancel stale completion callbacks on reversal and unmount.
- Pause decorative motion outside the viewport, in a hidden document and under reduced motion. Release animations, observers and event listeners when unmounted.
- Keep per-instance custom CSS substitution for `{id}`. The renderer exposes documented SVG layers; inherited pseudo-element/keyframe internals are not a compatibility promise.

## Border Beam design

Use an SVG path normalized to a perimeter of 100 units. Browser-owned dash-offset animation moves the highlight along that path; opacity animation breathes the pulse variants. A sharp stroke and blurred strokes share the same geometry and timeline. The contained variant clips its glow to the rounded host; the outer variant can bloom beyond it without requiring an opaque child. No custom frame loop, canvas, shader, CSS property registration or generated keyframe stylesheet is needed.

The implementation uses standard [SVG path length](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/pathLength) and [Web Animations](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) APIs. Colors and tuning are authored for this implementation. Existing public declarations define compatibility, not rendering structure.

## Acceptance and ownership

Run the repository gates in [testing](../testing.md), including moving-frame browser checks, resizing, independent instances, reduced motion, visibility, rapid activation reversal, teardown, source installation and full-page captures in both themes and viewport sizes. Review the final package source and documentation before updating its ownership statement. Preserve the recovery bundle locally, and retain historical attribution until a separately reviewed publication-history transition.

The website, installer support, remaining SDKs, bundled icons, fonts and external shaders are outside the first replacement. Their license files are not removed by completion of Border Beam.

## Border Beam replacement review

The former stylesheet generator, shared pulse driver and component implementation are removed. The replacement has four source files: React composition, public model/geometry, native animation lifecycle and exports. It imports React and local modules only, with no bundled artwork, shader or copied rendering dependency. Public type declarations were checked for bidirectional TypeScript assignability against the saved pre-change declarations. Preset values and palette tuning are newly authored; custom CSS must migrate as described in the [package guide](../../packages/border-beam/README.md#css-customization).

The package's MIT notice now names Liven UI contributors for this replacement. Repository support files remain covered by the retained root attribution; other package legal files are byte-identical to the pre-change revision. Git history is unchanged, so earlier implementations retain their original notices. This review records the implementation boundary, not a formal legal determination.

## Verification on 2026-10-10

- `bun run check`: 82 tests passed; all 11 build targets succeeded. The lint scope now includes the new renderer source.
- The three new browser contracts passed in desktop/mobile light/dark: 12 cases in Chrome, plus 24 cases using WebKit and Firefox with the same checked-in spec and a temporary project matrix. This is automated browser coverage, not an installed Safari or physical-device claim.
- The independent npm consumer installed, typechecked, bundled and rendered all seven registry entries, verifying 118 source/legal files. Border Beam contributes six files and no additional rendering dependency. The hosted installation URL was redirected to the owned local test server; live distribution remains unverified.
- The saved pre-change and current declaration surfaces passed bidirectional TypeScript checks for all public values and types. Custom CSS migration remains necessary for former internal selectors.

The full production UI suite passed: 438 cases, two intentional desktop drawer skips, one worker, zero retries. Guide and Studio full-page captures were inspected at desktop/mobile sizes in both themes, alongside moving Beam variants and independent-consumer output. No layout regression was observed in these captures; accent controls retain their existing gradient and white text.

The owner approved committing this verified replacement and continuing the remaining sequence on 2026-10-10. Thinking Orbs is next. No history rewrite, push or deployment is authorized by that continuation.
