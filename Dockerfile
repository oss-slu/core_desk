# Base image for frontend and backend
FROM node:20-alpine AS base

RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libxkbcommon0 \
    xdg-utils

# Accept build-time arguments
ARG DATABASE_URL

# Set the working directory to /app for the frontend
WORKDIR /app

# Copy app directory contents to /app
COPY ./app/ ./

# Install dependencies for the frontend
RUN yarn install

# Make sure NODE_ENV is set to production
ENV NODE_ENV=production

# Build the frontend
RUN yarn build

# Set the working directory to /api for the backend
WORKDIR /api

# Copy api directory contents to /api
COPY ./api/ ./

# Install dependencies for the backend
RUN yarn install

# Build Prisma (assumes you have a Prisma setup)
RUN npx prisma generate
RUN npx prisma migrate deploy

# Expose the required port for the backend
EXPOSE 3000

# Ensure environment variables are injected at runtime (no .env embedded)
CMD ["yarn", "start"]