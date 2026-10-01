import type { Metadata } from "next";

import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { copy } from "./copy";
import { historyDays } from "./lib/resources";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_STATUS_WEB_URL ?? "https://status.almena.id"),
  title: { default: copy.app.name, template: `%s · ${copy.app.name}` },
  description: copy.home.lead.replace("{days}", String(historyDays)),
};

/** The document, always dark: header, the page and the footer. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="shell relative isolate flex min-h-dvh flex-col">
          <SiteHeader />
          <main className="page-frame flex flex-1 flex-col pt-8 pb-12">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
