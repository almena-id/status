import { cn } from "cn";

/** The Almena mark: three nodes and the links between them, in the brand colour (cyan, the status page's identity). */
export function Logo({
  size = 32,
  title,
  className,
}: {
  size?: number;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      className={cn("flex-none text-primary", className)}
      width={size}
      height={size}
      viewBox="136 136 752 752"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g stroke="currentColor" strokeWidth="24" strokeLinecap="round">
        <line x1="512" y1="237" x2="237" y2="785" />
        <line x1="512" y1="237" x2="785" y2="785" />
        <line x1="237" y1="785" x2="646" y2="507" />
      </g>
      <g fill="currentColor">
        <circle cx="512" cy="237" r="94" />
        <circle cx="237" cy="785" r="94" />
        <circle cx="785" cy="785" r="94" />
      </g>
    </svg>
  );
}
