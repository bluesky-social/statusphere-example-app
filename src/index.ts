import events from 'node:events'
import type http from 'node:http'
import express, { type Express } from 'express'
import { pino } from 'pino'
import type { OAuthClient } from '@atproto/oauth-client-node'

import { createDb, migrateToLatest } from '#/db'
import { env } from '#/lib/env'
import { Ingester } from '#/firehose/ingester'
import { createRouter } from '#/routes'
import { createClient } from '#/auth/client'
import { createResolver, Resolver } from '#/firehose/resolver'
import type { Database } from '#/db'

export type AppContext = {
  db: Database
  ingester: Ingester
  logger: pino.Logger
  oauthClient: OAuthClient
  resolver: Resolver
}

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public ctx: AppContext
  ) {}

  static async create() {
    const { NODE_ENV, HOST, PORT, DB_PATH } = env

    const logger = pino({ name: 'server start' })
    const db = createDb(DB_PATH)
    await migrateToLatest(db)
    const ingester = new Ingester(db)
    const oauthClient = await createClient(db)
    const resolver = createResolver()
    ingester.start()
    const ctx = {
      db,
      ingester,
      logger,
      oauthClient,
      resolver,
    }

    const app: Express = express()

    // Set the application to trust the reverse proxy
    app.set('trust proxy', true)

    // Middlewares
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Routes
    const router = createRouter(ctx)
    app.use(router)

    // Error handlers
    app.use((_req, res) => res.sendStatus(404))

    const server = app.listen(env.PORT)
    await events.once(server, 'listening')
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`)

    return new Server(app, server, ctx)
  }

  async close() {
    this.ctx.logger.info('sigint received, shutting down')
    this.ctx.ingester.destroy()
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info('server closed')
        resolve()
      })
    })
  }
}

const run = async () => {
  const server = await Server.create()

  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 10000).unref() // Force shutdown after 10s
    await server.close()
    process.exit()
  }

  process.on('SIGINT', onCloseSignal)
  process.on('SIGTERM', onCloseSignal)
}

run()
