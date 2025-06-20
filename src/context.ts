import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { Firehose } from '@atproto/sync'
import { pino } from 'pino'

import { createOAuthClient } from '#/auth/client'
import { createDb, Database } from '#/db'
import { createIngester } from '#/ingester'
import { env } from '#/env'

/**
 * Application state passed to the router and elsewhere
 */
export type AppContext = {
  db: Database
  ingester: Firehose
  logger: pino.Logger
  oauthClient: NodeOAuthClient
  identityResolver: NodeOAuthClient['identityResolver']
}

export async function createAppContext(): Promise<AppContext> {
  const db = await createDb()
  const oauthClient = await createOAuthClient(db)
  const ingester = createIngester(db)
  const logger = pino({ name: 'server', level: env.LOG_LEVEL })

  return {
    db,
    ingester,
    logger,
    oauthClient,
    identityResolver: oauthClient.identityResolver,
  }
}
