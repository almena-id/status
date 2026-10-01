import type { ResourceType } from "./lib/resources";
import type { Impact, UpdateState } from "./lib/incidents";
import type { Overall, State } from "./lib/status";

/** Every text the page shows. The page is in English only. */
export const copy = {
  app: { name: "Almena Status" },
  footer: { rights: "Almena Network", site: "almena.id", feed: "JSON" },
  home: {
    title: "Almena Network status",
    lead: "Whether each service of the network works right now, and how it has done over the last {days} days.",
    updated: "Updated {time}",
    filter: "Filter by service type",
    all: "All",
    by: "by {operator}",
    empty: "No service of this type is watched yet.",
  },
  overall: {
    operational: "All systems operational",
    degraded: "Degraded performance",
    partial: "Partial outage",
    major: "Major outage",
    maintenance: "Maintenance in progress",
    unknown: "Status not known yet",
  } satisfies Record<Overall, string>,
  state: {
    operational: "Operational",
    degraded: "Degraded",
    partial: "Partial outage",
    major: "Outage",
    maintenance: "Maintenance",
    unknown: "No data",
  } satisfies Record<State, string>,
  types: {
    identity: "Identity",
    mediator: "Mediators",
    api: "APIs",
    agent: "Agents",
    portal: "Portals",
  } satisfies Record<ResourceType, string>,
  bar: {
    ago: "{days} days ago",
    today: "Today",
    uptime: "{value}% uptime",
    noData: "No data",
    latency: "{value} ms",
    summary: "{name}: {value}% uptime over the last {days} days",
  },
  incidents: {
    active: "Ongoing",
    upcoming: "Scheduled maintenance",
    past: "Past incidents",
    none: "No incidents in the last {days} days.",
    history: "Incident history",
    all: "Every incident of the last {days} days",
    back: "Back to the current status",
    affects: "Affects",
    window: "{start} – {end}",
    impact: {
      minor: "Minor",
      major: "Major",
      maintenance: "Maintenance",
    } satisfies Record<Impact, string>,
    updates: {
      investigating: "Investigating",
      identified: "Identified",
      monitoring: "Monitoring",
      resolved: "Resolved",
      scheduled: "Scheduled",
      in_progress: "In progress",
      completed: "Completed",
    } satisfies Record<UpdateState, string>,
  },
};
