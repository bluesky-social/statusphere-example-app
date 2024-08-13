import path from 'node:path'
import { OAuthResolverError } from '@atproto/oauth-client-node'
import { isValidHandle } from '@atproto/syntax'
import express from 'express'
import { createSession, destroySession, getSession } from '#/auth/session'
import type { AppContext } from '#/config'
import { home } from '#/pages/home'
import { login } from '#/pages/login'
import { page } from '#/view'
import { handler } from './util'
import * as Status from '#/lexicon/types/com/example/status'

export const createRouter = (ctx: AppContext) => {
  const router = express.Router()

  router.use('/public', express.static(path.join(__dirname, '..', 'public')))

  router.get(
    '/client-metadata.json',
    handler((_req, res) => {
      return res.json(ctx.oauthClient.clientMetadata)
    })
  )

  router.get(
    '/oauth/callback',
    handler(async (req, res) => {
      const params = new URLSearchParams(req.originalUrl.split('?')[1])
      try {
        const { agent } = await ctx.oauthClient.callback(params)
        await createSession(req, res, agent.accountDid)
      } catch (err) {
        ctx.logger.error({ err }, 'oauth callback failed')
        return res.redirect('/?error')
      }
      return res.redirect('/')
    })
  )

  router.get(
    '/login',
    handler(async (_req, res) => {
      return res.type('html').send(page(login({})))
    })
  )

  router.post(
    '/login',
    handler(async (req, res) => {
      const handle = req.body?.handle
      if (typeof handle !== 'string' || !isValidHandle(handle)) {
        return res.type('html').send(page(login({ error: 'invalid handle' })))
      }
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

  router.post(
    '/logout',
    handler(async (req, res) => {
      await destroySession(req, res)
      return res.redirect('/')
    })
  )

  router.get(
    '/',
    handler(async (req, res) => {
      const session = await getSession(req, res)
      const agent =
        session &&
        (await ctx.oauthClient.restore(session.did).catch(async (err) => {
          ctx.logger.warn({ err }, 'oauth restore failed')
          await destroySession(req, res)
          return null
        }))
      const statuses = await ctx.db
        .selectFrom('status')
        .selectAll()
        .orderBy('indexedAt', 'desc')
        .limit(10)
        .execute()
      const didHandleMap = await ctx.resolver.resolveDidsToHandles(
        statuses.map((s) => s.authorDid)
      )
      if (!agent) {
        return res.type('html').send(page(home({ statuses, didHandleMap })))
      }
      const { data: profile } = await agent.getProfile({ actor: session.did })
      return res
        .type('html')
        .send(page(home({ statuses, didHandleMap, profile })))
    })
  )

  router.post(
    '/status',
    handler(async (req, res) => {
      const session = await getSession(req, res)
      const agent =
        session &&
        (await ctx.oauthClient.restore(session.did).catch(async (err) => {
          ctx.logger.warn({ err }, 'oauth restore failed')
          await destroySession(req, res)
          return null
        }))
      if (!agent) {
        return res.status(401).json({ error: 'Session required' })
      }

      const record = {
        $type: 'com.example.status',
        status: req.body?.status,
        updatedAt: new Date().toISOString(),
      }
      if (!Status.validateRecord(record).success) {
        return res.status(400).json({ error: 'Invalid status' })
      }

      try {
        await agent.com.atproto.repo.putRecord({
          repo: agent.accountDid,
          collection: 'com.example.status',
          rkey: 'self',
          record,
          validate: false,
        })
      } catch (err) {
        ctx.logger.warn({ err }, 'failed to write record')
        return res.status(500).json({ error: 'Failed to write record' })
      }

      try {
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

  return router
}
