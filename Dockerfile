# Base image for frontend and backend
FROM node:20-alpine AS base

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    openssl \
    gdb

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# 🔴 Enable Node crash diagnostics
ENV NODE_OPTIONS="--trace-uncaught --trace-warnings --abort-on-uncaught-exception --report-on-fatalerror --report-uncaught-exception"
ENV NODE_REPORT_DIRECTORY=/var/log/node-reports
ENV NODE_REPORT_FILENAME=report.json

# Accept build-time arguments
ARG DATABASE_URL
ARG SENTRY_AUTH_TOKEN
ARG VITE_BUILD_DATE
ARG VITE_HASH

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

# 🔴 Ensure report directory exists
RUN mkdir -p /var/log/node-reports

EXPOSE 3000

# 🔴 Enable core dumps + run with verbose output
CMD sh -c "ulimit -c unlimited && yarn start"
