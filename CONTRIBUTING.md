# Contributing

Liven UI is a React component library. Changes should improve discovery, live interaction, configuration or working integration code. Read [architecture](docs/architecture.md), [development](docs/development.md), [testing](docs/testing.md) and [design](design.md) before changing their respective areas. Automated maintenance follows [AGENTS.md](AGENTS.md).

Use Node 24 and Bun 1.4.2:

```sh
bun install --frozen-lockfile
bun run dev:docs
bun run check
```

For UI or rendering changes, run `bun run test:ui` after the fresh production build and inspect desktop/mobile light/dark captures. See the testing guide for browser installation and scope. SDK source changes must preserve public exports, declarations, lifecycle cleanup and installed-source behavior. Run `bun run scripts/check-consumer.ts` when changing source distribution.

Submit a focused pull request describing the problem, resulting behavior, verification and remaining limitations. Include screenshots for visible changes. Update canonical documentation when a contract changes. Do not commit credentials, local environment files, generated registry payloads, build outputs or browser artifacts. Source comments default to none; explain only necessary non-obvious runtime intent in a single line.

First-party contributions use the [MIT license](LICENSE). Preserve applicable package LICENSE/NOTICE files. Report vulnerabilities through the process in [SECURITY.md](SECURITY.md).
