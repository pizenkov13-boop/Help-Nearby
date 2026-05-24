import { getSupabase, isSupabaseFetchError } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Review } from "@/lib/types";

const REVIEW_COLUMNS =
  "id, name, country, message, rating, approved, created_at";

export interface SubmitReviewInput {
  name: string;
  country: string;
  message: string;
  rating: number;
}

function formatSupabaseError(error: {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}): string {
  const parts = [
    error.message,
    error.code ? `code=${error.code}` : "",
    error.details ? `details=${error.details}` : "",
    error.hint ? `hint=${error.hint}` : "",
  ].filter(Boolean);
  return parts.join(" | ");
}

export async function fetchApprovedReviews(): Promise<Review[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(REVIEW_COLUMNS)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchApprovedReviews]", formatSupabaseError(error));
      return [];
    }

    return (data as Review[]) ?? [];
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[fetchApprovedReviews] Supabase unreachable — empty list");
    } else {
      console.error("[fetchApprovedReviews]", error);
    }
    return [];
  }
}

/** @deprecated Use fetchApprovedReviews */
export const fetchReviews = fetchApprovedReviews;

export async function submitReview(
  input: SubmitReviewInput,
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  const name = input.name.trim();
  const country = input.country.trim();
  const message = input.message.trim();
  const rating = Math.round(input.rating);

  if (!name || !country || !message) {
    return { ok: false, error: "Name, country, and message are required." };
  }

  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be between 1 and 5." };
  }

  const row = { name, country, message, rating, approved: false as const };

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("reviews")
        .insert(row)
        .select(REVIEW_COLUMNS)
        .single();

      if (error) {
        console.error("[submitReview] admin insert:", formatSupabaseError(error));
        return {
          ok: false,
          error: "Could not save your review. Please try again.",
        };
      }

      return { ok: true, review: data as Review };
    } catch (error) {
      console.error("[submitReview] admin insert exception:", error);
      return {
        ok: false,
        error: "Could not save your review. Please try again.",
      };
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      error: "Reviews are temporarily unavailable. Please try again later.",
    };
  }

  try {
    // Do not .select() after insert: RLS only allows SELECT on approved rows,
    // so RETURNING would fail with 42501 even when INSERT succeeds.
    const { error } = await supabase.from("reviews").insert(row);

    if (error) {
      console.error("[submitReview] anon insert:", formatSupabaseError(error));
      return {
        ok: false,
        error: "Could not save your review. Please try again.",
      };
    }

    return {
      ok: true,
      review: {
        id: 0,
        name,
        country,
        message,
        rating,
        approved: false,
        created_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.error("[submitReview] Supabase unreachable:", error);
      return {
        ok: false,
        error: "Reviews are temporarily unavailable. Please try again later.",
      };
    }
    console.error("[submitReview]", error);
    return { ok: false, error: "Could not save your review. Please try again." };
  }
}
