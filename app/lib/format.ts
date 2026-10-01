/** A moment, in UTC: the server does not know the visitor's time zone. */
export function formatTime(at: number): string {
  return `${new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(at)} UTC`;
}

/** A day (midnight UTC). */
export function formatDay(at: number): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(at);
}

/** A share (0–1) as a percentage, never rounded up to 100 while short of it. */
export function formatPercent(share: number): string {
  const value = Math.floor(share * 10000) / 100;
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
}

/** A resource's address without the scheme, as shown. */
export const displayUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
