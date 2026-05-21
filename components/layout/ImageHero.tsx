import type { ReactNode } from "react";

interface ImageHeroProps {
  imageSrc: string;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}

export function ImageHero({
  imageSrc,
  title,
  subtitle,
  badge,
  children,
}: ImageHeroProps) {
  return (
    <section className="hero page-hero">
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      <div className="hero-overlay" />
      <div className="hero-grad" />

      <div className="hero-inner">
        <div className="hero-content">
          {badge}
          <h1>{title}</h1>
          {subtitle && <p className="lead">{subtitle}</p>}
          {children}
        </div>
      </div>

      <div className="wave">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
          <path
            fill="currentColor"
            d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,90.7C672,85,768,75,864,69.3C960,64,1056,64,1152,69.3C1248,75,1344,85,1392,90.7L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </section>
  );
}
