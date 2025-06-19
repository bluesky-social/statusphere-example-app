import type { Database } from '#/db'
import * as Status from '#/lexicon/types/xyz/statusphere/status'
import { IdResolver, MemoryCache } from '@atproto/identity'
import { Event, Firehose } from '@atproto/sync'
import pino from 'pino'

const HOUR = 60e3 * 60
const DAY = HOUR * 24

export function createIngester(db: Database) {
  const logger = pino({ name: 'firehose ingestion' })
  return new Firehose({
    idResolver: new IdResolver({
      didCache: new MemoryCache(HOUR, DAY),
    }),
    handleEvent: async (evt: Event) => {
      // Watch for write events
      if (evt.event === 'create' || evt.event === 'update') {
        const now = new Date()
        const record = evt.record

        // If the write is a valid status update
        if (
          evt.collection === 'xyz.statusphere.status' &&
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
              indexedAt: now.toISOString(),
            })
            .onConflict((oc) =>
              oc.column('uri').doUpdateSet({
                status: record.status,
                indexedAt: now.toISOString(),
              }),
            )
            .execute()
        }
      } else if (
        evt.event === 'delete' &&
        evt.collection === 'xyz.statusphere.status'
      ) {
        // Remove the status from our SQLite
        await db
          .deleteFrom('status')
          .where('uri', '=', evt.uri.toString())
          .execute()
      }
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'error on firehose ingestion')
    },
    filterCollections: ['xyz.statusphere.status'],
    excludeIdentity: true,
    excludeAccount: true,
  })
}
