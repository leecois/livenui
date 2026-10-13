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

## Replacement requirements

Use original generated or independently licensed artwork when replacing these assets. Keep provenance, dimensions and file sizes current in this guide, update the shared manifest and inspect the actual reveal/melt result. Regeneration is not deterministic; full generation prompts are not a rendering contract.

The retired photograph URLs `/agent-images/gen-1.jpg`, `/agent-images/gen-2.jpg`, `/agent-images/gen-3.jpg`, `/agent-images/melt-a.jpg` and `/agent-images/melt-b.jpg` must continue to return 404. SDK copyright and legal attribution remain intact.

## Verification

Follow [testing](testing.md). The media browser contracts decode all five WebP images, verify retired URLs are unavailable, reveal each new Image asset through the native renderer, and check Melt card loading, exported paths and keyboard movement. Review full-page Image and Melt captures in desktop/mobile light/dark alongside the complete library suite. Passing decode checks alone does not establish the visual quality of the revealed or merged image.
