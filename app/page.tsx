import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleHelpIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { AutoRefresh } from "@/app/components/AutoRefresh";
import { IncidentCard } from "@/app/components/IncidentCard";
import { StateMark, stateBackground } from "@/app/components/StateMark";
import { UptimeBar } from "@/app/components/UptimeBar";
import { Card } from "@/app/components/ui/card";
import { copy } from "@/app/copy";
import { displayUrl, formatPercent, formatTime } from "@/app/lib/format";
import type { Incident } from "@/app/lib/incidents";
import { historyDays, isType, probeInterval } from "@/app/lib/resources";
import { getStatus, type Overall } from "@/app/lib/status";

/** Past incidents shown here; the rest are in /history. */
const RECENT_DAYS = 7;

const overallIcon: Record<Overall, typeof CheckCircle2Icon> = {
  operational: CheckCircle2Icon,
  degraded: CircleAlertIcon,
  partial: CircleAlertIcon,
  major: CircleAlertIcon,
  maintenance: WrenchIcon,
  unknown: CircleHelpIcon,
};

/**
 * The network's status now, each resource's last 90 days and its incidents.
 * `?type=` keeps one type of service: Almena's and third parties' alike.
 */
export default async function StatusPage({ searchParams }: PageProps<"/">) {
  const asked = (await searchParams).type;
  const filter = isType(asked) ? asked : null;
  const status = getStatus();
  const shown = filter ? status.types.filter((type) => type.id === filter) : status.types;
  const overall = filter ? (shown[0]?.overall ?? "unknown") : status.overall;
  const Icon = overallIcon[overall];

  const visible = new Set(shown.flatMap((type) => type.resources.map((resource) => resource.id)));
  const names = new Map(
    status.types.flatMap((type) => type.resources.map((resource) => [resource.id, resource.name])),
  );
  const relevant = (incident: Incident) =>
    !filter || incident.components.some((id) => visible.has(id));
  const active = status.active.filter(relevant);
  const upcoming = status.upcoming.filter(relevant);
  const recent = status.past.filter(
    (incident) =>
      relevant(incident) && incident.starts >= status.updatedAt - RECENT_DAYS * 86_400_000,
  );
  const titles = new Map(
    [...status.active, ...status.upcoming, ...status.past].map((i) => [i.id, i.title]),
  );

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8">
      <AutoRefresh seconds={probeInterval()} />
      <header className="grid gap-1">
        <h1 className="text-[28px] font-bold tracking-tight">{copy.home.title}</h1>
        <p className="text-muted-foreground">
          {copy.home.lead.replace("{days}", String(historyDays))}
        </p>
      </header>

      <nav aria-label={copy.home.filter} className="flex flex-wrap gap-2">
        <FilterLink href="/" current={filter === null} label={copy.home.all} state={status.overall} />
        {status.types.map((type) => (
          <FilterLink
            key={type.id}
            href={`/?type=${type.id}`}
            current={filter === type.id}
            label={copy.types[type.id]}
            state={type.overall}
            count={type.resources.length}
          />
        ))}
      </nav>

      <div
        role="status"
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-2xl px-6 py-5 text-lg font-semibold text-background shadow-card",
          stateBackground[overall],
          overall === "unknown" && "text-foreground",
        )}
      >
        <Icon className="size-6 flex-none" aria-hidden />
        <span className="flex-1">{copy.overall[overall]}</span>
        <span className="text-sm font-normal opacity-85">
          {copy.home.updated.replace("{time}", formatTime(status.updatedAt))}
        </span>
      </div>

      {active.length > 0 && (
        <Section title={copy.incidents.active}>
          {active.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} names={names} />
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title={copy.incidents.upcoming}>
          {upcoming.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} names={names} />
          ))}
        </Section>
      )}

      {shown.length === 0 && (
        <p className="rounded-xl border border-dashed px-5 py-6 text-center text-sm text-faint">
          {copy.home.empty}
        </p>
      )}

      {shown.map((type) => (
        <Section key={type.id} title={copy.types[type.id]}>
          <Card className="gap-0 divide-y p-0">
            {type.resources.map((resource) => {
              const uptime = resource.uptime === null ? null : formatPercent(resource.uptime);
              return (
                <div key={resource.id} className="grid gap-3 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="grid min-w-0 gap-0.5">
                      <h3 className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                        {resource.name}
                        <span className="text-xs font-normal text-faint">
                          {copy.home.by.replace("{operator}", resource.operator)}
                        </span>
                      </h3>
                      <a
                        href={resource.url}
                        className="inline-flex items-center gap-0.5 justify-self-start text-sm break-all text-primary hover:underline"
                      >
                        {displayUrl(resource.url)}
                        <ArrowUpRightIcon className="size-3.5 flex-none" aria-hidden />
                      </a>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {resource.latency !== null && !["major", "unknown"].includes(resource.state) && (
                        <span className="text-xs text-faint tabular-nums">
                          {copy.bar.latency.replace("{value}", String(resource.latency))}
                        </span>
                      )}
                      <StateMark state={resource.state} label={copy.state[resource.state]} />
                    </div>
                  </div>
                  <UptimeBar
                    days={resource.days}
                    summary={copy.bar.summary
                      .replace("{name}", resource.name)
                      .replace("{value}", uptime ?? "—")
                      .replace("{days}", String(historyDays))}
                    incidentTitles={titles}
                  />
                  <p className="text-right text-xs text-muted-foreground tabular-nums">
                    {uptime === null ? copy.bar.noData : copy.bar.uptime.replace("{value}", uptime)}
                  </p>
                </div>
              );
            })}
          </Card>
        </Section>
      ))}

      <Section title={copy.incidents.past}>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed px-5 py-6 text-center text-sm text-faint">
            {copy.incidents.none.replace("{days}", String(RECENT_DAYS))}
          </p>
        ) : (
          recent.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} names={names} />
          ))
        )}
        <Link
          href="/history"
          className="justify-self-start text-sm font-medium text-primary hover:underline"
        >
          {copy.incidents.all.replace("{days}", String(historyDays))} →
        </Link>
      </Section>
    </div>
  );
}

/** One button of the type filter, with that type's state and its number of resources. */
function FilterLink({
  href,
  current,
  label,
  state,
  count,
}: {
  href: string;
  current: boolean;
  label: string;
  state: Overall;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      scroll={false}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        current
          ? "border-primary bg-brand-soft text-foreground"
          : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span className={cn("size-2 rounded-full", stateBackground[state])} aria-hidden />
      {label}
      {count !== undefined && <span className="text-xs text-faint tabular-nums">{count}</span>}
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
