import { cn } from "cn";

import { copy } from "@/app/copy";
import { formatDay, formatPercent } from "@/app/lib/format";
import type { Day } from "@/app/lib/status";
import { stateBackground } from "./StateMark";

/**
 * One tick per day, oldest on the left, coloured by how the day went; hover
 * a tick for the day, its uptime and its incidents.
 */
export function UptimeBar({
  days,
  summary,
  incidentTitles,
}: {
  days: Day[];
  summary: string;
  incidentTitles: Map<string, string>;
}) {
  return (
    <div className="grid gap-1.5">
      <ol role="img" aria-label={summary} className="flex h-8 items-stretch gap-[2px]">
        {days.map((day, index) => {
          const parts = [
            formatDay(day.date),
            day.uptime === null
              ? copy.bar.noData
              : copy.bar.uptime.replace("{value}", formatPercent(day.uptime)),
            ...day.incidents.map((id) => incidentTitles.get(id) ?? id),
          ];
          return (
            <li
              key={day.date}
              title={parts.join("\n")}
              className={cn(
                "min-w-0 flex-1 rounded-[2px] transition-opacity hover:opacity-70",
                stateBackground[day.state],
                // Fewer ticks where there is little room: the last 30 or 60 days.
                index < days.length - 30 && "max-sm:hidden",
                index < days.length - 60 && "max-lg:hidden",
              )}
            />
          );
        })}
      </ol>
      <div className="flex justify-between text-xs text-faint">
        <span className="sm:hidden">{copy.bar.ago.replace("{days}", "30")}</span>
        <span className="max-sm:hidden lg:hidden">{copy.bar.ago.replace("{days}", "60")}</span>
        <span className="max-lg:hidden">{copy.bar.ago.replace("{days}", String(days.length))}</span>
        <span>{copy.bar.today}</span>
      </div>
    </div>
  );
}
