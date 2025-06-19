import SqliteDb from 'better-sqlite3'
import {
  Kysely,
  Migration,
  MigrationProvider,
  Migrator,
  SqliteDialect,
} from 'kysely'

import { env } from '#/env'

// Types

export type DatabaseSchema = {
  status: Status
  auth_session: AuthSession
  auth_state: AuthState
}

export type Status = {
  uri: string
  authorDid: string
  status: string
  createdAt: string
  indexedAt: string
}

export type AuthSession = {
  key: string
  session: AuthSessionJson
}

export type AuthState = {
  key: string
  state: AuthStateJson
}

type AuthStateJson = string

type AuthSessionJson = string

// Migrations

const migrations: Record<string, Migration> = {}

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('status')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('authorDid', 'varchar', (col) => col.notNull())
      .addColumn('status', 'varchar', (col) => col.notNull())
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('auth_session')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('session', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('auth_state')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('state', 'varchar', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('auth_state').execute()
    await db.schema.dropTable('auth_session').execute()
    await db.schema.dropTable('status').execute()
  },
}

// APIs

export async function createDb(options?: {
  /** @default true */
  migrate?: boolean
}): Promise<Database> {
  const db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(env.DB_PATH),
    }),
  })

  if (options?.migrate !== false) {
    const migrator = new Migrator({ db, provider: migrationProvider })
    const { error } = await migrator.migrateToLatest()
    if (error) throw error
  }

  return db
}

export type Database = Kysely<DatabaseSchema>
