"use client";

import { Star } from "lucide-react";
import { CountryFlag } from "@/components/icons/CountryFlag";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CountryFlag country={review.country} />
          <span className="font-semibold text-slate-900 dark:text-white">{review.name}</span>
          <span className="text-sm text-slate-500">· {review.country}</span>
        </div>
        <time className="text-xs text-slate-500" dateTime={review.created_at}>
          {date}
        </time>
      </div>

      <div className="mb-3 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              "h-4 w-4",
              n <= review.rating
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300 dark:text-gray-600",
            )}
          />
        ))}
      </div>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">{review.message}</p>
    </article>
  );
}
