import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import { ReviewsPage } from "@/components/pages/ReviewsPage";

export const metadata: Metadata = {
  title: "Reviews & Suggestions — Help Nearby",
  description: "Share your feedback and suggestions to improve Help Nearby.",
};

export default function Reviews() {
  if (siteConfig.isCopy) notFound();
  return <ReviewsPage />;
}
