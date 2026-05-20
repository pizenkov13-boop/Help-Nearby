import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/AboutPage";

export const metadata: Metadata = {
  title: "About Us — Help Nearby",
  description: "Learn about Help Nearby and our mission to connect people with local assistance.",
};

export default function About() {
  return <AboutPage />;
}
