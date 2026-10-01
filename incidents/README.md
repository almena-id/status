# Incidents and maintenance

One Markdown file per incident or maintenance window, published on the status
page as soon as it is saved here (the page reads this folder on every
request; in Docker it is mounted read-only). Remove a file to unpublish it.

- `<id>.md` — the incident, in English. The id is the file name: lowercase
  letters, digits and hyphens (`2026-10-01-mediator-down`).

```markdown
---
title: Messages are not being delivered
impact: major             # minor | major | maintenance
components: mediator, api # resource ids, from ../resources.json
starts: 2026-10-01T10:00:00Z
ends: 2026-10-01T11:20:00Z # when it was resolved; leave it out while open
---

## 2026-10-01T11:20:00Z resolved
Redis is back and the queued messages have been delivered.

## 2026-10-01T10:05:00Z investigating
The mediator cannot reach its storage. We are looking into it.
```

- `components` are the `id`s of the affected resources in
  [resources.json](../resources.json).
- `impact` decides how the resources named in `components` are shown while
  it is open: `minor` as degraded, `major` as an outage, `maintenance` as
  maintenance.
- For `maintenance`, `starts` and `ends` are the window. Before it opens it is
  listed as scheduled; inside it, failed probes of its resources count as
  maintenance, not as downtime.
- Each update is a `## <ISO 8601 time> <state>` heading and its text. States:
  `investigating`, `identified`, `monitoring`, `resolved` for incidents;
  `scheduled`, `in_progress`, `completed` for maintenance. Their order in the
  file does not matter.
- Times are UTC (`Z`). A file with an unknown `impact` or an unreadable
  `starts` is skipped.
