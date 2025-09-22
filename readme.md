# SLU Open Project

[![codecov](https://codecov.io/gh/jackcrane/slu-open-project/graph/badge.svg?token=OUAS5BV7BW)](https://codecov.io/gh/jackcrane/slu-open-project)

This is an open source project management platform for distributed manufacturing, processing, and toolshops within an organization. It was specifically designed for the Saint Louis University Center for Additive Manufacturing, but can be adapted for other organizations.

**See the [Development documentation](doc/index.md) for more information and conventions on using and developing this codebase.**

## Installation & Quickstart

### 1. Install node.js(https://nodejs.org/en/download/current)

### 2. Install Postgres(https://www.postgresql.org/download/) (or have access to a connection string) and start local server

### 3. Install yarn (If using Windows machine, use Command Prompt as terminal)

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
SERVER_URL=(tunnel url accessible from the internet. Used for callbacks & webhooks)
SENTRY_AUTH_TOKEN=(Sentry.io auth token)
AWS_REGION=nyc3
AWS_BUCKET=open-project
AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com
PROJECT_NAME=dev-(your first name)
AWS_ACCESS_KEY_ID=(get an api key from the tech lead)
AWS_SECRET_ACCESS_KEY=(get an api key from the tech lead)
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

### 12. Open Prisma database

Run the following in your terminal (Command Prompt for Windows) to open the database
```bash
yarn prisma studio
```

Toggle admin true/false status for user:
1. Click on user model
2. Select the admin true/false value for your user
3. Click enter on keyboard to open the dropdown
4. Select "true" or "false" to toggle between admin permissions
5. Save changes

## Testing

To run the tests, docker and docker-compose are required.

1. Run the tests

```bash
cd api
yarn test
```

2. To clean up

```bash
docker-compose down -v
```

### End-to-End (E2E) tests

Quick, isolated runs use Docker (recommended):

- Run once: `npm run test:e2e`
- Watch mode: `npm run test:e2e:watch`
- Clean up: `npm run down:e2e`

Notes:
- Requires Docker and Docker Compose. The compose stack brings up Postgres, MinIO (S3), the API (serving the app), and a Cypress runner.
- Artifacts (videos/screenshots) are saved under `e2e/cypress/`.

Local development runner (without Docker):
- Start the stack in one terminal: `npm run dev:stack`
- In another terminal, open Cypress: `npm --workspace e2e run cy:open`
- Headless run locally: `npm --workspace e2e run cy:run`

Tip: The Cypress base URL defaults to `http://localhost:5173` but can be overridden via `BASE_URL`.
