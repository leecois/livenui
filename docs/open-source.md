# Open-source and marketing readiness

Audit date: 2026-10-10. Target repository: [leecois/livenui](https://github.com/leecois/livenui). Target website: [livenui.dev](https://livenui.dev). This is a local release-readiness audit, not permission to push, publish or deploy. See [architecture](architecture.md), [development](development.md), [testing](testing.md) and [source distribution](decisions/002-source-registry-distribution.md).

## Current verdict

The local source has been prepared for publication, with the limitations below. Public marketing is not ready: the target domain did not resolve from the audit environment, and the unauthenticated repository URL returned 404. A 404 cannot distinguish a private repository from a missing repository. Remote visibility, HTTPS, repository settings and deployed behavior remain unverified.

| Area | Result |
| --- | --- |
| Source and history hygiene | No actual credential or private endpoint identified by the targeted scans; no private environment or generated artifact tracked |
| Licensing | Original MIT notices retained; inherited application/support, icons, fonts and shader terms included |
| Playground security | Executable raw SVG filter configuration rejected; installed SDK keeps its trusted application-code API |
| Dependencies | Ten advisory records across nine packages reduced to one unresolved High advisory in build/installer tooling |
| Distribution | All seven current source integrations installed, typechecked, bundled and rendered in an independent React application |
| Production URLs | Production defaults to `https://livenui.dev`; development remains localhost; build-time override validated |
| Collaboration | Contribution/security guides added; pull requests configured for checks; dependency auto-merge no longer uses administrator bypass |
| Remote launch | DNS, public repository access, required checks, private reporting and deployed verification remain release tasks |

## Hygiene evidence

The audit started at commit `5079c24` with 435 tracked files and 98 reachable revisions. It scanned 977 unique historical blobs, including six unreachable blobs, and checked current tracked/new text plus the structure outside hidden and dependency directories. Targeted rules covered private-key material, common provider token formats, credential assignments, credential-bearing URLs, private endpoints, email addresses, workstation paths and retired project names. Matches were classified without publishing credential values. Current email/path matches were synthetic fixtures or neutral maintainer documentation; historical retired-name matches were reference provenance and evidence snapshots. No actual leaked credential was identified. These checks cannot prove the absence of every possible secret.

Git author and committer metadata used `Liven UI Maintainers <maintainers@livenui.invalid>` throughout the inspected history. Subjects remain single-line Conventional Commits without bodies. Credential findings did not require a history rewrite. The owner-requested pre-publication cleanup condensed 105 local commits to 98, combining navigation, mascot, logo, focus and documentation iterations. Optional licensing-index documents were removed from reachable `main` history. Each recreated commit passed its staged-comment gate; the resulting tree matched the validated cleanup target. The original history is saved in an ignored local Git bundle, and unreachable objects are preserved. Existing `.git`, environment files, build targets, executable source and legal content remain intact; CI changes are listed below.

The unused template `apps/docs/public/banner.png` was removed; it displayed another product's documentation and had no source consumer. Eight remaining PNG/WebP assets had no EXIF, XMP, IPTC or ICC payloads; the ICO was checked separately through branding acceptance. Fonts retain their intended copyright/license metadata. Generated output, installed dependencies and browser artifacts remain ignored for local inspection. `.env.example` is credential-free; `.gitignore` excludes private `.env*`, keys, OS metadata, dumps, logs and generated output.

The five reference JPEGs retired on 2026-10-06 remain in earlier Git revisions. Current public URLs return 404 and active demos use the original artwork documented in [demo media](demo-media.md). Removing a current file does not remove it from Git history. This audit preserves that history and the upstream MIT attribution; it does not claim that every historical asset was authored by Liven UI.

## Licensing and claims

The [root MIT license](../LICENSE) covers Liven UI's original contributions. Inherited source retains [upstream MIT terms](../licenses/upstream-MIT.txt) and all seven SDK licenses. Bundled [icons](../packages/ui/LICENSE-ICONS), [fonts](../apps/docs/lib/og/OFL.txt) and [shaders](../packages/metal-fx/LICENSE-APACHE-2.0) retain their own terms. Original SDK LICENSE/NOTICE files remain unchanged. Source registries include required LICENSE, all additional LICENSE-* / LICENSE.* files and available NOTICE. Metal installation now carries the full Apache license alongside its notice.

All workspaces are private; the public distribution is editable source from the Liven UI registry. Marketing may describe an independently maintained component library with seven current families, 87 examples, live configuration and copied React integration. Original contributions use MIT; adapted source and assets retain their applicable terms. [Contributing](../CONTRIBUTING.md#licensing) covers new component ownership. Do not claim original authorship of every renderer, an independently published npm scope, hosted AI chat, cloud presets or live microphone/device coverage from simulated tests. Chat replies are scripted, presets stay in the browser and microphone access is explicit. Public internal-team identity recommendations remain skipped. Bright accent/white-text contrast warnings remain accepted design trade-offs.

## Security and dependency follow-up

A shared Gooey configuration could inject raw SVG containing an inline image error handler. The audit reproduced JavaScript execution locally. The parser now rejects `filter` in JSON, shared links and presets; controls omit code-only props and the preview adapter discards raw filter markup. Domain tests and browser regressions cover rejected configuration, retained safe rendering and code export. The SDK API remains available to trusted application code. Other application-reference props remain code-only.

The dependency changes remove unused standalone audit/proxy tools, update concurrently and pin patched shell-quote/esbuild while aligning transitive KaTeX with the app. MDX formula rendering and the full build remain required compatibility gates. `bun audit` still exits nonzero for [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), with no published fixed version on the audit date. Observed paths run through build/installer dependencies such as Tailwind tooling, shadcn and tsc-alias. No public request-to-pattern path was identified in this checkout; this is not proof of universal non-exploitability. Do not suppress the advisory or describe the dependency audit as clean. Review it when upstream fixes are available.

## Verification

`bun install --frozen-lockfile` passed. `bun run check` passed with 82 tests, 12-workspace architecture validation and 11 build targets. Documentation link validation includes real route handlers. Two existing non-blocking Biome suggestions remain; no validation rule was disabled.

`LIVENUI_BROWSER_CHANNEL=chrome bun run scripts/check-consumer.ts` passed. A fresh npm React application installed all seven entries with shadcn, verified 119 source/legal files, compiled the copied configured snippets and rendered the actual installed SDKs. Hosted commands were checked, then directed to the owned local registry for execution. This does not establish live registry availability or fresh installation with all package managers. Clipboard uses a test double.

`LIVENUI_BROWSER_CHANNEL=chrome LIVENUI_TEST_PORT=43219 bun run test:ui` passed against the newly built production output: 426 passed and two intentional desktop drawer skips, across 428 cases with one worker. Eight full-page captures were inspected: Components overview and safe Gooey Studio in desktop/mobile light/dark. No overlapping controls or clipped installation commands were observed in these captures; bright accent/white-text controls remain unchanged. The browser used Chrome with software rendering.

The audit does not claim Safari, Firefox, physical-device, live microphone, deployed runtime or production analytics validation. Earlier manual iPhone acceptance remains historical evidence in [testing](testing.md).

## Release sequence

1. Keep the local validated commits on `main`. Review `git status --porcelain`, staged comments and the diff before any separately authorized push.
2. Configure DNS and HTTPS for `livenui.dev`; ensure a hosted environment has not retained `.env.example`'s localhost override. Build with the intended origin and verify canonical/share URLs, sitemap, robots, agent reference and all seven `/r/{id}.json` entries online.
3. Make the repository publicly accessible when authorized. Enable private vulnerability reporting, require the Workspace checks status on `main`, and review auto-merge permissions/settings. Local workflow files do not establish those remote protections.
4. Repeat one installed-source journey from the live site, keyboard/touch chat and copy behavior on a real device, and a representative renderer interaction before beginning public marketing. Use the documented independent-library, scoped attribution and local-demo wording.
