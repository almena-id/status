import { cn } from "cn";

import type { State } from "@/app/lib/status";

/** Each state's colour, as Tailwind classes (the tokens are in globals.css). */
export const stateBackground: Record<State | "none", string> = {
  operational: "bg-state-operational",
  degraded: "bg-state-degraded",
  partial: "bg-state-partial",
  major: "bg-state-major",
  maintenance: "bg-state-maintenance",
  unknown: "bg-state-none",
  none: "bg-state-none",
};

export const stateText: Record<State, string> = {
  operational: "text-state-operational",
  degraded: "text-state-degraded",
  partial: "text-state-partial",
  major: "text-state-major",
  maintenance: "text-state-maintenance",
  unknown: "text-faint",
};

/** A component's state: a dot in its colour and its name. */
export function StateMark({ state, label }: { state: State; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", stateText[state])}>
      <span className={cn("size-2 rounded-full", stateBackground[state])} aria-hidden />
      {label}
    </span>
  );
}
