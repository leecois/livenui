# Soltu source distribution

Date: 2026-10-04. The owner selected source managed by Soltu and installed from its registry.

## Result

The former installation flow downloaded upstream effect SDKs. Its registry entries merely re-exported those packages, so local fixes did not reach consumers. The new flow packages the exact local engine/type source for all seven libraries, a client entry and LICENSE/available NOTICE files. Public snippets and agent instructions import `@/components/soltu/{id}`. npm/pnpm/Bun commands use the Soltu source registry. No unpublished npm package or original-authorship claim is introduced.

Canonical IDs are `beam`, `orbs`, `metal`, `gooey`, `voice`, `image` and `avatars`. Old registry URLs remain aliases serving the same maintained source. Standard installer targets respect the consumer's component-directory configuration, including root/src and custom directory layouts. Image includes Three.js and its types; Metal retains its shader dependency.

Deleted the seven obsolete package-only adapters in `apps/docs/registry`. Workspace identities and rendering APIs remain intact. Updated the integration page, agent reference, SDK guides, operating-contract edit map and canonical developer docs. Browser-compatible development checks replace direct Node global references in Gooey source. An abandoned workspace directory containing only ignored build/cache artifacts and an empty source directory was removed so workspace discovery could run.

## Evidence

- Independent consumer project: all seven entries installed, nine component-family snippets typechecked and the source bundled; prerequisites were linked from the local toolchain.
- Four registry tests pass with 296 assertions, comparing source/legal content, rejecting upstream effect dependencies, preserving aliases and validating standard installer schema/target planning.
- `bun run check` passed with pinned Bun 1.4.2 and Node 24.21.0: 39 source tests, typechecks, lint, documentation/architecture gates and 11 production build tasks.
- `bun run test:ui` passed against the newly built production output: 102 passed, two intentional desktop drawer skips, one worker and no retries. Reviewed full-page desktop and mobile captures in light and dark themes; the installation controls, source imports and gradient actions retain their layout without page overflow. Long commands and code use their existing scrollable containers on mobile.

## Delivery boundaries

This distributes a Soltu-maintained fork and preserves attribution. It does not mean that the original engine code was authored by Soltu. Private workspaces stay private and no npm package was published. Browser capture uses Chrome/Chromium with software rendering and controlled audio doubles; no physical microphone, Safari/Firefox, clean network install for every package manager or live deployment is claimed. The default browser test port was occupied by another server, which was preserved; the managed run uses an independent unused port.

Local generation updates the checkout's registry payloads. The live website receives them only after a separately authorized deployment. No push or deployment was performed.

See [Decision 002](../docs/decisions/002-source-registry-distribution.md), [architecture](../docs/architecture.md), [development](../docs/development.md) and [testing](../docs/testing.md).
