import type { DbOrganization } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSupabase, isSupabaseFetchError } from "@/lib/supabase";
import type { Review } from "@/lib/types";

const REVIEW_COLUMNS =
  "id, name, country, message, rating, approved, created_at";

export async function fetchUnverifiedOrganizations(): Promise<DbOrganization[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("verified", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchUnverifiedOrganizations]", error.message);
      return [];
    }

    return (data as DbOrganization[]) ?? [];
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[fetchUnverifiedOrganizations] Supabase unreachable");
      return [];
    }
    console.error("[fetchUnverifiedOrganizations]", error);
    return [];
  }
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

export async function fetchPendingReviews(): Promise<Review[]> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required to load pending reviews.",
    );
  }

  const { data, error } = await admin
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("approved", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchPendingReviews]", error.message);
    throw new Error(error.message);
  }

  return (data as Review[]) ?? [];
}

export async function approveReviewById(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is required in .env.local to moderate reviews.",
    };
  }

  const { error } = await admin
    .from("reviews")
    .update({ approved: true })
    .eq("id", id)
    .eq("approved", false);

  if (error) {
    console.error("[approveReviewById]", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteReviewById(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is required in .env.local to delete reviews.",
    };
  }

  const { error } = await admin.from("reviews").delete().eq("id", id);

  if (error) {
    console.error("[deleteReviewById]", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
