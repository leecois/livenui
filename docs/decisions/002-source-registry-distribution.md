# Decision 002: Distribute Liven UI source

Status: implemented; owner selected source managed by Liven UI and installed from its registry.
Date: 2026-10-04.

## Problem

The playground recommended npm installation of the original effect packages. Registry entries contained only re-export adapters with the same dependencies. Local SDK corrections therefore reached the site preview but not the user installing a component. The owner requires Liven UI to maintain and distribute the component source.

## Decision

Keep private workspace package identities and rendering APIs. Replace adapter distribution with complete local TypeScript source, a client entry and legal files under the consumer's `components/livenui` directory. Canonical public IDs are `beam`, `orbs`, `metal`, `gooey`, `voice`, `image` and `avatars`. Retain old registry URLs as aliases containing the same maintained source.

Use standard registry installation commands for npm, pnpm and Bun. The installer copies files; it is not the component supplier. The public snippets, agent prompts, integration reference and SDK guides import installed local source. Standard targets use the consumer's `@components` directory alias, while example imports document their assumed `@/components` prefix. Image includes Three.js and its type dependency; Metal retains its shader dependency and existing notices.

Preserve the original licenses and attribution for inherited source. Liven UI is an independently maintained library; the current seven rendering SDKs include adapted implementations, and future original components can use Liven UI contributor copyright. Apply [licensing rules](../../CONTRIBUTING.md#licensing) to each implementation rather than labeling the whole catalog a fork. Do not advertise an unpublished npm namespace or silently publish packages. Source generation and deployment remain separate actions.

The [registry schema](https://ui.shadcn.com/docs/registry/registry-item-json) supports multi-file blocks, npm/type dependencies and non-code `registry:file` entries for legal files. The [installer](https://ui.shadcn.com/docs/cli) accepts custom registry items. Installed tool code additionally verifies `@components` target resolution for source, licenses and custom component directories.

## Verification and limits

Install all seven entries in a temporary independent project, compile snippets for every component family and bundle the installed source. Compare included source/legal content with the checkout, reject upstream effect dependencies, verify both formats and legacy aliases, and validate standard-installer target plans. Run the full static/build/browser gates and review desktop/mobile captures in both themes.

Fast Bun tests use installed prerequisite runtime/type dependencies through a temporary link. The separate `scripts/check-consumer.ts` runner installs a fresh npm React consumer, executes commands and code copied from Studio, verifies source/legal payloads and rejects bundle inputs outside that application. It renders all seven configured integrations. See [consumer verification](../testing.md#fresh-consumer-integration) for the accepted non-RSC entry transformation and clipboard scope. This does not establish fresh installation on every package manager, npm namespace ownership or live deployment. The full implementation source, including later local fixes, is now the registry payload owner.
