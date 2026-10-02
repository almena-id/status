// Where to report a vulnerability (RFC 9116): privately, through the
// repository's GitHub.
const repository = "https://github.com/almena-id/status";

// security.txt must expire, in less than a year; written on each request, it
// stays this far ahead while the portal runs.
const ttlDays = 180;

export function GET() {
  const expires = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  return new Response(
    [
      `Contact: ${repository}/security/advisories/new`,
      `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}`,
      `Policy: ${repository}/security/policy`,
      "Preferred-Languages: en, es",
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
