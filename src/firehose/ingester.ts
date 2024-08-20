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
              uri: evt.uri.toString(),
              authorDid: evt.author,
              status: record.status,
              createdAt: record.createdAt,
              indexedAt: new Date().toISOString(),
            })
            .onConflict((oc) =>
              oc.column('uri').doUpdateSet({
                status: record.status,
                indexedAt: new Date().toISOString(),
              })
            )
            .execute()
        }
      } else if (
        evt.event === 'delete' &&
        evt.collection === 'com.example.status'
      ) {
        // Remove the status from our SQLite
        await this.db.deleteFrom('status').where({ uri: evt.uri.toString() })
      }
    }
  }

  destroy() {
    this.firehose?.destroy()
  }
}
