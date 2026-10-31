import type { Metadata } from "next";
import { PrivacyContent } from "@/components/pages/PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy — Help Nearby",
  description:
    "What Help Nearby collects, which services receive data, and what the forms store. No accounts, no tracking cookies.",
  alternates: { canonical: "https://www.help-nearby.org/privacy" },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
