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

## Deploying

In production, you will need a private key to sign OAuth tokens request. Use the
following command to generate a new private key:

```sh
./bin/gen-jwk
```

The generated key must be added to the environment variables (`.env` file) in `PRIVATE_KEYS`.

```env
PRIVATE_KEYS='[{"kty":"EC","kid":"12",...}]'
```

> [!NOTE]
>
> The `PRIVATE_KEYS` is an array of keys. Make sure to use single
> quotes, and square brackets around the keys `PRIVATE_KEYS='[<key here>]'`. If
> you generate multiple keys, add new keys at the beginning of the array, so
> that the first key is always the most recent one. When a key is removed, all
> associated sessions will be invalidated.

Make sure to also set the `COOKIE_SECRET`, which is used to sign session
cookies, in your environment variables (`.env` file). You can generate a random
string for this:

```sh
openssl rand -base64 33
```

Finally, set the `PUBLIC_URL` to the URL where your app will be accessible. This
will allow the authorization servers to download the app's public keys.

```env
PUBLIC_URL="https://your-app-url.com"
```

> [!NOTE]
>
> You can use services like [ngrok](https://ngrok.com/) to expose your local
> server to the internet for testing purposes. Just set the `PUBLIC_URL` to the
> ngrok URL.
