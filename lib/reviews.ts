import { supabase } from "@/lib/supabase";
import type { Review } from "@/lib/types";

const REVIEW_COLUMNS =
  "id, name, country, message, rating, approved, created_at";

export interface SubmitReviewInput {
  name: string;
  country: string;
  message: string;
  rating: number;
}

export async function fetchApprovedReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchApprovedReviews]", error.message);
    return [];
  }

  return (data as Review[]) ?? [];
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

  const { data, error } = await supabase
    .from("reviews")
    .insert({ name, country, message, rating, approved: false })
    .select(REVIEW_COLUMNS)
    .single();

  if (error) {
    console.error("[submitReview]", error.message);
    return { ok: false, error: "Could not save your review. Please try again." };
  }

  return { ok: true, review: data as Review };
}
