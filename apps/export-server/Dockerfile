# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy root workspace package definitions
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/export-server/package*.json ./apps/export-server/
COPY apps/web/package*.json ./apps/web/
COPY launch/package*.json ./launch/
COPY tsconfig.base.json ./

# Install all monorepo dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci \
      --workspace=@motionslides/export-server \
      --workspace=@motionslides/shared

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/export-server ./apps/export-server

# Build export-server (compiles apps/export-server and referenced shared packages to dist)
RUN npm run build --workspace=@motionslides/export-server

# ── Stage 2: Production Runner ─────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_EXECUTABLE=/usr/bin/chromium
ENV PORT=3001

# Install Chromium, FFmpeg, and international font packages to ensure crisp text rendering
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-kacst \
    fonts-wqy-zenhei \
    ca-certificates

# Reuse the dependency tree that compiled successfully in the builder. This
# avoids a second registry-dependent install in the runtime stage.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/export-server/dist ./apps/export-server/dist

WORKDIR /app/apps/export-server

EXPOSE 3001

CMD ["node", "dist/apps/export-server/index.js"]
