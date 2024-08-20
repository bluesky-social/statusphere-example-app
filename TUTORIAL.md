# Tutorial

In this guide, we're going to build a **simple multi-user app** that publishes your current "status" as an emoji.

At various points we will cover how to:

- Signin via OAuth
- Fetch information about users (profiles)
- Listen to the network firehose for new data
- Publish data on the user's account using a custom schema

We're going to keep this light so you can quickly wrap your head around ATProto. There will be links with more information about each step.

## Where are we going?

Data in the Atmosphere is stored on users' personal repos. It's almost like each user has their own website. Our goal is to aggregate data from the users into our SQLite DB. 

Think of our app like a Google. If Google's job was to say which emoji each website had under `/status.json`, then it would show something like:

- `nytimes.com` is feeling 📰 according to `https://nytimes.com/status.json`
- `bsky.app` is feeling 🦋 according to `https://bsky.app/status.json`
- `reddit.com` is feeling 🤓 according to `https://reddit.com/status.json`

The Atmosphere works the same way, except we're going to check `at://` instead of `https://`. Each user has a data repo under an `at://` URL. We'll crawl all the `at://`s in the Atmosphere for all the  `/status.json` records and aggregate them into our SQLite database.

## Step 1. Starting with our ExpressJS app

Start by cloning the repo and installing packages.

```bash
git clone TODO
cd TODO
npm i
npm run dev # you can leave this running and it will auto-reload
```

Our repo is a regular Web app. We're rendering our HTML server-side like it's 1999. We also have a SQLite database that we're managing with [Kysley](#todo).

Our starting stack:

- Typescript
- NodeJS web server ([express](#todo))
- SQLite database ([Kysley](#todo))
- Server-side rendering ([uhtml](#todo))

With each step we'll explain how our Web app taps into the Atmosphere. Refer to the codebase for more detailed code &mdash; again, this tutorial is going to keep it light and quick to digest.

## Step 2. Signing in with OAuth

When somebody logs into our app, they'll give us read & write access to their personal `at://` repo. We'll use that to write the `status.json` record.

We're going to accomplish this using OAuth ([spec](#todo)). You can find a [more extensive OAuth guide here](#todo), but for now just know that most of the OAuth flows are going to be handled for us using the [@atproto/oauth-client-node](#todo) library. This is the arrangement we're aiming toward:

```
  ┌─App Server───────────────────┐
  │    ┌─► Session store ◄┐      │
  │    │                  │      │    ┌───────────────┐
  │ App code ──────►OAuth client─┼───►│ User's server │
  └────▲─────────────────────────┘    └───────────────┘
  ┌────┴──────────┐
  │  Web browser  │
  └───────────────┘
```

When the user logs in, the OAuth client will create a new session with their repo server and give us read/write access along with basic user info.

Our login page just asks the user for their "handle," which is the domain name associated with their account. For [Bluesky](https://bsky.app) users, these tend to look like `alice.bsky.social`, but they can be any kind of domain (eg `alice.com`).

```html
<!-- src/pages/login.ts -->
<form action="/login" method="post" class="login-form">
  <input
    type="text"
    name="handle"
    placeholder="Enter your handle (eg alice.bsky.social)"
    required
  />
  <button type="submit">Log in</button>
</form>
```

When they submit the form, we tell our OAuth client to initiate the authorization flow and then redirect the user to their server to complete the process.

```typescript
/** src/routes.ts **/
// Login handler
router.post(
  '/login',
  handler(async (req, res) => {
    // Initiate the OAuth flow
    const url = await oauthClient.authorize(handle)
    return res.redirect(url.toString())
  })
)
```

This is the same kind of SSO flow that Google or GitHub uses. The user will be asked for their password, then asked to confirm the session with your application.

When that finishes, they'll be sent back to `/oauth/callback` on our Web app. The OAuth client stores the access tokens for the server, and then we attach their account's [DID](#todo) to their cookie-session.

```typescript
/** src/routes.ts **/
// OAuth callback to complete session creation
router.get(
  '/oauth/callback',
  handler(async (req, res) => {
    // Store the credentials
    const { agent } = await oauthClient.callback(params)

    // Attach the account DID to our user via a cookie
    const session = await getIronSession(req, res)
    session.did = agent.accountDid
    await session.save()

    // Send them back to the app
    return res.redirect('/')
  })
)
```

With that, we're in business! We now have a session with the user's `at://` repo server and can use that to access their data.

## Step 3. Fetching the user's profile

Why don't we learn something about our user? Let's start by getting the [Agent](#todo) object. The [Agent](#todo) is the client to the user's `at://` repo server.

```typescript
/** src/routes.ts **/
async function getSessionAgent(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext
) {
  // Fetch the session from their cookie
  const session = await getIronSession(req, res)
  if (!session.did) return null

  // "Restore" the agent for the user
  return await ctx.oauthClient.restore(session.did).catch(async (err) => {
    ctx.logger.warn({ err }, 'oauth restore failed')
    await session.destroy()
    return null
  })
}
```

Users publish JSON records on their `at://` repos. In [Bluesky](https://bsky.app), they publish a "profile" record which looks like this:

```typescript
interface ProfileRecord {
  displayName?: string // a human friendly name
  description?: string // a short bio
  avatar?: BlobRef     // small profile picture
  banner?: BlobRef     // banner image to put on profiles
  createdAt?: string   // declared time this profile data was added
  // ...
}
```

We're going to use the [Agent](#todo) to fetch this record to include in our app.

```typescript
/** src/routes.ts **/
// Homepage
router.get(
  '/',
  handler(async (req, res) => {
    // If the user is signed in, get an agent which communicates with their server
    const agent = await getSessionAgent(req, res, ctx)

    if (!agent) {
      // Serve the logged-out view
      return res.type('html').send(page(home()))
    }

    // Fetch additional information about the logged-in user
    const { data: profileRecord } = await agent.getRecord({
      repo: agent.accountDid,               // our user's repo
      collection: 'app.bsky.actor.profile', // the bluesky profile record type
      rkey: 'self',                         // the record's name
    })

    // Serve the logged-in view
    return res
      .type('html')
      .send(page(home({ profile: profileRecord.value || {} })))
  })
)
```

With that data, we can give a nice personalized welcome banner for our user:

```html
<!-- pages/home.ts -->
<div class="card">
  ${profile
    ? html`<form action="/logout" method="post" class="session-form">
        <div>
          Hi, <strong>${profile.displayName || 'friend'}</strong>.
          What's your status today?
        </div>
        <div>
          <button type="submit">Log out</button>
        </div>
      </form>`
    : html`<div class="session-form">
        <div><a href="/login">Log in</a> to set your status!</div>
        <div>
          <a href="/login" class="button">Log in</a>
        </div>
      </div>`}
</div>
```

## Step 4. Reading & writing records

You can think of the user repositories as collections of JSON records:

```
                                   ┌────────┐
                               ┌───| record │
               ┌────────────┐  │   └────────┘
           ┌───| collection |◄─┤   ┌────────┐
┌──────┐   │   └────────────┘  └───| record │
│ repo |◄──┤                       └────────┘
└──────┘   │   ┌────────────┐      ┌────────┐
           └───┤ collection |◄─────| record │
               └────────────┘      └────────┘
```

Let's look again at how we read the "profile" record:

```typescript
await agent.getRecord({
  repo: agent.accountDid,               // The user
  collection: 'app.bsky.actor.profile', // The collection
  rkey: 'self',                         // The record name
})
```

We write records using a similar API. Since our goal is to write "status" records, let's look at how that will happen:

```typescript
await agent.putRecord({
  repo: agent.accountDid,              // The user
  collection: 'com.example.status',    // The collection
  rkey: 'self',                        // The record name
  record: {                            // The record value
    status: "👍",
    updatedAt: new Date().toISOString()
  }
})
```

Our `POST /status` route is going to use this API to publish the user's status to their repo.

```typescript
/** src/routes.ts **/
// "Set status" handler
router.post(
  '/status',
  handler(async (req, res) => {
    // If the user is signed in, get an agent which communicates with their server
    const agent = await getSessionAgent(req, res, ctx)
    if (!agent) {
      return res.status(401).json({ error: 'Session required' })
    }

    // Construct their status record
    const record = {
      $type: 'com.example.status',
      status: req.body?.status,
      updatedAt: new Date().toISOString(),
    }

    try {
      // Write the status record to the user's repository
      await agent.putRecord({
        repo: agent.accountDid,
        collection: 'com.example.status',
        rkey: 'self',
        record,
      })
    } catch (err) {
      ctx.logger.warn({ err }, 'failed to write record')
      return res.status(500).json({ error: 'Failed to write record' })
    }

    res.status(200).json({})
  })
)
```

Now in our homepage we can list out the status buttons:

```html
<!-- src/pages/home.ts -->
<div class="status-options">
  ${['👍', '🦋', '🥳', /*...*/].map(status => html`
    <div class="status-option" data-value="${status}">
      ${status}
    </div>`
  )}
</div>
```

And write some client-side javascript to submit the status on click:

```javascript
/* src/pages/public/home.js */
Array.from(document.querySelectorAll('.status-option'), (el) => {
  el.addEventListener('click', async (ev) => {
    const res = await fetch('/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: el.dataset.value }),
    })
    const body = await res.json()
    if (!body?.error) {
      location.reload()
    }
  })
})
```

## Step 5. Creating a custom "status" schema

The collections are typed, meaning that they have a defined schema. The `app.bsky.actor.profile` type definition [can be found here](https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/actor/profile.json).

Anybody can create a new schema using the [Lexicon](#todo) language, which is very similar to [JSON-Schema](#todo). The schemas use [reverse-DNS IDs](#todo) which indicate ownership, but for this demo app we're going to use `com.example` which is safe for non-production software.

> ### Why create a schema?
>
> Schemas help other applications understand the data your app is creating. By publishing your schemas, you enable compatibility and reduce the chances of bad data affecting your app.

Let's create our schema in the `/lexicons` folder of our codebase. You can [read more about how to define schemas here](#todo).

```json
/* lexicons/status.json */
{
  "lexicon": 1,
  "id": "com.example.status",
  "defs": {
    "main": {
      "type": "record",
      "key": "literal:self",
      "record": {
        "type": "object",
        "required": ["status", "updatedAt"],
        "properties": {
          "status": {
            "type": "string",
            "minLength": 1,
            "maxGraphemes": 1,
            "maxLength": 32
          },
          "updatedAt": {
            "type": "string",
            "format": "datetime"
          }
        }
      }
    }
  }
}
```

Now let's run some code-generation using our schema:

```bash
./node_modules/.bin/lex gen-server ./src/lexicon ./lexicons/*
```

This will produce Typescript interfaces as well as runtime validation functions that we can use in our `POST /status` route:

```typescript
/** src/routes.ts **/
import * as Status from '#/lexicon/types/com/example/status'
// ...
// "Set status" handler
router.post(
  '/status',
  handler(async (req, res) => {
    // ...

    // Construct & validate their status record
    const record = {
      $type: 'com.example.status',
      status: req.body?.status,
      updatedAt: new Date().toISOString(),
    }
    if (!Status.validateRecord(record).success) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // ...
  })
)
```

## Step 6. Listening to the firehose

So far, we have:

- Logged in via OAuth
- Created a custom schema
- Read & written records for the logged in user

Now we want to fetch the status records from other users.

Remember how we referred to our app as being like a Google, crawling around the repos to get their records? One advantage we have in the AT Protocol is that each repo publishes an event log of their updates.

```
┌──────┐                                       
│ REPO │  Event stream                                     
├──────┘                                       
│   ┌───────────────────────────────────────────┐
├───┼  1 PUT /com.example.status/self           │
│   └───────────────────────────────────────────┘
│   ┌───────────────────────────────────────────┐
├───┼  2 DEL /app.bsky.feed.post/3l244rmrxjx2v  │
│   └───────────────────────────────────────────┘
│   ┌───────────────────────────────────────────┐
├───┼  3 PUT /app.bsky.actor/self               │
▼   └───────────────────────────────────────────┘
```

Using a [Relay service](#todo) we can listen to an aggregated firehose of these events across all users in the network. In our case what we're looking for are valid `com.example.status` records.


```typescript
/** src/firehose.ts **/
import * as Status from '#/lexicon/types/com/example/status'
// ...
const firehose = new Firehose({})

for await (const evt of firehose.run()) {
  // Watch for write events
  if (evt.event === 'create' || evt.event === 'update') {
    const record = evt.record

    // If the write is a valid status update
    if (
      evt.collection === 'com.example.status' &&
      Status.isRecord(record) &&
      Status.validateRecord(record).success
    ) {
      // Store the status
      // TODO
    }
  }
}
```

Let's create a SQLite table to store these statuses:

```typescript
/** src/db.ts **/
// Create our statuses table
await db.schema
  .createTable('status')
  .addColumn('authorDid', 'varchar', (col) => col.primaryKey())
  .addColumn('status', 'varchar', (col) => col.notNull())
  .addColumn('updatedAt', 'varchar', (col) => col.notNull())
  .addColumn('indexedAt', 'varchar', (col) => col.notNull())
  .execute()
```

Now we can write these statuses into our database as they arrive from the firehose:

```typescript
/** src/firehose.ts **/
// If the write is a valid status update
if (
  evt.collection === 'com.example.status' &&
  Status.isRecord(record) &&
  Status.validateRecord(record).success
) {
  // Store the status in our SQLite
  await db
    .insertInto('status')
    .values({
      authorDid: evt.author,
      status: record.status,
      updatedAt: record.updatedAt,
      indexedAt: new Date().toISOString(),
    })
    .onConflict((oc) =>
      oc.column('authorDid').doUpdateSet({
        status: record.status,
        updatedAt: record.updatedAt,
        indexedAt: new Date().toISOString(),
      })
    )
    .execute()
}
```

You can almost think of information flowing in a loop:

```
       ┌─────Repo put─────┐
       │                  ▼
┌──────┴─────┐      ┌───────────┐
│ App server │      │ User repo │
└────────────┘      └─────┬─────┘
       ▲                  │
       └────Event log─────┘
```

Why read from the event log? Because there are other apps in the network that will write the records we're interested in. By subscribing to the event log, we ensure that we catch all the data we're interested in -- including data published by other apps.

## Step 7. Listing the latest statuses

Now that we have statuses populating our SQLite, we can produce a timeline of status updates by users. We also use a [DID](#todo)-to-handle resolver so we can show a nice username with the statuses:

```typescript
/** src/routes.ts **/
// Homepage
router.get(
  '/',
  handler(async (req, res) => {
    // ...

    // Fetch data stored in our SQLite
    const statuses = await db
      .selectFrom('status')
      .selectAll()
      .orderBy('indexedAt', 'desc')
      .limit(10)
      .execute()

    // Map user DIDs to their domain-name handles
    const didHandleMap = await resolver.resolveDidsToHandles(
      statuses.map((s) => s.authorDid)
    )

    // ...
  })
)
```

Our HTML can now list these status records:

```html
<!-- src/pages/home.ts -->
${statuses.map((status, i) => {
  const handle = didHandleMap[status.authorDid] || status.authorDid
  const date = ts(status)
  return html`
    <div class="status-line">
      <div>
        <div class="status">${status.status}</div>
      </div>
      <div class="desc">
        <a class="author" href="https://bsky.app/profile/${handle}">@${handle}</a>
        was feeling ${status.status} on ${status.indexedAt}.
      </div>
    </div>
  `
})}
```

## Step 8. Optimistic updates

As a final optimization, let's introduce "optimistic updates." Remember the information flow loop with the repo write and the event log? Since we're updating our users' repos locally, we can short-circuit that flow to our own database:

```
       ┌───Repo put──┬──────┐
       │             │      ▼
┌──────┴─────┐       │  ┌───────────┐
│ App server │◄──────┘  │ User repo │
└────────────┘          └───┬───────┘
       ▲                    │        
       └────Event log───────┘        
```

This is an important optimization to make, because it ensures that the user sees their own changes while using your app. When the event eventually arrives from the firehose, we just discard it since we already have it saved locally.

To do this, we just update `POST /status` to include an additional write to our SQLite DB:

```typescript
/** src/routes.ts **/
// "Set status" handler
router.post(
  '/status',
  handler(async (req, res) => {
    // ...

    try {
      // Write the status record to the user's repository
      await agent.putRecord({
        repo: agent.accountDid,
        collection: 'com.example.status',
        rkey: 'self',
        record,
      })
    } catch (err) {
      ctx.logger.warn({ err }, 'failed to write record')
      return res.status(500).json({ error: 'Failed to write record' })
    }

    try {
      // Optimistically update our SQLite <-- HERE!
      await ctx.db
        .insertInto('status')
        .values({
          authorDid: agent.accountDid,
          status: record.status,
          updatedAt: record.updatedAt,
          indexedAt: new Date().toISOString(),
        })
        .onConflict((oc) =>
          oc.column('authorDid').doUpdateSet({
            status: record.status,
            updatedAt: record.updatedAt,
            indexedAt: new Date().toISOString(),
          })
        )
        .execute()
    } catch (err) {
      ctx.logger.warn(
        { err },
        'failed to update computed view; ignoring as it should be caught by the firehose'
      )
    }

    res.status(200).json({})
  })
)
```

You'll notice this code looks almost exactly like what we're doing in `firehose.ts`.

## Next steps

TODO


