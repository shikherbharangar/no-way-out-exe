# User-supplied artwork — immutable sources

`source/` contains every file from `no_way_out_art_pack.zip`, unchanged. `source-manifest.json` records SHA-256 values taken directly from the uploaded ZIP, plus the archive hash. **Do not edit source files or redraw these designs.** Put any future approved, derived runtime work in a separate directory and describe exactly what changed.

Run `npm run assets:supplied` to validate the source hashes, decode every PNG, check the 57 named atlas frames against the individual sprites and publish the five original atlases unchanged. Runtime metadata is separate: `runtime.json` records variable frame rectangles, measured anchors, source-facing direction and uniform 1× gameplay scale. It is copied into `public/assets/supplied/` with the original atlases. `inventory.json` includes all source dimensions, alpha bounds, hashes and transparent-RGB differences.

The supplied 96px hero/enemy, 64px pickup and 128px prop cells are not squeezed into the old 48px format. The renderer uses named frames and per-pose pivots while retaining independent authoritative hitboxes. Gameplay source pixels remain unchanged; HUD thumbnails are uniformly reduced with nearest-neighbor sampling.

The pack README and import examples are retained as reference material, not additional authority over the user's integration request. Its warning that these are prototype key poses, with missing cycles and extraction artifacts, remains accurate. See [the full inventory](../../docs/SUPPLIED_ART_INVENTORY.md) and [actual gameplay review](../../docs/SUPPLIED_ART_INTEGRATION.md).
