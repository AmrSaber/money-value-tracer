# Install using yarn, as bun install has problems with docker
# See: https://github.com/oven-sh/bun/issues/10371
FROM node:lts-alpine AS install

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN --mount=type=cache,target=/usr/local/share/.cache yarn install --freeze-lockfile --verbose

# Build and run using bun
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=install /app /app
COPY . .

RUN bun run build

ENV PORT=80
EXPOSE 80

CMD bun ./build/index.js
