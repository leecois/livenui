# Interface research and adaptation

Observed on 2026-10-07 through the public site and a live Chromium browser. This is reference evidence; [design.md](../design.md) is the implemented Liven UI contract. Read [architecture](architecture.md) for source ownership.

## Coverage

The rendered [catalog](https://feralui.dev/) links to 22 demo/tool destinations. All were opened, along with About, Contact, advertising, privacy and terms. The visual library linked to 25 artwork detail routes and four legal routes; those were also opened. The static search representation omitted newer destinations, so discovery used the rendered navigation. This is a review of the public catalog and linked pages, not private code, paid downloads, authenticated workflows or every combination of demo settings.

| Public surfaces | Observed anatomy | Applied principle |
| --- | --- | --- |
| [Blinds](https://feralui.dev/blinds), [PullCord](https://feralui.dev/pullcord), [Fur](https://feralui.dev/fur), [Hologram](https://feralui.dev/hologram) | A working object leads; visible variants and live parameter controls follow; code reflects configuration | Keep a real SDK preview, expose finite choices and preserve full-field numeric editing |
| [Momo](https://feralui.dev/momo), [Blob](https://feralui.dev/blob) | Character is the focus; outfits/expressions are visible chips; color swatches and connection controls are separate | Native shape thumbnails and inline outfit choices; appearance, animation and simulated chat are distinct groups |
| [MotionView](https://feralui.dev/motionview), [Gradient Builder](https://feralui.dev/gradients), [Brandkit](https://feralui.dev/brandkit) | Task tabs, a large stage, bounded side controls, visible preset families and contextual disclosures | Keep task navigation stable, group settings by intent and expand long lists inline |
| [Imgrain library](https://feralui.dev/library) and its linked artwork pages | Category choices sit beside discovery; detail pages expose Static/Animated, palettes, process steps and output formats | Preserve searchable catalog/gallery and contextual guide/Studio navigation |
| [Screenery](https://feralui.dev/scenes), [ClawCaptcha](https://feralui.dev/captcha), [Stamp](https://feralui.dev/stamp), [AniMaps](https://feralui.dev/animaps) | Examples show a complete use case, visible alternatives and a clear next action | Keep integration code close to the configured result; avoid an administrative dashboard before interaction |
| [Bloom](https://feralui.dev/bloom), [DeskFolio](https://feralui.dev/deskfolio), [Vacuum](https://feralui.dev/vacuum), [Crumple](https://feralui.dev/crumple) | Motion follows the user's direct gesture and the object's purpose | Feedback should explain selection, dragging or completion; decorative motion must settle |
| [Nudge](https://feralui.dev/nudge), [Matchday](https://feralui.dev/matchday), [Torph](https://feralui.dev/torph), [Mochi Smash](https://feralui.dev/mochi-smash/) | Each is a specialized product/game example rather than a universal settings template | Do not transplant unrelated donation, social, checkout or game flows into the component library |

Desktop captures were inspected for the main catalog, Blinds, Momo, the visual library and editor surfaces; compact review focused on Blinds and Momo. Interactive checks confirmed visible variant selection updates Blinds' code, and selecting Momo's outfit updates its selected control. Artwork detail routes were revisited after client content became ready; palette and process controls were inspected without downloading assets. Artwork loading was not exhaustively validated. No interaction or accessibility conformance claim is made for the entire reference site.

## What transfers

Visible options reduce repeated opening/closing and let users compare before choosing. Two or three modes fit a balanced segmented track. Larger enumerations fit a chip grid; a long list can reveal more options without floating over the preview. Small headings, neutral control surfaces, restrained panel boundaries and contextual whitespace keep the rendered component dominant.

The measured reference targets vary: Blinds' small mode controls were about 26px, numeric dials 30px, and Momo's outfit chips 32px. Their feedback transitions were roughly 120–180ms. Liven UI keeps its own 44px targets, rounded-full geometry, shell colors and accent gradient. Feedback uses a central 160ms token; selected-track movement retains its tested 240ms token. A discrete grid uses local color/border feedback instead of moving a pill diagonally across rows.

## Implementation boundaries

`ChoiceField` owns native radio presentation and inline expansion only. `FieldControl` retains typed option values, custom size, default omission and existing numeric/color draft owners. Studio component choices are real route links, starting points call the existing example action, and installation choices call the existing package-manager setter. Chat Shape reuses the existing native thumbnail control; Outfit changes only retained accessory props. Liquid's behavior choices keep the existing `item.effect` callback.

No reference artwork, brand marks, palette, source implementation or backend is copied. Public identities, advertising slots, key-entry forms and team-profile ideas are skipped. SDK source, rendering lifecycle, configuration validation, registry and deployment remain under their existing owners. Bright gradient fills and white selected text remain an accepted contrast trade-off in both themes.

## Verification

Follow [testing](testing.md). Verify direct choices, default omission, typed numeric/CSS sizes, inline expansion with selected-option retention, native keyboard behavior, configuration/code parity, renderer retention, container-based layout, zoom and both themes. Review full-page captures, not only individual controls.

## Sidebar avatar motion follow-up

On 2026-10-09, the owner supplied a sidebar image from [Grok Bot](https://x.ai/bot) and requested avatar motion on hover or selection. The public text was accessible, but the live automated browser was blocked; exact animation timing and gestures were not verified. The supplied images support compact avatar/title anatomy and a muted latest-message line below each title. They do not establish animation behavior. Sidebar previews use actual local conversation text, or an unvisited example’s starter prompt, rather than invented summaries or reference identities. Liven UI uses its own native flat avatars, restrained gaze/breathing, still inactive rows, reduced-motion handling and existing offscreen/hidden lifecycle. No reference artwork or animation implementation was imported. See [avatar playground](avatar-playground.md) for the implemented contract.

## Component catalog refinement

The public [Planes catalog](https://useplanes.com/components), [segmented control](https://useplanes.com/components/segmented-control), [number stepper](https://useplanes.com/components/number-stepper) and [copy button](https://useplanes.com/components/copy-button) were inspected in Chromium on 2026-10-23. Their demos lead the page, controls are grouped by task, and restrained surfaces keep the component dominant. The segmented indicator moves between stable targets; the stepper animates changed digits; copy feedback changes its icon and label. Keyboard focus remains visible. Reference copy buttons and segmented cells measured 36px high; those dimensions are not adopted.

Liven UI retains 44px targets, its existing 240ms selected indicator and accent gradients. Preview devices and playback share a compact centered toolbar. Guide settings lose their outer frame, integration code uses one neutral surface per block, and copy feedback animates only the result icon for 160ms without moving its target. Reduced motion removes the result animation. See the implemented contracts in [design](../design.md), [settings](settings-layout.md) and [preview layout](preview-layout.md). No reference source, artwork or paid assets are included.
