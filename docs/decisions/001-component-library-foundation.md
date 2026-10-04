# Decision 001: Component library foundation

Status: implemented; owner approved the architectural commit.
Date: 2026-10-04.

## Problem

The application had a 1,067-line workbench containing navigation, clipboard state, browser persistence, configuration/transfer, catalog and gallery views. Its 1,513-line stylesheet accumulated generic element styling and later overrides. A margin-bearing preview note was reused in Studio's component context row, visibly lowering its description. Previous checks covered compilation, viewport overflow and task completion but did not assert typography or row alignment. A passing audit therefore did not prevent the reported defect.

## Research

We inspected primary repository structure, manifests and operating documentation, rather than copying reference styling.

| Project and primary source | Observed organization | Liven UI adaptation |
| --- | --- | --- |
| [shadcn/ui contributing guide](https://github.com/shadcn-ui/ui/blob/main/CONTRIBUTING.md) | Monorepo separates application, content, registry and CLI; registry output is regenerated from authored sources | Preserve app/SDK/CLI boundaries and generated installer ownership; document the full regeneration path |
| [Radix agent contract](https://github.com/radix-ui/primitives/blob/main/AGENTS.md) and [Select manifest](https://github.com/radix-ui/primitives/blob/main/packages/react/select/package.json) | Explicit package layout, commands, peer conventions and separate unit/browser tooling | Add a short operating contract with exact edit map and gates; keep foundation primitives independent and preserve native props/refs |
| [Radix composition guide](https://www.radix-ui.com/primitives/docs/guides/composition) | Behavior composition requires appropriate interactive elements, prop spreading and ref support | Button/Select wrap real native controls, retain keyboard behavior, and centralize geometry without importing application state |
| [Fumadocs workspace](https://github.com/fuma-nama/fumadocs/blob/dev/pnpm-workspace.yaml), [root build scripts](https://github.com/fuma-nama/fumadocs/blob/dev/package.json) and [UI export manifest](https://github.com/fuma-nama/fumadocs/blob/dev/packages/radix-ui/package.json) | Separate apps/examples/packages and explicit component/layout/provider exports, including Glass slots | Keep the existing Glass/provider shell; compose owned features below it rather than rebuilding navigation behavior |
| [Playwright server lifecycle](https://playwright.dev/docs/test-webserver) | Browser configuration can own startup/readiness/shutdown and reject unrelated servers | Check in single-worker production-browser acceptance with predictable artifacts and no server reuse |

These are patterns adapted to Liven UI's scale, not a claim that all three projects share an identical architecture. No external brand skin, palette or unrelated backend was transplanted. Contributor branch/publication policies from reference projects do not override this repository's local-only main-branch rules.

## Decision

Keep the monorepo, toolchain, SDK public APIs, Glass shell and routing infrastructure. Rebuild owned application structure as one bounded `component-library` feature, split into pure domain/data, browser hooks, view composition, panels, SDK adapters and scoped style owners. Use the existing `agent-ui` workspace for shared native control primitives and a single token source. Do not introduce seven extra application packages or a second documentation application.

Remove the old workbench and CSS override stack. Make static import/workspace boundaries executable. Add reproducible browser design contracts for the actual screenshot failure and adjacent control geometry. Write canonical agent, architecture, design, development and testing guides; keep historical audits separate.

## Consequences

Agents can find the owning source before editing, and the same state drives preview and generated code. Independent panels are easier to inspect and styles no longer depend on a late corrective cascade. Token-driven selectors provide consistent typography and native behavior across themes. Tests deliberately check coordinates, control size and current workflows alongside visual captures.

The SDK metadata remains curated, not automatically generated; coordinated API updates are still required. Browser captures still require visual judgment. A full design-system product, remote persistence, publishing pipeline migration or replacement rendering engine is outside this decision. Private workspace builds do not publish modified SDKs.

## Acceptance

Run all static/domain/build gates and the checked-in browser suite; inspect desktop/mobile light/dark full-page captures. Record observed failures and corrections before committing. Because this changes application architecture, request confirmation for the finished diff before creating its commit, according to the explicit repository owner rule.
