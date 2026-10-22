# Real gameplay captures

The current verified deliverables are in [`premium/`](premium/):

- [15-second gameplay video with game audio](premium/gameplay-15s.mp4)
- [Sequence gallery and Broforce comparison](../docs/PREMIUM_ACTION_REVIEW.md)
- [Chain explosion](premium/04-chain-explosion.png), [cooperative charge](premium/02-cooperative-charge.png), [narrow escape](premium/05-narrow-escape.png)
- [Characters](premium/characters.png), [environment](premium/environment.png), [cooperative puzzle](premium/cooperative.png), [gameplay](premium/gameplay.png), [explosion](premium/explosions.png), [aftermath](premium/aftermath.png)
- [Sequence state/animation evidence](premium/evidence.json), [scene capture evidence](premium/capture-evidence.json), [media hashes and duration verification](premium/media-verification.json), [authoritative online combat evidence](premium/network-evidence.json)

All frames come from the real Phaser game through Chromium/Playwright. Sequence frames are native 640 × 360 canvas captures; the scene screenshots are 1280 × 720. The MP4 contains 450 frames at 30fps and actual synthesized game audio. It is a continuous excerpt, without replacement artwork, compositing or speed changes.

With `npm run dev` running, execute `npm run capture:showcase`, `npm run capture:gameplay`, then `npm run export:showcase`. The export needs FFmpeg/ffprobe. Set `CHROMIUM_PATH`, `GAME_CAPTURE_URL`, or `CAPTURE_DIR` to override the browser, development URL, or output directory. Capture after builds/asset generation finish.

## Preserved earlier work

`showcase/` contains the exact interrupted recordings and evidence recovered in commit `bc0beac`. They are preserved rather than overwritten. The older `showcase/gameplay-15s.webm` name does not guarantee a 15-second duration; use the verified current MP4 above.

Root-level PNGs and `capture-evidence.json` are the earlier recovered scene captures. `before/` retains exact originals from `69be5a6`. The [last confirmed published gallery at 6abd192](https://github.com/shikherbharangar/no-way-out-exe/blob/6abd192a4a23e49ccbf44f1d1adbae2cd31c926a/artifacts/visual-review.md) remains available unchanged in Git history. The once-missing `explosion-peak.png` is superseded by the committed explosion captures.
