# Cell Block Zero art and action pipeline

The current pass keeps the existing 48 × 48 actor cells, 16px tile grid and 640 × 360 internal canvas. It replaces generated anatomy with editable original pixel parts and explicit key poses, adds the ash-furnace composition, and integrates the combat encounter with the authoritative simulation.

See the [source editing guide](../art/README.md), [actual captures and reference comparison](PREMIUM_ACTION_REVIEW.md), and [validation record](VALIDATION.md).

## Source assets

`art/source/actors.pixels.json` contains palette-indexed rows and deliberately placed body/face/weapon parts. Each row symbol is one pixel. ZIP has a spiked head/scarf, pale cyan shoulder guard and electrical glove; BRICK has orange prison straps, a heavier torso and riveted gauntlet; guards have helmets, red visors, armor and carbines. A small set of explicit poses produces the 32-frame timeline. Reused parts and rotated corpse in-betweens remain documented limitations.

`art/source/materials.pixels.json` defines hand-composed concrete, masonry, steel and earth clusters. `art/source/fire-keyframes.json` defines six asymmetric flame outlines and internal curls; the compiler adds exposure/scale in-betweens and nested shading. Existing original smoke/debris/fan/prop assets remain in use.

`scripts/art/composition.py` composes the worn plaster cells, green paint, bunk, chalk tallies, observation opening, rust furnace, exhaust stack and freight recess as one original backdrop. It sits between the far/mid parallax and world fixtures. Quiet dark openings separate the recognizable masses; the floor plane retains bright edges. The backdrop is cosmetic, while the tilemap platforms and walls are genuinely destructible.

## Gameplay and presentation

Guard patrol, line of sight, aiming, firing, stun, recoil, gravity and defeat are authoritative. BRICK's wind-up, braced shield, reflected projectiles, ZIP-to-BRICK charge, larger shock punch, barrel fuses and chain damage are also authoritative and serialized in online snapshots. The existing collision, movement, puzzle, revival, checkpoint and exit systems remain active.

The renderer selects actual run/jump/attack/aim/recoil frames from state. Electrical bolts have stepped trails and contact arcs. Concrete emits dust and stone; fuel emits directional fire and smoke; the charged punch emits cyan arcs and a broad impact. Material fragments launch on staggered beats, fall and bounce. Local hit-stop and camera shake accompany impact; online clients never pause the server simulation.

At most 150 fragments, 55 smoke clouds, 260 sparks and 12 scorch records are retained. Compact health/portraits, contextual terminal instructions and short dialogue remain. No zoom or larger hero scale was added.

## Regeneration and capture

```bash
npm run assets
npm run build
npm test
# Start npm run dev and npm run server in separate terminals.
npm run test:browser
npm run test:network
npm run test:network:action
npm run capture:showcase
npm run capture:gameplay
npm run export:showcase
```

All 17 shipping PNGs reproduce byte-for-byte. Capture controls enter through ordinary keyboard events; the inspection hook only reads state. Showcase frames are collected immediately after rendering, without pausing the running recording. The separate single-explosion screenshot script briefly pauses an already rendered peak-fire frame for screenshot encoding, then resumes. Neither path manufactures game state or pixels.

Important art direction note: it is okay to match Broforce's approximate character size, chunkiness, scene scale, and screen density. The goal is not subtle originality. The goal is a similarly impressive level of visual quality and arcade intensity, while still using original characters, original environments, and original assets.
