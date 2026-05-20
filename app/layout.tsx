import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AppProviders } from "@/components/providers/AppProviders";
import { SuspendedPostHogPageView } from "@/components/providers/PostHogPageView";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Help Nearby — Find Help Near You",
  description:
    "Discover food banks, shelters, medical aid, clothing donations, and volunteer opportunities near you.",
  applicationName: "Help Nearby",
};

export const viewport: Viewport = {
  themeColor: "#007bff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geistSans.variable)}>
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
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
        <AppProviders>
          <SuspendedPostHogPageView />
          {children}
        </AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
