# Cell Block Zero: action-first visual pass

This pass changes presentation while retaining the existing authoritative simulation and multiplayer protocol. No sectors, puzzle mechanics, enemies, or collision rules were added. [The visual review](../artifacts/visual-review.md) contains the real before/after captures.

## Actors and animation

Original 48 × 48 sheets replace the previous 32 × 40 sheets. Each actor still has 32 frames, now with articulated elbows/knees, contrasting run contacts, a crouched landing, distinct jump/fall shapes, attack wind-up/extension/recoil/recovery, collapse poses, and revival/victory gestures. ZIP uses a spiked head silhouette, angular scarf, cyan jacket, pale shoulder guard, and lit gauntlet. BRICK uses a broader orange tank/harness, heavy limbs, and a large riveted power glove. Guards use armored gray-blue shapes, a red visor, and a visible carbine.

Run-frame selection follows distance traveled. Guard damage produces a brief visual recoil and hit flash. ZIP's dash leaves short-lived copies of the actual sprite frame. Hero feet and contact shadows anchor the new silhouettes to existing collision surfaces. Larger artwork does not change the tested player collider.

## Fire, smoke and fracture

`scripts/art/effects.py` creates original 128-pixel fire frames, 96-pixel smoke frames, and a 12-frame debris atlas. Fire progresses from ignition through white/yellow-hot overlapping lobes to orange/red curling flame and dark embers. Smoke expands independently and outlives the fire.

`PixelEffects` receives removed tile positions and their previous material. Masonry emits fractured stone, catwalks emit metal shards, and dirt emits darker clods. Fragments rotate, fall, bounce, and fade. Surviving tiles get visible cut edges. Temporary scorch, dust, streaking sparks, a short light flash, controlled shake, and impact pause complete the sequence. Cosmetic effects never mutate simulation state.

Effect budgets are bounded: at most 150 fragment sprites, 55 smoke clouds, 260 sparks, and 12 scorch records. Restarting a run clears these effects.

## Prison, camera and HUD

Cold navy architecture provides a darker resting background. Pale concrete/steel tops mark playable surfaces. Orange alarms/fire/drums and cyan technology supply selective saturation. Unequal cable loops, turbine shutters, diagonal ductwork, localized wear, and interrupted catwalks break up the repeated cell-window pattern. Fans, steam, maintenance sparks, and alarm lamps animate the environment.

The camera uses frame-rate-independent follow damping and capped velocity look-ahead while retaining room for both players. No zoom was added: a stable internal pixel scale keeps the art crisp.

Health bars and hero portraits replace the large HUD boxes. Controls stay in orientation/settings. The hack prompt appears near the terminal, only when relevant. Short timed dialogue replaces permanent bottom-of-screen instructions. The sound/fullscreen/menu controls are small and subdued until hovered or focused.

## Reproduce and verify

```bash
npm run assets
npm run build
npm test
# With npm run dev and npm run server already running:
npm run test:browser
npm run test:network
node scripts/capture-gameplay.mjs
```

Asset generation was run twice; all 16 PNGs reproduced byte-for-byte. The 12 gameplay tests, complete input-driven simulation route, local/two-browser co-op smoke tests, and reconnect protocol tests passed. The production build loaded the new fire/smoke/debris/portrait sheets, supported pause/resume, and had no missing HTTP assets or unhandled browser exceptions.

The capture script uses normal keyboard input and observes game state. For the explosion image, it temporarily stops the render loop immediately after a real peak-fire frame is drawn, captures that canvas, and resumes. This avoids a slow screenshot encoder advancing past the fireball. It does not modify textures, game positions, terrain, or pixels to construct the picture.

Important art direction note: it is okay to match Broforce's approximate character size, chunkiness, scene scale, and screen density. The goal is not subtle originality. The goal is a similarly impressive level of visual quality and arcade intensity, while still using original characters, original environments, and original assets.
