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

"npm run build" is a command used to generate a production-ready version of your application. It compiles your TypeScript code into JavaScript, optimizes the code for performance, and bundles all the necessary assets into a single file or multiple files. This process helps ensure that your application runs efficiently in a production environment.
"npm run dev" is a command used to start a development server for your application. It typically includes features like hot module replacement (HMR) and live reloading, which allow you to see changes to your code in real-time without having to manually refresh the browser. This is particularly useful during development, as it enables you to quickly see the effects of your changes without restarting the server.

