# almena-status

The status page of Almena ID, published at `https://status.almena.id`: whether each service of the network — the identity domain, mediators, APIs, agents and portals, whether Almena runs them or a third party provides them for public use — works right now, how it did over the last 90 days, and the incidents and maintenance announced by hand. In English, always dark. Built with [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript and Tailwind CSS 4.

It depends on nothing it watches: it probes the platform's public names itself, every minute, and keeps the history in its own SQLite database. Run it away from the platform (another host or provider), so that it stays up, and sees the outage, when the platform does not.

## Quick start

Needs Node.js 24 or later, [Task](https://taskfile.dev) and Docker.

```bash
task init   # .env from .env.example
task dev    # the status page with hot reload on http://localhost:3200
```

To run the production build in Docker instead:

```bash
task up      # builds the image and starts it
task health  # {"status":"ok","version":"dev"}
```

Every merge into `main` publishes the image `ghcr.io/almena-id/status` (amd64 and arm64) with a `year.month.sequence` version (e.g. `2026.10.1`, the sequence restarting each month), also tagged `latest` and `sha-<commit>`; the commit gets the git tag `v<version>`. Run it with `config/` and `incidents/` mounted over `/app/config` and `/app/incidents`, and a volume on `/data`, as [compose.yml](compose.yml) does.

To run that published image (`latest`) in production, from this checkout:

```bash
task prod:up    # pulls ghcr.io/almena-id/status:latest and starts it on port 3200
task prod:down  # stops it; the history volume is kept
```

[compose-prod.yml](compose-prod.yml) holds every value it needs: it reads nothing from `.env` or the environment, so change the values there.

## What is watched

[config/resources.json](config/resources.json), read on every use (Docker mounts the `config` folder): adding a service, Almena's or a third party's, is adding an entry.

```json
{
  "id": "mediator",
  "name": "Almena Mediator",
  "type": "mediator",
  "operator": "Almena",
  "description": "Public DIDComm mediator, the network's default",
  "url": "https://mediator.almena.id",
  "probe": "https://mediator.almena.id/health"
}
```

- `type` is one of `identity`, `mediator`, `api`, `agent`, `portal`: the page lists the services by type and filters by it (`/?type=mediator`).
- `url` is the service's public address, shown and linked; `probe` is what is GET.
- `follow: true` follows redirects; otherwise a redirect is a failure (did:web must answer directly).
- An entry with a missing field, an unknown type or a repeated `id` is skipped and logged.

A service is operational on 2xx, degraded when slower than `STATUS_SLOW_MS` (or on a 503 whose JSON says `"status": "degraded"`, as the mediator's does without Redis), and down after two failures in a row.

The history is bounded: raw samples are kept two days, and one row per service and day for 90 days; older rows are deleted every hour.

## Incidents and maintenance

One Markdown file each in [incidents/](incidents/README.md), shown as soon as it is saved (Docker mounts the folder). The format is in [incidents/README.md](incidents/README.md).

## Configuration

Read from the environment or `.env`; [.env.example](.env.example) explains every one.

| Variable | Default | |
|---|---|---|
| `NEXT_PUBLIC_STATUS_WEB_URL` | `https://status.almena.id` | Public origin of the page, for metadata; inlined at build time |
| `STATUS_WEB_PORT` | `3200` | Port of the page on the host |
| `STATUS_PROBE_INTERVAL_SECONDS` | `60` | Seconds between two rounds of probes |
| `STATUS_PROBE_TIMEOUT_MS` | `10000` | A probe slower than this fails |
| `STATUS_SLOW_MS` | `2000` | A probe slower than this is degraded |
| `STATUS_RESOURCES_FILE` | `./config/resources.json` | What is watched |
| `STATUS_DATA_DIR` | `./data` (`/data` in Docker) | Where the history (SQLite) is kept |
| `STATUS_INCIDENTS_DIR` | `./incidents` | Where the incidents are read from |

## Endpoints

| | |
|---|---|
| `GET /` | The status: overall, each service with its 90 days, ongoing and recent incidents; `?type=` filters |
| `GET /history` | Every incident of the last 90 days |
| `GET /api/status.json` | The same report as JSON; `?type=` filters |
| `GET /health` | Liveness and the running version, used by the Docker health check |
| `GET /.well-known/security.txt` | Where to report a vulnerability ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)): this repository's private advisories; `Expires` stays 180 days ahead |

## Development

`task --list` shows every task. Before sending a change, `task check` (ESLint, TypeScript and a production build) must pass; see [CONTRIBUTING.md](CONTRIBUTING.md). This Next.js version differs from older ones: [AGENTS.md](AGENTS.md) points to the documentation bundled in `node_modules/next/dist/docs/`.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
