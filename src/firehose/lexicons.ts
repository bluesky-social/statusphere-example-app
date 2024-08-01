import type { IncomingMessage } from "node:http";

import { type LexiconDoc, Lexicons } from "@atproto/lexicon";
import type { ErrorFrame, HandlerAuth } from "@atproto/xrpc-server";
import type { CID } from "multiformats/cid";

// @NOTE: this file is an ugly copy job of codegen output. I'd like to clean this whole thing up

export function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function hasProp<K extends PropertyKey>(
  data: object,
  prop: K
): data is Record<K, unknown> {
  return prop in data;
}

export interface QueryParams {
  /** The last known event to backfill from. */
  cursor?: number;
}

export type RepoEvent =
  | Commit
  | Handle
  | Migrate
  | Tombstone
  | Info
  | { $type: string; [k: string]: unknown };
export type HandlerError = ErrorFrame<"FutureCursor" | "ConsumerTooSlow">;
export type HandlerOutput = HandlerError | RepoEvent;
export type HandlerReqCtx<HA extends HandlerAuth = never> = {
  auth: HA;
  params: QueryParams;
  req: IncomingMessage;
  signal: AbortSignal;
};
export type Handler<HA extends HandlerAuth = never> = (
  ctx: HandlerReqCtx<HA>
) => AsyncIterable<HandlerOutput>;

export interface Commit {
  seq: number;
  rebase: boolean;
  tooBig: boolean;
  repo: string;
  commit: CID;
  prev?: CID | null;
  /** The rev of the emitted commit */
  rev: string;
  /** The rev of the last emitted commit from this repo */
  since: string | null;
  /** CAR file containing relevant blocks */
  blocks: Uint8Array;
  ops: RepoOp[];
  blobs: CID[];
  time: string;
  [k: string]: unknown;
}

export function isCommit(v: unknown): v is Commit {
  return (
    isObj(v) &&
    hasProp(v, "$type") &&
    v.$type === "com.atproto.sync.subscribeRepos#commit"
  );
}

export interface Handle {
  seq: number;
  did: string;
  handle: string;
  time: string;
  [k: string]: unknown;
}

export function isHandle(v: unknown): v is Handle {
  return (
    isObj(v) &&
    hasProp(v, "$type") &&
    v.$type === "com.atproto.sync.subscribeRepos#handle"
  );
}

export interface Migrate {
  seq: number;
  did: string;
  migrateTo: string | null;
  time: string;
  [k: string]: unknown;
}

export function isMigrate(v: unknown): v is Migrate {
  return (
    isObj(v) &&
    hasProp(v, "$type") &&
    v.$type === "com.atproto.sync.subscribeRepos#migrate"
  );
}

export interface Tombstone {
  seq: number;
  did: string;
  time: string;
  [k: string]: unknown;
}

export function isTombstone(v: unknown): v is Tombstone {
  return (
    isObj(v) &&
    hasProp(v, "$type") &&
    v.$type === "com.atproto.sync.subscribeRepos#tombstone"
  );
}

export interface Info {
  name: "OutdatedCursor" | (string & {});
  message?: string;
  [k: string]: unknown;
}

export function isInfo(v: unknown): v is Info {
  return (
    isObj(v) &&
    hasProp(v, "$type") &&
    v.$type === "com.atproto.sync.subscribeRepos#info"
  );
}

/** A repo operation, ie a write of a single record. For creates and updates, cid is the record's CID as of this operation. For deletes, it's null. */
export interface RepoOp {
  action: "create" | "update" | "delete" | (string & {});
  path: string;
  cid: CID | null;
  [k: string]: unknown;
}

export function isRepoOp(v: unknown): v is RepoOp {
  return (
    isObj(v) &&
    hasProp(v, "$type") &&
    v.$type === "com.atproto.sync.subscribeRepos#repoOp"
  );
}

export const ComAtprotoSyncSubscribeRepos: LexiconDoc = {
  lexicon: 1,
  id: "com.atproto.sync.subscribeRepos",
  defs: {
    main: {
      type: "subscription",
      description: "Subscribe to repo updates",
      parameters: {
        type: "params",
        properties: {
          cursor: {
            type: "integer",
            description: "The last known event to backfill from.",
          },
        },
      },
      message: {
        schema: {
          type: "union",
          refs: [
            "lex:com.atproto.sync.subscribeRepos#commit",
            "lex:com.atproto.sync.subscribeRepos#handle",
            "lex:com.atproto.sync.subscribeRepos#migrate",
            "lex:com.atproto.sync.subscribeRepos#tombstone",
            "lex:com.atproto.sync.subscribeRepos#info",
          ],
        },
      },
      errors: [
        {
          name: "FutureCursor",
        },
        {
          name: "ConsumerTooSlow",
        },
      ],
    },
    commit: {
      type: "object",
      required: [
        "seq",
        "rebase",
        "tooBig",
        "repo",
        "commit",
        "rev",
        "since",
        "blocks",
        "ops",
        "blobs",
        "time",
      ],
      nullable: ["prev", "since"],
      properties: {
        seq: {
          type: "integer",
        },
        rebase: {
          type: "boolean",
        },
        tooBig: {
          type: "boolean",
        },
        repo: {
          type: "string",
          format: "did",
        },
        commit: {
          type: "cid-link",
        },
        prev: {
          type: "cid-link",
        },
        rev: {
          type: "string",
          description: "The rev of the emitted commit",
        },
        since: {
          type: "string",
          description: "The rev of the last emitted commit from this repo",
        },
        blocks: {
          type: "bytes",
          description: "CAR file containing relevant blocks",
          maxLength: 1000000,
        },
        ops: {
          type: "array",
          items: {
            type: "ref",
            ref: "lex:com.atproto.sync.subscribeRepos#repoOp",
          },
          maxLength: 200,
        },
        blobs: {
          type: "array",
          items: {
            type: "cid-link",
          },
        },
        time: {
          type: "string",
          format: "datetime",
        },
      },
    },
    handle: {
      type: "object",
      required: ["seq", "did", "handle", "time"],
      properties: {
        seq: {
          type: "integer",
        },
        did: {
          type: "string",
          format: "did",
        },
        handle: {
          type: "string",
          format: "handle",
        },
        time: {
          type: "string",
          format: "datetime",
        },
      },
    },
    migrate: {
      type: "object",
      required: ["seq", "did", "migrateTo", "time"],
      nullable: ["migrateTo"],
      properties: {
        seq: {
          type: "integer",
        },
        did: {
          type: "string",
          format: "did",
        },
        migrateTo: {
          type: "string",
        },
        time: {
          type: "string",
          format: "datetime",
        },
      },
    },
    tombstone: {
      type: "object",
      required: ["seq", "did", "time"],
      properties: {
        seq: {
          type: "integer",
        },
        did: {
          type: "string",
          format: "did",
        },
        time: {
          type: "string",
          format: "datetime",
        },
      },
    },
    info: {
      type: "object",
      required: ["name"],
      properties: {
        name: {
          type: "string",
          knownValues: ["OutdatedCursor"],
        },
        message: {
          type: "string",
        },
      },
    },
    repoOp: {
      type: "object",
      description:
        "A repo operation, ie a write of a single record. For creates and updates, cid is the record's CID as of this operation. For deletes, it's null.",
      required: ["action", "path", "cid"],
      nullable: ["cid"],
      properties: {
        action: {
          type: "string",
          knownValues: ["create", "update", "delete"],
        },
        path: {
          type: "string",
        },
        cid: {
          type: "cid-link",
        },
      },
    },
  },
};

const lexicons = new Lexicons([ComAtprotoSyncSubscribeRepos]);

export const isValidRepoEvent = (evt: unknown) => {
  return lexicons.assertValidXrpcMessage<RepoEvent>(
    "com.atproto.sync.subscribeRepos",
    evt
  );
};
