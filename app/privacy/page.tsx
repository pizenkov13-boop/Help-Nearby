import type { Metadata } from "next";
import { CopyPrivacyContent } from "@/components/pages/CopyPrivacyContent";
import { PrivacyContent } from "@/components/pages/PrivacyContent";
import { absoluteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = siteConfig.isCopy
  ? {
      title: `Privacy — ${siteConfig.name}`,
      description: "What this site does and does not collect. No accounts.",
      alternates: { canonical: absoluteUrl("/privacy") },
    }
  : {
      title: "Privacy — Help Nearby",
      description:
        "What Help Nearby collects, which services receive data, and what the forms store. No accounts, no tracking cookies.",
      alternates: { canonical: "https://www.help-nearby.org/privacy" },
    };

export default function PrivacyPage() {
  return siteConfig.isCopy ? <CopyPrivacyContent /> : <PrivacyContent />;
}
