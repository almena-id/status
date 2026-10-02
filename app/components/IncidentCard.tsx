import { cn } from "cn";

import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { copy } from "@/app/copy";
import { formatTime } from "@/app/lib/format";
import type { Incident } from "@/app/lib/incidents";
import { stateBackground } from "./StateMark";

const impactState = { minor: "degraded", major: "major", maintenance: "maintenance" } as const;

/** An incident or a maintenance window: its title, what it touches and every update. */
export function IncidentCard({
  incident,
  names,
}: {
  incident: Incident;
  /** Each resource's name, by id. */
  names: Map<string, string>;
}) {
  const text = copy.incidents;
  return (
    <Card id={incident.id} className="scroll-mt-24 gap-4 overflow-hidden p-0">
      <div className="flex">
        <span
          className={cn("w-1.5 flex-none", stateBackground[impactState[incident.impact]])}
          aria-hidden
        />
        <div className="grid flex-1 gap-4 p-5">
          <header className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{incident.title}</h3>
              <Badge variant="muted">{text.impact[incident.impact]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {text.window
                .replace("{start}", formatTime(incident.starts))
                .replace("{end}", incident.ends === null ? "…" : formatTime(incident.ends))}
            </p>
            {incident.components.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {text.affects}:{" "}
                {incident.components.map((id) => names.get(id) ?? id).join(", ")}
              </p>
            )}
          </header>
          {incident.updates.length > 0 && (
            <ol className="grid gap-3 border-l pl-4">
              {incident.updates.map((update) => (
                <li key={update.at} className="grid gap-1">
                  <p className="text-sm">
                    <strong className="font-semibold">{text.updates[update.state]}</strong>
                    <span className="font-mono text-faint"> · {formatTime(update.at)}</span>
                  </p>
                  {update.body.split(/\n\s*\n/).map((paragraph, index) => (
                    <p key={index} className="text-sm whitespace-pre-line text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Card>
  );
}
