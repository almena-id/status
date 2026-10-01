import { isType } from "@/app/lib/resources";
import { getStatus } from "@/app/lib/status";

/**
 * The status as JSON, for anyone who wants to read it by program: the same
 * report as the page. `?type=` keeps one type of service, as on the page.
 */
export function GET(request: Request) {
  const asked = new URL(request.url).searchParams.get("type");
  const status = getStatus();
  const types = isType(asked) ? status.types.filter((type) => type.id === asked) : status.types;
  return Response.json(
    {
      ...status,
      updatedAt: new Date(status.updatedAt).toISOString(),
      types: types.map((type) => ({
        ...type,
        resources: type.resources.map((resource) => ({
          ...resource,
          checkedAt: resource.checkedAt && new Date(resource.checkedAt).toISOString(),
          days: resource.days.map((day) => ({
            ...day,
            date: new Date(day.date).toISOString().slice(0, 10),
          })),
        })),
      })),
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}
