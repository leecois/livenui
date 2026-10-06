# Original demo media

The Image and Gooey melt demonstrations use five images generated specifically for Liven UI on 2026-10-06 with the built-in image generation tool. No reference images, downloaded photographs or personal portraits were supplied. These are generated artworks, not captures of the native SDK renderers. The SDKs still own reveal and melt behavior.

The assets live in [the public media directory](../apps/docs/public/agent-images). [The media manifest](../apps/docs/features/component-library/lib/media.ts) owns paths used by previews and exported melt snippets. Image integration code continues to use the developer's supplied image pool. Melt integration requires copying the chosen images into the consumer application's public directory or replacing the paths with its own assets.

## Assets

| File | Subject | Dimensions | Bytes |
| --- | --- | --- | --- |
| prism-garden.webp | Blue and violet glass garden | 1024 × 1536 | 227170 |
| violet-dunes.webp | Lilac dunes beneath an ivory moon | 1024 × 1536 | 144906 |
| orbital-glass.webp | Glass orbit around a ceramic sphere | 1024 × 1536 | 131766 |
| warm-ribbon.webp | Coral and amber glass ribbon | 1254 × 1254 | 109398 |
| cool-ribbon.webp | Blue and lavender glass ribbon | 1254 × 1254 | 131304 |

Generation outputs were converted to WebP with Sharp, quality 82 and effort 6. Dimensions and composition were preserved. No crop, resize, remote hosting or custom metadata was added. The complete deployed pool is 744544 bytes.

## Replacement audit

The five retired JPEGs were byte-identical to photographs in the local reference checkout. They were deleted from public source, and all active preview and melt export references were replaced. A SHA-256 comparison across the public image tree found no other exact matches with that reference checkout. SDK copyright and legal attribution remain intact.

Retired public URLs are `/agent-images/gen-1.jpg`, `/agent-images/gen-2.jpg`, `/agent-images/gen-3.jpg`, `/agent-images/melt-a.jpg` and `/agent-images/melt-b.jpg`. They must return 404 in the current production build.

## Generation prompts

The following full prompts were used in built-in generation mode. No CLI fallback or input image was used. Regeneration can produce different images; inspect new outputs before replacing the checked-in files.

### prism-garden

Use case: stylized-concept. Create a completely original portrait 2:3 image for a developer component library's image reveal demo. A sculptural garden of tall translucent frosted glass fins in cobalt blue and lavender, one graceful glass arch and a small glowing pearl nestled among the fins. Fine optical caustics on a pale stone plinth, dark indigo studio background, gentle luminous mist. Editorial 3D still life, physically plausible glass, rich texture and subtle grain, distinctive dimensional subject at center, full composition filling the frame with clear edges useful for a pixel mosaic reveal. Restrained blue-violet emphasis with cyan light and neutral shadows. No text, letters, logos, people, watermarks, interface, borders, or collage. One cohesive finished image.

### violet-dunes

Use case: stylized-concept. Create a completely original portrait 2:3 image for a developer component library's image reveal demo. A surreal landscape of flowing lilac sand dunes with precise wind-carved ripples and an oversized smooth ivory moon hovering just above the horizon. Deep violet twilight sky, a bright cobalt ribbon of reflected light running along the valley, subtle warm peach light on the dune crest. Beautiful cinematic editorial render, tactile fine sand texture, sophisticated quiet composition with deep foreground, central focal form and intricate detail that rewards a pixel mosaic reveal. No text, letters, logos, people, animals, watermarks, interface, borders, or collage. One cohesive finished image.

### orbital-glass

Use case: stylized-concept. Create a completely original portrait 2:3 image for a developer component library's image reveal demo. A suspended translucent cobalt glass torus intersecting an elegant pale ceramic sphere, with two thin violet glass orbital arcs arranged around it. Floating sculptural still life above a softly lit dark charcoal pedestal, focused blue and lavender rim light, beautiful reflections, fine surface imperfections, shallow atmospheric depth, premium cinematic editorial 3D render. A bold centered silhouette and detailed material transitions, filling most of the frame, useful for showing a pixel mosaic dissolve into an image. No text, letters, logos, people, watermarks, interface, borders, or collage. One cohesive finished image.

### warm-ribbon

Use case: stylized-concept. Create a completely original square 1:1 abstract image for a tiny draggable image card in a liquid merge demo. A single thick flowing folded ribbon of satin glass, curled into a sculptural loop, warm coral and apricot amber material with soft violet reflections against a deep warm neutral background. Macro editorial 3D render, luscious rounded form, strong luminous central silhouette, fine material texture, smooth lighting and subtle caustics, legible at 84px. Fill most of the frame. No text, letters, logos, people, eyes, portraits, watermarks, interface, borders, or collage. One finished image.

### cool-ribbon

Use case: stylized-concept. Create a completely original square 1:1 abstract image for a tiny draggable image card in a liquid merge demo. A single thick flowing folded ribbon of satin glass, curled into a sculptural loop with a different knot-like twist, cool cobalt blue and lavender material with delicate cyan reflections against a deep cool neutral background. Macro editorial 3D render, luscious rounded form, strong luminous central silhouette, fine material texture, smooth lighting and subtle caustics, legible at 84px. Fill most of the frame. No text, letters, logos, people, eyes, portraits, watermarks, interface, borders, or collage. One finished image.

## Verification

Follow [testing](testing.md). The media browser contracts decode all five WebP images, verify retired URLs are unavailable, reveal each new Image asset through the native renderer, and check Melt card loading, exported paths and keyboard movement. Review full-page Image and Melt captures in desktop/mobile light/dark alongside the complete library suite. Passing decode checks alone does not establish the visual quality of the revealed or merged image.
