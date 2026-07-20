# AT Protocol "Statusphere" Example App

An example application covering:

- Signin via OAuth
- Fetch information about users (profiles)
- Listen to the network firehose for new data
- Publish data on the user's account using a custom schema

See https://atproto.com/guides/statusphere-tutorial for a guide through the codebase.

This project uses [Next.js](https://nextjs.org) as a server framework and [Jetstream](https://github.com/bluesky-social/jetstream) for syncing data from the Atmosphere.

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

The app connects directly to the public Jetstream service on startup and watches the `xyz.statusphere.status` collection, so it'll pick up any account that's posted a status through this app without you registering repos by hand — no local infra required. To point at a different Jetstream instance, set `JETSTREAM_URL` in `.env.local`.
