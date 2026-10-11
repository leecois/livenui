# Decision 003: Renderer replacement and restoration

Status: established renderers restored; replacement experiment superseded.
Date: 2026-10-11.

## Context

Replacing the seven rendering implementations changed their visual quality and interaction behavior. The replacements did not meet the intended material, motion and effect quality. Improving application controls did not require replacing the underlying engines.

## Decision

Restore all seven SDK implementations from `d240803`, the revision before the replacement experiment. Retain the application workspace, Studio, avatar chat, shared controls and original demo artwork. The committed Border Beam replacement remains in Git history; restoration is a forward change.

Restore corresponding package licenses, notices, dependencies, registry metadata and package guides with each implementation. The initial renderer integration recorded [Libraries.dev](https://github.com/Jakubantalik/Libraries.dev) at revision `d06640864eb4adc2fe240f899a44ee6210779782` as its source reference. Local changes are maintained in this repository; this reference does not imply that current SDK files are unchanged upstream copies.

## Consequences

Visual quality, lifecycle behavior and public component APIs remain acceptance criteria for future renderer changes. Application improvements do not establish exclusive authorship of inherited implementations. The root MIT license does not replace component-specific notices or the Metal shader's Apache license; follow [contribution licensing](../../CONTRIBUTING.md#licensing).

Run the source, build, browser and [independent-consumer gates](../testing.md#fresh-consumer-integration) for renderer or distribution changes as applicable. Inspect moving interactions and full-page desktop/mobile captures in both themes. Preserve integration, layout, lifecycle, mascot and legal-retention contracts. Keep run-specific logs and recovery artifacts outside canonical documentation.
