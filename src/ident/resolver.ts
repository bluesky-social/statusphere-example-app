import { IdResolver, DidDocument, CacheResult } from '@atproto/identity'
import type { Database } from '#/db'

const HOUR = 60e3 * 60
const DAY = HOUR * 24

export function createResolver(db: Database) {
  const resolver = new IdResolver({
    didCache: {
      async cacheDid(did: string, doc: DidDocument): Promise<void> {
        await db
          .insertInto('did_cache')
          .values({
            did,
            doc: JSON.stringify(doc),
            updatedAt: new Date().toISOString(),
          })
          .onConflict((oc) =>
            oc.column('did').doUpdateSet({
              doc: JSON.stringify(doc),
              updatedAt: new Date().toISOString(),
            })
          )
          .execute()
      },

      async checkCache(did: string): Promise<CacheResult | null> {
        const row = await db
          .selectFrom('did_cache')
          .selectAll()
          .where('did', '=', did)
          .executeTakeFirst()
        if (!row) return null
        const now = Date.now()
        const updatedAt = +new Date(row.updatedAt)
        return {
          did,
          doc: JSON.parse(row.doc),
          updatedAt,
          stale: now > updatedAt + HOUR,
          expired: now > updatedAt + DAY,
        }
      },

      async refreshCache(
        did: string,
        getDoc: () => Promise<DidDocument | null>
      ): Promise<void> {
        const doc = await getDoc()
        if (doc) {
          await this.cacheDid(did, doc)
        }
      },

      async clearEntry(did: string): Promise<void> {
        await db.deleteFrom('did_cache').where('did', '=', did).execute()
      },

      async clear(): Promise<void> {
        await db.deleteFrom('did_cache').execute()
      },
    },
  })

  return {
    async resolveDidToHandle(did: string): Promise<string> {
      const didDoc = await resolver.did.resolveAtprotoData(did)
      const resolvedHandle = await resolver.handle.resolve(didDoc.handle)
      if (resolvedHandle === did) {
        return didDoc.handle
      }
      return did
    },

    async resolveDidsToHandles(
      dids: string[]
    ): Promise<Record<string, string>> {
      const didHandleMap: Record<string, string> = {}
      const resolves = await Promise.all(
        dids.map((did) => this.resolveDidToHandle(did).catch((_) => did))
      )
      for (let i = 0; i < dids.length; i++) {
        didHandleMap[dids[i]] = resolves[i]
      }
      return didHandleMap
    },
  }
}
