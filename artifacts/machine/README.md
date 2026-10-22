# THE MACHINE — actual gameplay captures

- [Continuous gameplay video with game audio](gameplay.mp4) and [original WebM](gameplay.webm).
- [Gameplay screenshot](gameplay.png), copied from the actual cooperative ram frame.
- `01`–`07`: cage, relay, trap, chase, cooperative boss, heart explosion, archive exit.
- `08`–`09`: separate online browser clients during the cooperative boss.
- [Full gallery, controls and visual comparison](../../docs/THE_MACHINE.md).

These are real Phaser gameplay frames. The capture scripts play through Cell Block Zero with ordinary keyboard controls, enter Sector 02 through its freight lift, and finish the new sector. They inspect state without rewriting players, terrain, enemies, health or effects. Canvas reads occur immediately after rendering. The MP4 preserves the continuous original recording's speed and game audio; 30fps encoding can repeat frames when browser rendering is slower.

`browser-evidence.json` records observed route states, events and animation frames. `network-evidence.json` covers the full authoritative campaign and reconnect inside THE MACHINE. `online-browser-evidence.json` covers two independent browser clients. `media-verification.json` records decoded dimensions, duration, frame counts and file hashes. Export verifies that each PNG contains substantial color variation, rejecting empty WebGL readbacks.

The `regression/` directory holds fresh outputs from the unchanged Sector 01 smoke/combat checks and the production asset/UI check. Previously published premium-pass media is preserved in its original directory.
