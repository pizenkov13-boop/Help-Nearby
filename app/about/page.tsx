import type { Metadata } from "next";
import { AboutContent } from "@/components/pages/AboutContent";

export const metadata: Metadata = {
  title: "About Us — Help Nearby",
  description:
    "Learn about Help Nearby and our mission to connect people with local assistance.",
};

export default function AboutPage() {
  return <AboutContent />;
}
