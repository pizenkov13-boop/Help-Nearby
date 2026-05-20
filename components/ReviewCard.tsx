"use client";

import { Star } from "lucide-react";
import { countryToFlag } from "@/lib/countryFlags";
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
    <article className="rounded-xl border border-gray-800 bg-gray-800/50 p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" aria-hidden>
            {countryToFlag(review.country)}
          </span>
          <span className="font-semibold text-white">{review.name}</span>
          <span className="text-sm text-gray-500">· {review.country}</span>
        </div>
        <time className="text-xs text-gray-500" dateTime={review.created_at}>
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
                : "text-gray-600",
            )}
          />
        ))}
      </div>

      <p className="text-sm leading-relaxed text-gray-300">{review.message}</p>
    </article>
  );
}
