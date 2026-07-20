import { Jetstream, LexIndexer } from "bsky-jetstream-preview";
import { AtUri } from "@atproto/syntax";
import {
  insertStatus,
  deleteStatus,
  updateAccountActive,
  updateHandle,
  deleteAccount,
} from "@/lib/db/queries";
import * as xyz from "@/lib/lexicons/xyz";
import { SqliteCursorStore } from "./cursor-store";

const JETSTREAM_URL =
  process.env.JETSTREAM_URL || "wss://jetstream1.us-east.bsky.network";

const indexer = new LexIndexer()
  .commit(xyz.statusphere.status.main, {
    put: async (e) =>
      insertStatus({
        uri: e.uri,
        authorDid: e.did,
        status: e.record.status,
        createdAt: e.record.createdAt,
        indexedAt: new Date().toISOString(),
        current: 1,
      }),
    del: async (e) =>
      deleteStatus(AtUri.make(e.did, e.collection, e.rkey)),
  })
  .identity(async (e) => {
    if (e.handle) await updateHandle(e.did, e.handle);
  })
  .account(async (e) => {
    if (!e.active && e.status === "deleted") {
      await deleteAccount(e.did);
    } else {
      await updateAccountActive(e.did, e.active ? 1 : 0);
    }
  });

let started = false;

export function startJetstreamConsumer() {
  if (started) return;
  started = true;

  const jetstream = new Jetstream(JETSTREAM_URL);
  const cursor = new SqliteCursorStore();

  const run = async () => {
    while (true) {
      try {
        await jetstream.runner(indexer).live({
          cursor,
          onError: (err) => console.error("[jetstream] stream error", err),
        });
      } catch (err) {
        console.error("[jetstream] consumer crashed, reconnecting in 5s", err);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  };

  void run();
}
