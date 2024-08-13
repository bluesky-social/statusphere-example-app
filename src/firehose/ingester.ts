import type { Database } from '#/db'
import { Firehose } from '#/firehose/firehose'
import * as Status from '#/lexicon/types/com/example/status'

export class Ingester {
  firehose: Firehose | undefined
  constructor(public db: Database) {}

  async start() {
    const firehose = new Firehose({})

    for await (const evt of firehose.run()) {
      // Watch for write events
      if (evt.event === 'create' || evt.event === 'update') {
        const record = evt.record

        // If the write is a valid status update
        if (
          evt.collection === 'com.example.status' &&
          Status.isRecord(record) &&
          Status.validateRecord(record).success
        ) {
          // Store the status in our SQLite
          await this.db
            .insertInto('status')
            .values({
              authorDid: evt.author,
              status: record.status,
              updatedAt: record.updatedAt,
              indexedAt: new Date().toISOString(),
            })
            .onConflict((oc) =>
              oc.column('authorDid').doUpdateSet({
                status: record.status,
                updatedAt: record.updatedAt,
                indexedAt: new Date().toISOString(),
              })
            )
            .execute()
        }
      }
    }
  }

  destroy() {
    this.firehose?.destroy()
  }
}
