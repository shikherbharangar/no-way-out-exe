# Animation production handoff — incomplete

**No new illustrated frame or anatomy repair has been completed.** These files are editable production templates and reference sheets, not finished animation or runtime replacements. The supplied identities are retained. The original 83-file pack remains immutable.

Open `.ora` files in GIMP or Krita (OpenRaster). Work on copies. Do not run any automated body warping, interpolation, recoloring, pixelation or pose duplication to fill the missing drawings.

| File | Purpose and current state |
|---|---|
| `zip-repair.ora`, `brick-repair.ora` | Original-sized atlas, editable copy, untouched hidden reference, empty repair-paint layer. **Repairs not done.** |
| `zip-animation-template.ora`, `brick-animation-template.ora` | 512×576 production sheet: 8 columns, 9 rows, 64×64 cells. Blank paint layer and separate removable layout guides. **No character art in these templates.** |
| `zip-reference.png`, `brick-reference.png` | Native supplied atlases, byte-for-byte copies. They still contain the known defects. |
| `animation-spec.json` | 39 distinct required drawings per hero, timing, pose briefs, source references, anchors, attack/revival alignment. All 78 are marked `missing`. |
| `scale-audit.json` | Measured alpha bounds for all 25 supplied hero poses; source height versus collider and tiles. |
| `REPAIR_BRIEF.md` | Specific anatomy and fragment repairs for a pixel artist. |

Rows, top to bottom: **idle, run, jump, fall, land, attack, hurt, death, revive**. Each row starts at column zero; unused cells stay empty. Frame rectangles are in the JSON. Guides: gray = cell; teal = ground at y=56; white = anchor at (32,56); amber = unchanged 14×25 collider; blue = proposed head top. These marks are editor guides, never game artwork.

Proposed native standing heights: **ZIP 34px, BRICK 40px**, each at 1 artwork pixel per world pixel. ZIP's dark trousers, teal jacket, white hair, red scarf and gauntlets must survive this intentional native drawing. BRICK's beard, chest/vest, orange trousers and connected oversized fist must remain distinct masses. These dimensions are a production choice informed by actual gameplay reduction diagnostics, **not a completed or approved redraw**. The live game remains at the existing 1× source scale.

Use a stable (32,56) root anchor for every new cell. The reference pack has per-pose anchors because its extractions are inconsistent; do not perpetuate that anatomy drift in the new sheets. Airborne soles may move relative to the root as deliberately drawn, but changing a frame must not teleport the character root. Left-facing rendering mirrors the anchor. Equipment must stay on the same character-relative arm through all keys; mirror the complete sprite, not individual parts.

ZIP running uses eight genuine contact/compression/passing/push-off drawings. BRICK has a separate eight-frame cycle that carries his fist weight. The intended cycle spans 48 world pixels, so future playback should follow actual traveled distance instead of a fixed timer that slides planted feet. Do not implement runtime playback until the drawings exist and pass visual review.

ZIP's projectile fires immediately on input: the release drawing must be first, with recoil afterwards. BRICK has the existing 140ms wind-up; his contact key must start when `windup` reaches zero, at `(x + attackFacing*29, y - 16)`. Do not change authoritative timing to fit art. Revival is the **revived hero's** 450ms recovery after the partner's existing 800ms interaction. Landing lasts 100ms. Death must transition to a recognizable prone body, not hold the supplied upright electric effect.

`python scripts/prepare-animation-production.py` prepares the handoff. It **preserves existing ORA documents** so rerunning it cannot overwrite an artist's painting. JSON specifications are generated from the explicit briefs in that script; edit those briefs there. `python scripts/audit-animation-production.py` validates the source/template packaging and writes a readiness report. Packaging success does not count as art acceptance.

Before import: hide guides; export transparent native PNGs to a new derived directory; provide reviewed per-frame metadata; inspect every key at 1× and 2×; test full cycles and both facings over neutral and real scenery; compare contact points against unchanged simulation; obtain user review. Nothing in this directory is loaded by the game.
