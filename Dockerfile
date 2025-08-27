# Base image for frontend and backend
FROM node:20-alpine AS base

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    openssl

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Accept build-time arguments
ARG DATABASE_URL
ARG SENTRY_AUTH_TOKEN
ARG VITE_BUILD_DATE
ARG VITE_HASH

# Make Vite see these at build time (Vite only inlines VITE_* at build)
ENV VITE_BUILD_DATE=${VITE_BUILD_DATE}
ENV VITE_HASH=${VITE_HASH}

# --- Frontend ---
WORKDIR /app
COPY ./app/ ./
RUN yarn install
RUN yarn build

# --- Backend ---
WORKDIR /api
COPY ./api/ ./
RUN yarn install
RUN npx prisma generate
RUN npx prisma migrate deploy

EXPOSE 3000
CMD ["yarn", "start"]