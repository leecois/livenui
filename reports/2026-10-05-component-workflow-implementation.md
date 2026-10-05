# Component workflow implementation

Date: 2026-10-05

## Delivered behavior

All seven component guides now follow starting examples → interactive preview → quick settings → current React code. Preview and Install & Usage are separate keyboard-accessible task tabs. Installation is reachable immediately, with source installation, configured code and essential integration guidance in one view.

Starting cards mount actual SDK renderers. Choosing a card updates the editable preview and moves focus to it. Avatar examples include an agent sidebar context. Short choices use native radio semantics, readable labels and the existing accent tokens. Advanced settings, saved presets and JSON editing belong to Studio.

Open in Studio transfers the selected component variant, props and playback through a validated URL fragment. Reload and native fragment history retain the configuration. Invalid or oversized payloads fall back safely. File imports use the same parser. Exported theme props are included only when the selected API supports them.

Changing task tabs preserves configuration while unmounting inactive scenes. Leaving Preview releases microphone capture; returning requires an explicit new microphone request.

## Verification

- `bun run check` passed: 20 typecheck tasks, scoped source and documentation lint, architecture validation, 51 Bun tests with zero failures, and 11 build targets.
- `LIVENUI_BROWSER_CHANNEL=chrome LIVENUI_TEST_PORT=43188 bun run test:ui` passed against the newly built production output: 158 passed, two intentional desktop skips for the mobile-only drawer, zero failures, one worker and no retries. The runner owned and stopped its preview server.
- Reviewed full-page captures for all seven guides at 1440px and 390px in light and dark themes, plus installation and Studio captures. Individual starting-card, agent-sidebar and active Beam/Voice captures supplement full-page images because offscreen examples intentionally release their scenes.
- Compact controls and installation were checked at 320px. Mobile Liquid examples use full-width cards after visual review exposed clipped menu and slider scenes. Compact Beam examples have explicit host bounds and a taller frame so the actual effect fits.
- Regression checks cover native radio keyboard interaction and focus, tab semantics, code equality across task switches and Studio handoff, Metal variants, invalid fragments, Back/Forward, delayed imports, microphone teardown and preserved playback.

Browser evidence is in ignored `playwright-report/` and `test-results/` artifacts. The tests used installed Chrome with software rendering and microphone test doubles. Safari, Firefox, physical mobile devices, live audio hardware and deployment were not validated.

## Boundaries and design policy

Changes are confined to the component-library feature, public guides, regression checks and canonical documentation. SDK package sources, root configuration, build targets, legal attribution and deployment infrastructure were preserved. No remote publication or push was performed.

Accent buttons and selected pills retain `--gradient-accent` with white text in both themes. Associated contrast warnings remain accepted design trade-offs. Public team-profile display remains a skipped requirement.

## Canonical documents

- [Design](../design.md): guide and Studio hierarchy, control geometry and responsive composition.
- [Architecture](../docs/architecture.md): state ownership, task lifecycle and validated configuration handoff.
- [Development](../docs/development.md): feature change recipes and ownership.
- [Testing](../docs/testing.md): production browser matrix, regression coverage and evidence limits.

The [earlier research](2026-10-05-component-page-ux-research.md) remains a dated proposal and reference snapshot.
