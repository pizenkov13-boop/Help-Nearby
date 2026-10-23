import { LANGUAGES, translations } from "@/lib/i18n/translations";
import type { LanguageCode } from "@/lib/types";

/** The name is a nickname, not a real-name field: short, and never required. */
export const MAX_REVIEW_NAME_LENGTH = 60;

export interface ReviewInput {
  /** Optional name or nickname. */
  name?: string;
  country: string;
  message: string;
  rating: number;
  /** UI language of the submitter; picks the "Anonymous" fallback. */
  language?: string;
}

export interface ReviewRow {
  name: string;
  country: string;
  message: string;
  rating: number;
  approved: false;
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value);
}

/** "Anonymous" in the submitter's language (English when unknown). */
export function anonymousReviewerName(language?: unknown): string {
  return translations[isLanguageCode(language) ? language : "en"].reviewAnonymous;
}

/** What is shown for a stored name: the name, or the fallback when it is empty (also for old rows). */
export function displayReviewerName(name: string | null | undefined, fallback: string): string {
  return name?.trim() || fallback;
}

/**
 * Validates a review. Country and message are required; the name is optional. The `name` column
 * is NOT NULL and the insert policy needs a non-empty value, so an empty name is stored as the
 * "Anonymous" word of the submitter's language.
 */
export function prepareReview(
  input: ReviewInput,
): { ok: true; row: ReviewRow } | { ok: false; error: string } {
  const country = input.country.trim();
  const message = input.message.trim();
  const rating = Math.round(input.rating);

  if (!country || !message) {
    return { ok: false, error: "Country and message are required." };
  }

  if (!(rating >= 1 && rating <= 5)) {
    return { ok: false, error: "Rating must be between 1 and 5." };
  }

  const name = (input.name ?? "").trim().slice(0, MAX_REVIEW_NAME_LENGTH).trim();

  return {
    ok: true,
    row: {
      name: name || anonymousReviewerName(input.language),
      country,
      message,
      rating,
      approved: false,
    },
  };
}
