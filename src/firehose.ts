import { cborToLexRecord, readCar } from "@atproto/repo";
import { Subscription } from "@atproto/xrpc-server";
import type { Database } from "#/db";

export class Firehose {
  public sub: Subscription<unknown>;

  constructor(public service: string, public db: Database) {
    this.sub = new Subscription({
      service: service,
      method: "com.atproto.sync.subscribeRepos",
      getParams: () => ({}),
      validate: (value: unknown) => value,
    });
  }

  async handleEvent(evt: any): Promise<void> {
    if (evt.$type !== "com.atproto.sync.subscribeRepos#commit") {
      return;
    }

    const car = await readCar(evt.blocks);

    for (const op of evt.ops) {
      if (op.action !== "create") continue;
      const uri = `at://${evt.repo}/${op.path}`;
      const [collection] = op.path.split("/");
      if (collection !== "app.bsky.feed.post") continue;

      if (!op.cid) continue;
      const recordBytes = car.blocks.get(op.cid);
      if (!recordBytes) continue;
      const record = cborToLexRecord(recordBytes);
      await this.db
        .insertInto("post")
        .values({
          uri,
          text: record.text as string,
          indexedAt: new Date().toISOString(),
        })
        .execute();
    }
  }

  async run(subscriptionReconnectDelay: number) {
    try {
      for await (const evt of this.sub) {
        try {
          await this.handleEvent(evt);
        } catch (err) {
          console.error("repo subscription could not handle message", err);
        }
      }
    } catch (err) {
      console.error("repo subscription errored", err);
      setTimeout(
        () => this.run(subscriptionReconnectDelay),
        subscriptionReconnectDelay
      );
    }
  }
}
