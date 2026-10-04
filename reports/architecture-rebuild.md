# Application foundation rebuild

Date: 2026-10-04. Status: implemented, verified locally and approved by the owner for commit. This report records the local implementation, not a deployed release.

## Findings and correction

The reported Studio row reused `.demo-note`, a centered preview caption with a 14px top margin. Alongside a native component select, this lowered supporting copy relative to the control. The old 1,067-line workbench also mixed discovery, session persistence, transfer, clipboard, controls and views; the 1,513-line stylesheet depended on corrective overrides.

The application is now a bounded `features/component-library` feature with domain/data, hooks, view composition, panels, dynamic SDK adapters and separately owned style files. Workbench composition is 69 lines; playground state is 247 lines. Shared Button/Select controls preserve native props/refs. Semantic tokens have one source, mapped to Glass theme colors. Studio context aligns vertically on wide containers and moves supporting text to its own row on narrow containers. Preview/control panels align at both edges on desktop.

A separate associated label fixes the package-manager accessible name, which previously included option text. Button icon styling targets decorative spans instead of changing the last span regardless of its role. Repeated CSS overrides and unused legacy navigation/Studio selectors were removed. Native Liquid behavior selection uses the same foundation control.

Site metadata and registry origin now share `lib/site.ts`; metadata uses the configured site base and no longer advertises retired RSS URLs. Rendering engines, Glass shell, public package exports, navigation mechanics, examples and registry contracts remain.

## Agent documentation

Canonical entry points are [AGENTS.md](../AGENTS.md), [design.md](../design.md), [architecture](../docs/architecture.md), [development](../docs/development.md) and [testing](../docs/testing.md). The [decision record](../docs/decisions/001-component-library-foundation.md) contains primary research sources and adaptation rationale. Root README indexes these guides.

The documents distinguish repository maintenance from public integration guidance; identify source owners/generated output; specify change recipes, trust boundaries, resource cleanup and verification limits; and retain local-only main-branch, single-agent and architectural approval constraints.

## Verification

- Frozen Bun installation: 1,359 installs across 1,561 packages checked, no changes.
- Full `bun run check`: 20 successful workspace typecheck/dependency tasks, tooling typecheck, 93 scoped Biome files, 57 app docs-lint files, public link validation, architecture gate, 17 Bun tests with 22,590 assertions and 11 successful build tasks.
- Architecture gate: 12 workspaces, no workspace cycles, valid static feature boundaries and seven linked canonical documents.
- Checked-in browser suite: 54 passed, two intentionally skipped desktop drawer cases, zero failures. Chrome/Chromium on this machine with software rendering, one worker, managed production server.
- Layout matrix: all seven libraries at desktop/mobile in light/dark; Studio row additionally checked at 320, 390, 768, 1024 and 1440px. Control typography, target height, rounded geometry, context centering, panel alignment, local clipping, document overflow and gradient/white emphasis are asserted.
- Journeys: search/recovery, shareable gallery filters, all 83 examples, three Metal variants, four liquid behaviors, slider keyboard actions, avatar playback, tab keyboard navigation, invalid/valid JSON, local presets across reload, validated import/export, API disclosure and mobile focus/navigation.
- HTTP contracts: agent skill, LLM references, static JSON, MDX text, registry JSON, OG image, canonical Studio metadata and retired-blog redirect return expected results.
- Full-page desktop light/dark and mobile light/dark captures reviewed. Overview captures wait for each actual renderer; gallery upper/lower captures respect offscreen scene release. Context and variant captures are included in ignored `test-results/`; the run report is in ignored `playwright-report/`.
- Catalog, defaults/parsers/snippets, examples, discovery logic, preview boundary and six unmodified adapters were byte-compared with their pre-refactor source. Only Liquid's native selector composition changed among adapters. No rendering SDK source was modified.
- Bright-gradient contrast flags remain accepted design trade-offs. Public internal-identity display recommendations are skipped. Legal attribution notices remain.

Early browser runs found the package-manager label defect and an overbroad test selector that matched both document and SVG titles. Both were corrected; the final suite passed without retries. Initial full-page captures also revealed a test-readiness gap: waiting for the server-rendered heading did not ensure lazy card renderers were ready. Capture now explicitly waits for real renderer hosts.

This run does not prove every possible configuration or GPU backend is correct. Safari, Firefox, physical mobile hardware, real microphone capture and deployment were not tested. SDK workspaces remain private; no package publication, remote push or deployment occurred. The preview server shut down after validation.
