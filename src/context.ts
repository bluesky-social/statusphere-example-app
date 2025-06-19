import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { Firehose } from '@atproto/sync'
import { pino } from 'pino'

import { createOAuthClient } from '#/auth/client'
import { Database } from '#/db'
import { createDb } from '#/db'
import {
  BidirectionalResolver,
  createBidirectionalResolver,
  createIdResolver,
} from '#/id-resolver'
import { createIngester } from '#/ingester'

/**
 * Application state passed to the router and elsewhere
 */
export type AppContext = {
  db: Database
  ingester: Firehose
  logger: pino.Logger
  oauthClient: NodeOAuthClient
  resolver: BidirectionalResolver
}

export async function createAppContext(): Promise<AppContext> {
  const logger = pino({ name: 'server start' })

  const db = await createDb()
  const oauthClient = await createOAuthClient(db)
  const baseIdResolver = createIdResolver()
  const ingester = createIngester(db, baseIdResolver)
  const resolver = createBidirectionalResolver(baseIdResolver)

  return {
    db,
    ingester,
    logger,
    oauthClient,
    resolver,
  }
}
