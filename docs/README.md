# Developer documentation

For installing and using components, start with the [integration guide](https://livenui.dev/agents/integration). These documents explain how to contribute to and maintain this repository.

## Start here

| Guide | Read it when |
| --- | --- |
| [Contributing](../CONTRIBUTING.md) | Preparing a focused contribution |
| [Development](development.md) | Setting up the workspace or changing a feature |
| [Architecture](architecture.md) | Finding ownership, dependencies and runtime contracts |
| [Design](../design.md) | Changing layout, controls, tokens or motion |
| [Testing](testing.md) | Choosing checks, reviewing visual evidence and verifying releases |
| [Agent contract](../AGENTS.md) | Running automated maintenance |

## Feature guides

| Area | Guides |
| --- | --- |
| Workspaces | [Studio](studio-workspace.md), [avatar playground](avatar-playground.md) |
| Controls and layout | [Settings](settings-layout.md), [preview sizing](preview-layout.md), [interaction research](interface-research.md) |
| Visual assets | [Brand](brand.md), [mascots](mascots.md), [demo media](demo-media.md) |

## Decisions

- [Component library foundation](decisions/001-component-library-foundation.md): ownership and dependency boundaries.
- [Source distribution](decisions/002-source-registry-distribution.md): editable integration source and attribution.
- [Renderer restoration](decisions/003-original-component-implementations.md): visual quality and retained renderer contracts.

## Documentation policy

Keep documentation that helps someone use, change, test or release the project. Each contract has one canonical owner; link to it rather than duplicating instructions. Decision records explain durable trade-offs. Preserve source provenance and applicable legal notices.

Public component guides live in `apps/docs/content/docs/agents`; contributor guides live here. Keep agent execution rules in `AGENTS.md`, not product copy.

Store local audit logs, screenshots, temporary investigations and recovery bundles under ignored `tmp/`. Browser tools also use ignored `test-results/` and `playwright-report/`. The retired `reports/` directory is ignored. Local archives are not a shared backup; promote reproducible regression checks and lasting decisions into tests or canonical guides before relying on them.

Do not commit credentials, device identifiers, absolute workstation paths, approval transcripts or repeated command output. Release results should state the tested revision, commands and limitations in the release or review record; a past successful run is not a standing readiness guarantee.
