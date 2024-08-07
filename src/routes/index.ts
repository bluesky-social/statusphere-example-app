import express from 'express'
import type { AppContext } from '#/config'
import { home } from '#/pages/home'
import { page } from '#/view'
import { handler } from './util'

export const createRouter = (ctx: AppContext) => {
  const router = express.Router()

  router.get(
    '/',
    handler(async (req, res) => {
      const posts = await ctx.db.selectFrom('post').selectAll().orderBy('indexedAt', 'desc').limit(10).execute()
      return res.type('html').send(page(home(posts)))
    }),
  )

  return router
}
