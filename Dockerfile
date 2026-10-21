FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server ./server
COPY src/game/simulation.ts ./src/game/simulation.ts
ENV NODE_ENV=production
ENV PORT=2567
EXPOSE 2567
USER node
CMD ["npm", "run", "server"]
