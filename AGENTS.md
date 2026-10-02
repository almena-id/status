<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# status

The status page of the Almena Network, `https://status.almena.id`
(`NEXT_PUBLIC_STATUS_WEB_URL`): whether each service of the network works
now and how it did over the last 90 days, plus the incidents and maintenance
written by hand. Nobody signs in here. Everything is written in English, and
the page is in English only, always dark. Use
`task` for everything (`task --list`); `task check` must pass before
finishing.

- It depends on nothing it watches: it probes the public names itself and
  keeps its history in its own SQLite (`node:sqlite`, `STATUS_DATA_DIR`). Never
  make it read the API, its database or anything else of the platform; it is
  meant to run away from it (another host or provider).
- What is watched is data, not code: `config/resources.json`
  (`STATUS_RESOURCES_FILE`), read on every use. Each resource has an id, a
  name, a type, its operator (Almena, or a third party that provides it for
  public use, e.g. a mediator), a description, its public `url` (shown) and
  its `probe`. The types are fixed in `app/lib/resources.ts` (`types`) and
  are what the filter at the top of `/` offers (`?type=`).
- `instrumentation.ts` starts the probe loop (`app/lib/monitor.ts`) once per
  server, never during `next build`. A failure counts once it repeats
  (`failuresToDown`); 2xx slower than `STATUS_SLOW_MS` is degraded; a 503
  whose JSON says `"status": "degraded"` is degraded (the mediator without
  Redis). Redirects fail, except where a component sets `follow` (the website).
- `app/lib/store.ts`: raw samples for two days, and one row per component and
  UTC day (`days`) for the 90-day bars. `app/lib/status.ts` builds the report
  that `/` and `/api/status.json` show.
- Incidents and maintenance are Markdown files in `incidents/`
  (`STATUS_INCIDENTS_DIR`), read on every request; the format is in
  `incidents/README.md`; `components` there are resource ids. An open
  incident sets its resources' state
  (`minor` degraded, `major` outage); failed probes inside a maintenance
  window count as maintenance, not downtime.
- `/api/status.json` is public (CORS `*`): keep its shape stable, it is
  what anything built on the status later will read.
- `app/health/route.ts` is the Docker health check: keep it dependency-free.
- `output: "standalone"` in `next.config.ts` is what the Dockerfile ships.
- Every user-facing text is in `app/copy.ts`, in English: no language
  selector. Times are shown in UTC: the server does not know the visitor's
  zone.
- Always dark: `<html class="dark">`, no theme selector; `app/globals.css`
  has only the dark palette.
- Violet is the status page's identity (the catalog is blue, the registry and
  the wallet orange), leaving the states their colours (`--state-*`: green,
  amber, orange, red, blue). `app/globals.css`
  holds only the theme and is the only place a colour is written
  (`app/icon.svg` aside).
- The interface is shadcn/ui (`components.json`, Radix base), copied from the
  catalog with its Almena variants: components in `app/components/ui` (add
  more with `npx shadcn add <name>`, the CLI pinned in devDependencies),
  Tailwind utilities, `cn` from the `cn` package, icons from `lucide-react`.
- Never delete `.next` while a dev server may be running: it breaks it (500s).
