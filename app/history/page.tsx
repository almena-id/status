import type { Metadata } from "next";
import Link from "next/link";

import { IncidentCard } from "@/app/components/IncidentCard";
import { copy } from "@/app/copy";
import { historyDays } from "@/app/lib/resources";
import { getStatus } from "@/app/lib/status";

export const metadata: Metadata = { title: copy.incidents.history };

/** Every incident and maintenance window of the history, newest first. */
export default function HistoryPage() {
  const status = getStatus();
  const incidents = [...status.active, ...status.past];
  const names = new Map(
    status.types.flatMap((type) => type.resources.map((resource) => [resource.id, resource.name])),
  );

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <header className="grid gap-1">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          ← {copy.incidents.back}
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight">{copy.incidents.history}</h1>
      </header>
      {incidents.length === 0 ? (
        <p className="rounded-xl border border-dashed px-5 py-10 text-center text-faint">
          {copy.incidents.none.replace("{days}", String(historyDays))}
        </p>
      ) : (
        incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} names={names} />
        ))
      )}
    </div>
  );
}
