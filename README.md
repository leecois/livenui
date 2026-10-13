# Liven UI

Interactive React components with live configuration and ready-to-copy integration code.

Explore [the component library](https://livenui.dev/agents), try [Studio](https://livenui.dev/studio), or read the [integration guide](https://livenui.dev/agents/integration).

## Components

Seven families cover border beams, thinking orbs, metallic effects, liquid interactions, voice visualization, image reveals and bot avatars. Guides provide starting examples and quick settings; Studio adds advanced configuration, code export and browser-local presets.

Installation copies editable component source from the registry into your application. The playground and generated integration code use the same configuration. Avatar chat is a scripted local demo; microphone access is optional and starts only after an explicit action.

## Develop locally

Use Node 24 and Bun 1.4.2.

```sh
bun install --frozen-lockfile
bun run dev:docs
```

The development site runs at `http://localhost:3000`. Production defaults to `https://livenui.dev`; `NEXT_PUBLIC_APP_URL` overrides the build-time origin. See [setup and origin configuration](docs/development.md#project-identity-and-origin).

```sh
bun run check
bunx playwright install chromium
bun run test:ui
```

Browser tests use the production build from `check` and own their preview server. See [testing](docs/testing.md) for focused checks and browser coverage.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [developer documentation](docs/README.md). The documentation index covers architecture, design, change recipes and release checks. Automated maintenance also follows [AGENTS.md](AGENTS.md).

- `apps/docs`: website, playgrounds, guides and source registry.
- `packages/agent-ui`: shared controls and design tokens.
- Seven SDK packages: rendering implementations and public component APIs.
- `packages/cli`, `packages/ui`, `packages/tsconfig`: installation and build support.

Source registries regenerate from the maintained SDKs during builds. Workspace packages are private; public installation uses the registry. See the [distribution decision](docs/decisions/002-source-registry-distribution.md).

## License

The root [MIT License](LICENSE) retains the copyright notices for Liven UI contributions and inherited MIT-licensed source. Components retain their package-specific LICENSE/NOTICE files for standalone distribution. Bundled [icons](packages/ui/LICENSE-ICONS) and [shaders](packages/metal-fx/LICENSE-APACHE-2.0) retain their own terms. Attribution applies to the included material, not unrelated original components.
