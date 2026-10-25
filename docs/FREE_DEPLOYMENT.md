# Free public deployment: Vercel Hobby + Render Free

Source branch: **`free-public-deployment`**, based on `approved-art-integration` at `ee08e39`. Do not merge or push over main. The supplied artwork, shared simulation, two sectors, destruction, rescue and checkpoint rules are unchanged.

**Public deployment is pending account authorization. No public game or backend URL has been verified.** This environment has no connected Vercel/Render deployment tools or account credentials. GitHub deployment/status API reads and hosting documentation requests returned access errors. Git access works; code and configuration can be published to the review branch. Never treat the placeholder hostnames below as deployed addresses.

## Architecture and cost controls

- Frontend: Vercel **Hobby**, Vite static output `dist`. Personal/non-commercial use must meet Hobby eligibility.
- Backend: Render **Free Web Service**, Docker runtime, one instance, persistent Node WebSocket process. TLS/WSS is terminated by Render.
- Source: existing GitHub repository, deployment branch only.
- No database, disk, worker, cron, add-on, paid plan, paid instance, Railway service or external keepalive monitor is required.
- `render.yaml` explicitly uses `plan: free` and disables automatic deploys. Review the dashboard's **Free / $0** selection before creating the service. If the account UI requires a paid selection, stop instead of upgrading.

## Exact setup order

1. Sign in to [Vercel](https://vercel.com/new) with your GitHub account. Use a personal **Hobby** scope. Import `shikherbharangar/no-way-out-exe`; authorize access to this repository if requested. Select **`free-public-deployment`** as the production branch in the project's Git/production-environment settings. Do not use the rejected art branches or main for this deployment.
2. Use framework **Vite**, root directory `.`, Node **24.x**, install **`npm ci`**, build **`npm run build`**, output **`dist`**. These commands are already in `vercel.json`. Create the project to obtain its actual stable `https://…vercel.app` domain. The first build may have online play unavailable until step 6; local co-op still works. If the import screen initially selects main, change the production branch and explicitly deploy this branch before sharing the URL.
3. Sign in to [Render](https://dashboard.render.com/) with GitHub and authorize the same repository. Choose **New → Blueprint**, select the repository and **`free-public-deployment`** branch, and review `render.yaml`. It defines one Docker Web Service named `no-way-out-multiplayer`, **Free**, Dockerfile `./Dockerfile`, build context `.`, health path `/health`. Name availability can change the final hostname; copy the actual one from Render rather than guessing it.
4. When prompted for **`ALLOWED_ORIGIN`**, paste the actual stable Vercel origin from step 2, for example `https://YOUR-ACTUAL-PROJECT.vercel.app`, with **no trailing slash or path**. Confirm `NODE_ENV=production`. Leave `PORT` to Render's automatically supplied value. Apply the Blueprint only when the instance shows Free/$0. If using **New → Web Service** manually instead, select the same repository/branch, Docker runtime, Free instance, root `.`, Dockerfile `./Dockerfile`, context `.`, health path `/health`, the same environment variables, and disable automatic deploys.
5. Wait for the Render deployment to become healthy. Open **`https://ACTUAL-SERVICE.onrender.com/health`**. It must return HTTP 200 and JSON with `"ok":true`. Check logs for the assigned listening port. The server binds `0.0.0.0`, not localhost. No Render start-command override is needed: the Docker CMD runs Node directly with tsx.
6. In Vercel **Project → Settings → Environment Variables**, set **`VITE_SERVER_URL=wss://ACTUAL-SERVICE.onrender.com`** for **Production**. Replace `https://` in the actual Render URL with `wss://`; keep the same hostname. No token or secret belongs in this value. Redeploy the latest `free-public-deployment` commit to **Production**, because Vite embeds this value at build time. Confirm the deployed commit matches this branch.
7. For an openly shareable game, ensure the production domain is publicly accessible and not behind Vercel deployment protection/login. Share the stable production domain, not a protected preview or a changing per-commit preview URL. The backend must allow that **exact** HTTPS origin. If you add a custom domain, append its exact origin to `ALLOWED_ORIGIN` and redeploy Render. Do not use `*.vercel.app` or `*`.
8. Open the game, choose Online Co-op, create a room, copy its invite link, and send it to a friend. Both players ready up. Keep both browser tabs open while playing. Run the production acceptance command below before considering deployment complete.

Blueprint creation is optional; the manual Web Service settings above are equivalent. Both require your own account authorization. No credentials were invented or requested in chat.

## Environment variables

| Host | Key | Exact required value |
|---|---|---|
| Vercel, Production build | `VITE_SERVER_URL` | `wss://` followed by the **actual assigned Render hostname**; no localhost, credentials or placeholder |
| Render runtime | `NODE_ENV` | `production` |
| Render runtime | `ALLOWED_ORIGIN` | The **actual stable Vercel HTTPS origin**, no trailing slash; comma-separated exact origins if needed |
| Render runtime | `PORT` | Automatically supplied by Render; server reads it. Do not hard-code a different dashboard value. Local default is `2567`. |

No other environment variables or paid services are required. Vercel preview URLs are intentionally rejected unless you explicitly allow their exact origins. You can leave multiplayer unconfigured on previews. Never expose a Render API key or any secret via a `VITE_*` variable.

## Docker and server behavior

The old Dockerfile copied only `simulation.ts`, omitting its `machine.ts` import. It now copies the complete `src/game` directory and `server` directory. Copies are owned by `node` so restrictive source-file permissions cannot prevent the unprivileged runtime from reading them. Runtime dependencies are installed from the lockfile with `npm ci --omit=dev`; `tsx` is a runtime dependency. Static artwork and large review artifacts are excluded from the backend build context.

The Docker build supports an **optional** BuildKit `npm_ca` secret for development environments behind a custom TLS proxy. This execution environment needed its proxy DNS mapping and trusted CA for npm downloads. The certificate is mounted only during installation and is absent from the resulting image; TLS verification remains enabled. **Render does not need this secret or any proxy configuration.**

Production startup fails with an explicit message if `ALLOWED_ORIGIN` is missing or malformed. WebSocket upgrades require an exact allowed browser origin; absent/null/spoofed-suffix origins are rejected. This is a browser-origin restriction, not user authentication: non-browser programs can set headers. Existing room capacity, rate limit, payload limit and random room/reconnect tokens remain in place.

`GET /health` and `HEAD /health` return 200 without an Origin requirement. No frontend health-poll loop is used. HTTPS pages reject insecure `ws://` endpoints before connecting. Active socket ping/pong detects dead transports; this is connection maintenance for actual clients, not a service-warming job. An empty server makes no external requests.

## Sleeping service, retries and local play

The frontend connects only when the player chooses Create or Join. It retries failed initial connections for a **fixed maximum of two minutes**, using 1/2/4/8-second backoff and a 20-second per-attempt bound. The menu displays **“Multiplayer server is waking up”**, keeps the room code, and offers **Play local co-op**. Cancelling stops every pending attempt/timer.

After an established session drops, reconnect attempts have a separate **25-second** budget. The existing host reserves disconnected slots for **30 seconds** and freezes the simulation. A TCP/WebSocket handshake alone does not reset the retry budget; a valid lobby response does. Expired rooms and rejected joins stop retrying and show the server's explanation.

Local co-op needs only the frontend assets; it starts and plays when the online backend is unreachable. It does not continuously probe or warm Render.

## Troubleshooting

| Symptom | Check |
|---|---|
| Local works; online says it is not configured | Set `VITE_SERVER_URL` in Vercel **Production**, then rebuild/redeploy this branch. Runtime environment changes alone cannot update an already-built Vite bundle. |
| `/health` fails | Wait for a cold start; check Render deploy logs, Free service availability, assigned `PORT`, and production `ALLOWED_ORIGIN`. |
| `/health` works; WebSocket repeatedly fails | Check exact `ALLOWED_ORIGIN`, no trailing slash, stable production URL, and `wss://` endpoint. The ws library rejects unauthorized upgrades with HTTP 401. Browsers hide handshake details, so the UI cannot reliably distinguish an origin mistake from a sleeping service. |
| Invite asks a friend to log into Vercel | Share the stable production domain and remove production deployment protection where your Hobby project permits it. Do not share a protected preview. |
| Room disappeared after sleep or deployment | Rooms are in memory. Create a new room; reconnect cannot restore a restarted process. |
| A preview cannot connect | Explicitly allow its exact HTTPS origin or use the production domain. Do not wildcard all Vercel domains. |

## Free-tier limitations

- Render Free can suspend the process after inactivity. The first connection may take roughly a minute or longer; the two-minute UI deadline is not a guarantee of platform startup time.
- Free instance hours, bandwidth and other quotas are shared/limited. Exhausted quotas can suspend availability. Check the account's current limits before launch; no automatic paid upgrade is part of this configuration.
- Free CPU/RAM and platform restarts limit reliability. This is suitable for a small private-room game, not a verified high-concurrency service or guaranteed uptime.
- Rooms live in one process's memory. Sleep, restart, crash or redeployment loses rooms and progress. The reconnect token restores only an existing process's reserved slot; it cannot recover a destroyed process. A friend may need to create a new room after the server restarts.
- Run **one backend instance**. Independent replicas do not share rooms.
- Vercel Hobby is intended for eligible personal/non-commercial use. No paid team scope, custom paid domain, analytics add-on or upgrade is needed.
- There are no external keepalive services, scheduled pings or artificial activity to bypass inactivity rules.

References for the account owner to check current terms: [Render Free](https://render.com/docs/free), [Render WebSockets](https://render.com/docs/websocket), [Vercel Hobby](https://vercel.com/docs/plans/hobby). Live documentation access was unavailable from this execution environment, so dashboard plan/limit confirmation remains necessary.

## Public acceptance test

The prepared changes passed a local production rehearsal: Docker build and non-root startup on injected port 10000; complete `simulation.ts` → `machine.ts` import; `/health` GET/HEAD; origin rejection; 46 unit/gameplay tests; production Vite build; existing local browser smoke checks; network authority, rescue/reconnect and full-campaign checks. Two independent browsers using the production bundle over local HTTPS/WSS completed both sectors in 72.591 seconds, retained destruction through reconnect and ended on identical snapshots. Local co-op and cancellation also passed with the transport deliberately unavailable.

The TLS fixture uses a temporary self-signed certificate **only for localhost testing**. This does not verify Render/Vercel TLS, internet latency, account configuration, platform cold-start duration or public availability. The final browser rehearsal used the corrected Docker image; earlier bot timing failures at the terminal were resolved in an input-only test helper without changing game physics. The readiness and validation records are in [artifacts/deployment](../artifacts/deployment/README.md).

Once both actual services are configured, from a checkout with Node 24 and Chromium:

```bash
npm ci
DEPLOYED_GAME_URL=https://ACTUAL-PROJECT.vercel.app \
CHROMIUM_PATH=/path/to/chromium \
CAPTURE_DIR=artifacts/deployment/public npm run test:deployed
```

Use an absolute Chromium path (`/usr/bin/chromium` is the default here). This test uses the **production build**, two independent browser contexts, real room/invite UI and keyboard inputs. It observes WebSocket state without using development hooks or writing game state; checks both sectors, destruction, reconnect and identical final state; captures screenshots; and separately rejects the transport to prove local co-op still works. It does not bypass TLS errors on a public URL. The timeout allows a cold service to wake.

Also test manually on two separate computers/networks: invite, ready, movement, wall destruction, gate puzzle, pause/rejoin and a real brief network interruption. Browser automation on one machine does not establish real-world latency or account-level availability.

Until these steps run against the **actual public URLs**, the deployment status is **not deployed / public verification pending**, regardless of local test results.
