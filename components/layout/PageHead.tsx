import type { ReactNode } from "react";

interface PageHeadProps {
  badge: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}

export function PageHead({ badge, title, subtitle }: PageHeadProps) {
  return (
    <section className="page-head">
      <span className="hero-live">{badge}</span>
      <h1>{title}</h1>
      {subtitle && <p className="sub">{subtitle}</p>}
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
