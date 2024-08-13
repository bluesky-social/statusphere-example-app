import type { Kysely, Migration, MigrationProvider } from 'kysely'

const migrations: Record<string, Migration> = {}

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('did_cache')
      .addColumn('did', 'varchar', (col) => col.primaryKey())
      .addColumn('doc', 'varchar', (col) => col.notNull())
      .addColumn('updatedAt', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('status')
      .addColumn('authorDid', 'varchar', (col) => col.primaryKey())
      .addColumn('status', 'varchar', (col) => col.notNull())
      .addColumn('updatedAt', 'varchar', (col) => col.notNull())
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
    await db.schema.dropTable('did_cache').execute()
  },
}
