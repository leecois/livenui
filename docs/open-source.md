# Release checklist

Targets: [leecois/livenui](https://github.com/leecois/livenui) and [livenui.dev](https://livenui.dev). Complete these checks for the revision being released. This checklist is not a current audit result or authorization to push, publish or deploy.

## Source and documentation

- Review `git status --porcelain`, the release diff and intended commit history. Resolve unexplained changes before publishing.
- Scan tracked files and reachable history for credentials, private endpoints, personal data and local artifacts. Inspect findings without printing secret values; targeted searches cannot prove that every secret is absent.
- Keep private environment files ignored and `.env.example` credential-free. Preserve local configuration during ordinary maintenance.
- Keep contributor guides current and follow the [documentation policy](README.md#documentation-policy). Exclude raw audit logs, screenshots and recovery bundles from the published tree.
- Verify asset provenance and applicable notices. Demo artwork is documented in [demo media](demo-media.md).

## Licensing and distribution

The [root MIT license](../LICENSE) retains the copyright notices for Liven UI contributions and inherited MIT-licensed source. Components retain their package-specific LICENSE/NOTICE files for standalone distribution. Bundled [icons](../packages/ui/LICENSE-ICONS), [fonts](../apps/docs/lib/og/OFL.txt) and [shaders](../packages/metal-fx/LICENSE-APACHE-2.0) retain their own terms. Follow [contribution licensing](../CONTRIBUTING.md#licensing) for new or adapted components.

- Verify that generated registry entries contain complete maintained source, LICENSE, additional license files and available NOTICE content.
- Maintain licenses at their package or asset owner. Website copies in `apps/docs/public/licenses/` are ignored build outputs generated from package originals; do not commit or edit them separately. Icon attribution is included in `packages/ui/LICENSE-ICONS`.
- Run the [fresh consumer integration check](testing.md#fresh-consumer-integration) when changing source distribution.
- Keep private workspace package identities distinct from the public source registry. Do not advertise unpublished npm packages.

See [source distribution](decisions/002-source-registry-distribution.md) and [renderer restoration](decisions/003-original-component-implementations.md) for implementation provenance and scope.

## Security and verification

- Run `bun run check`. For UI or rendering changes, run the fresh-production browser suite and inspect desktop/mobile captures in both themes, following [testing](testing.md).
- Run `bun audit` and assess each current finding by dependency path and exposure. Record unresolved findings with the tested revision; do not describe a nonzero audit as clean.
- Recheck the previously unresolved [braces advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), observed in build/installer dependencies on 2026-10-10. That historical finding does not establish its current status.
- Preserve rejection of raw SVG filters in shared configuration, JSON and presets. Trusted application-code APIs have a different boundary; see [architecture](architecture.md).
- Report exact browser/device coverage. Simulated viewport, clipboard and microphone checks do not establish physical-device or live-hardware behavior.

## Repository and deployed site

- Confirm public repository access, private vulnerability reporting, required Workspace checks and auto-merge permissions. Local workflow files do not establish remote settings.
- Confirm DNS and HTTPS for the public domain. Build with the intended origin; remove any hosted localhost override and rebuild when `NEXT_PUBLIC_APP_URL` changes.
- Verify deployed canonical/share URLs, sitemap, robots, agent reference and all seven `/r/{id}.json` entries.
- Complete one installed-source journey from the live site and check keyboard/touch input, copy behavior and representative renderer interactions on the intended devices.
- Record the revision, verification results and remaining release blockers before requesting any required publication approval.

## Product claims

Describe Liven UI as an independently maintained component library with live configuration and editable React integration source. Original contributions and adapted implementations coexist; do not claim exclusive authorship of inherited renderers.

Avatar chat uses scripted local replies, presets stay in the browser and microphone access is explicit. Do not imply hosted AI chat, cloud storage or device coverage that has not been tested. Public team-identity recommendations remain skipped; bright accent/white-text contrast warnings remain accepted design trade-offs under the [design guide](../design.md).
