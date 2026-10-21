# Validation record

Current target: the Cell Block Zero vertical slice on desktop Chromium.

Executed on 2026-10-21 using Node 24.19.0 and desktop Chromium:

- `npm run build`: TypeScript check and production bundle passed. Phaser produces a documented bundle-size warning (~354 KB gzip JS).
- `npm test`: **12 tests passed**, two files, zero failures/skips. Includes a complete input-driven route from spawn to cooperative exit.
- `npm run test:network`: room capacity, ready/start, authoritative movement, reconnect, duplicate-token rejection, and client-state tamper rejection passed.
- `npm run test:browser`: local controls/remapping, live tile destruction, pause, resize, and two independent online browser contexts passed. Both characters moved; terrain agreed; partner-disconnect UI appeared; zero unhandled browser exceptions.
- Production bundle served with `npm run preview -- --port 4173`: title and game started; 13 successful PNG requests; pause/resume passed; no HTTP errors or browser exceptions; development inspection hook absent.

These checks validate this running machine and its production build, not an external deployment. The full-route regression operates the fixed-step simulation directly; browser tests exercise controls and destruction but do not automate the entire escape through browser input. Screenshots are generated in `artifacts/` and are intentionally not shipping assets.

Reference comparison: the Steam reference API and the two Vercel documentation URLs returned proxy `403 Forbidden`. Screenshot-based visual inspection was performed on the game's own rendered title, prison, explosion, and multiplayer screens; a direct Broforce reference comparison was not possible.

Unverified capabilities: public deployment, actual internet latency, multiple physical computers, physical controllers, mobile play, Docker image build, multi-instance backend operation, and full narrative/endless content.
