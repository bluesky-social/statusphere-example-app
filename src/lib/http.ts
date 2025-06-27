import { createHttpTerminator } from 'http-terminator'
import { once } from 'node:events'
import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http'
import { createServer } from 'node:http'

export type NextFunction = (err?: unknown) => void

export type Middleware<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse<Req> = ServerResponse<Req>,
> = (req: Req, res: Res, next: NextFunction) => void

export type Handler<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse<Req> = ServerResponse<Req>,
> = (req: Req, res: Res) => unknown | Promise<unknown>
/**
 * Wraps a request handler middleware to ensure that `next` is called if it
 * throws or returns a promise that rejects.
 */
export function handler<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse<Req> = ServerResponse<Req>,
>(fn: Handler<Req, Res>): Middleware<Req, Res> {
  return async (req, res, next) => {
    try {
      await fn(req, res)
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Create an HTTP server with the provided request listener, ensuring that it
 * can bind the listening port, and returns a termination function that allows
 * graceful termination of HTTP connections.
 */
export async function startServer(
  requestListener: RequestListener,
  {
    port,
    gracefulTerminationTimeout,
  }: { port?: number; gracefulTerminationTimeout?: number } = {},
) {
  const server = createServer(requestListener)
  const { terminate } = createHttpTerminator({
    gracefulTerminationTimeout,
    server,
  })
  server.listen(port)
  await once(server, 'listening')
  return { server, terminate }
}
