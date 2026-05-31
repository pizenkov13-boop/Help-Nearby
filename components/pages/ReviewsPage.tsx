"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { ReviewCard } from "@/components/ReviewCard";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReviewsPage() {
  const { t } = useLanguage();
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
    if (!name.trim() || !country.trim() || !message.trim()) {
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
      <PageHero title={t("reviewsTitle")} subtitle={t("reviewsSubtitle")} />

      <section className="page-section">
        <div className="container" style={{ maxWidth: "36rem" }}>
        <div className="reviews-form-card">
          <div className="mb-6 flex items-center gap-2" style={{ color: "#34d399" }}>
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium" style={{ color: "#fff" }}>
              {t("reviewsTitle")}
            </span>
          </div>

          {submitted && (
            <p
              className="mb-5 rounded-brand border border-brand-emerald/30 bg-brand-emerald/10 px-4 py-3 text-center text-brand-emerald"
              role="status"
            >
              {t("reviewsFormSuccess")}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="review-name">{t("reviewsFormName")}</label>
              <input
                id="review-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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
              <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {t("reviewsFormRating")}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="rounded p-1 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
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
                rows={5}
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

        <div className="mt-12">
          <h2 className="section-title" style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>
            {t("reviewsListTitle")}
          </h2>

          {loadingReviews ? (
            <p className="text-center text-sm" style={{ color: "var(--text-fade)" }}>
              {t("reviewsLoading")}
            </p>
          ) : reviews.length === 0 ? (
            <p
              className="text-center"
              style={{
                border: "1px dashed var(--border-soft)",
                borderRadius: "var(--radius)",
                padding: "3rem 1.5rem",
                color: "var(--text-dim)",
              }}
            >
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
