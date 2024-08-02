import express from 'express'
import type { AppContext } from '#/config'
import { handler } from './util'

export const createRouter = (ctx: AppContext) => {
  const router = express.Router()

  router.get(
    '/',
    handler(async (req, res) => {
      const posts = await ctx.db.selectFrom('post').selectAll().orderBy('indexedAt', 'desc').limit(10).execute()
      const postTexts = posts.map((row) => row.text)
      res.json(postTexts)
    }),
  )

  return router
}
