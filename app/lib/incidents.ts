import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Incidents and maintenance are written by hand, one Markdown file each in
 * `STATUS_INCIDENTS_DIR` (`incidents/`; see incidents/README.md). They are
 * read on every request: a new file shows at once.
 */

export const impacts = ["minor", "major", "maintenance"] as const;
export type Impact = (typeof impacts)[number];

export const updateStates = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
  "scheduled",
  "in_progress",
  "completed",
] as const;
export type UpdateState = (typeof updateStates)[number];

export type IncidentUpdate = { at: number; state: UpdateState; body: string };

export type Incident = {
  id: string;
  title: string;
  impact: Impact;
  components: string[];
  /** When it began; for maintenance, when the window opens. */
  starts: number;
  /** When it was resolved; for maintenance, when the window closes. Null while open. */
  ends: number | null;
  /** Newest first. */
  updates: IncidentUpdate[];
};

const dir = () => process.env.STATUS_INCIDENTS_DIR ?? path.join(process.cwd(), "incidents");

type Parsed = { meta: Record<string, string>; updates: IncidentUpdate[] };

/** The front matter (`key: value` lines between `---`) and the `## <ISO time> <state>` updates. */
function parse(source: string): Parsed {
  const meta: Record<string, string> = {};
  let body = source;
  const front = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (front) {
    body = source.slice(front[0].length);
    for (const line of front[1].split(/\r?\n/)) {
      const match = /^([a-z_]+):\s*(.*?)\s*(#.*)?$/.exec(line.trim());
      if (match) meta[match[1]] = match[2];
    }
  }
  const updates: IncidentUpdate[] = [];
  for (const section of body.split(/^## /m).slice(1)) {
    const [heading, ...lines] = section.split(/\r?\n/);
    const [when, state] = heading.trim().split(/\s+/);
    const at = Date.parse(when);
    if (Number.isNaN(at) || !(updateStates as readonly string[]).includes(state)) continue;
    updates.push({ at, state: state as UpdateState, body: lines.join("\n").trim() });
  }
  return { meta, updates: updates.sort((a, b) => b.at - a.at) };
}

function read(file: string): string | null {
  try {
    // Read at runtime, never traced into the build.
    return readFileSync(path.join(/*turbopackIgnore: true*/ dir(), file), "utf8");
  } catch {
    return null;
  }
}

/** Every incident, newest first. Invalid files are skipped. */
export function loadIncidents(): Incident[] {
  let files: string[];
  try {
    files = readdirSync(/*turbopackIgnore: true*/ dir());
  } catch {
    return [];
  }
  const incidents: Incident[] = [];
  for (const file of files) {
    const match = /^([a-z0-9][a-z0-9-]*)\.md$/.exec(file);
    if (!match) continue;
    const id = match[1];
    const source = read(file);
    if (source === null) continue;
    const { meta, updates } = parse(source);
    const impact = meta.impact as Impact;
    const starts = Date.parse(meta.starts ?? "");
    if (!meta.title || !impacts.includes(impact) || Number.isNaN(starts)) continue;
    const ends = meta.ends ? Date.parse(meta.ends) : NaN;

    incidents.push({
      id,
      title: meta.title,
      impact,
      components: (meta.components ?? "")
        .split(",")
        .map((component) => component.trim())
        .filter(Boolean),
      starts,
      ends: Number.isNaN(ends) ? null : ends,
      updates,
    });
  }
  return incidents.sort((a, b) => b.starts - a.starts);
}

/** An incident still open, or a maintenance window in progress. */
export function isActive(incident: Incident, now = Date.now()): boolean {
  return incident.starts <= now && (incident.ends === null || now < incident.ends);
}

/** A maintenance window that has not opened yet. */
export function isUpcoming(incident: Incident, now = Date.now()): boolean {
  return incident.impact === "maintenance" && incident.starts > now;
}

/** Whether a component is in a maintenance window right now. */
export function inMaintenance(component: string, incidents: Incident[], now = Date.now()) {
  return incidents.some(
    (incident) =>
      incident.impact === "maintenance" &&
      isActive(incident, now) &&
      incident.components.includes(component),
  );
}
