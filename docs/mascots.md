# Bot avatar mascots

Four native mascot types extend the original eighteen shapes. The four type values are additive; existing props, the canvas renderer, animation ticker and installation format remain compatible. The new shapes are available in the guide, Gallery, Studio and copied source installations.

## Research and adaptation

The reference is the [mascot repository](https://github.com/EximAgent/eximagent-mascot/tree/e58e4b8ec92c78c96b1ecd41bfbd94f22ab4d45e), inspected on 2026-10-05. Its [manifest](https://github.com/EximAgent/eximagent-mascot/blob/e58e4b8ec92c78c96b1ecd41bfbd94f22ab4d45e/manifest.json) lists four production mascots; the shield is a concept rather than a production asset. The [usage guide](https://github.com/EximAgent/eximagent-mascot/blob/e58e4b8ec92c78c96b1ecd41bfbd94f22ab4d45e/docs/mascot-usage-guide.md) and the four hero images establish a shared family of soft bodies, two eyes and role-specific silhouettes.

| Reference anatomy | Liven UI type | Adaptation |
| --- | --- | --- |
| Forward arrowhead | `arrowhead` | Rounded point and recessed back; eyes sit forward of the recess |
| Speech cushion | `chat` | Compact rounded cushion with an integrated reply tail |
| Three open connecting arms | `connector` | Rounded E silhouette with both eyes anchored to the broad stem |
| Faceted lightbulb and base | `bulb` | Soft polygonal crown over a stepped, shallower base |

The outlines are newly authored in the SDK's 100×100 body coordinates. No reference PNG, SVG path, logo or marketing copy is included in the distribution. Colors reuse the existing sky, lavender, teal and yellow avatar palette. Plush remains the default; plastic, crisp, smooth and flat use the same native renderer. The adaptation softens hard facets to match the current inflated Bot avatars bodies rather than introducing a second material system.

Connector uses three 18-unit arms separated by 18-unit openings. Equal arm thickness and wider openings keep the E silhouette readable after native inflation and plush fur, including at 32px. The broad stem supports both eyes; the middle arm remains shorter than the outer arms.

Plastic and plush Connector bodies use contours from the existing inflated height field for each depth layer. Uniformly shrinking the entire concave outline pulls arms toward the stem and produces folded wedges when viewed at an angle; wider front-facing openings alone do not solve that defect. Contours stay inside the body boundary and are cached with their relief data. Existing material maps and fur films coat these layers. Other avatar types retain their existing rendering path.

Connector eyes project from their own sampled surface heights and clip to the projected body volume. The face sits slightly farther inside the stem. This preserves natural perspective while avoiding an eye being sliced by an unrelated flat front mask.

## Ownership and behavior

[SDK shapes](../packages/bot-avatars/src/shapes.ts) own silhouettes and the bulb base. [Presets](../packages/bot-avatars/src/presets.ts) own palette, face coordinates and scale. [Types](../packages/bot-avatars/src/types.ts) expose the four additive enum values. Existing types, default `clover`, states and configuration props remain compatible.

The face presets use two eyes without a mouth. Existing gaze, blink, click-to-hop, working and sleeping states remain available, as do optional accessories and custom colors. Reduced motion retains a still state pose. This feature adds no runtime dependency, timer, animation loop or new image request.

[Catalog metadata](../apps/docs/features/component-library/data/catalog.json) validates the new shapes. Guide starting examples use their existing gallery IDs, while the agent list demonstrates chat and research roles at 40px. Gallery retains the original examples and contains 87 configurations in total.

## Verification

Follow [testing](testing.md). The mascot browser contracts validate face clearance against actual canvas paths, both themes, all five materials, three activity states, 32px/64px/96px sizes, pointer interaction, click-to-hop, paused stability and Studio handoff. Connector regressions sample transparent openings and three distinct arms across materials at 32px/64px/128px, measure equal arm thickness on the unprojected contour within one raster pixel, and inspect both plush and plastic at 192px with held yaw angles of ±0.6 and ±1 radians. At ±0.6 they also compare the rendered silhouette with an independently sampled height-field volume and require two complete perspective-scaled eye components. CPU relief tests verify nested layers, retained openings and finite empty geometry across depth and roundness settings. The standalone source installation contract compiles each new type. Inspect material and full-page captures before committing; measurable checks alone do not establish visual quality.
