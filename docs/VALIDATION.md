# Sector 02 validation — THE MACHINE

The current milestone continues `f6cdd58`; the older action-pass record below remains historical evidence. See [THE MACHINE guide and visual review](THE_MACHINE.md) for the new playable route and actual captures.

- Production build: TypeScript and Vite pass. The existing Phaser bundle-size warning remains (~364 KB gzip); no new build error.
- Gameplay: **32 tests across five suites**, including all original 20 tests. New checks cover both-sector progression, deterministic selection across 512 seeds, nine input-driven sector runs covering all four layouts, lift roles/recall, relay requirements, ram vulnerability/release, trap warning/reset, full demolition recovery, ladder recovery, stranded-hologram recall and snapshot continuation.
- Networking: existing room/capacity/ready/input/reconnect/tamper tests and the original combat route pass. The new complete campaign uses two websocket clients, reconnects after powering the relay and verifies identical final snapshots. Reconnect preserves the layout seed, terrain, lift and relay; the room freezes while disconnected.
- Browser: the original smoke suite checks local controls, remapping, destruction, pause, resize, two-browser lobby/movement/destruction and disconnect UI. The new local campaign capture starts in Cell Block Zero, transitions through the lift and finishes THE MACHINE using only keyboard events. Separate independent browser contexts play the complete online campaign and compare final snapshots.
- Production browser: all 21 shipping PNG assets load, controls/pause work, and the development hook is absent. The complete campaign inspection/capture runs use the development build, not the production hook.
- Art preservation: all **17 pre-existing PNG assets** remain byte-identical to `f6cdd58`. Four new original machine PNGs are added, retaining native character/tile scale.
- Media: seven local sequence PNGs, two online client PNGs, a gameplay cover, continuous original WebM with game audio, and H.264/AAC MP4. `artifacts/machine/media-verification.json` records decoded dimensions/duration, frame count and SHA-256 hashes. Export is continuous, without compositing or speed changes; encoding at 30fps may repeat captured frames.

Evidence is under `artifacts/machine/`; original regression captures are isolated in its `regression/` subdirectory so previously published action-pass media remains untouched. The extended two-browser run found and fixed a real cage-recall bug: riders could be carried into the lower floor. Riders now align exactly with the moving deck; a regression verifies free movement after recall. Test driver corrections addressed independent clients disagreeing on a narrowly sampled waypoint and input overshoot at an online punch and changed screenshot selection from a fire condition to the actual crusher/dust pursuit. A network test launched during server restart was rerun after the server was ready. Final visual inspection also caught blank online WebGL readbacks; online captures now wait for post-render and media export rejects low-color blank PNGs. These failed attempts are not counted as successful validation.

The tests run against local Chromium and the dedicated local WebSocket server. Physical controllers, long-distance network latency, a deployed production multiplayer service and production load are not verified here. The room generator is a validated four-combination authored grammar, not a general arbitrary-map solver. Broforce commercial visual parity remains unproven.

---

# Validation record

Target: the Cell Block Zero desktop slice, Node 24.19.0, Chromium, Phaser 3.90. Validation date: 22 October 2026.

## Recovery

The environment outage did not establish a code failure. Once the workspace returned, the branch was `work` at `6abd192` with 24 modified tracked files, eight untracked source/asset/test files, and the ignored showcase directory. All were inspected, then committed unchanged as `bc0beac` on `recovery/premium-action-2026-10-22` and pushed before further changes. No reset, clean, force push or discarded working-tree data was used. Further work was performed on `premium-action-validated`.

The recovered source recording was 16.428 seconds and contained the complete escape. Its earlier companion named `gameplay-15s.webm` was not an exact 15-second export. Both remain preserved in `artifacts/showcase/`. Fresh captures are separate in `artifacts/premium/`.

## Checks

- `npm run build`: TypeScript and production bundle pass. The expected Phaser chunk-size warning remains (~359 KB gzip JavaScript).
- `npm test`: 20 tests in three files pass, including the unchanged complete input-driven escape route. New cases cover punch wind-up, real projectile-to-shield charge, charge consumption, directional reflection, staggered chain damage, platform removal/guard falling, knockback, aim/line of sight, arc collision, snapshot state and wall occlusion.
- Two existing assertions were adapted to deliberate new behavior: barrel destruction is checked after its fuse, and a test forcing total death clears the newly held brace shield first. Neither test was removed or skipped.
- `npm run test:browser`: local UI/remapping/movement/jump, actual terrain destruction, pause/resume, resizing and two independent online browser contexts pass. Both slots move; terrain snapshots agree; disconnection UI appears; no unhandled browser exceptions.
- `npm run test:network`: capacity, ready/start, authoritative movement, reconnect, duplicate-token rejection and client state-tamper rejection pass.
- `npm run test:network:action`: two websocket clients use input messages to breach, solve the original puzzle, enter the encounter, charge BRICK, trigger the shock punch and four-barrel chain, and defeat guards. Both receive exactly equal snapshots at the same tick. Disconnect freezes state; reconnect preserves destroyed terrain, barrel state and the open gate. Evidence: `artifacts/premium/network-evidence.json`.
- All 17 shipping PNGs regenerate byte-for-byte. The hero/world scale and player colliders remain unchanged from `6abd192`.
- `npm run capture:showcase`: uses real keyboard input from spawn through the puzzle and encounter. Assertions require hero movement frames, evolving fire frames, guard shooting, enemy defeat, charge, charged punch, a chain screenshot, a crossing screenshot, unique filenames and both players escaping within the video excerpt. State, animation frames, render count and events are saved in `artifacts/premium/evidence.json`.
- `npm run capture:gameplay`: six real screenshots show characters, destruction, aftermath, environment, the active co-op hack and the completed gate. The single peak-explosion capture pauses only after an actual rendered frame; the video sequence never pauses its render loop.
- `npm run export:showcase`: FFmpeg decodes and exports a continuous 15.000-second H.264/AAC clip at 640 × 360 and 30fps (450 encoded frames), then decodes it again to check for errors. A SHA-256 media manifest accompanies the export. No compositing or playback speed change is used.
- `npm run test:production` against `npm run preview -- --port 4173`: real production title/game/input/pause/resume, original PNG asset loading, no HTTP/browser errors and absence of the development inspection hook. Evidence: `artifacts/premium/production-evidence.json`.

## Regressions caught during validation

The capture driver could finish its approach facing ZIP away from BRICK, so its first bolts missed the shield. It now explicitly aims through normal movement input. It also keeps ZIP behind the braced partner and uses normal revival controls if needed, instead of assuming the guards cannot defeat a player. Failed capture evidence was retained separately; it is not used as a passing result.

Animation inspection found that the shield pose overrode BRICK's run and jump frames. The pose is now limited to a stationary, grounded brace, preserving movement animation while the shield remains visible. Screenshot naming now captures the first charged strike once, so a later counterattack cannot silently replace its image. Small light-spill layers skip non-positive radii.

## Limits

The real Broforce screenshots and remaining visual differences are documented in [the direct comparison](PREMIUM_ACTION_REVIEW.md). The available reference stills do not prove animation or explosion-quality parity, and commercial visual parity is not claimed.

These checks cover a local production build and one authoritative server with independent browser/websocket clients. Public deployment, real internet latency, physical controllers, multiple physical machines, mobile play, Docker build and multi-instance hosting remain unverified. A 30fps video export may duplicate frames from a slower source renderer; actual rendered-frame counts are recorded independently. No further sectors or full-game completion is claimed.
