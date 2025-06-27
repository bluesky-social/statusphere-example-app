import { Agent } from '@atproto/api'
import { TID } from '@atproto/common'
import { OAuthResolverError } from '@atproto/oauth-client-node'
import express, { Request, Response } from 'express'
import { getIronSession } from 'iron-session'
import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http'
import path from 'node:path'

import type { AppContext } from '#/context'
import { env } from '#/env'
import * as Profile from '#/lexicon/types/app/bsky/actor/profile'
import * as Status from '#/lexicon/types/xyz/statusphere/status'
import { handler } from '#/lib/http'
import { ifString } from '#/lib/util'
import { page } from '#/lib/view'
import { home } from '#/pages/home'
import { login } from '#/pages/login'

// Max age, in seconds, for static routes and assets
const MAX_AGE = env.NODE_ENV === 'production' ? 60 : 0

type Session = { did?: string }

// Helper function to get the Atproto Agent for the active session
async function getSessionAgent(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
) {
  const session = await getIronSession<Session>(req, res, {
    cookieName: 'sid',
    password: env.COOKIE_SECRET,
  })
  if (!session.did) return null
  try {
    const oauthSession = await ctx.oauthClient.restore(session.did)
    return oauthSession ? new Agent(oauthSession) : null
  } catch (err) {
    ctx.logger.warn({ err }, 'oauth restore failed')
    await session.destroy()
    return null
  }
}

export const createRouter = (ctx: AppContext): RequestListener => {
  const router = express()

  // Static assets
  router.use(
    '/public',
    express.static(path.join(__dirname, 'pages', 'public'), {
      maxAge: MAX_AGE * 1000,
    }),
  )

  // OAuth metadata
  router.get(
    '/oauth-client-metadata.json',
    handler((req: Request, res: Response) => {
      res.setHeader('cache-control', `max-age=${MAX_AGE}, public`)
      res.json(ctx.oauthClient.clientMetadata)
    }),
  )

  // Public keys
  router.get(
    '/.well-known/jwks.json',
    handler((req: Request, res: Response) => {
      res.setHeader('cache-control', `max-age=${MAX_AGE}, public`)
      res.json(ctx.oauthClient.jwks)
    }),
  )

  // OAuth callback to complete session creation
  router.get(
    '/oauth/callback',
    handler(async (req: Request, res: Response) => {
      res.setHeader('cache-control', 'no-store')

      const params = new URLSearchParams(req.originalUrl.split('?')[1])
      try {
        // Load the session cookie
        const session = await getIronSession<Session>(req, res, {
          cookieName: 'sid',
          password: env.COOKIE_SECRET,
        })

        // If the user is already signed in, destroy the old credentials
        if (session.did) {
          try {
            const oauthSession = await ctx.oauthClient.restore(session.did)
            if (oauthSession) oauthSession.signOut()
          } catch (err) {
            ctx.logger.warn({ err }, 'oauth restore failed')
          }
        }

        // Complete the OAuth flow
        const oauth = await ctx.oauthClient.callback(params)

        // Update the session cookie
        session.did = oauth.session.did
        await session.save()
      } catch (err) {
        ctx.logger.error({ err }, 'oauth callback failed')
        return res.redirect('/?error')
      }
      return res.redirect('/')
    }),
  )

  // Login page
  router.get(
    '/login',
    handler(async (req: Request, res: Response) => {
      res.setHeader('cache-control', `max-age=${MAX_AGE}, public`)

      return res.type('html').send(page(login({})))
    }),
  )

  // Login handler
  router.post(
    '/login',
    express.urlencoded(),
    handler(async (req: Request, res: Response) => {
      res.setHeader('cache-control', 'no-store')

      const input = ifString(req.body.input)

      // Validate
      if (!input) {
        return res.type('html').send(page(login({ error: 'invalid input' })))
      }

      // @NOTE "input" can be a handle, a DID or a service URL (PDS).

      // Initiate the OAuth flow
      try {
        const url = await ctx.oauthClient.authorize(input, {
          scope: 'atproto transition:generic',
        })
        res.redirect(url.toString())
      } catch (err) {
        ctx.logger.error({ err }, 'oauth authorize failed')

        const error =
          err instanceof OAuthResolverError
            ? err.message
            : "couldn't initiate login"

        return res.type('html').send(page(login({ error })))
      }
    }),
  )

  // Signup
  router.get(
    '/signup',
    handler(async (req: Request, res: Response) => {
      res.setHeader('cache-control', `max-age=${MAX_AGE}, public`)

      try {
        const service = env.PDS_URL ?? 'https://bsky.social'
        const url = await ctx.oauthClient.authorize(service, {
          scope: 'atproto transition:generic',
        })
        res.redirect(url.toString())
      } catch (err) {
        ctx.logger.error({ err }, 'oauth authorize failed')
        res.type('html').send(
          page(
            login({
              error:
                err instanceof OAuthResolverError
                  ? err.message
                  : "couldn't initiate login",
            }),
          ),
        )
      }
    }),
  )

  // Logout handler
  router.post(
    '/logout',
    handler(async (req: Request, res: Response) => {
      // Never store this route
      res.setHeader('cache-control', 'no-store')

      const session = await getIronSession<Session>(req, res, {
        cookieName: 'sid',
        password: env.COOKIE_SECRET,
      })

      // Revoke credentials on the server
      if (session.did) {
        try {
          const oauthSession = await ctx.oauthClient.restore(session.did)
          if (oauthSession) await oauthSession.signOut()
        } catch (err) {
          ctx.logger.warn({ err }, 'Failed to revoke credentials')
        }
      }

      session.destroy()

      return res.redirect('/')
    }),
  )

  // Homepage
  router.get(
    '/',
    handler(async (req: Request, res: Response) => {
      // Prevent caching of this page when the credentials change
      res.setHeader('Vary', 'Cookie')

      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx)

      // Fetch data stored in our SQLite
      const statuses = await ctx.db
        .selectFrom('status')
        .selectAll()
        .orderBy('indexedAt', 'desc')
        .limit(10)
        .execute()
      const myStatus = agent
        ? await ctx.db
            .selectFrom('status')
            .selectAll()
            .where('authorDid', '=', agent.assertDid)
            .orderBy('indexedAt', 'desc')
            .executeTakeFirst()
        : undefined

      // Map user DIDs to their domain-name handles
      const didHandleMap = await ctx.resolver.resolveDidsToHandles(
        statuses.map((s) => s.authorDid),
      )

      if (!agent) {
        // Serve the logged-out view
        return res.type('html').send(page(home({ statuses, didHandleMap })))
      }

      // Make sure this page does not get cached in public caches (proxies)
      res.setHeader('cache-control', 'private')

      // Fetch additional information about the logged-in user
      const profileResponse = await agent.com.atproto.repo
        .getRecord({
          repo: agent.assertDid,
          collection: 'app.bsky.actor.profile',
          rkey: 'self',
        })
        .catch(() => undefined)

      const profileRecord = profileResponse?.data

      const profile =
        profileRecord &&
        Profile.isRecord(profileRecord.value) &&
        Profile.validateRecord(profileRecord.value).success
          ? profileRecord.value
          : {}

      // Serve the logged-in view
      res
        .type('html')
        .send(page(home({ statuses, didHandleMap, profile, myStatus })))
    }),
  )

  // "Set status" handler
  router.post(
    '/status',
    express.urlencoded(),
    handler(async (req: Request, res: Response) => {
      // Never store this route
      res.setHeader('cache-control', 'no-store')

      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        return res
          .status(401)
          .type('html')
          .send('<h1>Error: Session required</h1>')
      }

      // Construct & validate their status record
      const rkey = TID.nextStr()
      const record = {
        $type: 'xyz.statusphere.status',
        status: req.body?.status,
        createdAt: new Date().toISOString(),
      }

      // Make sure the record generated from the input is valid
      if (!Status.validateRecord(record).success) {
        return res
          .status(400)
          .type('html')
          .send('<h1>Error: Invalid status</h1>')
      }

      let uri
      try {
        // Write the status record to the user's repository
        const res = await agent.com.atproto.repo.putRecord({
          repo: agent.assertDid,
          collection: 'xyz.statusphere.status',
          rkey,
          record,
          validate: false,
        })
        uri = res.data.uri
      } catch (err) {
        ctx.logger.warn({ err }, 'failed to write record')
        return res
          .status(500)
          .type('html')
          .send('<h1>Error: Failed to write record</h1>')
      }

      try {
        // Optimistically update our SQLite
        // This isn't strictly necessary because the write event will be
        // handled in #/firehose/ingestor.ts, but it ensures that future reads
        // will be up-to-date after this method finishes.
        await ctx.db
          .insertInto('status')
          .values({
            uri,
            authorDid: agent.assertDid,
            status: record.status,
            createdAt: record.createdAt,
            indexedAt: new Date().toISOString(),
          })
          .execute()
      } catch (err) {
        ctx.logger.warn(
          { err },
          'failed to update computed view; ignoring as it should be caught by the firehose',
        )
      }

      return res.redirect('/')
    }),
  )

  return router
}
