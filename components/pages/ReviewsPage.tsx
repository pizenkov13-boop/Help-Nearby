"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { ReviewCard } from "@/components/ReviewCard";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { MAX_REVIEW_NAME_LENGTH } from "@/lib/reviewInput";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReviewsPage() {
  const { t, language } = useLanguage();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as Review[];
      setReviews(data);
    } catch (err) {
      console.error("[ReviewsPage]", err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The name is optional: only country and message are required.
    if (!country.trim() || !message.trim()) {
      setError(t("reviewsFormRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          language,
          country: country.trim(),
          message: message.trim(),
          rating,
        }),
      });

      const data = (await res.json()) as Review | { error?: string };

      if (!res.ok) {
        setError(
          "error" in data && data.error
            ? data.error
            : "Could not submit review.",
        );
        return;
      }

      setSubmitted(true);
      setName("");
      setCountry("");
      setRating(5);
      setMessage("");
      window.setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error("[ReviewsPage submit]", err);
      setError("Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        compact
        gradient
        title={t("reviewsTitle")}
        subtitle={t("reviewsSubtitle")}
      />

      <section className="page-section page-section-compact" id="review-form">
        <div className="container" style={{ maxWidth: "36rem" }}>
          <div className="reviews-form-card">
            {submitted && (
              <p
                className="mb-5 rounded-brand border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-center text-teal-800 dark:text-brand-emerald"
                role="status"
              >
                {t("reviewsFormSuccess")}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}

              <div>
                <label htmlFor="review-name">{t("reviewsFormName")}</label>
                <input
                  id="review-name"
                  type="text"
                  value={name}
                  maxLength={MAX_REVIEW_NAME_LENGTH}
                  autoComplete="nickname"
                  aria-describedby="review-name-hint"
                  placeholder={t("reviewsFormNamePlaceholder")}
                  onChange={(e) => setName(e.target.value)}
                />
                <p
                  id="review-name-hint"
                  className="mt-1 text-xs text-[var(--text-muted)]"
                >
                  {t("reviewsFormNameHint")}
                </p>
              </div>

              <div>
                <label htmlFor="review-country">{t("reviewsFormCountry")}</label>
                <input
                  id="review-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Sudan, Yemen, Haiti"
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-[var(--text-muted)]">
                  {t("reviewsFormRating")}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="flex h-11 w-11 items-center justify-center rounded transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                      aria-label={`${n} stars`}
                    >
                      <Star
                        className={cn(
                          "h-7 w-7",
                          n <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-gray-600",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="review-message">{t("reviewsFormMessage")}</label>
                <textarea
                  id="review-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="cta"
                style={{ width: "100%" }}
              >
                {submitting ? t("reviewsLoading") : t("reviewsFormSubmit")}
              </button>
            </form>
          </div>

          <div className="mt-8">
            <h2
              className="section-title"
              style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}
            >
              {t("reviewsListTitle")}
            </h2>

            {loadingReviews ? (
              <p className="text-center text-sm text-[var(--text-fade)]">
                {t("reviewsLoading")}
              </p>
            ) : reviews.length === 0 ? (
              <p className="rounded-brand border border-dashed border-[var(--border-soft)] px-6 py-12 text-center text-[var(--text-dim)]">
                {t("reviewsListEmpty")}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
