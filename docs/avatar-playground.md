# Avatar playground

The Bot avatars guide opens a complete local chat playground. Studio keeps its component editor and provides the same Chat playground action. Both presentations share the existing `usePlayground` configuration owner and native SDK adapter.

## Reference and scope

The public [Momo playground](https://feralui.dev/momo) was inspected in Chromium on 2026-10-07 at 1440px and 390px. Its complete composition has an examples/history sidebar, a full-height conversation with a centered character and helper selector, a bottom composer, and a separate configuration sidebar. Examples produce scripted conversation turns; replies can stream or appear instantly. On mobile, examples and Playground open over the conversation.

Liven UI follows that complete composition and interaction model. The owner selected a local interactive chat demo. Twenty original scripted examples, eighteen outfits assembled from retained native accessories, bot identities, conversation history, Stop, simulated availability and Stream/Instant replies work without chat requests, credentials or a backend. Appearance uses the existing semantic surfaces, spacing, rounded-full controls and accent gradient. Reference artwork, character assets and branding are not included. The retained SDK supports Idle, Working and Sleeping rather than the reference renderer's seven expressions.

## Full-height chat

- The native fullscreen dialog covers the viewport while retaining the Glass shell and route below it. Native modal behavior makes the covered interface inert. Component preview closes chat and returns to the same configuration; Chat playground reopens it with retained conversations and named bots. Leaving the workbench releases that local session.
- The dialog root is its own inline-size container. At widths of at least 1100px, columns are 256px for examples, a flexible conversation, and 320px for Playground. Each sidebar scrolls independently below its 64px header. Below 1100px, both sidebars become native modal overlays with contained focus, Escape dismissal and opener restoration. Resizing changes presentation without replacing the main native avatar.
- An empty conversation centers the configured avatar, Who's helping selector and New bot action. During conversation, the same renderer sits above the bottom composer. Its configured canvas size is retained. Working is a temporary demonstration state while a reply is pending; exported props remain the chosen component configuration.
- The message feed scrolls separately and follows replies while the reader is near its bottom. Enter submits, Shift+Enter adds a newline, and composition input is preserved. Input is limited to 2000 characters. Up to twenty conversations with forty messages each are retained in this workbench session.
- Stop, Offline, a new conversation, history selection, closing chat and teardown invalidate pending reply work. Stream-to-Instant changes retain progress. Connection controls simulate availability; local-demo wording remains visible. User content is rendered as plain React text.

## Configuration and integration

The bot selector exposes all twenty-two catalog shapes and up to twenty named bots created from the current configuration. Outfit radios set only native hat, glasses, headphones and bow-tie props, preserving shape, color, material and size. Six quick colors retain the exact editor and native picker. Appearance & motion exposes the existing native material, size, face, accessory and motion controls.

Playground's Code tab uses the existing code panel. Open in Studio transfers the validated current configuration. Get installation steps returns to the workbench's Install & Usage task. Closing chat stops its reply work and unmounts its scenes; the underlying component preview then mounts from the retained props and playback.

The component editor retains the preceding character workspace: preview beside a 384px controls panel at feature widths of at least 900px, stacked below that width, with current code and then starting examples. Shape radios show eight common native paused thumbnails, expand to all catalog shapes, retain an imported selection and preserve native keyboard selection. Each controls panel queries its own width.

## Ownership and verification

`views/avatar-chat.tsx` composes the chat and owns presentation/profile state. `hooks/use-avatar-chat.ts` owns bounded local conversation state and cancelable reply scheduling. `lib/avatar-chat.ts` owns scripted examples and native outfit combinations. Panels receive configuration/chat values and callbacks; they do not create configuration sessions. SDK imports remain in `previews/avatars.tsx`; no engine, public API, registry or infrastructure is replaced.

Run the gates in [testing](testing.md). `e2e/avatar-chat.spec.ts` verifies complete desktop composition, mobile overlays, focus/Escape, resizing, renderer identity, streaming/cancellation, history, offline/instant modes, bot profiles, theme switching, code parity and absence of chat requests. Inspect its full-page empty, stopped and customized conversations plus mobile overlay captures in all four viewport/theme projects. `tests/avatar-chat.test.ts` validates every outfit against the retained component schema and checks scripted topics. Existing avatar-layout, mascot, settings, preview-width and integration journeys remain required; component journeys explicitly enter Component preview from the guide's initial chat. Browser checks use Chromium with software rendering and synthetic input, not physical devices or deployment.
