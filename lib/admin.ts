import type { DbOrganization } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

export async function fetchUnverifiedOrganizations(): Promise<DbOrganization[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("verified", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchUnverifiedOrganizations]", error.message);
    throw new Error(error.message);
  }

  return (data as DbOrganization[]) ?? [];
}

export async function verifyOrganizationById(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is required in .env.local to verify organizations.",
    };
  }

  const { error } = await admin
    .from("organizations")
    .update({ verified: true })
    .eq("id", id)
    .eq("verified", false);

  if (error) {
    console.error("[verifyOrganizationById]", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
