# Verification and visual review

Static checks and browser acceptance test different things. A production compilation pass does not guarantee alignment, rendering fidelity or all runtime behavior. Follow [AGENTS.md](../AGENTS.md) and [design.md](../design.md).

## Reproducible baseline

```sh
bun install --frozen-lockfile
bunx playwright install chromium
bun run check:ui
```

On a Linux host, install browser system dependencies with the official Playwright installation command appropriate to the environment. On a machine with Chrome already installed, `LIVENUI_BROWSER_CHANNEL=chrome bun run test:ui` is an optional local alternative. The default uses Playwright's managed Chromium. These commands require the pinned Bun and compatible Node toolchain.

The browser runner owns a production server at `127.0.0.1:43187`, one worker, no detached loops and no retries that can conceal flakes. `LIVENUI_TEST_PORT` selects another unused local port. It refuses to reuse a server, so an occupied port fails clearly. Run `bun run build` after source changes before invoking `test:ui` alone. The server shuts down when the run completes.

## Gates

| Layer | Owner | Detects |
| --- | --- | --- |
| Typecheck | Workspace scripts and `tsconfig.tools.json` | Public/package/application/tooling type mismatches |
| Biome | Root `biome.json` | Lint, formatting and import consistency in the declared scope |
| Documentation lint | App docs script | Broken public MDX links |
| Architecture gate | `scripts/check-architecture.ts` | Workspace cycles, inverted dependency boundaries, broken maintenance-doc links |
| Bun tests | `tests/` | Valid/invalid configuration, examples, discovery, SDK ESM/CJS contracts, finite orb frames, source-registry installation, standalone compilation, legal-file retention, alias planning and installer cleanup/peers |
| Build | Turbo and Next pre/post scripts | Package distributions, registry regeneration and all app targets |
| Browser contracts | `e2e/library.spec.ts` | Render hosts, dimensions/alignment, design tokens, source order, navigation, JSON/preset/transfer workflows |
| Component workflow | `e2e/component-workflow.spec.ts` | Quick choices, direct installation, variant/configuration handoff, reload and fragment history |
| Visual review | Primary agent inspecting captures | Aesthetic defects that measurable contracts do not encode |

Root lint is intentionally scoped. Passing it does not mean every vendored engine line was audited. The architecture gate checks declared static imports and workspace edges; it is not a general-purpose proof of all dynamic dependency behavior.

## Browser matrix

Four projects cover 1440px desktop and 390px mobile in light and dark themes. Each checks all seven libraries, error boundaries, failed resources, stage-host clipping, accent/white text, form typography, 44px control height and rounded geometry. Studio context assertions additionally run at 1440, 1024, 768, 390 and 320px.

Journeys cover discovery empty/recovery states, URL-persisted example search, MetalText deep links, keyboard tabs, invalid/valid JSON, saved presets across reload, installation commands, validated import/export and API disclosure. They also reach all 83 examples, exercise all three Metal variants and four liquid behaviors, verify slider keyboard actions and avatar playback, and check metadata, registry/reference endpoints and redirects. Mobile drawer tests verify focus containment, Escape, opener restoration, navigation and exactly one active destination. Desktop drawer cases are intentionally skipped because that surface is absent.

Rendered preview motion starts paused for reduced-motion runs, which gives reproducible composition captures. Paused rendering still uses real SDKs; tests check hosts and error/resource failures. Source lifecycle regressions in `tests/lifecycle.test.ts` use isolated subprocesses with deferred image loads and controlled frame/listener ownership. `tests/microphone.test.ts` checks shared in-flight requests and track/listener release. These probes isolate module mocks from the package contract suite. `tests/cli.test.ts` covers registry containment, custom config propagation and real nonzero subprocess exits.

Browser regressions in `e2e/playground-state.spec.ts` check playback persistence, Voice activation/freeze independence and valid draft replacement. `e2e/microphone.spec.ts` controls deferred capture resolution after Pause, Replay, navigation and switching to Install & Usage, plus stale denials. Leaving Preview also stops a live stream; returning requires an explicit new request. The capture streams are test doubles; these cases prove hook ownership and state handling, not physical audio capture.

Component workflow regressions exercise native radio arrow keys, example selection and focus, task-tab keyboard navigation, direct installation access, all seven validated Studio handoffs and Metal component variants. They verify code equality across task switches, handoff and reload, safe invalid-fragment fallback, native Back/Forward restoration and stale-fragment removal when changing libraries. Install and Studio captures supplement guide captures; compact installation is checked at 320px.

`e2e/sidebar-icons.spec.ts` checks every destination's decorative icon, unchanged accessible link names, active-route uniqueness, row alignment and 44px targets. It samples finite detail animation during keyboard focus, verifies stable row bounds and desktop hover, and confirms reduced motion removes icon animations. Compact drawer checks verify the last row is hit-testable and has room for its focus ring. Full-page and isolated sidebar captures cover the desktop sidebar and mobile drawer in both themes.

Beam and Voice starting-example journeys explicitly enable motion after paused startup and capture each active variant. These cases use the no-preference motion setting so CSS reductions do not hide the effect being inspected. Guide layout captures retain reduced motion. Individual starting-example and agent-sidebar captures record visible renderers separately, because offscreen examples intentionally unmount.

Deferred file reads in the playground suite verify that late success/failure cannot replace a newer import, Reset or Metal variant selection. Image playback also exercises a real one-shot reveal/hide through Pause and Resume. Isolated cycle probes cover paused startup, preserved manual hold and one-shot versus continuous hide completion. Installer graph probes cover shared-child deduplication, circular dependency rejection before writes and retry after an invalid child payload.

Add targeted moving-scene tests for animation-engine changes: time-varying frames, per-instance pause, pointer interaction, material isolation and teardown are not proven by a paused layout capture.

## Evidence

`playwright-report/` contains the browser HTML report; `test-results/` contains per-test full-page/context/variant images and failure traces. Overview capture scrolls each library into view and waits for its real renderer before recording the complete page. Gallery records visible upper/lower windows separately because offscreen example scenes intentionally unmount. Both are ignored build artifacts. Inspect captures for desktop light, desktop dark, mobile light and mobile dark before accepting any UI change. Also inspect narrower widths when composition changes.

Use `bunx playwright show-report` to review a run interactively. Add one-shot focused tests to the checked-in suite when a regression matters; do not leave the only repeatable evidence in a workstation-specific `/tmp` script. There is no automatic screenshot baseline acceptance: existing effects animate and GPU rendering varies, so layout contracts are asserted directly and raster captures receive human/agent visual review.

## Manual acceptance checklist

- Review heading/control type scale, context-row alignment, balanced whitespace and every owned panel.
- Confirm liquid morph/move/melt/bend mechanics, all three Metal components, avatar gaze/material/state behavior and image reveal quality when their adapters change.
- Exercise keyboard selection, arrows/Home/End, Escape and visible focus, including long labels and 200% zoom.
- Check both themes: gradients keep white text and neutral surfaces follow shell tokens.
- Verify microphone permission starts only after the explicit action and tracks stop on navigation. Automated layout runs do not validate real microphone hardware.
- Check production HTTP contracts and redirects when shell, source loading, registry or build tooling changes.
- Record skipped identity-display requirements and accepted accent contrast flags rather than silently changing product policy.

Current browser scope is Chromium with software rendering. Do not claim Safari, Firefox, physical mobile devices, live audio or deployed infrastructure were validated unless those checks actually ran. CI currently executes `bun run check`; browser acceptance is a required local UI gate and has not been added to the deployment workflow implicitly.
