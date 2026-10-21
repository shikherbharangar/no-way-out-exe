# Verified gameplay screenshots

These are actual Chromium screenshots of the running Phaser game, captured with Playwright. They are not mockups or generated replacement images. All five images are 1280 × 720 PNGs and have been opened and visually inspected.

| File | What it shows |
| --- | --- |
| [gameplay.png](gameplay.png) | Both prisoners immediately after completing the cooperative gate puzzle |
| [characters.png](characters.png) | ZIP and BRICK at the playable scene's starting position |
| [environment.png](environment.png) | The scrolled prison, machinery, platforms, and damaged masonry |
| [explosions.png](explosions.png) | A live explosion destroying wall and floor tiles |
| [cooperative.png](cooperative.png) | BRICK powering the plate while ZIP actively hacks the linked terminal |

[Capture evidence](capture-evidence.json) records the browser viewport and observed game state immediately before each screenshot. The capture script reads game state to time keyboard inputs and screenshots; it never teleports players, changes the terrain directly, or replaces rendered artwork.

To reproduce, start `npm run dev` in the repository, then run:

```bash
node scripts/capture-gameplay.mjs
```

Override `CHROMIUM_PATH` for a different Chromium executable, or `GAME_CAPTURE_URL` for a different development-server address. The script writes these five screenshots and the evidence JSON. Other temporary screenshots remain ignored by Git.

The earlier `explosion-peak.png` existed locally but was ignored and unpublished. This tracked screenshot set replaces that inaccessible local-only reference.
