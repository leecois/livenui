# Development and change recipes

Read [AGENTS.md](../AGENTS.md), [architecture](architecture.md) and [design.md](../design.md). Execute commands from the repository root unless a recipe names another directory.

## Setup

Use Node 24 and Bun 1.4.2 (the manifest's pinned package manager). Do not assume whichever global binary happens to be first on PATH is correct.

```sh
node --version
bun --version
git status --short --branch
bun install --frozen-lockfile
bun run dev:docs
```

`dev:docs` builds required workspace packages and serves the documentation application. `bun run start` serves a previously built production application; `PORT` changes its port. Environment variables come from existing `.env*` and `.env.example`; preserve them and never include values in reports. Ordinary local search/build does not need remote credentials.

## Project identity and origin

The application workspace is `@livenui/docs`, the control foundation is `@livenui/agent-ui`, and installer support uses `livenui-cli` and `livenui-ui`. Seven rendering SDKs retain their private build identities and public component APIs. Consumer source installs under `components/livenui`.

The default site/registry origin is `http://localhost:3000`. Configure `NEXT_PUBLIC_APP_URL` for a hosted build and pass the hosted registry with the CLI's `--dir` option. Git starts independently on `main` with no remote; adding a new remote, publishing and deployment require explicit authorization. Historical reports retain their original project names and observations.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run typecheck` | All workspace typechecks, upstream builds and maintenance/browser tooling types |
| `bun run lint` | Scoped Biome formatting, import and lint checks |
| `bun run lint:docs` | MDX generation, public documentation links and docs lint |
| `bun run check:architecture` | Workspace graph, feature import boundaries and maintenance-document links |
| `bun run test` | Domain, configuration, engine and installer contracts |
| `bun run build` | All package and production application builds |
| `bun run check` | All non-browser gates in sequence |
| `bun run test:ui` | Sequential browser journeys against current production build |
| `bun run check:ui` | Full check followed by browser tests |

`lint:docs` currently includes a formatting/lint write step inherited from the existing app script. Review `git diff` after every gate; do not assume validation is entirely read-only. `bun run release` publishes and `bun run version` changes release metadata: neither is authorized by ordinary maintenance tasks.

## Fix a layout defect

1. Reproduce its route, query parameters, theme and container width in the browser. Inspect computed styles and element boxes, not only JSX.
2. Identify the owning file in `features/component-library/styles/`. If shared geometry is wrong, inspect the token source and foundation primitive first.
3. Correct the owning selector/composition. Delete obsolete rules; do not append overrides or apply viewport breakpoints to compensate for sidebar width.
4. Add or amend a meaningful browser contract that would fail for the defect (alignment, typography, local overflow, interaction or focus).
5. Run required checks, inspect screenshots and update the design guide if the intended contract changed.

## Add or change an example

Edit `lib/examples.ts`, preserving existing stable IDs. Configurations must parse with their exact library/variant and generate the correct public component import. Search names and use cases should be understandable to developers. Do not fork a separate list in gallery or Studio. Run `bun test tests/examples.test.ts tests/discovery.test.ts`; then run full checks and affected browser journeys.

## Change a component API

1. Implement in the owning SDK and preserve export/build contracts unless a breaking change is explicitly intended.
2. Update `data/catalog.json`, `lib/config.ts`, variant defaults, exported snippets and `lib/content.ts` essential fields.
3. Update the corresponding preview adapter, examples, public guide and agent integration reference.
4. The source registry reads the owning SDK on every pre-build. Update source entry/export conventions and `lib/distribution.ts` when the public entry changes; both formats regenerate from local source.
5. Test valid/invalid props, generated imports, package ESM/CJS exports, peers, resource lifecycle and relevant renderer variants.

Copy an existing SDK package structure when adding an entirely new package. Match compiler/build/peer conventions and legal requirements. New package publication or a changed public dependency contract needs explicit review; adding another package simply to split an app module is unnecessary.

## Work on hooks and panels

Keep configuration behavior in `usePlayground`, session persistence/theme/router in `useLibrarySession`, and panel rendering in `components/`. Pass the single state instance from the view. Keep parsing/discovery pure so Bun tests can run without a browser. Do not let controls and exported code create separate props stores.

Async configuration input must be validated before changing state. File import notices belong beside transfer actions. Tab validation notices belong in controls. Storage failures must offer a portable alternative instead of pretending a preset was saved.

## Source distribution

Public installation copies the current local SDK source, client entry and legal files from `/r/{id}.json`. Do not reintroduce an upstream package re-export or rename private workspaces merely to advertise an unpublished npm scope. Modify the owning SDK; never edit generated registry JSON or maintain a second engine copy. Canonical IDs and legacy aliases are defined in `components/registry.mts`.

Run `bun test tests/registry.test.ts tests/config.test.ts tests/discovery.test.ts` for distribution changes. The registry tests install all seven libraries into a separate project, typecheck all component families and bundle them with the consumer alias. They also validate the standard installer schema and target planning with root/src and custom component directories. Review runtime and type dependencies together.

## Installer maintenance

Registry file targets and resolver names are untrusted paths. Reject absolute, traversal and encoded traversal paths. Preflight all parent/child outputs against the captured project root and reject escaping symlinks before writing any file. Configured sibling aliases and symlinks inside that root remain valid. Recheck destinations immediately before writes; do not claim protection against concurrent hostile filesystem mutation.

The command factory in `packages/cli/src/program.ts` owns global option propagation. Dependency installation must reject nonzero subprocess exits and must not announce success after failure. Run `bun test tests/cli.test.ts tests/registry.test.ts` for installer changes, then the full gate.

## Dependency maintenance

Inspect root and workspace manifests, graph and peer ranges first. Upgrade deliberately and regenerate the Bun lockfile with the pinned binary. Do not mix npm/pnpm lockfiles into this workspace or use `--force`/ignored peers as a routine fix. Diagnose the package requesting the conflicting peer. Preserve the dual compiler contract until declarations and all builds prove compatibility.

Use a fresh installation only when investigating dependency resolution or a requested upgrade; never delete `.git`, `.env*` or source alongside `node_modules`. No dependency cache reset is required for a CSS or documentation change.

## Local delivery

Inspect `git diff --check` and the exact scope. Stage only intended changes. Run the staged comment gate required in [AGENTS.md](../AGENTS.md), review its matches, then create a one-line Conventional Commit for a small verified change. For sweeping architecture changes, present implemented behavior, validation, affected paths and material limitations, and obtain confirmation **before committing**. Never push automatically.
