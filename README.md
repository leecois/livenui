# Liven UI

A developer component library with seven rendering SDKs, 83 configurable examples and a shared live playground in the Fumadocs Glass layout. Find an interaction, try it, configure it and copy integration code.

## Start here

Coding agents must read [AGENTS.md](AGENTS.md) before editing.

| Guide | Purpose |
| --- | --- |
| [Architecture](docs/architecture.md) | Workspace topology, ownership, dependency boundaries and runtime contracts |
| [Design guide](design.md) | Implemented visual tokens, control recipes, responsive behavior and acceptance |
| [Development](docs/development.md) | Setup, commands and recipes for examples, UI, APIs and dependencies |
| [Testing](docs/testing.md) | Reproducible static, browser and visual verification |
| [Architecture decision](docs/decisions/001-component-library-foundation.md) | Research evidence and reasons for the current structure |

## Independent project

This checkout uses an independent Git history on `main`. Remote configuration is local; pushing, publication and deployment require explicit authorization. The application, component source, tests, licenses and infrastructure configuration were copied from the previous project. Dependencies and generated outputs are installed or rebuilt locally.

The site and registry default to `http://localhost:3000` until a deployment origin is configured. Set `NEXT_PUBLIC_APP_URL` in a local environment file before building for a hosted origin; replace localhost in static installation examples with that origin. No domain registration, npm publication or remote deployment is implied.

## Run

Use Node 24 and Bun 1.4.2.

```sh
bun install --frozen-lockfile
bun run dev:docs
```

```sh
bun run check
bunx playwright install chromium
bun run test:ui
```

`bun run check:ui` executes both verification stages. `bun run start` serves the built application; `PORT` overrides port 3000. Browser tests own their production preview server and run with one worker.

## Workspace and product

`apps/docs` owns the site, feature modules, MDX and source registry definitions. `packages/agent-ui` owns shared controls/tokens. Seven SDK packages implement border beam, thinking orbs, Metal Fx/Text/Badge, liquid morph/move/melt/bend, voice, image reveal and bot avatars. Existing `ui`, `cli` and `tsconfig` workspaces retain installer/build contracts. SDK builds provide ESM, CJS and declarations; the application and declaration compiler retain their existing compatibility split.

`/` opens `/agents`. `/agents/gallery` offers URL-shareable filters and progressive example loading. `/studio?library=orbs` opens the same playground; example links also select an initial configuration. Each component has a guide at `/agents/{id}`, and `/agents/integration` explains setup.

Playgrounds support essential/advanced controls, validated JSON, starting examples, browser-local presets, pause/replay, generated code, agent prompts and portable import/export. Microphone access is optional and click-initiated. Reduced motion pauses effects; offscreen previews release or pause their scenes. Hosted accounts, billing, cloud presets and agent chat are not connected.

The application preserves bright `--gradient-accent` controls with white text in both themes. Contrast flags are accepted design trade-offs. Public founder, executive and internal team identity display recommendations are skipped.

## Distribution and references

`/r` and `/registry` regenerate complete editable SDK source from this checkout during production builds. Canonical entries use `beam`, `orbs`, `metal`, `gooey`, `voice`, `image` and `avatars`; legacy URLs remain aliases. Users import their installed `components/livenui` source, rather than downloading upstream effect packages. Image carries Three.js and its types; Metal retains its shader dependency. Search is local at `/api/search`; optional remote synchronization is explicitly gated. `/agent-skill.md`, `/llms.txt`, `/llms-full.txt`, MDX text, static JSON and OG routes retain integration/discovery contracts.

Rendering source is ported from [Libraries.dev](https://github.com/Jakubantalik/Libraries.dev), with licenses and legal notices preserved. SDK workspaces remain private. Liven UI distributes its maintained fork through source registries, including licenses/notices; no npm ownership or original authorship is claimed. Local builds update registry payloads, and deployment is a separate authorized action. See [the source-distribution decision](docs/decisions/002-source-registry-distribution.md).

Historical integration/dependency/UX snapshots remain in `reports/`. They document past evidence and limits; canonical instructions are the linked guides above.

## Open-source readiness

Read the [publication audit and licensing scope](docs/open-source.md). Private environment files, local editor integrations and generated artifacts are excluded.

## License

Liven UI's first-party code and documentation are licensed under the [MIT License](LICENSE), with copyright attributed to Liven UI contributors. Third-party code retains its existing licenses, copyright notices and attribution. Package-specific LICENSE and NOTICE files remain authoritative for their respective source; the root license does not replace them.
