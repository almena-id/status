import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The kinds of service, in the order the page lists them and its filter
 * offers them. Any operator, Almena or a third party, can run any of them.
 */
export const types = ["identity", "mediator", "api", "agent", "portal"] as const;
export type ResourceType = (typeof types)[number];

export const isType = (value: unknown): value is ResourceType =>
  typeof value === "string" && (types as readonly string[]).includes(value);

/** A resource the status page watches: one entry of config/resources.json. */
export type Resource = {
  /** Stable id: the key of its samples and of incidents' `components`. */
  id: string;
  name: string;
  type: ResourceType;
  /** Who runs it: Almena, or the third party that provides it for public use. */
  operator: string;
  description: string | null;
  /** Its public address, shown on the page. */
  url: string;
  /** What is probed: a GET that answers 2xx while the resource works. */
  probe: string;
  /** Whether a redirect is followed; otherwise it is a failure (did:web must answer directly). */
  follow: boolean;
};

const file = () => process.env.STATUS_RESOURCES_FILE ?? path.join(process.cwd(), "config", "resources.json");

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

const httpUrl = (value: unknown) => {
  const url = text(value);
  if (!url) return null;
  try {
    return ["https:", "http:"].includes(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
};

/**
 * Every resource in config/resources.json (`STATUS_RESOURCES_FILE`), read on each
 * use: adding a third party's resource needs no restart. An entry missing a
 * field, of an unknown type or with a repeated id is skipped and logged.
 */
export function getResources(): Resource[] {
  let entries: unknown[];
  try {
    const parsed = JSON.parse(
      readFileSync(/*turbopackIgnore: true*/ file(), "utf8"),
    ) as { resources?: unknown };
    entries = Array.isArray(parsed.resources) ? parsed.resources : [];
  } catch (error) {
    console.error("status: resources.json cannot be read", error);
    return [];
  }
  const seen = new Set<string>();
  const resources: Resource[] = [];
  for (const entry of entries) {
    const raw = (entry ?? {}) as Record<string, unknown>;
    const id = text(raw.id);
    const name = text(raw.name);
    const url = httpUrl(raw.url);
    const probe = httpUrl(raw.probe);
    if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id) || seen.has(id) || !name || !isType(raw.type) || !url || !probe) {
      console.error("status: skipping an invalid resource", raw.id ?? raw.name ?? entry);
      continue;
    }
    seen.add(id);
    resources.push({
      id,
      name,
      type: raw.type,
      operator: text(raw.operator) ?? "Almena",
      description: text(raw.description),
      url,
      probe,
      follow: raw.follow === true,
    });
  }
  return resources;
}

/** Seconds between two rounds of probes. */
export const probeInterval = () => Number(process.env.STATUS_PROBE_INTERVAL_SECONDS ?? 60);

/** A probe slower than this (ms) counts as degraded. */
export const slowThreshold = () => Number(process.env.STATUS_SLOW_MS ?? 2000);

/** A probe is abandoned, and failed, after this long (ms). */
export const probeTimeout = () => Number(process.env.STATUS_PROBE_TIMEOUT_MS ?? 10000);

/** Failures in a row before a resource is declared down. */
export const failuresToDown = 2;

/** Days of history kept and shown. */
export const historyDays = 90;
