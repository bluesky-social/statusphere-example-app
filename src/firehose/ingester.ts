import type { Database } from '#/db'
import { Firehose } from '#/firehose/firehose'
import * as Status from '#/lexicon/types/com/example/status'

export class Ingester {
  firehose: Firehose | undefined
  constructor(public db: Database) {}

  async start() {
    const firehose = new Firehose({})

    for await (const evt of firehose.run()) {
      if (evt.event === 'create') {
        const record = evt.record
        if (
          evt.collection === 'com.example.status' &&
          Status.isRecord(record) &&
          Status.validateRecord(record).success
        ) {
          await this.db
            .insertInto('status')
            .values({
              authorDid: evt.author,
              status: record.status,
              updatedAt: record.updatedAt,
              indexedAt: new Date().toISOString(),
            })
            .onConflict((oc) => oc.doNothing())
            .execute()
        }
      }
    }
  }

  destroy() {
    this.firehose?.destroy()
  }
}
