'use server'

import assert from 'node:assert'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getIronSession } from 'iron-session'
import { env } from '#/env'
import { AppContext } from '#/index'

export type Session = { did: string }

export async function createSession(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  did: string
) {
  const session = await getSessionRaw(req, res)
  assert(!session.did, 'session already exists')
  session.did = did
  await session.save()
  return { did: session.did }
}

export async function destroySession(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) {
  const session = await getSessionRaw(req, res)
  await session.destroy()
  return null
}

export async function getSession(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) {
  const session = await getSessionRaw(req, res)
  if (!session.did) return null
  return { did: session.did }
}

export async function getSessionAgent(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext
) {
  const session = await getSessionRaw(req, res)
  if (!session.did) return null
  return await ctx.oauthClient.restore(session.did).catch(async (err) => {
    ctx.logger.warn({ err }, 'oauth restore failed')
    await destroySession(req, res)
    return null
  })
}

async function getSessionRaw(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) {
  return await getIronSession<Session>(req, res, {
    cookieName: 'sid',
    password: env.COOKIE_SECRET,
  })
}
