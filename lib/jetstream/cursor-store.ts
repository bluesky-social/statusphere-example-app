import type { CursorStore } from "bsky-jetstream-preview";
import { getDb } from "@/lib/db";

const CURSOR_KEY = "jetstream";

export class SqliteCursorStore implements CursorStore {
  async load(): Promise<number | undefined> {
    const row = await getDb()
      .selectFrom("ingest_cursor")
      .select("seq")
      .where("key", "=", CURSOR_KEY)
      .executeTakeFirst();
    return row?.seq;
  }

  async save(seq: number): Promise<void> {
    await getDb()
      .insertInto("ingest_cursor")
      .values({ key: CURSOR_KEY, seq })
      .onConflict((oc) => oc.column("key").doUpdateSet({ seq }))
      .execute();
  }
}
