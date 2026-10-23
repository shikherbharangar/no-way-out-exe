# Real gameplay evidence — prison art reboot

- `before/`: six real 1280 × 720 captures from unchanged `69eba18` using `capture-gameplay.mjs` and the existing keyboard route. `before/action/` contains additional real encounter frames; that baseline action run missed its guard-shot assertion and is not claimed as a passing showcase test.
- `iteration-1/`: the first imported-art pass, retained to show the asset revision. Its speckled plaster and repeated floor cracks prompted the revised source illustration, wider material panel and pose baseline correction.
- `after/`: six real final captures of the same situations, plus their observed simulation ticks and state.
- `after/action/`: six native 640 × 360 action frames, the uncut WebM with real game audio, a 15-second H.264/AAC MP4, and event/animation evidence. The final run passed the existing showcase assertions, including guard fire, cooperative charge, charged punch, chain explosions, enemy defeat and exit.
- `regression/`: production, local/online smoke, authoritative combat/reconnect and both-sector campaign evidence. Previously published screenshots outside this directory were not overwritten.
- `verification.json`: final screenshot/video sizes and SHA-256 hashes, plus pixel-master/capture checks.
- `index.html`: interactive comparison. Serve the repository root to use it; [the Markdown review](../../docs/ART_REBOOT.md) works directly in GitHub.

All screenshots were captured from Phaser running in Chromium. No generated mockups were substituted for gameplay. The **asset sources** under `art/reboot/source` are explicitly disclosed original AI-assisted illustrations; they are separate from these rendered captures. The MP4 is the first fifteen seconds of a continuous canvas recording with ordinary constant-frame-rate conversion. Its first actual video frame is held from t=0 if MediaRecorder starts video after audio. No scenery, actors or effects are composited into the recording.

Original sprite, simulation and server sources remain available. Main is not changed by this review branch. This evidence demonstrates functionality and the actual visual result; it does not establish commercial art parity.
