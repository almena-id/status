import type { Metadata } from "next";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";

import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { copy } from "./copy";
import { historyDays } from "./lib/resources";
import "./globals.css";

// The typefaces, self-hosted by next/font (downloaded when building, never
// from Google by the visitor): Chakra Petch for the brand and the headings,
// Inter for the interface, JetBrains Mono for figures and times. globals.css
// turns their variables into font-brand, font-sans and font-mono.
const brand = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-chakra-petch" });
const ui = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_STATUS_WEB_URL ?? "https://status.almena.id"),
  title: { default: copy.app.name, template: `%s · ${copy.app.name}` },
  description: copy.home.lead.replace("{days}", String(historyDays)),
};

/** The document, always dark: header, the page and the footer. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${brand.variable} ${ui.variable} ${mono.variable}`}>
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
