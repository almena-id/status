import "server-only";

import { inMaintenance, loadIncidents } from "./incidents";
import {
  failuresToDown,
  getResources,
  probeInterval,
  probeTimeout,
  type Resource,
  slowThreshold,
} from "./resources";
import { type ProbeState, prune, record } from "./store";

/** What one probe saw, before confirmation. */
type Seen = { ok: boolean; degraded: boolean; latency: number | null; code: number | null };

/**
 * One GET. 2xx is up (degraded when slower than the threshold); a 503 whose
 * JSON says `"status": "degraded"` (the mediator without Redis) is degraded;
 * anything else, a timeout or no answer is a failure.
 */
async function probe(resource: Resource): Promise<Seen> {
  const started = performance.now();
  try {
    const response = await fetch(resource.probe, {
      headers: { accept: "application/json", "user-agent": "almena-status" },
      cache: "no-store",
      redirect: resource.follow ? "follow" : "manual",
      signal: AbortSignal.timeout(probeTimeout()),
    });
    const latency = Math.round(performance.now() - started);
    if (response.ok) {
      await response.body?.cancel();
      return { ok: true, degraded: latency > slowThreshold(), latency, code: response.status };
    }
    let degraded = false;
    if (response.status === 503) {
      const body = (await response.json().catch(() => null)) as { status?: unknown } | null;
      degraded = body?.status === "degraded";
    } else {
      await response.body?.cancel();
    }
    return { ok: degraded, degraded, latency, code: response.status };
  } catch {
    return { ok: false, degraded: false, latency: null, code: null };
  }
}

/** Failures in a row and the last confirmed state, per component. */
const streaks = new Map<string, { failures: number; state: ProbeState | null }>();

/**
 * A failure counts once it repeats (`failuresToDown`): a single one keeps the
 * previous state. Inside a maintenance window, a failure is maintenance.
 */
function confirm(component: string, seen: Seen, maintenance: boolean): ProbeState | null {
  const streak = streaks.get(component) ?? { failures: 0, state: null };
  let state: ProbeState | null;
  if (seen.ok) {
    streak.failures = 0;
    state = seen.degraded ? "degraded" : "up";
  } else {
    streak.failures += 1;
    if (maintenance) state = "maintenance";
    else if (streak.failures >= failuresToDown) state = "down";
    else state = streak.state;
  }
  streak.state = state;
  streaks.set(component, streak);
  return state;
}

async function round() {
  const now = Date.now();
  const incidents = loadIncidents();
  await Promise.all(
    getResources().map(async (resource) => {
      const seen = await probe(resource);
      const state = confirm(resource.id, seen, inMaintenance(resource.id, incidents, now));
      // The very first probe failing has nothing to fall back on: wait for the next.
      if (state === null) return;
      record({ component: resource.id, at: now, state, latency: seen.latency, code: seen.code });
    }),
  );
}

declare global {
  var __almenaStatusMonitor: NodeJS.Timeout | undefined;
}

/** Starts probing every resource, once per server (instrumentation.ts). */
export function startMonitor() {
  if (globalThis.__almenaStatusMonitor) return;
  let rounds = 0;
  const tick = () => {
    round()
      .then(() => {
        // Pruning once an hour is plenty.
        if (rounds++ % Math.max(1, Math.round(3600 / probeInterval())) === 0) prune();
      })
      .catch((error: unknown) => console.error("status: probe round failed", error));
  };
  tick();
  globalThis.__almenaStatusMonitor = setInterval(tick, probeInterval() * 1000);
}
