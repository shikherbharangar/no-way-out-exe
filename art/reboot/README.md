# Prison art-direction reboot — review candidate

This is an AI-assisted illustration workflow, not a claim of hand-pixelled professional animation. Original image-generation sources were commissioned with explicit character designs, poses, materials and composition; no Broforce pixels were supplied to generation, traced, extracted or included in these assets. The source illustrations are retained here for provenance and revision. The limitations are documented in `docs/ART_REBOOT.md`.

## Editable production masters

Open `editable/*.png` in Aseprite or LibreSprite. Import hero strips as **48 × 48** cells, left-to-right, 32 frames. The companion `*-keys.png` sheets contain the sixteen source key poses in a 4 × 4 layout. `specification.json` records the fixed 65-color palette, pose mapping, native dimensions, prop ordering and terrain edge flags. PNG alpha is binary; no blur or dithering is used. Each artwork pixel maps to one world pixel. Rendering uses the game's existing nearest-neighbor scaling.

`npm run assets` copies these reviewed masters into `public/assets/reboot-*.png`. It does **not** regenerate or overwrite the editable masters. You can paint pixel corrections directly in them and commit the result. To publish only this set, use `python scripts/art/reboot.py`.

`python scripts/art/reboot_import.py` is an **explicit, destructive re-import of this set's editable masters**, intended only when deliberately replacing them from source. It performs cropping, fixed-palette conversion, baseline alignment, layout and edge-mask compilation; it does not draw anatomy or manufacture texture noise. Save your pixel edits before using it. The originals elsewhere in `art/source` remain untouched.

## Specification

- Runtime: 640 × 360 viewport; unchanged 16px collision grid, 14 × 25 player collider and 48 × 48 sprite frames. Standing artwork is roughly 39–41px tall; characters were not enlarged.
- Contacts end at frame y45 (exclusive baseline 46); airborne passing/jump keys end three pixels higher. Scene's existing +2 foot offset is retained.
- Key poses: idle, breathe, four run contacts/passes, jump, fall, land, aim/brace, wind-up, strike, recover, hurt, defeated, celebrate. The 32-frame strips hold selected poses for the current simulation's animation timings; they are not 32 unique drawings.
- ZIP: ivory swept hair, amber skin, petrol jacket, mint scarf, copper electrical pack. BRICK: broad shoulders, dark mohawk, black vest, orange prison trousers, steel piston glove. Guards: muted olive armor, heavy helmet, tiny red visor and short carbine.
- Materials: four 128 × 64 illustrated panels: plaster/brick, dark foundation, olive steel, chipped slab. Each divides into 16px tiles; sixteen exposed-edge variants use explicit 0–2px chip masks. The atlas is 1024 × 512. Neighbor changes select new edge variants from live authoritative terrain; collision geometry is unchanged.
- Props: eight 64px cells with individually sized barrel, terminal, cell door, pipe elbow, lamp, rubble, cabinet and shutter. Rubble is available to edit; dynamic destruction continues to use the established material-debris system.
- Security and freight doors have separate 32 × 128 and 92 × 100 native exports; neither is stretched at runtime.
- Fire: twelve illustrated fire/smoke keys held across eighteen 128px frames at the existing 28fps. Other impact, smoke and debris assets remain the established ones.
- Background: separate 1280 × 360 architecture and recessed-depth masters, with an explicitly placed mask around the central arch. Near architecture scrolls with the world, recesses at 0.28, foreground pipes at 1.08. Some source perspective remains in small props; this is a review weakness, not hidden by the compiler.

## Palette roles

| Role | Main colors |
|---|---|
| Deep silhouette | `#0c1119`, `#141e27`, `#15121d` |
| Recessed prison depth | `#1b2b36`, `#243c46`, `#30505a` |
| Brick, rust, plaster | `#70432f`, `#8e5433`, `#ad6d3e`, `#c68b50`, `#e2c58e` |
| Structural iron | `#41453d`, `#575c4d`, `#74775f`, `#94957a` |
| ZIP and live circuitry | `#23686b`, `#309391`, `#59c5b5`, `#91e8cc` |
| Skin and warm accents | `#784b48`, `#c48159`, `#eba56a`, `#ffca87` |
| Fire | `#732b29`, `#d64e26`, `#f47729`, `#ffc04e`, `#fff4d0` |

The first background source and first in-game iteration are retained to make the revision visible: broad plaster was repainted into larger clusters, then the material panels were widened and pose baselines corrected after reviewing real captures.
