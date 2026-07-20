export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startJetstreamConsumer } = await import("@/lib/jetstream/consumer");
    startJetstreamConsumer();
  }
}
