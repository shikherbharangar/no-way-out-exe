# Verified gameplay screenshots

These are actual Chromium screenshots of the running Phaser game, captured with Playwright. They are not mockups or generated replacement images. All six current images are 1280 × 720 PNGs and have been opened and visually inspected. [Compare the previous and revised art](visual-review.md).

| File | What it shows |
| --- | --- |
| [gameplay.png](gameplay.png) | Both prisoners immediately after completing the cooperative gate puzzle |
| [characters.png](characters.png) | ZIP and BRICK at the playable scene's starting position |
| [environment.png](environment.png) | The scrolled prison, machinery, platforms, and damaged masonry |
| [explosions.png](explosions.png) | A live explosion destroying wall and floor tiles |
| [aftermath.png](aftermath.png) | Expanding smoke, falling fragments, scorch and the exposed crater |
| [cooperative.png](cooperative.png) | BRICK powering the plate while ZIP actively hacks the linked terminal |

[Capture evidence](capture-evidence.json) records the browser viewport and observed game state immediately before each screenshot. The capture script reads game state to time keyboard inputs and screenshots; it never teleports players, changes the terrain directly, or replaces rendered artwork. It briefly pauses the render loop after an actual peak-fire frame to prevent screenshot-encoding delay from missing the explosion, then resumes play.

To reproduce, start `npm run dev` in the repository, then run:

```bash
node scripts/capture-gameplay.mjs
```

Override `CHROMIUM_PATH` for a different Chromium executable, or `GAME_CAPTURE_URL` for a different development-server address. The script writes these six screenshots and the evidence JSON. The three baseline images in `before/` are exact copies from commit `69be5a6`. Other temporary screenshots remain ignored by Git.

The earlier `explosion-peak.png` existed locally but was ignored and unpublished. This tracked screenshot set replaces that inaccessible local-only reference.
