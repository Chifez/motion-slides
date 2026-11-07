# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy root workspace package definitions
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/export-server/package*.json ./apps/export-server/
COPY tsconfig.base.json ./

# Install all monorepo dependencies
RUN npm ci

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/export-server ./apps/export-server

# Build export-server (compiles apps/export-server and referenced shared packages to dist)
RUN npm run build --workspace=@motionslides/export-server

# ── Stage 2: Production Runner ─────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_EXECUTABLE=/usr/bin/chromium
ENV PORT=3001

# Install Chromium, FFmpeg, and international font packages to ensure crisp text rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-kacst \
    fonts-wqy-zenhei \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for production install
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/export-server/package*.json ./apps/export-server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy shared sources and compiled artifacts from builder
COPY packages/shared ./packages/shared
COPY --from=builder /app/apps/export-server/dist ./apps/export-server/dist

WORKDIR /app/apps/export-server

EXPOSE 3001

CMD ["node", "dist/apps/export-server/index.js"]
