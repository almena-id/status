import Link from "next/link";

import { copy } from "@/app/copy";
import { Logo } from "./Logo";

/**
 * The bar across the top, 56px tall in every portal (room for the registry's
 * 32px controls) so the brand sits at the same height in all of them.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
      <div className="page-frame flex items-center gap-4 min-h-14 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-brand text-[17px] tracking-tight whitespace-nowrap"
          aria-label={copy.app.name}
        >
          <Logo size={28} />
          <span>
            Almena <strong className="font-semibold">Status</strong>
          </span>
        </Link>
      </div>
    </header>
  );
}
