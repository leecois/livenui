# Component page UX research

Date: 2026-10-05.
Scope: information hierarchy and interaction anatomy of the [Bot avatars reference](https://libraries.dev/bots), compared with Liven UI's `/agents/avatars` and shared Studio composition. This is a researched proposal; it does not change application behavior.

## Evidence

The reference was inspected in a live desktop and mobile browser. Preview and Install & Usage tabs were exercised, and the Working state was selected. Desktop preview, desktop installation and mobile preview captures were reviewed. Liven UI was rebuilt, then the existing avatar renderer/layout acceptance test passed at desktop light and mobile light using installed Chrome, one worker and a runner-owned production server. The two full-page captures were inspected. These observations do not claim dark-theme acceptance, other browser engines, physical devices or remote deployment.

## Observed reference anatomy

| Region | Purpose and interaction | Useful local adaptation |
| --- | --- | --- |
| Page title and short introduction | Identifies the component and explains its behavior before controls | Explain the use case and one concrete interaction without package jargon |
| Primary view switch | Preview and Install & Usage occupy separate views | Separate trying a component from integrating it; preserve configured values across the switch |
| Adjacent actions | Studio and coding-agent actions sit beside the view switch | Provide a clearly named route to deeper customization and an accessible agent-copy action |
| Initial demonstrations | A small avatar roster and two application-context examples precede the editor | Show a small, purposeful set of working examples before exposing the complete editor |
| Playground | One selected avatar has a stable stage, a visible playback action and grouped settings | Let the user connect each change to its immediate visible result |
| Settings | Type, State, Size, Shading, Hat and Glasses are separate groups of visible choices | Use direct choices for short enumerations; keep long lists and precision inputs readable |
| Generated snippet | Code immediately follows the playground and reflects the selected state | Keep working integration code close to the interactive result |
| Installation view | Install command and usage code are grouped together; platform navigation is a separate concern | Show only supported React/source-registry installation and its working import |
| Mobile | Demonstrations, stage, grouped settings and code stack in a predictable sequence | Keep the same task order and avoid making users scroll through advanced administration before reaching installation |

The reference also contains account, paid-plan and public team surfaces. These are outside Liven UI's runtime contracts. Team identity display is a skipped requirement. Accent-gradient contrast flags remain accepted design trade-offs. Local presentation must use the existing token source and control geometry.

## Current local friction

1. The component guide and Studio use the same complete Workbench. Visitors receive controls, saved presets, JSON editing and installation before the distinction between learning and advanced configuration is clear.
2. The default avatar page starts with a single adjustable avatar. The application-context explanation appears after the entire editor and integration block, so users must first understand the controls to understand the use case.
3. The State select exposes the API value `default`, while the preview uses the human label Idle. Activity is selected in two places without explaining why. Other raw select values make the controls read like an API editor.
4. Starting examples are hidden behind Examples & saved, grouping exploration with browser-local persistence. These serve different intentions.
5. The preview's height follows the full control panel, which includes a search field and administrative tabs. Its spare space is driven by form complexity rather than the component demonstration.
6. On mobile, installation follows the entire customization panel. The user cannot reach installation directly from a clearly visible component-level switch.
7. Helpful instructions repeat inside the stage, its caption and the later Material and motion section. The repeated text occupies space without introducing a new decision.

## Proposed Liven UI hierarchy

### Component guides

1. Component title, concise use case and one interaction instruction.
2. A primary Preview / Install & Usage switch, with Open in Studio and Copy agent prompt as adjacent actions.
3. Preview view: a small set of relevant demonstrations, then a stable stage and essential settings. Examples are visible starting points; saved presets and JSON remain advanced concerns.
4. A generated React snippet directly below the active playground, with Copy code. Its values must reflect the effective configuration and playback state.
5. Install & Usage view: package-manager choice, source-registry command, generated React code and required alias/dependency guidance. API details remain an optional disclosure. Switching views preserves the selected configuration.

For Bot avatars, introduce a small roster and practical agent-status example, then prioritize shape, activity, material and size in the editor. Accessories and detailed lighting/fur/motion parameters belong to advanced customization. Translate `default` to Idle in visible UI while retaining the API value in exported code.

### Studio

Keep the full configuration workflow, but group it by intent: component/starting example context; live preview and essential settings; optional advanced settings; generated code; optional saved configurations and JSON transfer; API reference. Keep one state owner and preserve the current validation, resource lifecycle and installation contracts.

### Overview and examples

The overview explains which interaction each component serves. Examples provide visual starting configurations and lead into customization. Component guides explain one component. Studio tunes a selected configuration. Avoid duplicate navigation destinations or making the user choose among these surfaces before trying a component.

## Implementation and acceptance boundaries

Own composition in `features/component-library/views` and `components`, public labels in `lib/content.ts`, and presentation in the existing scoped styles. Reuse examples, preview adapters and renderer boundaries. No SDK replacement or additional state store is required to implement the hierarchy.

Keep `--gradient-accent` and white text for primary actions and selected pills in both themes. Preserve rounded-full 44px controls, muted neutral tracks, existing semantic panel radii and container-based responsiveness. Do not transplant reference colors, branding, account restrictions or unsupported platform tabs.

Implementation acceptance must cover keyboard view switching, focus, configuration persistence, live-code synchronization, microphone/renderer release when a preview is hidden, direct installation access, 320px overflow, existing registry contracts and full-page desktop/mobile captures in both themes. Run `bun run check` and the complete production `bun run test:ui` gate before committing UI changes. The completed diff determines whether architectural approval is required; this research alone authorizes no publication.
