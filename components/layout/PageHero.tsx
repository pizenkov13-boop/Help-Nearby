"use client";

import { ImageHero } from "./ImageHero";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  imageSrc?: string;
}

export function PageHero({
  title,
  subtitle,
  imageSrc = "/images/hero.jpg",
}: PageHeroProps) {
  return (
    <ImageHero imageSrc={imageSrc} title={title} subtitle={subtitle} />
  );
}
