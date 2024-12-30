import events from 'node:events'
import type http from 'node:http'
import express, { type Express } from 'express'
import { pino } from 'pino'
import type { OAuthClient } from '@atproto/oauth-client-node'
import { Firehose } from '@atproto/sync'
import { createDb, migrateToLatest } from '#/db'
import { env } from '#/lib/env'
import { createIngester } from '#/ingester'
import { createRouter } from '#/routes'
import { createClient } from '#/auth/client'
import { createBidirectionalResolver, createIdResolver, BidirectionalResolver } from '#/id-resolver'
import type { Database } from '#/db'
import { MongoClient } from 'mongodb'
import { IdResolver, MemoryCache } from '@atproto/identity'

// Application state passed to the router and elsewhere
export type AppContext = {
  db: Database
  ingester: Firehose
  logger: pino.Logger
  oauthClient: OAuthClient
  resolver: BidirectionalResolver
  dbm: MongoClient
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

    // Set up the SQLite database
    const db = createDb(DB_PATH)
    await migrateToLatest(db)
    // Set up the mongodb database
    const dbm = new MongoClient(env.MONGO_URL)
    await dbm.connect()
    console.log('Connected successfully to the mongodb server')
    const dbName = dbm.db('statusphere')
    console.log(`Database '${dbName.databaseName}' created!`)
    const collection = dbName.collection('status')
    console.log(`Collection '${collection.collectionName}' created!`)
    const insertResult = await collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }])
    console.log('Inserted documents =>', insertResult)

    // Create the atproto utilities
    const oauthClient = await createClient(db)
    const baseIdResolver = createIdResolver()
    const ingester = createIngester(db, baseIdResolver, dbm)
    const resolver = createBidirectionalResolver(baseIdResolver)
    const ctx = {
      db,
      ingester,
      logger,
      oauthClient,
      resolver,
      dbm,
    }

    // Subscribe to events on the firehose
    ingester.start()

    // Create our server
    const app: Express = express()
    app.set('trust proxy', true)

    // Routes & middlewares
    const router = createRouter(ctx)
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(router)
    app.use((_req, res) => res.sendStatus(404))

    // Bind our server to the port
    const server = app.listen(env.PORT)
    await events.once(server, 'listening')
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`)

    return new Server(app, server, ctx)
  }

  async close() {
    this.ctx.logger.info('sigint received, shutting down')
    await this.ctx.ingester.destroy()
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
