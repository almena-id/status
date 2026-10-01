# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub: on
[almena-id/status](https://github.com/almena-id/status),
open the **Security** tab and choose **Report a vulnerability**. Do not open a
public issue, pull request or discussion about it.

Include what you can of:

- the version or commit, and the browser if relevant;
- what an attacker can do, and under which configuration;
- steps or a proof of concept to reproduce it.

We aim to acknowledge a report within 3 working days and to agree on a
disclosure date with you once the issue is understood. We credit reporters in
the release notes unless you prefer otherwise.

## Supported versions

The project is before its first release: only the `main` branch receives
security fixes.

## Scope

In scope, among others:

- cross-site scripting, open redirects and other injection in the portal;
- an issuer's published texts rendered as markup, or a service shown under
  an issuer that did not publish it;
- secrets or server-only data reaching the browser bundle;
- server components or route handlers that can be abused to reach other
  hosts (SSRF).

Out of scope:

- the development setup (`task dev`, `.env.example`);
- issues in [api](https://github.com/almena-id/api) or
  [registry](https://github.com/almena-id/registry) themselves: report them
  there;
- denial of service through sheer traffic volume.
