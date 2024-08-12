import type { Database } from '#/db'
import { Firehose } from '#/firehose/firehose'

export class Ingester {
  firehose: Firehose | undefined
  constructor(public db: Database) {}

  async start() {
    const firehose = new Firehose({})

    for await (const evt of firehose.run()) {
      if (evt.event === 'create') {
        if (evt.collection !== 'app.bsky.feed.post') continue
        const post: any = evt.record // @TODO fix types
        await this.db
          .insertInto('post')
          .values({
            uri: evt.uri.toString(),
            text: post.text as string,
            indexedAt: new Date().toISOString(),
          })
          .onConflict((oc) => oc.doNothing())
          .execute()
      }
    }
  }

  destroy() {
    this.firehose?.destroy()
  }
}
