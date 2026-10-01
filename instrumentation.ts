/** Runs once when the server starts: the probes begin (Node.js only). */
export async function register() {
  // Not while `next build` collects the pages: only a running server probes.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { startMonitor } = await import("./app/lib/monitor");
    startMonitor();
  }
}
