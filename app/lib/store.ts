import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

import { historyDays } from "./resources";

/** What a probe found, once confirmed (see monitor.ts). */
export type ProbeState = "up" | "degraded" | "down" | "maintenance";

export type Sample = {
  component: string;
  at: number;
  state: ProbeState;
  latency: number | null;
  code: number | null;
};

/** One component's day (UTC): how many samples ended in each state. */
export type DayTally = {
  component: string;
  /** Days since the epoch, UTC. */
  day: number;
  up: number;
  degraded: number;
  down: number;
  maintenance: number;
  latencySum: number;
};

const DAY = 86_400_000;
/** Raw samples are kept this long; the days table holds the rest. */
const SAMPLE_RETENTION = 2 * DAY;

export const dayOf = (at: number) => Math.floor(at / DAY);

declare global {
  var __almenaStatusDb: DatabaseSync | undefined;
}

/**
 * The status's own database: SQLite in `STATUS_DATA_DIR`, shared with nothing
 * the page watches. `node:sqlite` is loaded at runtime so the bundler leaves
 * it alone.
 */
function db(): DatabaseSync {
  if (globalThis.__almenaStatusDb) return globalThis.__almenaStatusDb;
  const dir = process.env.STATUS_DATA_DIR ?? path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");
  const database = new DatabaseSync(path.join(dir, "status.db"));
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS samples (
      component TEXT NOT NULL,
      at INTEGER NOT NULL,
      state TEXT NOT NULL,
      latency INTEGER,
      code INTEGER
    );
    CREATE INDEX IF NOT EXISTS samples_component_at ON samples (component, at);
    CREATE TABLE IF NOT EXISTS days (
      component TEXT NOT NULL,
      day INTEGER NOT NULL,
      up INTEGER NOT NULL DEFAULT 0,
      degraded INTEGER NOT NULL DEFAULT 0,
      down INTEGER NOT NULL DEFAULT 0,
      maintenance INTEGER NOT NULL DEFAULT 0,
      latency_sum INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (component, day)
    );
  `);
  globalThis.__almenaStatusDb = database;
  return database;
}

/** Records a sample and adds it to its day. */
export function record(sample: Sample) {
  const database = db();
  database
    .prepare("INSERT INTO samples (component, at, state, latency, code) VALUES (?, ?, ?, ?, ?)")
    .run(sample.component, sample.at, sample.state, sample.latency, sample.code);
  // The state names are the column names: never interpolate anything else.
  const column = sample.state;
  database
    .prepare(
      `INSERT INTO days (component, day, ${column}, latency_sum) VALUES (?, ?, 1, ?)
       ON CONFLICT (component, day) DO UPDATE SET
         ${column} = ${column} + 1, latency_sum = latency_sum + excluded.latency_sum`,
    )
    .run(sample.component, dayOf(sample.at), sample.latency ?? 0);
}

/** Drops raw samples and days older than what is kept. */
export function prune(now = Date.now()) {
  const database = db();
  database.prepare("DELETE FROM samples WHERE at < ?").run(now - SAMPLE_RETENTION);
  database.prepare("DELETE FROM days WHERE day < ?").run(dayOf(now) - historyDays);
}

/** Each component's latest sample. */
export function latestSamples(): Map<string, Sample> {
  const rows = db()
    .prepare(
      `SELECT s.component, s.at, s.state, s.latency, s.code FROM samples s
       JOIN (SELECT component, MAX(at) AS at FROM samples GROUP BY component) last
         ON last.component = s.component AND last.at = s.at`,
    )
    .all() as Sample[];
  return new Map(rows.map((row) => [row.component, row]));
}

/** The tallies of the last `historyDays` days, every component. */
export function dayTallies(now = Date.now()): DayTally[] {
  return db()
    .prepare(
      `SELECT component, day, up, degraded, down, maintenance, latency_sum AS latencySum
       FROM days WHERE day > ? ORDER BY day`,
    )
    .all(dayOf(now) - historyDays) as DayTally[];
}
