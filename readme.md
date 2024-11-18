# SLU Open Project

This is an open source project management platform for distributed manufacturing, processing, and toolshops within an organization. It was specifically designed for the Saint Louis University Center for Additive Manufacturing, but can be adapted for other organizations.

See the [Development documentation](doc/index.md) for more information and conventions on using and developing this codebase.

## Installation & Quickstart

1. Clone the repository

```bash
git clone https://github.com/jackcrane/slu-open-project.git
```

1. Set up environment variables

```
DATABASE_URL=(postgres connection string)
JWT_SECRET=(random string)
BASE_URL=http://localhost:5173
UPLOADTHING_TOKEN=(UploadThing API key from dashboard)
SERVER_URL=(tunnel url accessible from the internet. Used for callbacks & webhooks)
SENTRY_AUTH_TOKEN=(Sentry.io auth token)
```

1. Install dependencies

```bash
cd slu-open-project
yarn
```

```bash
cd app
yarn
```

1. Start the development server

```bash
cd api
yarn dev
```

1. Start the react app

```bash
cd app
yarn start
```

1. Open your browser to `http://localhost:5173` to view the app.

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