# AT Protocol "Statusphere" App

An application covering:

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
```
npm run dev
```
 is the command used to start the development server. It includes live reloading, which allows you to see changes to your code in real-time without having to restart the server.

```
npm run build
```
 is the command used to generate a production-ready version of your application. It compiles your TypeScript code into JavaScript, optimizes the code for performance, and bundles all the necessary assets. This process helps to ensure that your application runs efficiently in a production environment.

 ```
 npm start
 ```
 is the command used to start your application in production mode. It is typically used after running the build command to start the application in a production environment.



