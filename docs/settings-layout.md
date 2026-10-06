# Settings layout

Settings sit directly below the preview and before current integration code. Guides show essential controls; Studio adds advanced search, Saved and JSON. All views continue to use the same playground configuration owner.

## Reference and adaptation

The public [Eclipse customization panel](https://pro.reactbits.dev/docs/components/eclipse) was inspected in Chromium on 2026-10-06. It groups controls into a three-column grid with labels and values inside compact neutral rows, a nearby Reset action, numeric tracks and switches. The reference uses 32px numeric controls; Liven UI keeps its existing 44px native targets. No paid source, reference artwork or external palette is included.

Use the functional layout with local tokens: 20px panel insets, 12px field gaps, rounded-full neutral rows and bright gradient selection. Keep selected tabs/radio pills filled with `--gradient-accent` and white text. Checked switches use the same gradient with a white thumb. Accent contrast warnings remain accepted design trade-offs.

## Control contract

- Place labels and native number/text/select values on the same row. Show a numeric value once, in the editable input. Preserve clearing an optional value and accepting typed fractional values. Catalog fields do not define slider ranges, so do not invent bounds or replace exact numeric input with a generic slider.
- Keep visible labels associated with their native controls. Labels can wrap when space is limited. Native selects retain mobile and keyboard behavior; the chevron stays decorative.
- Boolean settings remain native checkboxes with a 44px target and a decorative switch track. Both label clicks and Space toggle the same configuration. Focus is visible around the track.
- Short typed choices remain native radio groups on neutral tracks. Groups with more than three choices span two grid columns, then one on compact containers. Wrap choices without clipping their labels, targets or focus rings; custom values remain visible.
- Place the compact Controls/Saved/JSON track beside the heading on wide containers and on its own row below 550px. Reset remains beside the heading. Guides omit the administrative tabs.
- Keep advanced discovery in the footer, separated by a quiet divider. Search only appears when advanced controls are expanded. Keep Saved input/action together and let JSON actions/help wrap at narrow widths. Validation feedback stays beside the panel.

Field columns follow the feature container: three at 900px or wider, two below 900px and one below 550px. See [design](../design.md) and [development](development.md).

## Verification

[Settings browser contracts](../e2e/settings-layout.spec.ts) check alignment and compact row heights across all seven Studio libraries, guide composition, native number/checkbox/radio behavior, focus, exported values, narrow advanced search and long saved names. Inspect each library's isolated settings capture plus guide/Studio full-page desktop/mobile light/dark captures. Saved and invalid JSON captures cover 320px. Run the complete gates in [testing](testing.md); these checks use Chromium with software rendering, not physical mobile hardware.
