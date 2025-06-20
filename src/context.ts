import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { Firehose } from '@atproto/sync'
import { pino } from 'pino'

import { createOAuthClient } from '#/auth/client'
import { createDb, Database, migrateToLatest } from '#/db'
import { createIngester } from '#/ingester'
import { env } from '#/env'
import {
  BidirectionalResolver,
  createBidirectionalResolver,
} from '#/id-resolver'

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
  const db = createDb(env.DB_PATH)
  await migrateToLatest(db)
  const oauthClient = await createOAuthClient(db)
  const ingester = createIngester(db)
  const logger = pino({ name: 'server', level: env.LOG_LEVEL })
  const resolver = createBidirectionalResolver(oauthClient)

  return {
    db,
    ingester,
    logger,
    oauthClient,
    resolver,
  }
}
