# AT Protocol "Statusphere" Example App

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

"npm run build" is a command used in Node.js development to generate a production-ready version of your application. It compiles your TypeScript code into JavaScript, optimizes the code for performance, and bundles all the necessary assets into a single file or multiple files. This process helps ensure that your application runs efficiently in a production environment.

