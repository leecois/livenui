# UI, performance and architecture audit

Project and package identifiers are normalized to current Liven UI naming. Original audit dates, findings and validation limits are retained; obsolete machine-specific temporary paths are omitted.

Date: 2026-10-04. Local checkout on `main`. The owner explicitly requested parallel subagents for this audit, overriding the usual single-primary-agent restriction for this task. Three bounded audit/edit scopes ran independently; the primary agent reviewed integration and ran all shared build/browser gates sequentially.

## Findings and implemented fixes

| Finding | Observed failure | Correction and regression evidence |
| --- | --- | --- |
| Microphone request ownership | Pause, Replay or navigation before permission completed could leave a live stream after teardown; concurrent starts could orphan capture | Share pending requests, invalidate generations on stop/unmount, stop late streams and detach ended listeners. Source probe plus deferred browser capture cases |
| Image reveal ordering | Stop/replace/restart followed by old loading completion painted the retired image; stale failure could cancel the replacement | Generation guards for loading, failure, reveal completion and timers. Isolated deferred-resolution/rejection and pause/disposal/resume probes |
| Avatar ticker lifetime | Four document/window listeners remained after the final subscriber; subscription inside a tick could schedule duplicate frames | Named listeners detach after last unsubscribe, reset pointer state, retain one frame and respect hidden documents. Multiple-subscriber/resubscribe/visibility probes |
| Playground playback snapshots | Toolbar playback differed from advanced fields, JSON and saved presets | One effective playback snapshot for controls/export/persistence. Voice `active` and native `paused` remain independent. Browser playback/preset/freeze cases |
| Metal draft replacement | Switching variant while JSON was open retained props from the previous component | Replace drafts on variant/import/reset/load; preserve unfinished edits on ordinary toolbar actions. Browser JSON replacement cases |
| Registry output containment | Absolute/traversal targets and escaping symlinks could read/write outside the project | Preflight all parent/child outputs against a captured project root, validate resolver paths and recheck writes. Normal nested output, sibling aliases and internal symlinks remain supported |
| Dependency installation errors | Nonzero install exits resolved and printed success | Throw on failed subprocess exits, stop the spinner with failure and propagate rejection. Real failing runtime/development subprocess tests |
| Global CLI configuration | `add` ignored inherited `--config` | Command factory reads inherited options and awaits parsing. Actual command-parser tests verify custom configuration before/after the subcommand |

Root lint now explicitly covers the edited SDK/CLI source files. Existing packages, public exports, peer ranges, routes, Glass shell, design tokens, gradients and 83 examples remain intact. No dependency upgrades or infrastructure changes were needed.

## Verification

- Toolchain: Node 24.21.0 and pinned Bun 1.4.2.
- `bun run check`: passed; 20 typecheck/upstream tasks, 106 root lint files, 57 docs lint files, 12-workspace architecture gate, 37 tests with 22,644 assertions and 11 production build tasks.
- `LIVENUI_BROWSER_CHANNEL=chrome bun run test:ui`: 98 passed, two intentional desktop drawer skips, zero failures, one worker and no retries (2.1 minutes). All four viewport/theme profiles passed against the fresh production output.
- The primary agent inspected full-page desktop/mobile light/dark captures, plus image and overview captures; gradients, geometry and source order remained intact. The managed preview server stopped after the run.
- `git diff --check` and the staged-comment gate are required before each local commit. No push, publication or deployment is authorized.

## Scope and limits

The audit followed concrete source findings rather than a whole-project rewrite. It does not establish a numeric bundle-size, frame-rate or Core Web Vitals improvement. Source lifecycle tests control asynchronous work and listeners; browser microphone tests use capture doubles, not physical hardware. Browser verification uses Chromium/Chrome with software rendering, not Safari, Firefox or physical devices.

Filesystem containment is checked before writes and after directory creation; it is not an atomic defense against concurrent malicious filesystem replacement. SDK workspaces remain private, so local corrections have not been published for downstream registry consumers. No live audio or deployment was tested. Public identity-display recommendations remain skipped, and bright-gradient contrast flags remain accepted design trade-offs.

Maintenance contracts are documented in [architecture](../docs/architecture.md), [development](../docs/development.md), [testing](../docs/testing.md) and [design](../design.md).
