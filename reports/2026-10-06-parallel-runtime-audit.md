# Configuration, SDK and installer audit

Date: 2026-10-06. Baseline: `d5eb7bf` on `main`.

## Scope and method

The owner requested parallel execution and had previously accepted a general audit of configuration correctness, SDK lifecycle/performance and installer reliability. Three read-only reviews inspected these areas independently. The primary agent reproduced findings, implemented bounded fixes, owned verification and created local commits. No architectural migration, dependency upgrade or publication is part of this audit.

The baseline passed `bun run check` with 55 Bun tests. Passing existing gates did not cover the cases below.

## Findings and fixes

| Area | Reproduced behavior | Implemented behavior and regression evidence |
| --- | --- | --- |
| Structured configuration | Voice accepted an object in `colors` and later called `.join`; avatar size/pose and image timing accepted incompatible shapes | Component-specific pure schemas reject invalid nested objects, required fields, arrays and tuples before state changes. Valid SDK unions remain accepted. Bun checks cover valid/invalid configurations; browser checks preserve preview/code after rejected JSON and file imports. |
| Application references | Metal accepted a string as its function-valued `mask` | JSON parsing rejects masks alongside other application references; masks remain available in integration code. |
| Post-build status | A failed post-build task logged an error but the process exited successfully | The wrapper sets a failing exit code. Isolated actual-wrapper subprocess checks verify both successful and failed task exits without loading environment files or contacting a remote index. |
| Partial CLI aliases | An empty/partial alias object changed omitted component and CSS directory defaults | Omitted aliases use the same defaults as an absent aliases object; explicit overrides survive. |
| Installer write state | A failed write was marked installed, allowing a later retry to skip the failed file and report success | Only successful writes, identical files and deliberately declined overwrites enter the installed set. Directory targets fail during preflight before any writes. Independent tests cover a removed directory blocker and an injected write failure followed by retry. |
| Registry production | Self and indirect dependency cycles overflowed recursive validation | Active ancestors detect cycles; visited components avoid repeating shared-child traversal within a root. Existing duplicate-file checks remain enforced. |
| Registry imports | Dot-prefixed targets could be written correctly while generated imports failed to resolve | Validated targets are normalized before lookup; a two-file installation checks the actual generated relative import. |
| Paused Image drawing | Explicit drawing of a paused 320×180 instance used an 8×8 shared backing canvas, producing a negative source offset; paused resize did not repaint | One-shot drawing includes its paused target when sizing the shared renderer. The resize observer repaints paused instances. Probes check full backing regions at configured DPR 1 and 2; browser checks resize a revealed image while paused and require retained opaque content. |
| Image shader teardown | Resetting a custom shader after the last owner was destroyed created a second renderer with zero owners and a pending frame | Resetting an absent shared renderer is a no-op. The regression checks renderer disposal, allocation count, pending frames and a later clean instance. |
| Avatar cache identity | `M10 56H95V95H10Z` and `M10 63H95V95H10Z` shared the shortened path hash and reused the first material form | Complete SVG path identity separates material caches. The actual component and material builder rasterize both distinct paths and reuse a repeated identical path. |
| Voice idle scheduling | Paused instances skipped painting but kept scheduling frame callbacks | After the initial paused paint, the loop stops when all instances are paused and current. It wakes on registration/configuration replacement; probes cover mixed playback and teardown/replacement from a level callback. The idle check does not allocate an intermediate array. |

The preliminary theme-override suspicion was rejected after inspecting the intermediate Preview wrapper: explicit light/dark props were already forwarded correctly. It is not counted as a defect and needed no change.

## Verification

- `bun run check`: passed; 69 Bun tests, zero failures; workspace/package/application/tooling typechecks, scoped lint, documentation links, architecture checks and production builds passed.
- Architecture gate: 12 workspaces, no dependency cycles, valid feature boundaries and 11 linked maintenance documents.
- Targeted browser checks: 8 passed across desktop/mobile light/dark, including real paused-image resizing and rejected structured inputs.
- Renderer/layout checks after correcting viewport and capture preconditions: 28 passed across all seven guides and all four projects.
- Final full browser suite: 194 passed, two expected desktop drawer skips, zero failures across 196 cases on the freshly checked production output. One worker, no retries, an owned preview server and no unrelated server reuse.
- Visual review: full-page Image, Voice and Bot avatars captures inspected in desktop light/dark and mobile light/dark. Native paused-resize artwork and isolated avatar-context captures supplement page captures.

The first targeted desktop resize check used a 900px viewport, which did not shrink the intentionally capped 320px image host. The check was corrected to a 320px viewport to exercise a real resize; pixel and dimension assertions were retained. No screenshot baselines or token expectations were weakened.

The first full browser run produced 193 passes, two expected desktop drawer skips and one mobile-dark Metal visibility failure. Its preview was below the viewport, and the SDK intentionally waits for visibility before copying its first frame. The test now scrolls the stage into view and asserts that viewport precondition before retaining the original renderer visibility check. Capture previously called smooth `scrollTo` without verifying that it reached the top; it now scrolls instantly and asserts `scrollY === 0`. These are test preconditions, not changes to the Metal renderer or application scrolling. The failed-run trace was retained locally for inspection. The faded band in mobile full-page captures is the shell's fixed footer gradient, which remains at the viewport edge even after the scroll assertion; isolated scene captures supplement these page captures.

## Limits and delivery

Schemas validate JSON-compatible shapes and existing playground bounds, not arbitrary CSS color/size syntax or SVG path semantics. SDK lifecycle probes use controlled renderer/canvas/frame doubles; browser journeys use actual SDKs in Chromium with software rendering. They do not establish Safari/Firefox behavior, physical device behavior, live microphone capture or deployment correctness.

Installer preflight is not a transactional rollback or protection against hostile concurrent filesystem mutation. Earlier successful writes remain after an unexpected later failure, and a retry resumes incomplete work.

The canonical [architecture](../docs/architecture.md), [development](../docs/development.md) and [testing](../docs/testing.md) guides describe the new contracts. Local commits stay on `main`; nothing is pushed, published or deployed. Root infrastructure, public APIs, legal attribution and the accent-gradient design policy retain their existing contracts.

Local implementation commits:

- `7ee38e8` — `fix(cli): preserve retryable writes and validate registry graphs`
- `a386e43` — `fix(build): propagate post-build task failures`
- `2b6c859` — `fix(sdk): correct paused rendering and idle resource ownership`
- `d1ced0a` — `fix(playground): validate structured JSON configuration`

The updated canonical guides and this evidence report are delivered in a separate documentation commit.
