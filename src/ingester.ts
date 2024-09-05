import pino from 'pino'
import { IdResolver } from '@atproto/identity'
import { Firehose } from '@atproto/sync'
import type { Database } from '#/db'
import * as Status from '#/lexicon/types/com/example/status'

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: 'firehose ingestion' })
  return new Firehose({
    idResolver,
    handleEvent: async(evt) => {
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
          await db
            .insertInto('status')
            .values({
              authorDid: evt.did,
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
    },
    onError: (err) => {
      logger.error({err}, 'error on firehose ingestion')
    },
    filterCollections: ['com.example.status'],
    excludeIdentity: true,
    excludeAccount: true,
  })
}