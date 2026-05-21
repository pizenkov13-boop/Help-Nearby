import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { AnalyticsLoader } from "@/components/providers/AnalyticsLoader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Help Nearby — Find Help Near You",
  description:
    "Discover food banks, shelters, medical aid, clothing donations, and volunteer opportunities near you.",
  applicationName: "Help Nearby",
};

export const viewport: Viewport = {
  themeColor: "#0a0f1f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark font-sans bg-[#0a0f1f] text-slate-100",
        dmSans.variable,
        newsreader.variable,
      )}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-192.png"
          sizes="192x192"
        />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-512.png"
          sizes="512x512"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Help Nearby" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#0a0f1f] bg-surface font-sans text-slate-100 antialiased"
      >
        <AppProviders>{children}</AppProviders>
        <AnalyticsLoader />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
