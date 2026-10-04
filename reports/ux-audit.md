# Component discovery and integration UX

Project and package identifiers are normalized to current Liven UI naming. Original audit dates, findings and validation limits are retained; obsolete machine-specific temporary paths are omitted.

Date: 2026-10-04
Audience: developers selecting and integrating React components.

## Evidence and approach

The review covered the local navigation tree, eleven documentation pages, seven playgrounds, 83 example configurations and the existing desktop/mobile layout. Baseline screenshots were recorded as temporary artifacts outside this checkout. This is a task-based heuristic review, not a usability study with recruited users or a measured conversion experiment.

The primary task is find → try → integrate. Recommendations follow these sources:

- [Information scent](https://www.nngroup.com/articles/information-scent/): descriptive labels and surrounding context help visitors predict where a link leads. Component cards now explain a use case and offer distinct playground and example links.
- [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): keep frequent choices visible and reveal advanced options when requested. Essential controls appear first; API tables, configuration transfer and advanced parameters remain available.
- [Recognition rather than recall](https://www.nngroup.com/articles/recognition-and-recall/): show relevant choices and guidance in context. Interaction hints sit under each preview, and installation commands sit beside the generated component code.
- [Native History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api): the framework supports synchronizing native history updates with search parameters. Example filters use URL state without rerendering the documentation on the server for every keystroke.

## Findings and changes

| Finding | Applied decision | Verification |
| --- | --- | --- |
| A flat navigation list mixes discovery, libraries and integration | Group the existing page tree into Explore, Components and Guides | Check canonical routes and exactly one active sidebar link |
| Names and rendering engines do not explain when to use a component | Describe use cases on cards; search names, public component symbols, package names and purposes | Search by public name and task, including multiword queries |
| Gallery renders all 83 entries at once and loses its filters on navigation | Show 12 results representing all seven libraries initially, add explicit load-more, and persist library/search in the URL | Filter, reload, Back, return from Studio and reach all 83 entries |
| Mobile users reach code and export actions before configuration controls | Order the DOM as preview, controls, installation/code | Compare element positions at desktop and mobile widths |
| API tables sit inside a narrow control sidebar | Put the complete API in a full-width disclosure below code | Open tables for every library, including Liquid.Item and Metal variants |
| Studio exposes a large set of parameters before a visitor chooses a task | Start with component-specific essential settings; search includes advanced settings | Check essential/advanced toggles and JSON validation |
| Empty local presets push starting examples out of view | Place a compact starting-point selector before named presets | Load an example, save, restore and delete a local preset |
| Copying an agent prompt receives more emphasis than copying React code | Make Copy code the primary gradient action; keep JSON and agent handoff in a disclosure | Test clipboard content, import validation and export |
| The mobile navigation drawer does not close with Escape or contain keyboard focus | Add Escape, Tab wrapping, dialog semantics and focus restoration to the existing drawer | Open using the keyboard, wrap Tab in both directions, Escape and verify restored focus |
| The Image preview clips at 320px | Constrain the preview root and preserve its image aspect ratio | Verify host bounds at 320px and both primary screen sizes |
| Integration copy mixes instructions with unrelated backend status | Provide a concrete package → client component → application state guide | Check example types and documentation links |

## Constraints

The Fumadocs Glass shell, seven rendering engines, SDK contracts, routes, registry endpoints, theme provider and workspace build targets remain in place. All 83 example configurations remain available. Rendering previews continue to pause offscreen, honor reduced motion and request microphone access only after interaction.

Accent buttons and selected pills retain `--gradient-accent` with white text in both themes. Bright-gradient contrast warnings remain an accepted design trade-off; this review does not recolor those controls. Recommendations to publish founders, executives or internal team members are skipped.

## Validation

`bun run check` passes with the pinned toolchain: all 20 typecheck/dependency tasks, repository lint, documentation/link validation, 17 tests with 22,590 assertions, and all 11 build tasks. The tests cover all 83 example configurations, package adapters, SDK exports and the new discovery behavior.

Browser verification uses Chrome with isolated contexts:

- 12 workflow checks cover task/import-name search, URL filters and history, all 83 results, essential/advanced controls, keyboard tabs, JSON validation, local presets, package-manager commands, clipboard output, portable configurations and component-specific APIs.
- 37 layout profiles cover all seven playgrounds at 1440px and 390px in both themes, all seven at 320px, and Studio at 768px and 1024px. Preview hosts fit, controls precede integration on mobile, and accent code buttons retain white text.
- Four mobile navigation profiles at 320px/390px in both themes verify initial focus, Tab/Shift+Tab wrapping, Escape, restored focus, navigation and control editing.
- Components, Examples, Studio and Get started have full-page and viewport screenshots at desktop/mobile in both themes. All 16 page/profile combinations return HTTP 200, have one active navigation entry and have no horizontal overflow.
- The browser runs record no uncaught JavaScript errors or failed HTTP responses. Artifacts and JSON evidence were temporary files outside this checkout and are not committed.

These checks establish functional and layout behavior; they do not substitute for observing real developers completing the task. A future usability session should ask a developer to find an audio visualization, customize a Metal badge and integrate a saved configuration without guidance.
