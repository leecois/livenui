# Runtime and integration audit

Date: 2026-10-04. Evidence snapshot for this local checkout.

The audit followed configuration and code export, renderer lifecycle, and source installation. Changes preserve the existing feature boundaries, SDK APIs, build targets, source registry, legal files and design tokens. Execution continued with one primary agent after the owner updated the operating constraints.

| Finding | Result | Regression evidence |
| --- | --- | --- |
| Expanded installer caches repeated shared children, accepted dependency cycles and retained incomplete results after a child failed | Traverse each component once, reject cycles before writes and cache validated payloads independently of traversal | Diamond graph output shrank from five entries to four; self/indirect cycles reject without files; a failed child is retried |
| Image cycle startup cleared explicit pause; resumed hides and loads lost one-shot/manual-hold behavior | Preserve pause, playback mode and hold mode; use the same hide completion path before and after pause | Paused startup schedules zero timers; one-shot completion stops; continuous completion schedules the next reveal; manual hold survives a pending load |
| Late file reads overwrote newer configuration and feedback | Invalidate obsolete reads on newer imports, edits, configuration replacement, playback actions and unmount | Deferred success/failure cannot replace a newer import, Reset or a Metal variant selection |

Eight domain regression cases were added; seven failed before the fixes, while the continuous-playback case served as a passing control. All four deferred-import browser cases failed against the previous hook behavior in desktop light mode before the fix.

Validation used Node 24.16.0 and Bun 1.4.2:

- `bun run check`: passed typechecks, lint, documentation checks, architecture checks, 47 tests and all production build targets.
- `LIVENUI_BROWSER_CHANNEL=chrome LIVENUI_TEST_PORT=43188 bun run test:ui`: 122 passed, two expected desktop drawer skips, one worker and a dedicated production server. The default port was occupied and its server was left untouched.
- Full-page Image guide captures were reviewed at desktop/mobile in light/dark themes, along with desktop collection captures in both themes. Alignment, local scrolling, stage clipping, rounded controls and gradient emphasis were preserved.
- The browser suite exercised real image reveal/hide playback, all seven SDK previews, all 83 examples, source registry endpoints, configuration transfer and mocked microphone lifecycle.

Managed Chromium stalled on the image preview and emitted GPU readback warnings. The same failure reproduced with the original image cycle implementation; the installed Chrome channel passed that baseline and the final full suite. The underlying managed-browser GPU issue remains unresolved. Browser acceptance therefore uses the documented Chrome alternative, with unchanged assertions and timeouts.

This run does not establish Safari/Firefox behavior, physical-device behavior, real microphone capture or deployed behavior. File invalidation prevents stale state changes but does not cancel the browser's file read. Installer containment does not claim protection against hostile concurrent filesystem mutation.

Current behavior is documented in [architecture](../docs/architecture.md), [development](../docs/development.md) and [testing](../docs/testing.md). This report is historical evidence, not an operating contract.
