# NO WAY OUT.exe

**Supplied-art integration review:** [Actual screenshots/video and remaining issues](docs/SUPPLIED_ART_INTEGRATION.md) · [Asset inventory](docs/SUPPLIED_ART_INVENTORY.md) · [Validation](docs/SUPPLIED_ART_VALIDATION.md). Branch `approved-art-integration`; not merged into main.

**Two idiots. One prison. Infinite bad decisions.**

A playable, original pixel-art prison escape built with Phaser 3, TypeScript, and Vite. This build contains **Cell Block Zero and Sector 02: THE MACHINE**, a complete two-sector cooperative chapter. The remaining sectors from the master brief are future work.

The premium action pass adds editable pixel drawings, a composed ash-furnace encounter, guard aiming/recoil, shield charging and timed barrel chains. Watch the [15-second real gameplay showcase](artifacts/premium/gameplay-15s.mp4), browse the [captured sequence and Broforce comparison](docs/PREMIUM_ACTION_REVIEW.md), or read the [art pipeline notes](docs/ART_DIRECTION.md). The original co-op puzzle, escape route and authoritative online server are preserved.

THE MACHINE adds a vertical counterweight shaft, seeded industrial rooms, a synchronized relay, a crusher chase and a cooperative magnetic ram boss. See the [new gameplay video and sector guide](docs/THE_MACHINE.md).

## Play locally

Node 22.12+ (validated with Node 24), npm, and a desktop browser are required.

```bash
cd /workspace/no-way-out-exe
npm ci
npm run dev
```

Vite prints its local address. Choose **BREAK OUT**, read the orientation, and start. There are no runtime asset hotlinks, paid services, API keys, or login requirements for local play. All shipping art is checked in.

| Action | ZIP | BRICK | Controller |
| --- | --- | --- | --- |
| Move | A / D | Left / Right | Left stick / D-pad |
| Jump | Space or W | Right Shift or Up | A |
| Interact / revive | F | Enter | X |
| Ability | G: arc bolt; air dash when airborne | Right Ctrl: blast punch and brief shield | B |
| Brace / charge | Fire G into BRICK’s shield | Hold Enter; then Right Ctrl for a charged punch | Hold X; partner presses B |
| Pause | Escape | Escape | On-screen menu |

Controls can be remapped in Settings. For a solo rehearsal, operate the two keyboard control groups in turn. This is still a two-character puzzle, with no AI partner. Two controllers are supported by the Gamepad API; physical controller hardware has not been tested in this environment. Keyboard ghosting varies by hardware; remapping or controllers can help.

## The escape

1. Move BRICK beside the explosive drum at the cracked partition. Blast punch the route open; both characters can jump out of the crater. ZIP's arc bolt also detonates drums.
2. Put BRICK on the brass pressure plate. ZIP climbs the two steel steps to the terminal and holds interact for 1.5 seconds. Both characters are needed: the electrical link supplies the terminal.
3. Pass the unlocked bulkhead together. In the ash-furnace bay, BRICK can hold interact to brace and reflect incoming shots; ZIP shoots into the shield to charge BRICK’s next punch. Guards aim before firing and fall when their platforms break. Trigger the staggered drum chain, jump across the damaged walkway, and keep ZIP behind the shield. The lower route remains usable.
4. If one character dies, stand within 50 pixels and hold interact to revive their hologram. If both die, the checkpoint restores terrain and players.
5. Bring **both living players** inside the freight lift and press interact. Then both hold interact for 1.2 seconds to descend into THE MACHINE. Follow the machinery hints, survive the transfer line and disable the magnetic heart together. Final results follow the Sector 02 archive exit.

Normal masonry, dirt floors, and catwalk sections are destructible. Bolted puzzle supports and the lowest foundation are reinforced so explosions cannot permanently remove the required pressure plate, terminal, or approach steps. Hero-triggered blasts do not damage partners. The link limits separation to approximately one camera width.

Machine room seeds are selectable in local orientation; online seeds come from the host server. There are four authored layout combinations. Hold interact at service ladders to climb. If a hologram is stranded in Sector 02, both hold interact for three seconds to recall the shared checkpoint.

## Included in this build

- Two original protagonists with idle, run, jump, fall, land, interaction, ability, hurt, collapse, revival, and victory frames.
- Acceleration, air control, variable jump height, coyote time, buffered jumping, ZIP wall jumps and air dash, BRICK blast punch/shield.
- A Phaser tilemap mirrored by authoritative collision data; explosions remove real walls/floors, trigger barrels, and affect guards.
- Pixel fireballs, sparks, bouncing debris, camera shake, local impact pauses, stepped explosion lighting, synthesized sound, mute and volume.
- Original textured PNG tiles and sprite sheets, distant architecture, parallax windows, near steelwork, animated fans, cables, light shafts, airborne grit, and a custom pixel-lettered logo.
- Electrical link, asymmetric plate/hack puzzle, gate, guards and projectiles, collapsing floor, checkpoint, ghost revival, and two-player exit.
- THE MACHINE: six reusable templates, connected seeded room selection, cooperative lift/relay/ram, moving platforms, lasers, a telegraphed crusher, chase, recovery ladders and shared checkpoints.
- Title, orientation, pause/settings, remapping, credits, results, fullscreen, resizing, and private online lobby.

## Real online co-op

Start a second terminal:

```bash
cd /workspace/no-way-out-exe
npm run server
```

The server listens on port 2567 and exposes `GET /health`. The local browser client discovers the backend on the same hostname only for `localhost` or `127.0.0.1`. For another computer, a LAN address, or a deployed frontend, set a reachable `VITE_SERVER_URL` in `.env.local` and restart Vite (or rebuild production).

Choose **ONLINE CO-OP → CREATE PRIVATE ROOM**. Send the six-letter code or copied invite link to the other player. Both players must ready up. The host controls ZIP and the guest controls BRICK. **Each online player uses the first keyboard control group** (A/D, Space, F, G) or their first controller, regardless of character.

The dedicated server owns the 60 Hz simulation, terrain, puzzle, hazards, projectiles, deaths, and victory. Clients send bounded boolean inputs and receive 20 Hz snapshots; rendering smooths positions. Brief button presses are latched through simulation/network sampling. Rooms accept exactly two slots. Reconnect tokens stay in the current client's memory, reserve a slot for 30 seconds, and reject duplicate use. A disconnected partner freezes the room until reconnection. Returning after a full page reload requires a new room; there is no account/session persistence.

This slice uses a small dedicated Node **`ws` server**, not Colyseus or Vercel Functions. Room state is intentionally in memory on **one long-lived process**. It is not safe to put independently balanced replicas behind a shared URL. Restarting the process loses rooms. Before scaling, migrate room routing/state to Colyseus or an equivalent supported multi-instance design. Input prediction, latency compensation, and production load testing are unfinished; internet latency can be noticeable.

## Verify

With both `npm run dev` and `npm run server` running:

```bash
npm run build
npm test
npm run test:network
npm run test:network:action
npm run test:browser
npm run test:network:machine
npm run test:browser:machine
npm run test:browser:machine:online
```

- Vitest covers movement, variable jump height, buffering, deterministic simulation, actual terrain removal, reinforced puzzle supports, plate/hack requirements, gate collision, revival/checkpoint reset, and two-player exit.
- The complete-route regression drives the simulation from the original spawn with normal inputs, without teleporting players or overriding the gate. It completes the escape; revival is covered separately.
- The WebSocket tests cover ready states, capacity, authoritative movement, reconnect, duplicate-slot rejection, and rejected client state changes. A full input-driven online combat route checks shield charging, shock punch, the barrel chain, identical snapshots, and destruction preserved through reconnect.
- Playwright runs two independent browser contexts. It exercises local controls/remapping, pause, live destruction, resizing, real lobby join/ready, each online character, synchronized terrain, and disconnection UI. It checks unhandled browser exceptions.

Browser scripts use `/usr/bin/chromium`; override `CHROMIUM_PATH` if needed. `npm run capture:gameplay` captures the six scene/puzzle images and `npm run capture:showcase` records the live combat sequence with its actual game audio. `npm run export:showcase` uses FFmpeg to encode and verify a continuous 15-second MP4. Captures default to `artifacts/premium/`; override `CAPTURE_DIR` to retain another run. Run captures after asset generation/build checks, without concurrent CPU-heavy browser jobs. Browser automation observes a development-only inspection hook, which is absent from production builds.

The production bundle is large because it includes Phaser (~355 KB gzip for the JS bundle). Vite's size warning is expected. A separate production-build asset-loading check is described in `docs/VALIDATION.md`.

## Assets and art direction

`public/assets/` contains original PNGs. `scripts/make_assets.py` compiles editable pixel grids, explicit pose layouts and drawn fire contours from `art/source/`, together with the independently composed prison backdrop. See [the source editing guide](art/README.md). Regeneration is optional and needs Python with Pillow:

```bash
python -m pip install Pillow
npm run assets
```

No Broforce sprites, maps, textures, audio, or UI were extracted, traced, or redistributed. The direction targets its small character scale, layered industrial scenery, and explosive arcade readability. The [direct visual review](docs/PREMIUM_ACTION_REVIEW.md) compares real captures with accessible Broforce community screenshots, identifies source limitations, and documents remaining differences. Commercial visual parity is not claimed.

## GitHub and Vercel

The checkout was initially empty. To publish reviewed changes to the selected repository's main branch:

```bash
git remote -v
git log --oneline -3
git push origin HEAD:main
```

Do not use force push. If the remote gains commits before publication, fetch and reconcile them first.

For the static frontend:

1. Import `shikherbharangar/no-way-out-exe` into Vercel and select the published branch.
2. Use the included `vercel.json`: install `npm ci`, build `npm run build`, output `dist`.
3. Set **`VITE_SERVER_URL=wss://YOUR-BACKEND-HOST`** in Vercel's environment settings. This is a public endpoint, not a secret. Redeploy after changing it.
4. Verify an HTTPS page can create/join a room from two different computers, synchronize destruction, and reconnect. That production test has not been performed here.

The brief's specific Vercel WebSocket announcement URL and official limitations page were requested, but both returned proxy 403 responses in this environment. This implementation makes **no claim about Vercel Functions' current WebSocket support** and does not depend on it.

### Dedicated backend deployment

Use a service that supports one continuously running Node process, WebSocket upgrades, and a public TLS endpoint. Deploy this repository's `Dockerfile`, or configure build `npm ci` and start `npm run server` with Node 24. The Docker image includes tsx because it runs the TypeScript server directly.

Set `PORT` to the platform's assigned port (default 2567). Set `ALLOWED_ORIGIN` to the exact HTTPS frontend origin; multiple origins are comma-separated. The server checks browser origins during the upgrade. Route `/health` for health checks. Configure **one instance**, with no autoscaling, until room-aware routing is implemented. Use WSS for an HTTPS frontend.

The Dockerfile and cloud deployment configuration are supplied but have not been built/deployed in this environment. No hosting credentials were requested or invented. Private rooms are ephemeral and not an authenticated public service; add production abuse controls and monitoring before a broad launch.

## Structure

```text
src/game/simulation.ts   Fixed-step movement, terrain, puzzle, combat, checkpoint
src/game/scene.ts        Phaser world, input, sprites, animation, camera, HUD
src/game/pixel-effects.ts Material fragments, sparks, smoke, fire and residue
src/game/prison-art.ts   Layered architecture, machinery and ambient animation
src/game/audio.ts        Original synthesized sound effects
src/net/client.ts       Rooms, input transport, reconnect
src/main.ts             Menus, settings, lobby and results
server/index.ts         Dedicated authoritative room server
tests/                  Deterministic gameplay and full-route regressions
scripts/                Pixel assets, browser and network validation
public/assets/          Committed original game assets
```

## Next priorities

1. Address the documented visual gaps: more distinct full-body animation, less repetitive surface borders, richer irregular terrain silhouettes and less repetitive smoke.
2. Test WSS online play between actual remote computers; add input prediction, server monitoring, and production room routing (preferably Colyseus before multiple instances).
3. Add pushable objects, throwing, vents, moving platforms, lasers, richer link interactions, and authored sound/music.
4. Build The Machine and The False Exit, including the pursuit, boss, complete narrative, and ending.
5. Build seeded modular endless generation with actual reachability/cooperation validation, difficulty modifiers, and persisted high scores.

There are no fake menu entries for unfinished sectors or endless mode. No deployment or full-scope completion is claimed.
