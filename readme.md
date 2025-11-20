# SLU Open Project

[![codecov](https://codecov.io/gh/jackcrane/slu-open-project/graph/badge.svg?token=OUAS5BV7BW)](https://codecov.io/gh/jackcrane/slu-open-project)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/oss-slu/core_desk)

This is an open source project management platform for distributed manufacturing, processing, and toolshops within an organization. It was specifically designed for the Saint Louis University Center for Additive Manufacturing, but can be adapted for other organizations.

**See the [Development documentation](doc/index.md) for more information and conventions on using and developing this codebase.**

## Installation & Quickstart

### 1. Install [node.js](https://nodejs.org/en/download/current)

### 2. Install [Postgres](https://www.postgresql.org/download/) (or have access to a connection string) and start local server

### 3. Install yarn (If using Windows machine, use Command Prompt)

```bash
npm install --global yarn
```

### 4. Clone the repository

```bash
git clone https://github.com/oss-slu/core_desk.git
```

### 5. Set up environment variables

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/YOUR_DATABASE_NAME" (start a local postgres server and put that here)
JWT_SECRET=(random string)
BASE_URL=http://localhost:5173
SERVER_URL=(a globally accessible url, e.g. a tunnel. Ngrok, Bore, and Cloudflare Tunnels are good software options)
SENTRY_AUTH_TOKEN=(Sentry.io auth token)
SENTRY_DSN=(Sentry project DSN used by the backend API)
SENTRY_TRACES_SAMPLE_RATE=0.05 (optional; defaults to 0 which disables tracing)
SENTRY_PROFILES_SAMPLE_RATE=0 (optional; defaults to 0)
SENTRY_ENVIRONMENT=(optional override for NODE_ENV shown in Sentry)
AWS_REGION=nyc3
AWS_BUCKET=open-project
AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com
PROJECT_NAME=dev-(your first name)
AWS_ACCESS_KEY_ID=(get api key from tech lead or provide your own)
AWS_SECRET_ACCESS_KEY=(get api key from tech lead or provide your own)
```

### 6. Install dependencies

```bash
cd open-project
yarn
```

```bash
cd app
yarn && yarn build
```

```bash
cd api
yarn
```

### 7. Start the development server

```bash
cd api
yarn dev
```

### 8. Start the react app

```bash
cd app
yarn start
```

### 9. Open your browser to `http://localhost:5173` to view the app

### 10. To authenticate/log in, we typically use the SLU OKTA log in system, but that is a pain to connect in your local environment, so we have a workaround utility

In the /api folder, run 

```bash
yarn okta
```

If this is your first time logging in, allow it to create a new user for you. Once finished, it will give you a line of javascript. Copy/paste that into the browser's console, and that will log you in without having to go through the typical auth flow.

### 11. Migrate prisma database with local postgres server.

Install Prisma Client
```bash
yarn add @prisma/client
yarn add -D prisma
```

Generate Prisma Client
```bash
yarn prisma generate
```

Apply migrations
```bash
yarn prisma migrate dev
```

### 12. If you need to access the database (not necessary for initial setup), open Prisma Studio

Run the following in your terminal (Command Prompt for Windows) to open the database
```bash
yarn prisma studio
```

## Testing

To run the tests, docker and docker-compose are required.

Install [Docker for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) or [Docker for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)

1. Start Docker Desktop
Open Docker Desktop and wait for the app to start completely.

2. Start database from ./api folder (Only run if on Windows computer using Command Prompt. This step is not necessary if on Mac.)
```bash
cd api
docker-compose up -d
```

3. Run the tests from ./api folder

Mac:
```bash
cd api
yarn test
```

Windows:
```bash
yarn test
```

4. To clean up
```bash
docker-compose down -v
```

### End-to-End (E2E) tests

Notes:
- Requires Docker and Docker Compose. The compose stack brings up Postgres, MinIO (S3), the API (serving the app), and a Cypress runner.
- Artifacts (videos/screenshots) are saved under `e2e/cypress/`.
- On Windows, run the following commands with Git Bash or WSL through VS Code.

On Windows from Git Bash in VS Code, you need to convert the /api-entrypoint.sh file to Unix line endings:

```bash
cd e2e/docker
dos2unix api-entrypoint.sh
```
If you are not using VS Code, be sure to have dos2unix installed.

Quick, isolated runs use Docker (recommended) from the root folder:
- Run once: `npm run test:e2e`
- Watch mode: `npm run test:e2e:watch`
- Clean up: `npm run down:e2e`

Local development runner (without Docker):
- Install `concurrently` if not already installed with `npm i -D concurrently` - [Documentation](https://www.npmjs.com/package/concurrently#installation)
- Start the stack in one terminal: `npm run dev:stack`
- In another terminal, open Cypress: `npm --workspace e2e run cy:open`
- Headless run locally: `npm --workspace e2e run cy:run`

Tip: The Cypress base URL defaults to `http://localhost:5173` but can be overridden via `BASE_URL`.
