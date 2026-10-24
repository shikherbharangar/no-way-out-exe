# Animation and scale review artifacts

**Animation acceptance is not met.** No new finished animation or anatomy repair is claimed.

- [Full review with real images](../../docs/ANIMATION_SCALE_REVIEW.md)
- [Interactive gallery](index.html) — serve the repository with Vite; open `/artifacts/animation-review/index.html`.
- [15-second actual gameplay video](action/gameplay-15s.mp4), [source recording](action/gameplay-source.webm), [verified media hashes](action/media-verification.json).
- [Source/packaging/readiness report](production-readiness.json), [same-tick scale evidence](scale-capture-evidence.json).
- [Editable production documents and instructions](../../art/animation-production/README.md).

`idle-*`, `running-*`, `combat-*` are actual 640×360 Phaser frames. `*-2x.png` are exact 1280×720 nearest-neighbor inspection copies. `scale-2x` and `scale-3x` mean the **hero render scale**; the final `-2x.png` suffix instead means **whole-frame inspection enlargement**. `half-diagnostic`/`third-diagnostic` are unshipped reduction experiments. `colliders` adds a diagnostic overlay. No simulation state is changed in these comparisons.

`previous-background` restores the original background tints at the same tick; `current` uses the modest scenery adjustment; `restored` and `final-restored` verify reversibility. The `action/` folder is continuous real input-driven gameplay. `regression/` contains actual browser/campaign/network verification.
