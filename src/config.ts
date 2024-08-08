import type { OAuthClient } from '@atproto/oauth-client-node'
import type pino from 'pino'
import type { Database } from '#/db'
import type { Ingester } from '#/firehose/ingester'

export type AppContext = {
  db: Database
  ingester: Ingester
  logger: pino.Logger
  oauthClient: OAuthClient
}
