import { copy } from "@/app/copy";
import { Logo } from "./Logo";

/** The foot of every page. */
export function SiteFooter() {
  return (
    <footer className="border-t text-sm text-muted-foreground">
      <div className="page-frame flex flex-wrap items-center justify-between gap-4 py-5">
        <span className="inline-flex items-center gap-2 text-foreground">
          <Logo size={18} />
          {copy.app.name}
        </span>
        <span>
          © {new Date().getFullYear()} {copy.footer.rights} ·{" "}
          <a href="https://almena.id" className="hover:text-foreground hover:underline">
            {copy.footer.site}
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/almena-id/status"
            className="hover:text-foreground hover:underline"
          >
            GitHub
          </a>{" "}
          ·{" "}
          <a href="/api/status.json" className="hover:text-foreground hover:underline">
            {copy.footer.feed}
          </a>
        </span>
      </div>
    </footer>
  );
}
