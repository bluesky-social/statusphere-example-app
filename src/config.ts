import type pino from "pino";
import type { Database } from "#/db";
import type { Firehose } from "#/firehose";

export type AppContext = {
  db: Database;
  firehose: Firehose;
  logger: pino.Logger;
};
