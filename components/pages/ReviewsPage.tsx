"use client";

import { useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function ReviewsPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitted(true);
    setName("");
    setEmail("");
    setRating(5);
    setMessage("");
  };

  return (
    <SiteLayout>
      <PageHero title={t("reviewsTitle")} subtitle={t("reviewsSubtitle")} />

      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-800 bg-gray-800/40 p-6 shadow-lg sm:p-8">
          <div className="mb-6 flex items-center gap-2 text-emerald-400">
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium text-white">{t("reviewsTitle")}</span>
          </div>

          {submitted ? (
            <p
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-emerald-400"
              role="status"
            >
              {t("reviewsFormSuccess")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {t("reviewsFormRequired")}
                </p>
              )}

              <div>
                <label
                  htmlFor="review-name"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  {t("reviewsFormName")}
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="review-email"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  {t("reviewsFormEmail")}
                </label>
                <input
                  id="review-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-gray-300">
                  {t("reviewsFormRating")}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="rounded p-1 transition-colors hover:bg-gray-700"
                      aria-label={`${n} stars`}
                    >
                      <Star
                        className={cn(
                          "h-7 w-7",
                          n <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-600",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-message"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  {t("reviewsFormMessage")}
                </label>
                <textarea
                  id="review-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-y rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-cta py-3 font-semibold text-white shadow-lg transition-all hover:opacity-95"
              >
                {t("reviewsFormSubmit")}
              </button>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}