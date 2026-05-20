import type { Metadata } from "next";
import { SubmitPage } from "@/components/pages/SubmitPage";

export const metadata: Metadata = {
  title: "Submit Organization — Help Nearby",
  description:
    "Submit a local assistance organization to Help Nearby for review and listing.",
};

export default function Submit() {
  return <SubmitPage />;
}
