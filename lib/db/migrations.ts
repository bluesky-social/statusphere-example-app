import { Kysely } from "kysely";
import { Migrator } from "kysely/migration";
import type { Migration } from "kysely/migration";
import { getDb } from ".";

const migrations: Record<string, Migration> = {
  "001": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("auth_state")
        .addColumn("key", "text", (col) => col.primaryKey())
        .addColumn("value", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("auth_session")
        .addColumn("key", "text", (col) => col.primaryKey())
        .addColumn("value", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("account")
        .addColumn("did", "text", (col) => col.primaryKey())
        .addColumn("handle", "text", (col) => col.notNull())
        .addColumn("active", "integer", (col) => col.notNull().defaultTo(1))
        .execute();

      await db.schema
        .createTable("status")
        .addColumn("uri", "text", (col) => col.primaryKey())
        .addColumn("authorDid", "text", (col) => col.notNull())
        .addColumn("status", "text", (col) => col.notNull())
        .addColumn("createdAt", "text", (col) => col.notNull())
        .addColumn("indexedAt", "text", (col) => col.notNull())
        .addColumn("current", "integer", (col) => col.notNull().defaultTo(0))
        .execute();

      await db.schema
        .createIndex("status_current_idx")
        .on("status")
        .columns(["current", "indexedAt"])
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable("status").execute();
      await db.schema.dropTable("account").execute();
      await db.schema.dropTable("auth_session").execute();
      await db.schema.dropTable("auth_state").execute();
    },
  },
  "002": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("ingest_cursor")
        .addColumn("key", "text", (col) => col.primaryKey())
        .addColumn("seq", "integer", (col) => col.notNull())
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable("ingest_cursor").execute();
    },
  },
};

export function getMigrator() {
  const db = getDb();
  return new Migrator({
    db,
    provider: {
      getMigrations: async () => migrations,
    },
  });
}
