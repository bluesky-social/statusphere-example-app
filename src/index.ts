import { once } from 'node:events'

import { createAppContext } from '#/context'
import { env } from '#/env'
import { startServer } from '#/lib/http'
import { run } from '#/lib/process'
import { createRouter } from '#/routes'

run(async (killSignal) => {
  // Create the application context
  const ctx = await createAppContext()

  // Create the HTTP router
  const router = createRouter(ctx)

  // Start the HTTP server
  const { terminate } = await startServer(router, { port: env.PORT })

  const url = env.PUBLIC_URL || `http://localhost:${env.PORT}`
  ctx.logger.info(`Server (${env.NODE_ENV}) running at ${url}`)

  // Subscribe to events on the firehose
  ctx.ingester.start()

  // Wait for a termination signal
  if (!killSignal.aborted) await once(killSignal, 'abort')
  ctx.logger.info(`Signal received, shutting down...`)

  // Gracefully shutdown the http server
  await terminate()

  // Gracefully shutdown the application context
  await ctx.destroy()
})
