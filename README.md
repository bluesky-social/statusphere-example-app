# AT Protocol "Statusphere" Example App

[![Test](https://github.com/bluesky-social/statusphere-example-app/actions/workflows/test.yml/badge.svg)](https://github.com/bluesky-social/statusphere-example-app/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/bluesky-social/statusphere-example-app/graph/badge.svg)](https://codecov.io/gh/bluesky-social/statusphere-example-app)

An example application covering:

- Signin via OAuth
- Fetch information about users (profiles)
- Listen to the network firehose for new data
- Publish data on the user's account using a custom schema

See https://atproto.com/guides/applications for a guide through the codebase.

## Getting Started

```sh
git clone https://github.com/bluesky-social/statusphere-example-app.git
cd statusphere-example-app
cp .env.template .env
npm install
npm run dev
# Navigate to http://localhost:8080
```
