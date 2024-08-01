import type { RepoRecord } from "@atproto/lexicon";
import { cborToLexRecord, readCar } from "@atproto/repo";
import { AtUri } from "@atproto/syntax";
import { Subscription } from "@atproto/xrpc-server";
import type { CID } from "multiformats/cid";
import {
  type Commit,
  type RepoEvent,
  isCommit,
  isValidRepoEvent,
} from "./lexicons";

type Opts = {
  service?: string;
  getCursor?: () => Promise<number | undefined>;
  setCursor?: (cursor: number) => Promise<void>;
  subscriptionReconnectDelay?: number;
};

export class Firehose {
  public sub: Subscription<RepoEvent>;
  private abortController: AbortController;

  constructor(public opts: Opts) {
    this.abortController = new AbortController();
    this.sub = new Subscription({
      service: opts.service ?? "https://bsky.network",
      method: "com.atproto.sync.subscribeRepos",
      signal: this.abortController.signal,
      getParams: async () => {
        if (!opts.getCursor) return undefined;
        const cursor = await opts.getCursor();
        return { cursor };
      },
      validate: (value: unknown) => {
        try {
          return isValidRepoEvent(value);
        } catch (err) {
          console.error("repo subscription skipped invalid message", err);
        }
      },
    });
  }

  async *run(): AsyncGenerator<Event> {
    try {
      for await (const evt of this.sub) {
        try {
          const parsed = await parseEvent(evt);
          for (const op of parsed) {
            yield op;
          }
        } catch (err) {
          console.error("repo subscription could not handle message", err);
        }
        if (this.opts.setCursor && typeof evt.seq === "number") {
          await this.opts.setCursor(evt.seq);
        }
      }
    } catch (err) {
      console.error("repo subscription errored", err);
      setTimeout(
        () => this.run(),
        this.opts.subscriptionReconnectDelay ?? 3000
      );
    }
  }

  destroy() {
    this.abortController.abort();
  }
}

export const parseEvent = async (evt: RepoEvent): Promise<Event[]> => {
  if (!isCommit(evt)) return [];
  return parseCommit(evt);
};

export const parseCommit = async (evt: Commit): Promise<Event[]> => {
  const car = await readCar(evt.blocks);

  const evts: Event[] = [];

  for (const op of evt.ops) {
    const uri = new AtUri(`at://${evt.repo}/${op.path}`);

    const meta: CommitMeta = {
      uri,
      author: uri.host,
      collection: uri.collection,
      rkey: uri.rkey,
    };

    if (op.action === "create" || op.action === "update") {
      if (!op.cid) continue;
      const recordBytes = car.blocks.get(op.cid);
      if (!recordBytes) continue;
      const record = cborToLexRecord(recordBytes);
      evts.push({
        ...meta,
        event: op.action as "create" | "update",
        cid: op.cid,
        record,
      });
    }

    if (op.action === "delete") {
      evts.push({
        ...meta,
        event: "delete",
      });
    }
  }

  return evts;
};

type Event = Create | Update | Delete;

type CommitMeta = {
  uri: AtUri;
  author: string;
  collection: string;
  rkey: string;
};

type Create = CommitMeta & {
  event: "create";
  record: RepoRecord;
  cid: CID;
};

type Update = CommitMeta & {
  event: "update";
};

type Delete = CommitMeta & {
  event: "delete";
};
