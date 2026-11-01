import type { Metadata } from "next";
import { AboutContent } from "@/components/pages/AboutContent";
import { CopyAboutContent } from "@/components/pages/CopyAboutContent";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = siteConfig.isCopy
  ? {
      title: `About — ${siteConfig.name}`,
      description: "Find free help near you: food, shelter, medical aid, clothing and volunteering.",
    }
  : {
      title: "About Us — Help Nearby",
      description:
        "Learn about Help Nearby and our mission to connect people with local assistance.",
    };

export default function AboutPage() {
  return siteConfig.isCopy ? <CopyAboutContent /> : <AboutContent />;
}
