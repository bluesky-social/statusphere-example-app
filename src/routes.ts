import assert from 'node:assert'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { OAuthResolverError } from '@atproto/oauth-client-node'
import { isValidHandle } from '@atproto/syntax'
import { TID } from '@atproto/common'
import express from 'express'
import { getIronSession } from 'iron-session'
import type { AppContext } from '#/index'
import { home } from '#/pages/home'
import { login } from '#/pages/login'
import { env } from '#/lib/env'
import { page } from '#/lib/view'
import * as Status from '#/lexicon/types/com/example/status'
import * as Profile from '#/lexicon/types/app/bsky/actor/profile'

type Session = { did: string }

// Helper function for defining routes
const handler =
  (fn: express.Handler) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }

// Helper function to get the Atproto Agent for the active session
async function getSessionAgent(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext
) {
  const session = await getIronSession<Session>(req, res, {
    cookieName: 'sid',
    password: env.COOKIE_SECRET,
  })
  if (!session.did) return null
  return await ctx.oauthClient.restore(session.did).catch(async (err) => {
    ctx.logger.warn({ err }, 'oauth restore failed')
    await session.destroy()
    return null
  })
}

export const createRouter = (ctx: AppContext) => {
  const router = express.Router()

  // Static assets
  router.use('/public', express.static(path.join(__dirname, 'pages', 'public')))

  // OAuth metadata
  router.get(
    '/client-metadata.json',
    handler((_req, res) => {
      return res.json(ctx.oauthClient.clientMetadata)
    })
  )

  // OAuth callback to complete session creation
  router.get(
    '/oauth/callback',
    handler(async (req, res) => {
      const params = new URLSearchParams(req.originalUrl.split('?')[1])
      try {
        const { agent } = await ctx.oauthClient.callback(params)
        const session = await getIronSession<Session>(req, res, {
          cookieName: 'sid',
          password: env.COOKIE_SECRET,
        })
        assert(!session.did, 'session already exists')
        session.did = agent.accountDid
        await session.save()
      } catch (err) {
        ctx.logger.error({ err }, 'oauth callback failed')
        return res.redirect('/?error')
      }
      return res.redirect('/')
    })
  )

  // Login page
  router.get(
    '/login',
    handler(async (_req, res) => {
      return res.type('html').send(page(login({})))
    })
  )

  // Login handler
  router.post(
    '/login',
    handler(async (req, res) => {
      // Validate
      const handle = req.body?.handle
      if (typeof handle !== 'string' || !isValidHandle(handle)) {
        return res.type('html').send(page(login({ error: 'invalid handle' })))
      }

      // Initiate the OAuth flow
      try {
        const url = await ctx.oauthClient.authorize(handle)
        return res.redirect(url.toString())
      } catch (err) {
        ctx.logger.error({ err }, 'oauth authorize failed')
        return res.type('html').send(
          page(
            login({
              error:
                err instanceof OAuthResolverError
                  ? err.message
                  : "couldn't initiate login",
            })
          )
        )
      }
    })
  )

  // Logout handler
  router.post(
    '/logout',
    handler(async (req, res) => {
      const session = await getIronSession<Session>(req, res, {
        cookieName: 'sid',
        password: env.COOKIE_SECRET,
      })
      await session.destroy()
      return res.redirect('/')
    })
  )

  // Homepage
  router.get(
    '/',
    handler(async (req, res) => {
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
            .where('authorDid', '=', agent.accountDid)
            .orderBy('indexedAt', 'desc')
            .executeTakeFirst()
        : undefined

      // Map user DIDs to their domain-name handles
      const didHandleMap = await ctx.resolver.resolveDidsToHandles(
        statuses.map((s) => s.authorDid)
      )

      if (!agent) {
        // Serve the logged-out view
        return res.type('html').send(page(home({ statuses, didHandleMap })))
      }

      // Fetch additional information about the logged-in user
      const { data: profileRecord } = await agent.com.atproto.repo.getRecord({
        repo: agent.accountDid,
        collection: 'app.bsky.actor.profile',
        rkey: 'self',
      })
      const profile =
        Profile.isRecord(profileRecord.value) &&
        Profile.validateRecord(profileRecord.value).success
          ? profileRecord.value
          : {}

      // Serve the logged-in view
      return res.type('html').send(
        page(
          home({
            statuses,
            didHandleMap,
            profile,
            myStatus,
          })
        )
      )
    })
  )

  // "Set status" handler
  router.post(
    '/status',
    handler(async (req, res) => {
      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        return res.status(401).json({ error: 'Session required' })
      }

      // Construct & validate their status record
      const rkey = TID.nextStr()
      const record = {
        $type: 'com.example.status',
        status: req.body?.status,
        createdAt: new Date().toISOString(),
      }
      if (!Status.validateRecord(record).success) {
        return res.status(400).json({ error: 'Invalid status' })
      }

      let uri
      try {
        // Write the status record to the user's repository
        const res = await agent.com.atproto.repo.putRecord({
          repo: agent.accountDid,
          collection: 'com.example.status',
          rkey,
          record,
          validate: false,
        })
        uri = res.data.uri
      } catch (err) {
        ctx.logger.warn({ err }, 'failed to write record')
        return res.status(500).json({ error: 'Failed to write record' })
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
            authorDid: agent.accountDid,
            status: record.status,
            createdAt: record.createdAt,
            indexedAt: new Date().toISOString(),
          })
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

  return router
}
