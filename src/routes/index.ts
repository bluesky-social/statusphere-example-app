import { OAuthResolverError } from '@atproto/oauth-client-node'
import { isValidHandle } from '@atproto/syntax'
import express from 'express'
import { createSession, destroySession, getSession } from '#/auth/session'
import type { AppContext } from '#/config'
import { home } from '#/pages/home'
import { login } from '#/pages/login'
import { page } from '#/view'
import { handler } from './util'

export const createRouter = (ctx: AppContext) => {
  const router = express.Router()

  router.get(
    '/client-metadata.json',
    handler((_req, res) => {
      return res.json(ctx.oauthClient.clientMetadata)
    }),
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
    }),
  )

  router.get(
    '/login',
    handler(async (_req, res) => {
      return res.type('html').send(page(login({})))
    }),
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
              error: err instanceof OAuthResolverError ? err.message : "couldn't initiate login",
            }),
          ),
        )
      }
    }),
  )

  router.post(
    '/logout',
    handler(async (req, res) => {
      await destroySession(req, res)
      return res.redirect('/')
    }),
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
      const posts = await ctx.db.selectFrom('post').selectAll().orderBy('indexedAt', 'desc').limit(10).execute()
      if (!agent) {
        return res.type('html').send(page(home({ posts })))
      }
      const { data: profile } = await agent.getProfile({ actor: session.did })
      return res.type('html').send(page(home({ posts, profile })))
    }),
  )

  return router
}
