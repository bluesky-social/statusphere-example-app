import pino from 'pino'
import { IdResolver } from '@atproto/identity'
import { Firehose } from '@atproto/sync'
import type { Database } from '#/db'
import * as Status from '#/lexicon/types/com/example/status'

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: 'firehose ingestion' })
  return new Firehose({
    idResolver,
    handleEvent: async (evt) => {
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
              uri: evt.uri.toString(),
              authorDid: evt.did,
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
        await db.deleteFrom('status').where({ uri: evt.uri.toString() })
      }
    },
    onError: (err) => {
      logger.error({ err }, 'error on firehose ingestion')
    },
    filterCollections: ['com.example.status'],
    excludeIdentity: true,
    excludeAccount: true,
  })
}
