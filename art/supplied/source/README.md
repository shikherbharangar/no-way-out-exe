# NO WAY OUT.exe — original arcade art kit (prototype assets)

Built from the ZIP and BRICK artwork direction approved in this conversation.

## What is inside

- **ZIP:** 13 transparent key-pose frames (idle, run, jump, fall, shoot, melee, dash, wall-jump, slide, hack, electric, hurt, death); 96×96 cells, 4-column sheet.
- **BRICK:** 12 transparent key-pose frames (idle, run, jump, fall, punch, aim, slam, shield, charge, special, hurt, death); 96×96 cells, 4-column sheet.
- **Enemies:** 15 static transparent silhouettes (guards, heavier units, combat dog, aliens, and more); 96×96 cells, 4-column sheet.
- **Pickups:** 12 static transparent icons; 64×64 cells, 6-column sheet.
- **Props:** checkpoint flag, rescue cage, terminal, reactor, and exit beacon; 128×128 cells, 5-column sheet.
- Full original concept boards and reference crops under `reference/`.
- `*_preview.png` boards and `index.html` for browsing the extracted poses.
- `import_into_repo/public/assets/arcade-rebirth/` contains copy-ready atlases and metadata.

## Quality & scope — read this

These are **real extracted PNGs with alpha channels**, suitable for import and playtesting, and they closely follow the visual concepts. They are NOT yet a professionally finished animation set: source imagery was AI-assisted, individual poses have imperfect continuity, some image fragments remain around effects, and the character frames have alignment/perspective variations. The pose sets contain only *one pose per action*, NOT complete running/attacking frame-by-frame cycles. Background tiles and special effects are visual references only, not tileable/shipping assets. Do not claim that the pack has commercial Broforce visual parity.

Do not ask Codex to redraw these as simple pixel figures. Import the source frames unchanged, wire up pose selection to actual abilities, visually test at the target resolution, and flag artifacts requiring manual artist cleanup. For shipping, art-direct in-betweens and sanitize each silhouette pixel-by-pixel in Aseprite/LibreSprite before building loops.

## Quick Phaser 3 import

Copy `import_into_repo/public/assets/arcade-rebirth/` to your Vite project's `public/assets/` directory.

```ts
// Inside a Phaser.Scene preload():
this.load.spritesheet('zip-rebirth', '/assets/arcade-rebirth/zip_atlas.png', { frameWidth: 96, frameHeight: 96 });
this.load.spritesheet('brick-rebirth', '/assets/arcade-rebirth/brick_atlas.png', { frameWidth: 96, frameHeight: 96 });
this.load.spritesheet('enemies-rebirth', '/assets/arcade-rebirth/enemies_atlas.png', { frameWidth: 96, frameHeight: 96 });
this.load.spritesheet('pickups-rebirth', '/assets/arcade-rebirth/pickups_atlas.png', { frameWidth: 64, frameHeight: 64 });
this.load.spritesheet('props-rebirth', '/assets/arcade-rebirth/props_atlas.png', { frameWidth: 128, frameHeight: 128 });

// In create(): 'idle' is index 0 in the hero atlas.
const hero = this.add.sprite(200, 180, 'brick-rebirth', 0)
  .setOrigin(0.5, 1)
  .setScale(0.7);
hero.setFrame(4); // punch key pose, not a complete punch animation
```

Frame names/indices are in `sprite_metadata.json`. Never tie collisions to the sprite geometry. Retain the existing simulation hitbox, foot position and server-side movement. Validate foot anchors per pose in-game; the current crops approximate alignment only.

**Transparency:** exported individual sprites and atlases are RGBA. Some thin dark edge artifacts remain and require final cleanup; do not alpha key again at runtime.

## Recommended next steps

1. Import ZIP and BRICK still poses in Cell Block Zero on an isolated Git branch.
2. Render and inspect idle, run and attacks at the true 640×360 viewport.
3. Manually touch up and harmonize silhouettes/animation anchor points.
4. Draw additional consistent in-between frames and run full gameplay validation.
5. Only after approval, begin integrating checkpoint/pickup/enemy art.
