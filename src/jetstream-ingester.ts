import WebSocket from 'ws'
import pino from 'pino';
import type { Database } from '#/db'
import * as Status from '#/lexicon/types/xyz/statusphere/status'

export function createJetstreamIngester(db: Database) {
  const logger = pino({ name: 'websocket ingestion' });

  return new Jetstream({
    db,
    handleEvent: async (evt) => {
      const now = new Date();
      const record = evt.commit?.record;

      if (
        (evt.commit?.operation === 'create' || evt.commit?.operation === 'update') &&
        evt.commit?.collection === 'xyz.statusphere.status' &&
        Status.isRecord(record) &&
        Status.validateRecord(record).success &&
        record &&
        record.$type === 'xyz.statusphere.status' // Replace with a proper type check if available
      ) {
        await db
          .insertInto('status')
          .values({
            uri: evt.commit.rkey,
            authorDid: evt.did,
            status: record.status,
            createdAt: record.createdAt,
            indexedAt: now.toISOString(),
          })
          .onConflict((oc) =>
            oc.column('uri').doUpdateSet({
              status: record.status,
              indexedAt: now.toISOString(),
            })
          )
          .execute();
      } else if (
        evt.commit?.operation === 'delete' &&
        evt.commit?.collection === 'xyz.statusphere.status'
      ) {
        await db.deleteFrom('status').where('uri', '=', evt.commit.rkey).execute();
      }
    },
    onError: (err) => {
      logger.error({ err }, 'error during WebSocket ingestion');
    },
    wantedCollections: ['xyz.statusphere.status']
  });
}

export class Jetstream {
  private db: Database;
  private handleEvent: (evt: any) => Promise<void>;
  private onError: (err: any) => void;
  private ws?: WebSocket;
  private isStarted = false;
  private wantedCollections: string[];

  constructor({
    db,
    handleEvent,
    onError,
    wantedCollections,
  }: {
    db: Database;
    handleEvent: (evt: any) => Promise<void>;
    onError: (err: any) => void;
    wantedCollections: string[];
  }) {
    this.db = db;
    this.handleEvent = handleEvent;
    this.onError = onError;
    this.wantedCollections = wantedCollections;
  }

  constructUrlWithQuery = (): string => {
    const params = new URLSearchParams();
    params.append('wantedCollections', this.wantedCollections.join(','));
    return `wss://jetstream2.us-east.bsky.network/subscribe?${params.toString()}`;
  };

  start() {
    if (this.isStarted) return;
    const logger = pino({ name: 'start function' });
    logger.info("STARTING");
    this.isStarted = true;
    const wsUrl = `wss://jetstream2.us-east.bsky.network/subscribe`;
    this.ws = new WebSocket(this.constructUrlWithQuery());

    this.ws.on('open', () => {
      console.log('WebSocket connection opened.');
    });

    this.ws.on('message', async (data) => {
      try {
        const event = JSON.parse(data.toString());
        await this.handleEvent(event);
      } catch (err) {
        this.onError(err);
      }
    });

    this.ws.on('error', (err) => {
      this.onError(err);
    });

    this.ws.on('close', (code, reason) => {
      console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
      this.isStarted = false;
    });
  }

  destroy() {
    if (this.ws) {
      this.ws.close();
      this.isStarted = false;
    }
  }
}
