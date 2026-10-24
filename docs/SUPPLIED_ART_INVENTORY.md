# Supplied asset inventory

Source: `no_way_out_art_pack.zip`, uploaded by the user. All 83 files (79 PNGs) were extracted with path validation, decoded/read and inspected through their source boards, previews and metadata. Source files remain byte-identical. [Machine-readable hashes/dimensions](../art/supplied/inventory.json).

## Runtime import contracts

| Group | Atlas | Named frames | Cell size | Import status |
|---|---|---|---|---|
| ZIP | 384×384 | 13 | 96×96 | Transparent, bounded, named key poses |
| BRICK | 384×288 | 12 | 96×96 | Transparent, bounded, named key poses |
| Enemies | 384×384 | 15 | 96×96 | Static silhouettes |
| Pickups | 384×128 | 12 | 64×64 | Static icons |
| Props | 640×128 | 5 | 128×128 | Static objects |

All atlas alpha is binary (0/255). Unused atlas cells are not registered as animation frames. No supplied artwork was redrawn, stretched, cropped into 48px cells or alpha-keyed. The 96/64/128px groups share one native pixel-to-world scale. Per-frame anchors are derived metadata, not image edits.

## Per-frame usage and cleanup

### ZIP

| Frame | Alpha bounds (left, top, right, bottom) | Current use / remaining work |
|---|---|---|
| idle | `(20, 21, 75, 91)` | Usable held idle; run/idle anatomy is not a complete cycle. |
| run | `(19, 27, 76, 91)` | Usable held movement key; no run-cycle in-betweens. |
| jump | `(23, 17, 72, 89)` | Usable jump key; no takeoff in-betweens. |
| fall | `(23, 39, 72, 91)` | Used; apparent body scale differs from idle and stray red fragment remains. |
| shoot | `(12, 14, 83, 91)` | Used for the existing electrical shot; stray red fragments above/right need cleanup. |
| melee | `(12, 12, 83, 91)` | Catalogued, not mapped to a new melee ability; stray upper fragments. |
| dash | `(5, 21, 90, 89)` | Used for the existing air dash; baked electrical arc, one key only. |
| wall_jump | `(28, 22, 67, 89)` | Used on existing wall contact; no full wall-jump cycle. |
| slide | `(28, 18, 68, 91)` | Catalogued; no new slide mechanic. |
| hack | `(24, 31, 71, 91)` | Used for hacking and temporary revival reuse; single pose. |
| electric | `(15, 30, 81, 91)` | Catalogued alternative key; no extra ability invented. |
| hurt | `(11, 13, 84, 91)` | Used as provided; built-in effects/anatomy differ from idle. |
| death | `(16, 11, 79, 91)` | Used as provided; still upright with electricity, not a complete collapse. |

### BRICK

| Frame | Alpha bounds (left, top, right, bottom) | Current use / remaining work |
|---|---|---|
| idle | `(10, 10, 86, 91)` | Usable held idle; oversized fist preserved. |
| run | `(12, 20, 84, 91)` | Usable held movement key; no full run cycle. |
| jump | `(21, 8, 74, 89)` | Usable jump key; raised arm changes silhouette. |
| fall | `(18, 23, 77, 91)` | Used; stray vertical fragment and equipment continuity need cleanup. |
| punch | `(10, 26, 85, 91)` | Used with left-facing metadata; detached fist and cropped body in source require artist repair. |
| aim | `(17, 25, 64, 91)` | Catalogued; no separate gun mechanic. |
| slam | `(4, 25, 92, 91)` | Catalogued; no new ground-slam rule. |
| shield | `(19, 27, 77, 91)` | Used for existing brace and temporary revival reuse; source includes a separate riot shield. |
| charge | `(12, 31, 84, 91)` | Used for punch wind-up; right-side equipment fragment needs cleanup. |
| special | `(4, 21, 92, 91)` | Available for charged attack state; fire is baked into the key. |
| hurt | `(14, 42, 82, 91)` | Used; detached lower-right fragment requires cleanup. |
| death | `(20, 64, 75, 91)` | Used; one prone key, no transition frames. |

### ENEMIES

| Frame | Alpha bounds (left, top, right, bottom) | Current use / remaining work |
|---|---|---|
| guard | `(19, 15, 77, 81)` | Placed on existing guards; original AI/stats, no separate motion or death keys. |
| shotgunner | `(16, 16, 79, 80)` | Placed on existing guards; original AI/stats, no separate motion or death keys. |
| shield_trooper | `(15, 15, 81, 81)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| sniper | `(11, 15, 84, 81)` | Placed on existing guards; original AI/stats, no separate motion or death keys. |
| heavy_trooper | `(9, 14, 87, 82)` | Placed on existing guards; original AI/stats, no separate motion or death keys. |
| jetpack_trooper | `(13, 10, 82, 86)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| riot_trooper | `(21, 15, 74, 80)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| drone | `(13, 24, 82, 72)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| turret | `(17, 16, 79, 80)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| combat_dog | `(2, 28, 68, 67)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| mutant_prisoner | `(2, 19, 94, 77)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| bio_soldier | `(5, 16, 90, 80)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| alien_runner | `(7, 13, 89, 82)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| alien_spitter | `(2, 19, 94, 77)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |
| armored_brute | `(2, 19, 94, 85)` | Catalogued, not spawned: no new enemy behavior or sector introduced. |

### PICKUPS

| Frame | Alpha bounds (left, top, right, bottom) | Current use / remaining work |
|---|---|---|
| health | `(16, 10, 47, 53)` | Used for the actual one-time rescue health reward. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| ammo | `(21, 16, 43, 47)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| extra_life | `(7, 17, 56, 47)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| shield | `(14, 8, 49, 56)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| speed | `(12, 15, 52, 49)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| invulnerability | `(16, 8, 47, 56)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| electric | `(10, 5, 53, 59)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| explosive | `(12, 6, 52, 57)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| double_damage | `(11, 7, 52, 57)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| drone | `(6, 6, 57, 57)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| random | `(13, 4, 50, 59)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |
| alien_artifact | `(6, 5, 57, 59)` | Catalogued; no corresponding new pickup mechanic implemented. Several icons include stray/broken label pixels; preserve until artist cleanup. |

### PROPS

| Frame | Alpha bounds (left, top, right, bottom) | Current use / remaining work |
|---|---|---|
| checkpoint_flag | `(22, 9, 106, 118)` | Used for existing checkpoint state; one static flag, no cloth cycle. |
| rescue_cage | `(26, 9, 102, 119)` | Used for host-owned optional rescue; contains a prisoner, no empty/open-cage frame. Whole cage is extracted upward. |
| terminal | `(26, 24, 101, 104)` | Used at the existing cooperative terminal, native proportions. |
| reactor | `(24, 6, 103, 122)` | Catalogued; existing Machine/boss rendering is preserved. |
| exit_beacon | `(13, 8, 114, 119)` | Catalogued; helicopter beacon does not replace the existing freight-lift objective. |

## Other included files

- `START_HERE.png`, ZIP/BRICK/enemy/pickup/prop previews and `index.html`: inspected as source review material, never represented as gameplay screenshots. The HTML contains a local asset gallery, not game implementation.
- `sprite_metadata.json`: checked every named rectangle against its atlas and individual PNG. All visible pixels agree; ZIP melee, BRICK aim, combat dog and armored brute have only transparent-RGB differences.
- `import_into_repo/public/assets/arcade-rebirth/`: all five copy-ready atlases match the corresponding source atlases byte-for-byte. Runtime uses a separate `supplied/` namespace.
- Six `reference/` images: full concept boards plus environment, VFX and support-hero examples. They are reference illustrations, not shipping tiles, ready animation strips or captured gameplay. No support heroes or aliens were added.
- Pack README: read and retained unchanged. Its prototype-quality warning is reflected in these notes. Recommendations do not override the explicit integration task.

## Artist handoff

First repair BRICK’s punch/charge/hurt fragments and ZIP’s stray effects/labels. Then author consistent run contacts/passes, anticipation/recoil, land, revive and death sequences for both protagonists. Guards need patrol, aim, recoil and defeat keys. Flags need cloth/raising keys; the cage needs open/empty/extract states if a different rescue presentation is desired. Preserve the supplied identities and palette while doing that work.
