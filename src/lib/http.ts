import { createHttpTerminator } from 'http-terminator'
import { once } from 'node:events'
import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http'
import { createServer } from 'node:http'

export type NextFunction = (err?: unknown) => void

export type Handler<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse<Req> = ServerResponse<Req>,
> = (req: Req, res: Res, next: NextFunction) => void

export type AsyncHandler<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse<Req> = ServerResponse<Req>,
> = (req: Req, res: Res, next: NextFunction) => Promise<void>

// Helper function for defining routes
export function handler<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse<Req> = ServerResponse<Req>,
>(fn: Handler<Req, Res> | AsyncHandler<Req, Res>): Handler<Req, Res> {
  return (req, res, next) => {
    // NodeJS prefers objects over functions for garbage collection,
    const nextSafe = nextOnce.bind({ next })
    try {
      const result = fn(req, res, nextSafe)
      if (result instanceof Promise) result.catch(nextSafe)
    } catch (err) {
      nextSafe(err)
    }
  }

  function nextOnce(this: { next: NextFunction | null }, err?: unknown) {
    const { next } = this
    this.next = null
    next?.(err)
  }
}

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
