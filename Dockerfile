# ---------- BASE ----------
FROM node:20-bullseye AS base

# Install Chromium + required system libs (glibc-based)
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-freefont-ttf \
    openssl \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Puppeteer config
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Enable core dumps (for debugging segfaults)
RUN ulimit -c unlimited || true

# ---------- BUILD STAGE ----------
FROM base AS builder

# Accept build args
ARG DATABASE_URL
ARG SENTRY_AUTH_TOKEN
ARG VITE_BUILD_DATE
ARG VITE_HASH

ENV DATABASE_URL=${DATABASE_URL}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV VITE_BUILD_DATE=${VITE_BUILD_DATE}
ENV VITE_HASH=${VITE_HASH}

# ---- FRONTEND ----
WORKDIR /app
COPY ./app/package.json ./app/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY ./app/ .
RUN yarn build

# ---- BACKEND ----
WORKDIR /api
COPY ./api/package.json ./api/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY ./api/ .

# Generate Prisma client
RUN npx prisma generate

# DO NOT run migrate at build time (this can crash + break builds)
# Migrations should run at container start

# ---------- RUNTIME ----------
FROM base AS runtime

# Install only runtime deps
WORKDIR /api

# Copy backend
COPY --from=builder /api /api

# Copy frontend build into backend if you serve static assets
COPY --from=builder /app/dist /api/public

EXPOSE 3000

# Use dumb-init to prevent zombie processes
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", \
  "--trace-uncaught", \
  "--trace-warnings", \
  "--report-on-fatalerror", \
  "--report-uncaught-exception", \
  "--report-directory=/tmp/node-reports", \
  "index.js"]