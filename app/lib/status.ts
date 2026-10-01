import "server-only";

import { type Incident, isActive, isUpcoming, loadIncidents } from "./incidents";
import {
  getResources,
  historyDays,
  probeInterval,
  type Resource,
  type ResourceType,
  types,
} from "./resources";
import { type DayTally, dayOf, dayTallies, latestSamples } from "./store";

/** A resource's state as shown: probed, or set by an open incident. */
export type State = "operational" | "degraded" | "partial" | "major" | "maintenance" | "unknown";

/** The headline of a set of resources, from each one's state. */
export type Overall = State;

export type Day = {
  /** Midnight UTC, ms. */
  date: number;
  /** Null when nothing was probed that day. */
  uptime: number | null;
  state: State | "none";
  incidents: string[];
};

export type ResourceStatus = Omit<Resource, "probe" | "follow"> & {
  state: State;
  /** Last probe's latency, ms. */
  latency: number | null;
  checkedAt: number | null;
  /** Over the days with samples, maintenance left out; null without any. */
  uptime: number | null;
  days: Day[];
};

export type TypeStatus = { id: ResourceType; overall: Overall; resources: ResourceStatus[] };

export type StatusReport = {
  /** Every resource's, whatever the filter. */
  overall: Overall;
  updatedAt: number;
  /** Every type with at least one resource, in `types` order. */
  types: TypeStatus[];
  active: Incident[];
  upcoming: Incident[];
  /** Ended incidents within the history, newest first. */
  past: Incident[];
};

const DAY = 86_400_000;
const rank: Record<State, number> = {
  operational: 0,
  unknown: 0,
  maintenance: 1,
  degraded: 2,
  partial: 3,
  major: 4,
};
const worst = (a: State, b: State) => (rank[b] > rank[a] ? b : a);

/** What an open incident does to the resources it names. */
const fromImpact: Record<Incident["impact"], State> = {
  minor: "degraded",
  major: "major",
  maintenance: "maintenance",
};

/** A day's colour: clean, slow, a short outage (under 5% of it) or a long one. */
function dayState(tally: DayTally): State {
  const watched = tally.up + tally.degraded + tally.down;
  if (watched === 0) return "maintenance";
  if (tally.down === 0) return tally.degraded ? "degraded" : "operational";
  return tally.down / watched < 0.05 ? "partial" : "major";
}

const uptimeOf = (up: number, watched: number) => (watched ? up / watched : null);

function overallOf(states: State[]): Overall {
  if (states.length === 0 || states.every((state) => state === "unknown")) return "unknown";
  const down = states.filter((state) => state === "major" || state === "partial").length;
  if (down && down === states.length) return "major";
  if (down) return "partial";
  if (states.includes("degraded")) return "degraded";
  if (states.includes("maintenance")) return "maintenance";
  return "operational";
}

/** Everything the page and /api/status.json show. */
export function getStatus(now = Date.now()): StatusReport {
  const resources = getResources();
  const latest = latestSamples();
  const incidents = loadIncidents();
  const active = incidents.filter((incident) => isActive(incident, now));
  const tallies = new Map<string, Map<number, DayTally>>();
  for (const tally of dayTallies(now)) {
    if (!tallies.has(tally.component)) tallies.set(tally.component, new Map());
    tallies.get(tally.component)!.set(tally.day, tally);
  }
  const today = dayOf(now);
  // A sample older than three rounds no longer says how it is now.
  const stale = now - 3 * probeInterval() * 1000;

  const statuses: ResourceStatus[] = resources.map((entry) => {
    // How it is probed stays private.
    const { id, name, type, operator, description, url } = entry;
    const resource = { id, name, type, operator, description, url };
    const sample = latest.get(resource.id);
    let state: State = "unknown";
    if (sample && sample.at >= stale) {
      state = (
        { up: "operational", degraded: "degraded", down: "major", maintenance: "maintenance" } as const
      )[sample.state];
    }
    for (const incident of active) {
      if (incident.components.includes(resource.id)) {
        state = worst(state, fromImpact[incident.impact]);
      }
    }

    const own = tallies.get(resource.id) ?? new Map<number, DayTally>();
    let up = 0;
    let watched = 0;
    const days: Day[] = [];
    for (let day = today - historyDays + 1; day <= today; day++) {
      const date = day * DAY;
      const tally = own.get(day);
      const touching = incidents
        .filter(
          (incident) =>
            incident.components.includes(resource.id) &&
            incident.starts < date + DAY &&
            (incident.ends ?? now) >= date,
        )
        .map((incident) => incident.id);
      if (!tally) {
        days.push({ date, uptime: null, state: "none", incidents: touching });
        continue;
      }
      const dayWatched = tally.up + tally.degraded + tally.down;
      up += tally.up + tally.degraded;
      watched += dayWatched;
      days.push({
        date,
        uptime: uptimeOf(tally.up + tally.degraded, dayWatched),
        state: dayState(tally),
        incidents: touching,
      });
    }

    return {
      ...resource,
      state,
      latency: sample?.latency ?? null,
      checkedAt: sample?.at ?? null,
      uptime: uptimeOf(up, watched),
      days,
    };
  });

  const horizon = now - historyDays * DAY;
  return {
    overall: overallOf(statuses.map((status) => status.state)),
    updatedAt: now,
    types: types
      .map((id) => {
        const own = statuses.filter((status) => status.type === id);
        return { id, overall: overallOf(own.map((status) => status.state)), resources: own };
      })
      .filter((type) => type.resources.length > 0),
    active,
    upcoming: incidents.filter((incident) => isUpcoming(incident, now)).reverse(),
    past: incidents.filter(
      (incident) =>
        !isActive(incident, now) && !isUpcoming(incident, now) && incident.starts >= horizon,
    ),
  };
}
