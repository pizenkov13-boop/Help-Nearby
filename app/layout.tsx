import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { AnalyticsLoader } from "@/components/providers/AnalyticsLoader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AppProviders } from "@/components/providers/AppProviders";
import "leaflet/dist/leaflet.css";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Help Nearby",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={cn("font-sans", dmSans.variable, newsreader.variable)}
    >
      <head>
        <script src="/chunk-recovery.js" />
        <script src="/theme-init.js" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-surface font-sans text-foreground transition-[background-color] duration-300"
      >
        <AppProviders>{children}</AppProviders>
        <AnalyticsLoader />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
