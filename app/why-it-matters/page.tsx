import type { Metadata } from "next";
import { WhyItMattersContent } from "@/components/pages/WhyItMattersContent";

export const metadata: Metadata = {
  title: "Why It Matters — Help Nearby",
  description:
    "Why quick access to nearby help resources changes lives in crisis.",
};

export default function WhyItMattersPage() {
  return <WhyItMattersContent />;
}
