import { OAuthClient } from '@atproto/oauth-client-node'

export interface BidirectionalResolver {
  resolveDidToHandle(did: string): Promise<string | undefined>
  resolveDidsToHandles(
    dids: string[],
  ): Promise<Record<string, string | undefined>>
}

export function createBidirectionalResolver({
  identityResolver,
}: OAuthClient): BidirectionalResolver {
  return {
    async resolveDidToHandle(did: string): Promise<string | undefined> {
      try {
        const { handle } = await identityResolver.resolve(did)
        if (handle) return handle
      } catch {
        // Ignore
      }
    },

    async resolveDidsToHandles(
      dids: string[],
    ): Promise<Record<string, string | undefined>> {
      const uniqueDids = [...new Set(dids)]

      return Object.fromEntries(
        await Promise.all(
          uniqueDids.map((did) =>
            this.resolveDidToHandle(did).then((handle) => [did, handle]),
          ),
        ),
      )
    },
  }
}
