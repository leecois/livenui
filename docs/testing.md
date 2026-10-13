# Verification and visual review

Static checks and browser acceptance test different things. A production compilation pass does not guarantee alignment, rendering fidelity or all runtime behavior. Follow [AGENTS.md](../AGENTS.md) and [design.md](../design.md).

## Reproducible baseline

```sh
bun install --frozen-lockfile
bunx playwright install chromium
bun run check:ui
```

On a Linux host, install browser system dependencies with the official Playwright installation command appropriate to the environment. On a machine with Chrome already installed, `LIVENUI_BROWSER_CHANNEL=chrome bun run test:ui` is an optional local alternative. The default uses Playwright's managed Chromium. These commands require the pinned Bun and compatible Node toolchain.

The browser runner owns a production server at `127.0.0.1:43187`, one worker, no detached loops and no retries that can conceal flakes. `LIVENUI_TEST_PORT` selects another unused local port. It refuses to reuse a server, so an occupied port fails clearly. Run `bun run build` after source changes before invoking `test:ui` alone. The server shuts down when the run completes.

## Gates

| Layer | Owner | Detects |
| --- | --- | --- |
| Typecheck | Workspace scripts and `tsconfig.tools.json` | Public/package/application/tooling type mismatches |
| Biome | Root `biome.json` | Lint, formatting and import consistency in the declared scope |
| Documentation lint | App docs script | Broken public MDX links |
| Architecture gate | `scripts/check-architecture.ts` | Workspace cycles, inverted dependency boundaries, broken root, developer and package-document links |
| Bun tests | `tests/` | Valid/invalid configuration, examples, discovery, SDK ESM/CJS contracts, finite orb frames, source-registry installation, standalone compilation, legal-file retention, alias planning and installer cleanup/peers |
| Build | Turbo and Next pre/post scripts | Package distributions, registry regeneration and all app targets |
| Browser contracts | `e2e/library.spec.ts` | Render hosts, dimensions/alignment, design tokens, source order, navigation, JSON/preset/transfer workflows |
| Component workflow | `e2e/component-workflow.spec.ts` | Quick choices, direct installation, variant/configuration handoff, reload and fragment history |
| Visual review | Primary agent inspecting captures | Aesthetic defects that measurable contracts do not encode |

Root lint is intentionally scoped. Passing it does not mean every vendored engine line was audited. The architecture gate checks declared static imports and workspace edges; it is not a general-purpose proof of all dynamic dependency behavior.

## Fresh consumer integration

`tests/registry.test.ts` also checks that website license copies regenerate from package originals, retain all nine existing public paths and replace stale content. Build caching must restore these generated files with the application output.

After `bun run check`, run `bun run scripts/check-consumer.ts` from the checkout root. It owns a new production server, creates an independent React application in ignored `tmp/consumer-*`, installs dependencies with npm and executes the standard installation command copied from each of the seven Studio integrations. The copied command's production registry origin is verified, then replaced with the owned test server's address for execution; no application environment file is changed.

The runner applies explicit props through the real JSON editor and copies the displayed React code. It verifies those props in the clipboard payload, every installed SDK/legal file, required runtime/type dependencies and the absence of workspace links. With `rsc: false`, the standard installer removes the generated entry's client directive; that single entry transformation is accepted. SDK source and legal content still match the registry. Copied JSX receives only a consumer component wrapper, then typechecks and bundles with independently installed dependencies. Bundle metadata rejects any source resolved outside the consumer. Chromium renders all seven integrations and records full-page/component captures and structured evidence beside install logs.

This is an npm consumer check. The UI suite verifies the command strings for npm, pnpm and Bun, but does not establish fresh installation with all three managers. Copy uses a clipboard test double and does not prove physical clipboard access. Temporary application files and artifacts remain ignored for inspection; the runner shuts down its own servers and browser.

## Installed Safari and physical iPhone

On macOS, `bun run scripts/check-safari.ts` owns a fresh production server and the installed Safari WebDriver. It checks numeric editing and exported values, full-track dragging, contained focus, copy feedback, all seven renderer hosts and local chat in both themes. Captures and `result.json` remain in ignored `tmp/safari-*`. Copy feedback is observed without reading the operating system clipboard. The runner stops its local servers and driver after success or failure and reports unsuccessful browser-session cleanup.

Enable [remote automation](https://developer.apple.com/documentation/safari-developer-tools/ios-enabling-webdriver) on the Mac and connected, unlocked, trusted iPhone before running `bun run scripts/check-safari.ts --ios`. The device uses a local HTTPS proxy with a one-day test certificate and session-scoped certificate acceptance; no trust profile is installed. Set `LIVENUI_DEVICE_HOST` if the automatic LAN address is unreachable, and `LIVENUI_DEVICE_UDID` to select one device when several are available. Device identities are omitted from reports and pairing errors. `--ios --render-only` verifies renderer/layout smoke checks separately and does not claim interaction coverage.

The runner releases WebDriver input state after pointer sequences. A successful input command alone does not prove that the live field changed or that the operating-system keyboard opened: verify both. The geometry report records `keyboardObserved`; false means keyboard occlusion was not tested. A render-only pass cannot replace interaction acceptance. Repeat typing and Send in regular Safari on the device, including keyboard opening, dismissal and layout stability.

The keyboard browser suite also routes production assets through an insecure origin to check the shared UUID fallback, native send/reply, New chat, bot creation and preset save/reload. These checks do not open a physical keyboard.

## Browser matrix

After a fresh build, `bun run test:ui --config=e2e/cross-browser.config.ts` runs the control-feedback, integration-layout, preview-width, avatar-chat-viewport and avatar-chat-keyboard journeys in Firefox and WebKit. Eight projects cover both engines at 1440px and 390px in both themes, with one worker and an owned production server. Reports and captures use separate cross-browser subdirectories. This matrix checks selected journeys, not the complete Chromium suite. WebKit is not the installed Safari browser, and a narrow viewport is not a physical phone.

Keyboard navigation uses Option+Tab in WebKit to include native buttons under its default keyboard-navigation preference. Pointer clicks need not focus a button; tests explicitly establish a starting focus before real forward/backward keyboard navigation. Resize drags remain within the browser viewport while leaving the stage, allowing every engine to deliver captured pointer events. Chromium's CDP touch journey remains in the full suite and is excluded from this additional matrix because the other engines do not support that protocol.

## Choose a focused regression

Use the smallest relevant suite while iterating, then complete the required gates. For example, after a fresh build:

```sh
bun test tests/config.test.ts tests/controls.test.ts
bun run test:ui e2e/settings-controls.spec.ts
```

The complete Chromium suite runs desktop (1440px) and mobile (390px) in both themes. Composition tests additionally cover 320/768/1024px and 200% zoom where relevant. Desktop drawer cases are intentionally skipped because that surface is absent. Test files own exact assertions; feature guides own the implemented contracts.

| Area | Browser suites under `e2e/` | Contract |
| --- | --- | --- |
| Discovery and integration | `library`, `component-workflow`, `integration-layout` | Navigation, examples, validated handoff/history, complete commands/snippets and copy feedback |
| Settings | `settings-controls`, `settings-layout`, `direct-choices`, `selection-tracks`, `control-feedback`, `clean-labels` | Native keyboard/touch interaction, numeric drafts and full-track dragging, direct choices, contained focus and stable geometry; [settings guide](settings-layout.md) |
| Studio and preview | `studio-workspace`, `preview-width`, `playground-state`, `gooey-layout` | Presets, configuration retention, pre-hydration layout, resizing and one behavior selector; [Studio](studio-workspace.md) and [preview sizing](preview-layout.md) |
| Avatar chat | `avatar-chat`, `avatar-chat-entry`, `avatar-chat-settings`, `avatar-chat-viewport`, `avatar-chat-keyboard`, `avatar-chat-motion`, `avatar-layout` | Local conversations, initial layout, helper/configuration identity, viewport anchoring, sidebar motion and teardown; [avatar playground](avatar-playground.md) |
| Rendering | `avatar-mascots`, plus moving-scene cases in `library` | Native materials, state, pointer interaction, pause and Connector relief; [mascots](mascots.md) |
| Resources and untrusted input | `microphone`, `playground-security` | Late capture cleanup, rejected raw SVG filters and Orb resource budgets |
| Assets and shell | `branding`, `demo-images`, `sidebar-icons` | Brand/media payloads, real image decoding, navigation focus/motion and compact containment; [brand](brand.md) and [media](demo-media.md) |

Browser suite names in the table end in `.spec.ts`. All seven libraries, three Metal components and four Liquid behaviors need coverage when shared preview composition changes. Device buttons resize a container; they do not emulate a browser engine or physical hardware.

| Non-browser area | Suites under `tests/` |
| --- | --- |
| Configuration, content and examples | `config`, `controls`, `discovery`, `examples`, `avatar-content`, `avatar-chat`, `orb-limits` |
| Renderer and resource ownership | `engine`, `lifecycle`, `metal-lifecycle`, `image-reentrancy`, `microphone`, `avatar-relief` |
| Distribution and build | `registry`, `cli`, `installer-retry`, `publication`, `search-sync` |

Non-browser suite names end in `.test.ts`. Lifecycle probes run isolated subprocesses with controlled frames, image loads, timers and listeners so module mocks cannot leak into package contract checks. They exercise teardown/replacement inside callbacks, paused rendering, pending imports, microphone requests and installer retries. Mocked ownership checks do not establish visual quality.

## Capture and interaction discipline

- Layout runs start with reduced motion and paused real SDKs. Enable motion explicitly for animation changes; verify changing frames, per-instance pause, pointer response, material isolation and teardown. A paused screenshot is insufficient.
- Scroll a stage into view before checking its renderer. Metal defers its first frame offscreen; example cards intentionally unmount outside the viewport. Capture Gallery's visible upper/lower windows separately.
- Scroll instantly to the top and assert `scrollY === 0` before a full-page capture. Review isolated scenes too: the compact shell's fixed footer gradient remains at the viewport edge in a full-page image.
- Test keyboard, pointer and touch cancellation separately. Keep native radio/tab behavior, exact-edit commit/cancel, selected-option retention, stable target bounds and configuration/code equality.
- Check renderer identity across configuration, focus and inspector changes. Switching away from Preview releases its renderer and microphone; Studio inspector tabs retain the central preview. Pending or late capture results must be released by their owner.
- Connector held-pose checks disable reduced motion while pausing playback, because reduced motion uses its own still pose. Review face clearance and separated arms across materials, sizes and yaw; contour tests alone do not prove shading quality.
- Tests with clipboard or microphone doubles validate payloads, feedback and lifecycle only. Repeat physical clipboard/audio interactions separately when those claims matter.

## Evidence

For a release, record the tested revision, gate results, unresolved dependency advisories and device coverage. Confirm public repository access and [private vulnerability reporting](../SECURITY.md). After an authorized deployment, verify HTTPS, canonical/share URLs, sitemap, robots, the agent reference and all seven registry endpoints on the actual domain, then complete one installed-source journey from that site.

`playwright-report/` contains the browser HTML report; `test-results/` contains per-test full-page/context/variant images and failure traces. Overview capture scrolls each library into view and waits for its real renderer before recording the complete page. Gallery records visible upper/lower windows separately because offscreen example scenes intentionally unmount. Both are ignored build artifacts. Inspect captures for desktop light, desktop dark, mobile light and mobile dark before accepting any UI change. Also inspect narrower widths when composition changes.

Use `bunx playwright show-report` to review a run interactively. Add one-shot focused tests to the checked-in suite when a regression matters; do not leave the only repeatable evidence in a workstation-specific `/tmp` script. There is no automatic screenshot baseline acceptance: existing effects animate and GPU rendering varies, so layout contracts are asserted directly and raster captures receive human/agent visual review.

## Manual acceptance checklist

- Review heading/control type scale, context-row alignment, balanced whitespace and every owned panel.
- Confirm liquid morph/move/melt/bend mechanics, all three Metal components, avatar gaze/material/state behavior and image reveal quality when their adapters change.
- Exercise keyboard selection, arrows/Home/End, Escape and visible focus, including long labels and 200% zoom.
- Check both themes: gradients keep white text and neutral surfaces follow shell tokens.
- Verify microphone permission starts only after the explicit action and tracks stop on navigation. Automated layout runs do not validate real microphone hardware.
- Check production HTTP contracts and redirects when shell, source loading, registry or build tooling changes.
- Record skipped identity-display requirements and accepted accent contrast flags rather than silently changing product policy.

The complete browser suite uses Chromium with software rendering. The additional bounded matrix covers Firefox and WebKit; the installed Safari runner is a separate check. Record exact commands, scopes and device limitations with each result. Do not infer physical keyboard, live audio or deployed infrastructure coverage from browser or renderer-only passes. CI currently executes `bun run check`; browser acceptance is a required local UI gate and has not been added to the deployment workflow implicitly.
