import events from "node:events";
import type http from "node:http";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import errorHandler from "#/common/middleware/errorHandler";
import rateLimiter from "#/common/middleware/rateLimiter";
import requestLogger from "#/common/middleware/requestLogger";
import { env } from "#/common/utils/envConfig";
import { Database } from "#/db";
import { Firehose } from "#/firehose";
import { addRoutes } from "#/routes";

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public firehose: Firehose,
    public logger: pino.Logger,
  ) {}

  static async create() {
    const { NODE_ENV, HOST, PORT } = env;

    await Database.sync({ force: true });

    const logger = pino({ name: "server start" });
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
    app.use(rateLimiter);

    // Request logging
    app.use(requestLogger);

    addRoutes(app);

    // Error handlers
    app.use(errorHandler());

    const server = app.listen(env.PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    const firehose = new Firehose("https://bsky.network");
    firehose.run(10);

    return new Server(app, server, firehose, logger);
  }

  async close() {
    this.logger.info("sigint received, shutting down");
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.logger.info("server closed");
        resolve();
      });
    });
  }
}
