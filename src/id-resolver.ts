import { IdResolver, MemoryCache } from '@atproto/identity'

const HOUR = 60e3 * 60
const DAY = HOUR * 24


export function createIdResolver() {
  return new IdResolver({
    didCache: new MemoryCache(HOUR, DAY),
  })
}

export interface BidirectionalResolver {
  resolveDidToHandle(did: string): Promise<string>
  resolveDidsToHandles(dids: string[]): Promise<Record<string, string>>
}

export function createBidirectionalResolver(resolver: IdResolver) {
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
