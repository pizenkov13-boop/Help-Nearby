import type { Metadata } from "next";
import { AdminPage } from "@/components/pages/AdminPage";

export const metadata: Metadata = {
  title: "Admin — Help Nearby",
  robots: { index: false, follow: false },
};

export default function AdminRoutePage() {
  return <AdminPage />;
}
