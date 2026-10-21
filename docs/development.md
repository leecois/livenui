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

The production site/registry origin is `https://livenui.dev`; development defaults to `http://localhost:3000`. `NEXT_PUBLIC_APP_URL` overrides either default. Verify that a copied `.env.example` has not left a localhost override in a hosted environment. Pass the hosted registry with the CLI's `--dir` option. Registry URLs, metadata, sitemap and `/agent-skill.md` use the build-time origin; rebuild when it changes. Credentials, paths, queries and fragments are rejected. Edit `apps/docs/content/agent-skill.md` for the downloadable reference. Git uses independent history on `main`; adding a new remote, pushing, publishing and deployment require explicit authorization.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run typecheck` | All workspace typechecks, upstream builds and maintenance/browser tooling types |
| `bun run lint` | Scoped Biome formatting, import and lint checks |
| `bun run lint:docs` | MDX generation, public documentation links and docs lint |
| `bun run check:architecture` | Workspace graph, feature import boundaries and root/developer/package-document links |
| `bun run test` | Domain, configuration, engine and installer contracts |
| `bun run build` | All package and production application builds |
| `bun run sync:search` | Explicit remote search synchronization after building, with opt-in credentials |
| `bun run check` | All non-browser gates in sequence |
| `bun run test:ui` | Sequential browser journeys against current production build |
| `bun run check:ui` | Full check followed by browser tests |

`lint:docs` currently includes a formatting/lint write step inherited from the existing app script. Review `git diff` after every gate; do not assume validation is entirely read-only. `bun run release` publishes and `bun run version` changes release metadata: neither is authorized by ordinary maintenance tasks.

## Hosting on Vercel

Connect the repository with production branch `main`, framework **Next.js**, root directory `apps/docs`, Node **24.x**, and **Include source files outside of the Root Directory** enabled. Keep the framework's default output directory. Set the project install command to:

```sh
npm install --global --allow-scripts=bun bun@1.4.2 && export PATH="$(npm prefix -g)/bin:$PATH" && bun --version && bun install --frozen-lockfile
```

Set the build command to:

```sh
export PATH="$(npm prefix -g)/bin:$PATH" && cd ../.. && bun --version && bun run build
```

The explicit path selects the installed Bun version instead of the build image's earlier binary. The root build produces workspace SDKs before the application generates its registry. Build cache outputs include `public/r`, `public/registry` and `public/licenses`, so a cache restore retains source-installation endpoints and legal files. Keep the Bun version aligned with `packageManager` when upgrading.

Use `livenui.dev` as the primary domain and redirect `www.livenui.dev` to it. Apply the DNS records recommended by the project's Domains settings. Leave `NEXT_PUBLIC_APP_URL` unset to use the production default, or set it to `https://livenui.dev`. Ordinary builds need no search credentials.

Authenticate the CLI locally and keep `.vercel/` and `.env*` ignored. Prefer deploying a specific Git commit so local environment files and audit artifacts are excluded. Connecting Git enables automatic deployments on future pushes; push/deploy authorization still follows [AGENTS.md](../AGENTS.md). Verify the live domain and installed-source journey using the [release checks](testing.md#evidence).

## Avatar configuration

Read [avatar playground](avatar-playground.md) before changing chat or the character workspace. Keep chat scheduling in its hook, full-height composition in its view and control panels supplied with callbacks. Native dialogs own covered-content isolation and compact focus containment. Validate Stop, Offline, re-entry and teardown before changing scripted reply scheduling. Keep shape options sourced from catalog metadata and shape-control thumbnails paused in the existing preview boundary. Chat sidebar rows own only hover/focus presentation; their selected state comes from the existing conversation. Motion belongs in the native preview adapter/SDK with reduced-motion and visibility handling. Inactive thumbnails hold a neutral pose. A single chat-owned media listener prevents sidebar activation under reduced motion and releases its listener on teardown. Keep runtime SDK imports in the preview adapter. Color swatches use the retained SDK palette and share the exact-entry state owner. Check container-based stacking, selected-shape retention, accessory/code equality and renderer identity.

## Fix a layout defect

1. Reproduce its route, query parameters, theme and container width in the browser. Inspect computed styles and element boxes, not only JSX.
2. Identify the owning file in `features/component-library/styles/`. If shared geometry is wrong, inspect the token source and foundation primitive first.
3. Correct the owning selector/composition. Delete obsolete rules; do not append overrides or apply viewport breakpoints to compensate for sidebar width.
4. Add or amend a meaningful browser contract that would fail for the defect (alignment, typography, local overflow, interaction or focus).
5. Run required checks, inspect screenshots and update the design guide if the intended contract changed.

For device preview controls, read [the layout research and width contract](preview-layout.md). Keep requested width in the workbench, measurement in `PreviewPanel` and pointer-capture handling in `PreviewResizer`; do not encode device presets into SDK props, share fragments or generated snippets. Check compact fallback, grip keyboard keys, touch/mouse cancellation, task-switch persistence and renderer identity with `e2e/preview-width.spec.ts`.

## Change website identity

For website identity, read [brand ownership](brand.md). Edit `public/logo.svg` geometry or standalone fills, then run `bun run scripts/generate-brand-assets.ts` to refresh browser/touch icons. The navigation and chat marks use shell foreground masks; standalone fills must match that theme pair. The sharing template consumes the same SVG on its light canvas. Keep the accent tokens for actions and selected controls. Run branding browser checks and inspect the small icons as well as the full-page matrix before the local commit.

If a cached build still renders earlier brand colors after a source revert, run `bun run build --force` before browser checks. Inspect the rendered navigation mark as well as the public SVG; correct source files alone do not establish that the production output uses the restored palette.

## Change a sidebar icon

Edit `lib/navigation-icon.tsx` for route-specific SVG anatomy and `app/navigation.css` for shell-scoped motion. The source loader attaches icons to existing page-tree entries; preserve Studio URL normalization, accessible labels and a single active destination. Keep icons decorative and server-rendered, use local color tokens and finite CSS animation, and verify keyboard focus, hover, reduced motion and the mobile drawer with `e2e/sidebar-icons.spec.ts`.

The owned drawer class keeps the existing shell header and footer fixed in its flex layout while the middle destination list owns scrolling. Verify the first and last link stay visible and hit-testable at compact heights when changing shell spacing or upgrading the layout package. Deferred initial focus must preserve an already-focused drawer descendant; `e2e/library.spec.ts` exercises this startup race alongside focus containment and opener restoration.

## Add or change an example

Image reveal and liquid melt demonstrations use the original local artwork documented in [demo media](demo-media.md). Update `lib/media.ts` when replacing these assets so previews and exported melt snippets share the same artwork. Exports resolve built-in melt image URLs against the public registry origin so consumer applications need no copied website assets. Keep demo media local; do not restore copied reference photographs.

Edit `lib/examples.ts`, preserving existing stable IDs. Configurations must parse with their exact library/variant and generate the correct public component import. Search names and use cases should be understandable to developers. Do not fork a separate catalog in gallery or Studio. Built-in CSS values in exported recipes must work without the website stylesheet: preserve consumer token overrides and supply fallbacks for website-owned variables. Metal’s standalone accent fallback must match the central accent tokens; custom CSS variables supplied by users remain their application’s responsibility. Guide showcases select existing IDs through `lib/content.ts`; application-context demonstrations live in `lib/examples.ts` and receive the same validation. Run `bun test tests/examples.test.ts tests/discovery.test.ts`; then run full checks and affected browser journeys.

## Change a bot mascot

Read [mascot design and ownership](mascots.md). Add types, silhouettes and face presets in `packages/bot-avatars/src`, then update both catalog type fields, examples and the SDK guide. Reuse the existing material and animation pipeline. Keep faces inside the body during gaze changes and validate silhouette details at 32px as well as the default preview size. Run the mascot browser contracts and review every material before the full gates.

## Change a component API

1. Implement in the owning SDK and preserve export/build contracts unless a breaking change is explicitly intended.
2. Update `data/catalog.json`, `lib/config.ts`, `lib/structured-props.ts`, variant defaults, exported snippets and `lib/content.ts` essential fields.
3. Update the corresponding preview adapter, examples, public guide and agent integration reference.
4. The source registry reads the owning SDK on every pre-build. Update source entry/export conventions and `lib/distribution.ts` when the public entry changes; both formats regenerate from local source.
5. Test valid/invalid props, generated imports, package ESM/CJS exports, peers, resource lifecycle and relevant renderer variants.

Reuse an existing SDK package structure when adding an entirely new package. Match compiler/build/peer conventions and follow [licensing rules](../CONTRIBUTING.md#licensing): original implementations use Liven UI contributor copyright; adapted portions retain their applicable notices. Do not copy another package's copyright onto independently authored source. New package publication or a changed public dependency contract needs explicit review; adding another package simply to split an app module is unnecessary.

## Work on hooks and panels

Keep configuration behavior in `usePlayground`, session persistence/theme/router in `useLibrarySession`, and panel rendering in `components/`. Pass the single state instance from the view. Keep parsing/discovery pure so Bun tests can run without a browser. Do not let controls and exported code create separate props stores.

Guide quick settings use `lib/content.ts` essential fields, human labels and optional typed choices. All finite enums use native radios: two or three options use balanced SelectionTrack cells, larger lists use ChoiceField chip grids with inline expansion and selected-option retention. Studio retains advanced settings and contextual JSON in Customize, and browser-local saved presets in the Presets inspector tab. Its inline starting-point choices share the gallery examples. See [Studio workspace](studio-workspace.md). Place guide integration prose in the content metadata when it must appear beside installation rather than repeat after the playground.

For settings presentation, follow [settings layout](settings-layout.md). Keep field dispatch in `FieldControl`, native numeric/color draft interactions in `NumberControl`/`ColorControl`, pure per-component editing metadata in `lib/controls.ts`, and grouping/navigation/action composition in `ControlsPanel` and scoped rules in `playground.css`. Align choice/switch labels beside compact controls, moving these labels above below 550px. Put larger choice headings above their grids. Keep numeric, color and text labels inside compound rows at every width; exact entries remain flexible within the value grid. Numeric pointer capture starts across the full field including the displayed value. Pressing does not jump; after 4px of horizontal movement, pointer position maps the field edges to the drag limits. Clicking the value focuses its native exact editor. Preserve exact draft semantics and restore on cancellation or lost capture. Use category headings only for expanded Studio settings. Keep fields under the same grid parent with stable keys across expansion/collapse so local drafts survive. Sort DOM children in the displayed order; do not visually reorder fields with CSS. Use ChoiceField for typed enums and inline expansion; use the shared SelectionTrack for two/three-option radio, tab and device groups. Studio component choices remain native links. It measures native selected targets for a decorative indicator without owning configuration or changing keyboard behavior; keep geometry and motion in the central tokens and scoped foundation styles. Verify inset strips, compound label alignment, value-grid separation, stable focus geometry, single compound focus indicators, target sizes, wrapping, keyboard selection and unchanged generated props with `e2e/settings-layout.spec.ts` and `e2e/settings-controls.spec.ts` before the full gates. New numeric fields need reviewed drag windows, units and steps plus coverage in `tests/controls.test.ts`. Distinguish recommended windows from effective renderer clamps and playground resource budgets; preserve valid custom values within those budgets and keep trusted SDK APIs unchanged. Update replacement control versions and the asynchronous revision guard when adding a draft or replacement path.

Use `studioHref` and `parseConfiguration` for portable guide-to-Studio links. Serialize effective props and the selected component variant into the fragment; do not introduce a second persistence store or send configuration as a server query. Guide task switching must preserve the configuration owner while unmounting inactive renderers. Studio Customize / Presets / Code keeps its central preview mounted; component navigation retains validated temporary snapshots while releasing the departing renderer. Check pending and live microphone teardown when changing this composition.

Async configuration input must be validated before changing state. File import notices belong beside transfer actions. Tab validation notices belong in controls. Storage failures must offer a portable alternative instead of pretending a preset was saved.

## Source distribution

Public installation copies the current local SDK source, client entry and legal files from `/r/{id}.json`. Do not reintroduce an upstream package re-export or rename private workspaces merely to advertise an unpublished npm scope. Modify the owning SDK; never edit generated registry JSON or maintain a second engine copy. Canonical IDs and legacy aliases are defined in `components/registry.mts`.

Run `bun test tests/registry.test.ts tests/config.test.ts tests/discovery.test.ts` for distribution changes. The registry tests install all seven libraries into a separate project, typecheck all component families and bundle them with the consumer alias. They also validate the standard installer schema and target planning with root/src and custom component directories. Review runtime and type dependencies together.

## Installer maintenance

Registry file targets and resolver names are untrusted paths. Reject absolute, traversal and encoded traversal paths. Preflight all parent/child outputs against the captured project root and reject escaping symlinks before writing any file. Configured sibling aliases and symlinks inside that root remain valid. Recheck destinations immediately before writes; do not claim protection against concurrent hostile filesystem mutation.

Resolve each component once per dependency traversal, preserving parent-first order. Cache validated component payloads rather than partially expanded dependency lists, so shared children are unique and a failed child can be retried. Reject circular dependencies before writing files.

Registry production rejects cycles, unsafe component paths and duplicate output names and file/ancestor conflicts after path normalization. Both writers validate before cleaning or writing output; the standard writer also converts its payload first. The native writer reserves `_registry` and descendants of `_registry.json` for its index. Invalid input must leave existing output intact; unexpected filesystem failures during writing are not transactional.

During installation, preflight existing output targets as files before starting writes. Deduplicate and track installed files by resolved output destination, so equal names in different configured namespaces remain distinct. Mark a destination installed only after a successful write, an identical existing file or a deliberate declined overwrite; failed writes must remain retryable. This is not a transactional rollback: earlier successful writes remain after an unexpected later failure. Normalize validated dot-prefixed registry targets when resolving generated imports. Partial alias objects retain the same omitted defaults as an absent alias object.

The command factory in `packages/cli/src/program.ts` owns global option propagation. Resolve each detected package manager’s add command for runtime and development dependencies. When a package occurs in both groups, install it once as a runtime dependency using the runtime specification; do not move it into devDependencies with a second `-D` command. An existing development-only package required at runtime must be promoted; an unspecified registry version retains its existing manifest specification. npm and pnpm use an explicit production-save flag. Other managers receive a promoted manifest before installation, with the original manifest restored if that command fails. Dependency installation must reject nonzero subprocess exits and must not announce success after failure. Run `bun test tests/cli.test.ts tests/registry.test.ts` for installer changes, then the full gate.

## Dependency maintenance

Inspect root and workspace manifests, graph and peer ranges first. Upgrade deliberately and regenerate the Bun lockfile with the pinned binary. Do not mix npm/pnpm lockfiles into this workspace or use `--force`/ignored peers as a routine fix. Diagnose the package requesting the conflicting peer. Preserve the dual compiler contract until declarations and all builds prove compatibility.

Use a fresh installation only when investigating dependency resolution or a requested upgrade; never delete `.git`, `.env*` or source alongside `node_modules`. No dependency cache reset is required for a CSS or documentation change.

The root overrides pin patched esbuild and shell-quote and align transitive KaTeX with the app's version. Remove overrides only when parent ranges resolve safe versions and builds, math rendering and consumer installation pass. Unused standalone audit/proxy tools are not part of the installed toolchain. Run `bun audit` and record unresolved advisories with their dependency paths and observed scope; do not describe it as clean while it reports an advisory.

## Local delivery

Inspect `git diff --check` and the exact scope. Stage only intended changes. Run the staged comment gate required in [AGENTS.md](../AGENTS.md), review its matches, then create a one-line Conventional Commit for a small verified change. For sweeping architecture changes, present implemented behavior, validation, affected paths and material limitations, and obtain confirmation **before committing**. Never push automatically.

## Publication sanitation

Before publication, review the intended diff and reachable history for credentials, private data and local artifacts without printing sensitive values. Ordinary maintenance preserves local environment files; an explicit sanitation request can authorize their removal. Keep `.env.example` free of credentials, ignore all other `.env*` files, and keep local editor integrations outside tracked source. Shared formatting settings in `.vscode` remain portable project configuration.

Run `bun run sync:search` explicitly when a remote index needs updating. This uncached task depends on the build and forwards only the three search settings through the task environment; cached builds never perform synchronization. Remote search synchronization requires `LIVENUI_SYNC_SEARCH=1`, `ORAMA_PRIVATE_API_KEY` and `ORAMA_INDEX_ID`. The index identifier is supplied by the operator; no hosted resource identifier is embedded in source. Missing credentials skip synchronization, and a missing index with supplied credentials fails before reading build output or contacting the service. Local search and ordinary builds do not require these settings.

Use the repository-local identity configuration for local commits. Do not overwrite global Git identity, discard source changes or publish rewritten history without explicit authorization.

## Maintain documentation

Follow the [documentation policy and index](README.md). Update the owning guide when a contract changes; keep reproducible checks in the test suite. Store investigation logs and recovery artifacts under ignored `tmp/`. Record release-specific results separately from reusable instructions. Run `bun run check:architecture` for maintenance-document links and `bun run lint:docs` when changing public guides.
