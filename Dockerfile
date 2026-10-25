FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
# Optional build-only CA for development environments behind a TLS proxy.
# Render needs no secret here. Never disable certificate verification.
RUN --mount=type=secret,id=npm_ca \
    if [ -f /run/secrets/npm_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/npm_ca; fi; \
    npm ci --omit=dev --no-audit --no-fund
COPY --chown=node:node server ./server
# Include the shared simulation's complete import tree, including machine.ts.
COPY --chown=node:node src/game ./src/game
ENV NODE_ENV=production
ENV PORT=2567
EXPOSE 2567
USER node
CMD ["node", "--import", "tsx", "server/index.ts"]
