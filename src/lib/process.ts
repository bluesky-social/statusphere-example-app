const SIGNALS = ['SIGINT', 'SIGTERM'] as const

/**
 * Runs a function with an abort signal that will be triggered when the process
 * receives a termination signal.
 */
export async function run<F extends (signal: AbortSignal) => Promise<void>>(
  fn: F,
): Promise<void> {
  const killController = new AbortController()

  const abort = (signal?: string) => {
    for (const sig of SIGNALS) process.off(sig, abort)
    killController.abort(signal)
  }

  for (const sig of SIGNALS) process.on(sig, abort)

  try {
    await fn(killController.signal)
  } finally {
    abort()
  }
}
