// Liveness probe for Docker and load balancers.
export function GET() {
  return Response.json({ status: "ok" });
}
