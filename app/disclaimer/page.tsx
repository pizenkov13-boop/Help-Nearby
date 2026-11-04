import type { Metadata } from "next";
import { DisclaimerContent } from "@/components/pages/DisclaimerContent";
import { absoluteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: `Disclaimer — ${siteConfig.name}`,
  description:
    "The information is for reference only and may be inaccurate or out of date. Check by phone or on the organization's website before you go.",
  alternates: { canonical: absoluteUrl("/disclaimer") },
};

export default function DisclaimerPage() {
  return <DisclaimerContent />;
}
