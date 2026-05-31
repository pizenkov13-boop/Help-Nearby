"use client";

import { ImageHero } from "./ImageHero";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  imageSrc?: string;
  compact?: boolean;
  /** Blue-green gradient band (no photo) — for Reviews etc. */
  gradient?: boolean;
}

export function PageHero({
  title,
  subtitle,
  imageSrc = "/images/hero.jpg",
  compact = false,
  gradient = false,
}: PageHeroProps) {
  return (
    <ImageHero
      imageSrc={imageSrc}
      title={title}
      subtitle={subtitle}
      compact={compact}
      gradient={gradient}
    />
  );
}
