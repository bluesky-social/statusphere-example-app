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

To read data from the network, you'll need an instance of Tap running. Find instructions for getting set up by checking out the [Statusphere tutorial](https://atproto.com/guides/statusphere-tutorial) or the [Tap repository](https://github.com/bluesky-social/indigo/blob/main/cmd/tap/README.md).
