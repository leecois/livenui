# Decision 003: Renderer replacement and restoration

Status: superseded by the owner's decision to restore the established renderers on 2026-10-11. Restoration has passed the checks below, and the owner approved its local commit. Nothing has been pushed or published.

## Decision

Restore all seven SDK implementations from `d240803`, the revision before the renderer replacement experiment. The owner preferred the prior visual quality and interaction behavior after reviewing the replacements. Retain the application workspace, Studio, avatar chat, shared controls, original demo artwork and other improvements already present at that revision.

The replacement experiment and its quality refinements are preserved in a local recovery bundle and binary patches. The committed Border Beam replacement remains in Git history; its working-tree restoration is a normal forward change, not a history rewrite.

## Attribution and distribution

Restore the corresponding package licenses, notices, dependencies, registry metadata and package guides with the implementation. Retained upstream source must keep its attribution. Liven UI's own application work does not establish exclusive authorship of the restored renderers. The root MIT license does not replace component-specific notices or the Metal shader's Apache license.

## Verification

Run the source, build, browser and independent-consumer gates in [testing](../testing.md). Use a newly built production application and inspect full-page desktop/mobile light/dark captures. Tests tied exclusively to the discarded replacement engines are restored to the pre-experiment suite; existing integration, layout, lifecycle, mascot and legal-retention contracts remain required.

Verification on 2026-10-11:

- All 134 tracked files in the seven SDK directories match `d240803` byte for byte, including licenses and notices.
- `bun run check` passed: 82 source tests and 11 build targets. One existing non-blocking lint suggestion remains.
- The complete Chrome production matrix ran 432 cases with one worker and no retries: 426 passed, two intentional desktop drawer skips, and four failures of the same Image test. That test enabled autoplay before asserting the initial manual state. Moving the motion override after manual configuration preserved every assertion; all four affected cases then passed. No renderer source or timeout was changed to obtain those passes.
- Keep the stronger scroll-end assertion and microphone lifecycle coverage. The controlled microphone now supplies a valid, internally generated `MediaStream` with native track events; no physical microphone is opened.
- An independent React consumer installed, typechecked, bundled and rendered all seven registry entries, verifying 119 source/legal files.
- Full-page Studio avatar captures were inspected in all four viewport/theme combinations, with additional Metal, Image and Gooey captures. Bright accent fills and white selected labels remain unchanged.

An initial managed-Chromium run was stopped after navigation, request teardown and interaction timeouts. The acceptance matrix above used locally installed Chrome with software rendering, matching the pre-experiment validation environment. These results do not establish a clean managed-Chromium run, other browser engines, physical devices, live microphone behavior or deployment readiness. The earlier remote/security/dependency audit was not repeated.

Local recovery artifacts are in `tmp/renderer-restore-20261011/`: the pre-restoration bundle and patches, source comparison, initial failure traces, production screenshots, and validation logs. The owner approved committing this architectural restoration under [AGENTS.md](../../AGENTS.md). No push or publication is authorized.
