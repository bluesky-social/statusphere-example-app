# AT Protocol "Statusphere" Example App

An example application covering:

- Signin via OAuth
- Fetch information about users (profiles)
- Listen to the network firehose for new data
- Publish data on the user's account using a custom schema

See https://atproto.com/guides/applications for a guide through the codebase.

This project uses [Next.js](https://nextjs.org) as a server framework and [Tap](https://github.com/bluesky-social/indigo/blob/main/cmd/tap/README.md) for syncing data from the Atmosphere.

This is a revamp of the original Statusphere example app which can be found on the [statusphere-og](https://github.com/bluesky-social/statusphere-example-app/tree/statusphere-og) branch.

## Getting Started

```sh
git clone https://github.com/bluesky-social/statusphere-example-app.git
cd statusphere-example-app
cp env.template .env.local
pnpm install
pnpm dev
# Navigate to http://127.0.0.1:3000
```

To read data from the network, you'll need an instance of Tap running. The easiest way locally is via Docker Compose:

```sh
docker compose up -d
```

This runs Tap with `TAP_SIGNAL_COLLECTION` set to `xyz.statusphere.status`, so it automatically discovers and syncs any account that has posted a status through this app (or a fork of it) — no manual repo registration needed. Tap's webhook is pointed at the Next.js dev server on the host (`host.docker.internal:3000`), and its data is persisted to `.tap-data/` between restarts.

See `docker-compose.yml` for the full config, or the [Tap repository](https://github.com/bluesky-social/indigo/blob/main/cmd/tap/README.md) for other setup options (e.g. running from source, `TAP_ADMIN_PASSWORD` for securing the webhook in shared environments).
