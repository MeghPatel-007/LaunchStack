
FROM oven/bun:1.4.4

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production

EXPOSE 8000

CMD ["bun", "run", "src/server.js"]
