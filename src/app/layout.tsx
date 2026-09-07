import type { Metadata, Viewport } from "next";
import { Silkscreen } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { env } from "@/lib/env";

const mark = Silkscreen({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mark", display: "swap" });

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9edf3" },
    { media: "(prefers-color-scheme: dark)", color: "#121417" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "exams.ro", template: "%s · exams.ro" },
  description: "Arhiva subiectelor de examen de la Politehnica București, Facultatea de Automatică și Calculatoare.",
  openGraph: { siteName: "exams.ro", locale: "ro_RO", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={mark.variable}>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#continut"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-on-ink"
        >
          Sari la conținut
        </a>
        <SiteHeader />
        <main id="continut" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
