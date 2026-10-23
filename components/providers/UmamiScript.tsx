import Script from "next/script";
import { isUmamiConfigured } from "@/lib/umami.client";

/**
 * Umami tracker. Renders nothing unless both NEXT_PUBLIC_UMAMI_WEBSITE_ID and
 * NEXT_PUBLIC_UMAMI_SRC are set. Cookie-less; query strings and hashes are not sent;
 * the browser's Do Not Track setting is respected.
 */
export function UmamiScript() {
  if (!isUmamiConfigured()) return null;

  return (
    <Script
      src={process.env.NEXT_PUBLIC_UMAMI_SRC!.trim()}
      data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID!.trim()}
      data-do-not-track="true"
      data-exclude-search="true"
      data-exclude-hash="true"
      strategy="afterInteractive"
    />
  );
}
