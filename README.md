# NO WAY OUT.exe

**Two idiots. One prison. Infinite bad decisions.**

A playable, original pixel-art prison escape built with Phaser 3, TypeScript, and Vite. This release deliberately concentrates on **Cell Block Zero**, the visual and gameplay acceptance slice. It is not the complete three-sector game described in the master brief.

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
| Pause | Escape | Escape | On-screen menu |

Controls can be remapped in Settings. For a solo rehearsal, operate the two keyboard control groups in turn. This is still a two-character puzzle, with no AI partner. Two controllers are supported by the Gamepad API; physical controller hardware has not been tested in this environment. Keyboard ghosting varies by hardware; remapping or controllers can help.

## The escape

1. Move BRICK beside the explosive drum at the cracked partition. Blast punch the route open; both characters can jump out of the crater. ZIP's arc bolt also detonates drums.
2. Put BRICK on the brass pressure plate. ZIP climbs the two steel steps to the terminal and holds interact for 1.5 seconds. Both characters are needed: the electrical link supplies the terminal.
3. Pass the unlocked bulkhead together to activate the checkpoint. Shoot guards, detonate drums, and watch the visibly warned collapsing walkway. The lower route remains usable.
4. If one character dies, stand within 50 pixels and hold interact to revive their hologram. If both die, the checkpoint restores terrain and players.
5. Bring **both living players** inside the freight lift and press interact. The slice ends with WARDEN's downward-elevator reveal and run statistics.

Normal masonry, dirt floors, and catwalk sections are destructible. Bolted puzzle supports and the lowest foundation are reinforced so explosions cannot permanently remove the required pressure plate, terminal, or approach steps. Hero-triggered blasts do not damage partners. The link limits separation to approximately one camera width.

## Included in this build

- Two original protagonists with idle, run, jump, fall, land, interaction, ability, hurt, collapse, revival, and victory frames.
- Acceleration, air control, variable jump height, coyote time, buffered jumping, ZIP wall jumps and air dash, BRICK blast punch/shield.
- A Phaser tilemap mirrored by authoritative collision data; explosions remove real walls/floors, trigger barrels, and affect guards.
- Pixel fireballs, sparks, bouncing debris, camera shake, local impact pauses, stepped explosion lighting, synthesized sound, mute and volume.
- Original textured PNG tiles and sprite sheets, distant architecture, parallax windows, near steelwork, animated fans, cables, light shafts, airborne grit, and a custom pixel-lettered logo.
- Electrical link, asymmetric plate/hack puzzle, gate, guards and projectiles, collapsing floor, checkpoint, ghost revival, and two-player exit.
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
npm run test:browser
```

- Vitest covers movement, variable jump height, buffering, deterministic simulation, actual terrain removal, reinforced puzzle supports, plate/hack requirements, gate collision, revival/checkpoint reset, and two-player exit.
- The complete-route regression drives the simulation from the original spawn with normal inputs, without teleporting players or overriding the gate. It completes the escape, including revival.
- The WebSocket test covers ready states, room capacity, authoritative movement, reconnect, duplicate-slot rejection, and rejected client state changes.
- Playwright runs two independent browser contexts. It exercises local controls/remapping, pause, live destruction, resizing, real lobby join/ready, each online character, synchronized terrain, and disconnection UI. It checks unhandled browser exceptions.

Browser scripts use `/usr/bin/chromium`. Set `CHROMIUM_PATH` to a compatible installed executable if needed. Alternatively install Playwright's Chromium and adapt the launch path. Screenshots are saved under ignored `artifacts/`. `npm run inspect` captures title and gameplay screenshots. Browser checks target the development server because their assertions read a development-only inspection hook; the hook is absent from production builds.

The production bundle is large because it includes Phaser (~355 KB gzip for the JS bundle). Vite's size warning is expected. A separate production-build asset-loading check is described in `docs/VALIDATION.md`.

## Assets and art direction

`public/assets/` contains original PNGs. `scripts/make_assets.py` reproducibly generates them from integer-coordinate pixel shapes, authored animation poses, constrained palettes, and seeded texture. Regeneration is optional and needs Python with Pillow:

```bash
python -m pip install Pillow
npm run assets
```

No Broforce sprites, maps, textures, audio, or UI were extracted, traced, or redistributed. The direction targets its small character scale, layered industrial scenery, and explosive arcade readability. Screenshot comparison against an externally retrieved Broforce image remains **unverified**: this environment's network proxy rejected the Steam reference destination. Do not treat this slice as having passed a side-by-side Broforce-quality acceptance review.

## GitHub and Vercel

The checkout was initially empty. The implementation is committed locally; it has not been pushed or deployed. To publish the reviewed commit to the selected repository's initial main branch:

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
src/game/scene.ts        Phaser world, input, sprites, animation, camera, effects
src/game/audio.ts        Original synthesized sound effects
src/net/client.ts       Rooms, input transport, reconnect
src/main.ts             Menus, settings, lobby and results
server/index.ts         Dedicated authoritative room server
tests/                  Deterministic gameplay and full-route regressions
scripts/                Pixel assets, browser and network validation
public/assets/          Committed original game assets
```

## Next priorities

1. Obtain the reference screenshots and conduct the requested direct visual review; further refine silhouettes, environment variety, debris, and lighting based on it.
2. Test WSS online play between actual remote computers; add input prediction, server monitoring, and production room routing (preferably Colyseus before multiple instances).
3. Add pushable objects, throwing, vents, moving platforms, lasers, richer link interactions, and authored sound/music.
4. Build The Machine and The False Exit, including the pursuit, boss, complete narrative, and ending.
5. Build seeded modular endless generation with actual reachability/cooperation validation, difficulty modifiers, and persisted high scores.

There are no fake menu entries for unfinished sectors or endless mode. No deployment or full-scope completion is claimed.
