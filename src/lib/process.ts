const SIGNALS = ['SIGINT', 'SIGTERM'] as const

/**
 * Runs a function with an abort signal that will be triggered when the process
 * receives a termination signal.
 */
export async function run<F extends (signal: AbortSignal) => unknown>(
  fn: F,
): Promise<Awaited<ReturnType<F>>> {
  const killController = new AbortController()

  const abort = (signal?: string) => {
    for (const sig of SIGNALS) process.off(sig, abort)
    killController.abort(signal)
  }

  for (const sig of SIGNALS) process.on(sig, abort)

  try {
    return (await fn(killController.signal)) as Awaited<ReturnType<F>>
  } finally {
    abort()
  }
}
