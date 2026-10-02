# Contributing

Thanks for helping with the Almena ID status page. By taking part you
agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues go
through [SECURITY.md](SECURITY.md), never through public issues.

## Getting started

You need Node.js 24 or later (for `node:sqlite`), [Task](https://taskfile.dev)
and Docker.

```bash
task init    # creates .env from .env.example
task dev     # runs the status page with hot reload
task up      # the production build in Docker
task --list  # everything else
```

## Making a change

- Open an issue first for anything larger than a small fix, so the approach
  can be agreed before the code.
- Everything is written in English: code, comments, docs, commit messages.
- This is Next.js 16: read the relevant guide in
  `node_modules/next/dist/docs/` before relying on what you know of older
  versions (see [AGENTS.md](AGENTS.md)).
- Prefer server components; only mark a component `"use client"` when it needs
  browser state or events.
- Every user-facing text goes through the message catalogues
  (`app/i18n/messages/*.json`), in English and Spanish at least.
- Never put secrets in `NEXT_PUBLIC_*` variables: they are shipped to every
  browser.
- Before sending a change, `task check` must pass: ESLint, TypeScript and a
  production build.

## Pull requests

Keep a pull request to one topic, describe what it changes and why (with a
screenshot for visible changes, in light and dark), and link the issue it
addresses. By contributing you agree that your contribution is licensed under
the [Apache License 2.0](LICENSE), as the rest of the project.
