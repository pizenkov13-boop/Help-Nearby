import type { Metadata, Viewport } from "next";
import { VercelAnalytics } from "@/components/providers/VercelAnalytics";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AppProviders } from "@/components/providers/AppProviders";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { fontVariableClasses } from "./fonts";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/siteConfig";

const SITE_URL = siteConfig.url;
const SITE_TITLE = `${siteConfig.name} — Find Help Near You`;
const SITE_DESCRIPTION =
  "Discover food banks, shelters, medical aid, clothing donations, and volunteer opportunities near you.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Help Nearby",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Help Nearby" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Help Nearby",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets env(safe-area-inset-*) work on notched iPhones.
  viewportFit: "cover",
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
      className={cn("font-sans", ...fontVariableClasses)}
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
        <VercelAnalytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
