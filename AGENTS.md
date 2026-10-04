# Agent operating contract

Liven UI is a component library for developers. Optimize the path **find a component → interact with it → configure it → copy working integration code**. Development is performed by a single primary agent.

## Read before editing

1. Read [architecture](docs/architecture.md) for ownership, dependency direction and runtime contracts.
2. Read [design.md](design.md) for every UI change. Values in the guide are implemented tokens, not suggestions.
3. Read [development](docs/development.md) for setup and change recipes.
4. Read [testing](docs/testing.md) before reporting completion.
5. Use [decisions](docs/decisions/001-component-library-foundation.md) for the rationale behind these boundaries.

If documentation disagrees with source, inspect the implementation and tests, then reconcile both in the same change. Historical files in `reports/` are evidence snapshots, not current instructions.

## Non-negotiable rules

- Work only in this checkout on `main`. Do not create branches, subagents or detached validation loops. Never push, publish, merge or deploy without a new explicit instruction.
- Make small, verified local commits. **Pause to confirm before committing sweeping architectural refactors.** Finish the implementation and verification first; request approval for the concrete diff, not a speculative plan.
- Commit messages are one-line Conventional Commit subjects. No body, co-author metadata or trailers.
- Default to zero source comments. A comment is permitted only as a necessary single-line explanation of non-obvious runtime intent. No multiline commentary, section banners, change narration or external brand/provider names in source comments.
- Before every commit execute exactly `git diff --cached | grep -E '^\+.*//|^\+.*/\*'`. Inspect every match. Remove non-compliant comments. Matches inside URLs or documentation commands are not source comments. Exit 1 means no matches, not a validation failure.
- Use English for source, identifiers, tests, documentation and commit subjects.
- Preserve `.git`, root configuration and `.env*`. Never print credentials. Do not delete unexplained worktree changes or replace SDK source to simplify UI work.
- Keep bright accent buttons and selected pills filled with `--gradient-accent` and white text in both themes. Record contrast flags as accepted design trade-offs; do not recolor these controls.
- Borrow functional anatomy and interaction mechanics from references; map presentation to local tokens, rounded-full controls, neutral tracks and contextual spacing.
- Public page copy, metadata and UI must not expose founder, executive or internal team identities. Recommendations to display team profiles are skipped requirements. Preserve legal licenses and source attribution.

## Edit map

| Task | Own the change here |
| --- | --- |
| Page routing, Glass layout, providers | `apps/docs/app`, `apps/docs/lib/source.ts`, `apps/docs/lib/layout.shared.tsx` |
| Library discovery, playground, gallery | `apps/docs/features/component-library` |
| Catalog API metadata | `apps/docs/features/component-library/data/catalog.json` |
| Defaults, parsing, code export | `apps/docs/features/component-library/lib/config.ts` |
| Public wording and essential controls | `apps/docs/features/component-library/lib/content.ts` |
| Examples | `apps/docs/features/component-library/lib/examples.ts` |
| Shared control primitives and tokens | `packages/agent-ui/src` |
| Actual effects and rendering engines | The seven SDK packages under `packages/` |
| Installation registry | `apps/docs/components/registry.mts`, `apps/docs/scripts/build-registry.ts`, feature `lib/distribution.ts` |
| User documentation | `apps/docs/content/docs/agents` |
| Developer documentation | Root guides and `docs/` |
| Regression checks | `tests`, `e2e`, `scripts/check-architecture.ts` |

## Completion gates

Run `bun run check` for source/config changes. For UI or rendering changes also run `bun run test:ui` against the newly built production output and inspect full-page desktop light/dark and mobile light/dark captures. Tests run with one worker and own the preview server. Do not reuse an unrelated server or validate stale output.

Use the smallest relevant test while iterating; complete the required gates before reporting or committing. Investigate failures instead of disabling checks, loosening token expectations or blindly replacing screenshot baselines. A compilation pass cannot prove visual correctness or absence of all runtime regressions.

Report what changed, evidence, limitations and local commit status. Link the modified canonical documents. Do not claim browser engines, devices, live microphones or deployment were tested when only Chromium with software rendering was used.
