# Supplied-art integration validation

Validated 24 October 2026 on `approved-art-integration`, based on `69eba18`. This record concerns functional integration and evidence integrity; it does not approve artistic quality.

| Check | Result |
|---|---|
| Source pack | All 83 files match SHA-256 values read directly from the uploaded ZIP. All 79 PNGs decode; every named frame fits its atlas. |
| Runtime import | Five atlas PNGs are byte-identical to the supplied files. Original 21 stable-main assets are also unchanged. |
| Visible pixel fidelity | 114 Phaser comparisons pass: all 57 frames, both directions, complete frame dimensions, reflected per-frame anchors, binary alpha, 1× scale. |
| Build | TypeScript and Vite pass. Existing large-Phaser-bundle warning remains; JavaScript is about 364.74KB gzip. |
| Gameplay tests | **37 tests across six suites pass**: original 32 retained, two previously proven route-driver recovery tests carried over, and three rescue/pose tests added. |
| Network baseline | Room capacity/readiness, authoritative movement, disconnect freeze, reconnect tokens, duplicate/tampered-client rejection pass. |
| Network combat/rescue | Two real WebSocket clients solve the gate, start a rescue, disconnect at 35.56% progress, verify frozen progress, reconnect and complete it, charge/punch/chain, defeat guards, compare identical snapshots and reconnect again with the saved rescue intact. |
| Network campaign | Both sectors, seeded layout, machinery, cooperative boss and exit pass; Machine reconnect preserves seed, relay, lift and terrain. |
| Browser smoke | Local movement/jump, remapping, destruction, pause, resize, two-browser lobby/controls/destruction and disconnect UI pass. |
| Production browser | All 23 requested PNG assets, including five supplied atlases, load. No HTTP/browser errors; controls/pause work and development inspection hook is absent. |
| Local full campaign | Both sectors complete; seven actual sequence frames; supplied heroes persist across the transition and the actual replay button clears rescue state. |
| Two-browser full campaign | Independent clients play both sectors through the cooperative boss and exit, with identical final snapshots and no browser exceptions. |
| Gameplay captures | Nine real native scene/neutral/restored triplets; simulation state and restored pixels match exactly. Exact 2× copies are verified by reverse nearest-neighbor sampling. |
| Review page | Local images, nine-scene selector, neutral/restored view, 2× display, all five source-atlas groups and actual MP4 playback pass without browser or HTTP errors. |
| Action video | Actual guard shots, charge, rescue, giant-fist impact, chain destruction and escape pass. Continuous 15.000-second H.264/AAC, 640×360, 450 encoded frames; full FFmpeg decode passes. |

Evidence lives under `artifacts/supplied/`, with source hashes under `art/supplied/`. Browser render tests are explicitly distinguished from actual gameplay screenshots. The seven action screenshots show real event states; the original pack's previews/mockups are never counted as gameplay captures.

The final action run recorded **368 rendered frames in 17.0075 wall-clock seconds**. Constant-rate 30fps export can duplicate frames. A separate 3.008-second idle sample in headless Chromium/SwiftShader recorded 69 frames, median 43.2ms and p95 56.5ms. This is a software-GPU environment, not verified 60fps production performance. Physical controllers, real internet latency, public deployment and production load remain untested.

During implementation, a strict raw-RGBA comparison found four atlas/individual differences. Inspection established that every difference was underneath alpha zero; all visible pixels matched, and no source pixels were altered. The rescue reward fixture keeps its ghost away from the living player holding Interact, isolating the cage reward from the existing proximity-based partner revival. The original revival behavior was not changed.

The browser route driver includes already-validated recoveries for a missed cage lift and a missed terminal landing; these generate ordinary inputs and never teleport or modify simulation state. Static supplied enemy art and held hero keys are accepted only as documented temporary rendering limitations, not complete animation.
