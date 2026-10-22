# Editable pixel sources

All drawings are original. No Broforce assets were extracted, traced, sampled or bundled.

- `source/actors.pixels.json`: a shared explicit palette; row strings where one symbol is one pixel (`.` is transparent); named face/body/limb/weapon parts; explicit part positions per pose; the 32-frame timeline. Edit a row for a one-pixel correction, a palette entry for a coherent color change, or a pose's integer coordinates for a keyframe. The compiler uses no generated anatomy. Death rotation and reused parts are intentional in-betweens.
- `source/materials.pixels.json`: 16 × 16 pixel grids and palettes for concrete, cracked masonry, steel and three distinct earth clusters. These override their tile slots after base asset generation.
- `source/fire-keyframes.json`: six hand-placed 128px flame contours, internal curls and editable integer vertices. `scripts/art/fire.py` supplies exposure/scale in-betweens and nested shading.
- `scripts/art/composition.py`: the independently composed cell and ash-furnace backdrop with explicit placements, materials, illumination and storytelling details.

Run `npm run assets` with Python/Pillow and DejaVu Sans Mono installed. The compiler writes normal PNG sprite sheets to `public/assets/`; these can also be opened in a pixel editor using 48px actor cells, 128px fire cells, and 16px tile cells. To retain changes across regeneration, edit the source grids/poses rather than only the generated PNG. All 17 shipping PNGs reproduce byte-for-byte.

The game still renders at 640 × 360 with nearest-neighbor sampling. Character sheet cells were already 48 × 48 at `6abd192`; this pass does not enlarge them or change player colliders.


## THE MACHINE

`scripts/art/machine.py` is the editable original source for four new PNGs: `machine-composition` (1280×640), `machine-foreground` (1280×640), `machine-depth` (1600×640), and `machine-props` (eight 96×96 cells). These are manually placed integer-coordinate shapes, pixel chips, seams, windings and highlights. The prop cells contain the cage, flywheel, receiver, crusher, shuttle and three ram/core states. The runtime uses them at native scale; the larger cell accommodates machinery, not enlarged heroes. The shaft, dynamo, transfer arch and heart are distinct compositions rather than a random scenery generator.

Run `npm run assets` to regenerate. Existing actor, material and fire sources and their 17 PNG outputs are preserved byte-for-byte. Room selection changes gameplay surfaces and machinery positions in `src/game/machine.ts`; the authored background establishes common architectural sockets for each variant. No Broforce pixels were used.
