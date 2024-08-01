import events from "node:events";
import type http from "node:http";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import errorHandler from "#/common/middleware/errorHandler";
import requestLogger from "#/common/middleware/requestLogger";
import { env } from "#/common/utils/envConfig";
import { createDb, migrateToLatest } from "#/db";
import { Firehose } from "#/firehose";
import { createRouter } from "#/routes";
import type { AppContext } from "./config";

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public ctx: AppContext
  ) {}

  static async create() {
    const { NODE_ENV, HOST, PORT } = env;

    const logger = pino({ name: "server start" });
    const db = createDb(":memory:");
    await migrateToLatest(db);
    const firehose = new Firehose("https://bsky.network", db);
    firehose.run(10);
    const ctx = {
      db,
      firehose,
      logger,
    };

    const app: Express = express();

    // Set the application to trust the reverse proxy
    app.set("trust proxy", true);

    // TODO: middleware for sqlite server
    // TODO: middleware for OAuth

    // Middlewares
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
    app.use(helmet());

    // Request logging
    app.use(requestLogger);

    // Routes
    const router = createRouter(ctx);
    app.use(router);

    // Error handlers
    app.use(errorHandler());

    const server = app.listen(env.PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    return new Server(app, server, ctx);
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info("server closed");
        resolve();
      });
    });
  }
}
