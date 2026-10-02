// Liveness probe for Docker and load balancers, with the running version
// (year.month.sequence, set when the image is built; "dev" otherwise).
export function GET() {
  return Response.json({ status: "ok", version: process.env.ALMENA_VERSION ?? "dev" });
}
