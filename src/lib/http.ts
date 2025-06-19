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

export function formHandler<
  Req extends IncomingMessage = IncomingMessage,
  Res extends ServerResponse<Req & { body: unknown }> = ServerResponse<
    Req & { body: unknown }
  >,
>(fn: AsyncHandler<Req & { body: unknown }, Res>): Handler<Req, Res> {
  return handler(async (req, res, next) => {
    if (req.method !== 'POST') {
      return void res.writeHead(405).end()
    }
    if (req.headers['content-type'] !== 'application/x-www-form-urlencoded') {
      return void res.writeHead(415).end('Unsupported Media Type')
    }

    // Read the request payload
    const chunks: Uint8Array[] = []
    for await (const chunk of req) chunks.push(chunk)
    const payload = Buffer.concat(chunks).toString('utf-8')

    // Parse the Form URL-encoded payload
    const body = payload ? Object.fromEntries(new URLSearchParams(payload)) : {}

    // Define the body property on the request object
    Object.defineProperty(req, 'body', {
      value: body,
      writable: false,
      enumerable: true,
      configurable: true,
    })

    // Call the provided async handler with the modified request
    return fn(req as Req & { body: unknown }, res, next)
  })
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
