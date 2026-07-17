# AT Protocol "Statusphere" Example App

An example application covering:

- Signin via OAuth
- Fetch information about users (profiles)
- Listen to the network firehose for new data
- Publish data on the user's account using a custom schema

See https://atproto.com/guides/statusphere-tutorial for a guide through the codebase.

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

To read data from the network, you'll need an instance of Tap running. Find full setup instructions in the [Statusphere tutorial](https://atproto.com/guides/statusphere-tutorial). Quickest way locally:

```sh
docker compose up -d
```

It watches the `xyz.statusphere.status` collection, so it'll pick up any account that's posted a status through this app without you registering repos by hand. Data persists in `.tap-data/` between restarts.

For other setups (running from source, securing the webhook with `TAP_ADMIN_PASSWORD`, etc.), see the [Tap repository](https://github.com/bluesky-social/indigo/blob/main/cmd/tap/README.md).
