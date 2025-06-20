import { Agent } from '@atproto/api'
import { TID } from '@atproto/common'
import { OAuthResolverError } from '@atproto/oauth-client-node'
import express, { Request, Response } from 'express'
import { getIronSession } from 'iron-session'
import assert from 'node:assert'
import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http'
import path from 'node:path'

import type { AppContext } from '#/context'
import * as Profile from '#/lexicon/types/app/bsky/actor/profile'
import * as Status from '#/lexicon/types/xyz/statusphere/status'
import { env } from '#/env'
import { handler } from '#/lib/http'
import { page } from '#/lib/view'
import { home, STATUS_OPTIONS } from '#/pages/home'
import { login } from '#/pages/login'
import { ifString } from './lib/util'

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
    // force rotating the credentials if the request has a no-cache header
    const refresh = req.headers['cache-control']?.includes('no-cache') || 'auto'

    const oauthSession = await ctx.oauthClient.restore(session.did, refresh)
    return oauthSession ? new Agent(oauthSession) : null
  } catch (err) {
    ctx.logger.warn({ err }, 'oauth restore failed')
    await session.destroy()
    return null
  }
}

export function createRouter(ctx: AppContext): RequestListener {
  const router = express()

  // Static assets
  router.use('/public', express.static(path.join(__dirname, 'pages', 'public')))

  // OAuth metadata
  router.get(
    '/oauth-client-metadata.json',
    handler((req: Request, res: Response) => {
      res.json(ctx.oauthClient.clientMetadata)
    }),
  )

  // Public keys
  router.get(
    '/.well-known/jwks.json',
    handler((req: Request, res: Response) => {
      res.json(ctx.oauthClient.jwks)
    }),
  )

  // OAuth callback to complete session creation
  router.get(
    '/oauth/callback',
    handler(async (req: Request, res: Response) => {
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

        // Redirect to the homepage
        return res.redirect('/')
      } catch (err) {
        ctx.logger.error({ err }, 'oauth callback failed')
        return res.redirect('/?error')
      }
    }),
  )

  // Login page
  router.get(
    '/login',
    handler((req: Request, res: Response) => {
      res.type('html').send(page(login({})))
    }),
  )

  // Login handler
  router.post(
    '/login',
    express.urlencoded({ extended: true }),
    handler(async (req: Request, res: Response) => {
      const input = ifString(req.body.input)

      // Validate
      if (!input) {
        res.type('html').send(page(login({ error: 'invalid input' })))
        return
      }

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

        res.type('html').send(page(login({ error })))
      }
    }),
  )

  // Signup
  router.get(
    '/signup',
    handler(async (req: Request, res: Response) => {
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
      const error = ifString(req.query.error)

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

      // Map (unique) user DIDs to their domain-name handles
      const uniqueDids = [...new Set(statuses.map((s) => s.authorDid))]

      const didHandleMap: Record<string, string | undefined> =
        Object.fromEntries(
          await Promise.all(
            uniqueDids.map((did) =>
              ctx.identityResolver.resolve(did).then(
                (r) => [did, r.handle],
                () => [did, undefined],
              ),
            ),
          ),
        )

      if (!agent) {
        // Serve the logged-out view
        res.type('html').send(page(home({ error, statuses, didHandleMap })))
        return
      }

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
        .send(page(home({ error, statuses, didHandleMap, profile, myStatus })))
    }),
  )

  // "Set status" handler
  router.post(
    '/status',
    express.urlencoded({ extended: true }),
    handler(async (req: Request, res: Response) => {
      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        res.redirect(`/login}`)
        return
      }

      try {
        const status = req.body?.status
        if (typeof status !== 'string' || !STATUS_OPTIONS.includes(status)) {
          throw new Error('Invalid status')
        }

        // Construct & validate their status record
        const rkey = TID.nextStr()
        const record = {
          $type: 'xyz.statusphere.status',
          status,
          createdAt: new Date().toISOString(),
        }

        if (!Status.validateRecord(record).success) {
          res.status(400).type('html').send('<h1>Error: Invalid status</h1>')
          return
        }

        // Write the status record to the user's repository
        let uri
        try {
          const res = await agent.com.atproto.repo.putRecord({
            repo: agent.assertDid,
            collection: 'xyz.statusphere.status',
            rkey,
            record,
            validate: false,
          })
          uri = res.data.uri
        } catch (err) {
          ctx.logger.error({ err }, 'failed to write record')
          res
            .status(500)
            .type('html')
            .send('<h1>Error: Failed to write record</h1>')
          return
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

        res.redirect('/')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        res.redirect(`/?error=${encodeURIComponent(message)}`)
      }
    }),
  )

  return router
}
