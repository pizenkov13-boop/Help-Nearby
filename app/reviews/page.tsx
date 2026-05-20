import type { Metadata } from "next";
import { ReviewsPage } from "@/components/pages/ReviewsPage";

export const metadata: Metadata = {
  title: "Reviews & Suggestions — Help Nearby",
  description: "Share your feedback and suggestions to improve Help Nearby.",
};

export default function Reviews() {
  return <ReviewsPage />;
}
