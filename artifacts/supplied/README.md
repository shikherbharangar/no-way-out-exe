# Verified supplied-art integration media

- `acceptance/`: nine actual 640×360 gameplay situations, with same-tick neutral and restored variants and exact 2× copies. Includes destruction, cooperative terminal, cage extraction and checkpoint.
- `action/`: continuous normal-input combat recording with actual sound; seven native event screenshots, source WebM, 15-second H.264/AAC export and verification data. Rescue, charge, guard shots, enemy defeat, chain destruction and win are asserted.
- `render-evidence.json`: an isolated **rendering test**, not a gameplay capture. All 57 original frames rendered both ways in Phaser match the supplied atlas pixels exactly. Contains a short software-renderer performance sample.
- `regression/`: production/browser/network evidence. Large regression WebMs are preserved locally and ignored by Git.
- `verification.json`: source checks, actual capture states, nearest-neighbor enlargements and file hashes. Does not assert visual approval.

Serve the repo with `npm run dev` and open `/artifacts/supplied/index.html`. The supplied pack's own concept boards, previews and mockups live separately in `art/supplied/source/`; they are not presented as gameplay screenshots.
