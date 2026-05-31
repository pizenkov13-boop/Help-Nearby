"use client";

import { ImageHero } from "./ImageHero";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  imageSrc?: string;
  compact?: boolean;
}

export function PageHero({
  title,
  subtitle,
  imageSrc = "/images/hero.jpg",
  compact = false,
}: PageHeroProps) {
  return (
    <ImageHero
      imageSrc={imageSrc}
      title={title}
      subtitle={subtitle}
      compact={compact}
    />
  );
}
