import type { Metadata } from "next";
import { AdminPage } from "@/components/pages/AdminPage";
import { getAdminPassword, isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Admin — Help Nearby",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminRoutePage() {
  const authenticated = await isAdminAuthenticated();

  return (
    <AdminPage
      initialAuthenticated={authenticated}
      initialConfigured={Boolean(getAdminPassword())}
      initialCanVerify={Boolean(getSupabaseAdmin())}
    />
  );
}
