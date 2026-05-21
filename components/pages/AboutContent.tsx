import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { ImageHero } from "@/components/layout/ImageHero";

const HOW_IT_WORKS_CARDS = [
  {
    title: "Search & Discover",
    text: "Enter your location and find nearby organizations filtered by category and your specific needs.",
  },
  {
    title: "Get Help",
    text: "Call directly or get directions to verified organizations instantly.",
  },
] as const;

const VALUES_CARDS = [
  {
    title: "Accessibility",
    text: "Help should be easy to find, free, and available to everyone.",
  },
  {
    title: "Dignity",
    text: "Everyone deserves help with respect and compassion.",
  },
  {
    title: "Global Reach",
    text: "No matter where you are, help is near you.",
  },
] as const;

export function AboutContent() {
  return (
    <>
      <ImageHero
        imageSrc="/images/about.jpg"
        title="Connecting People with Help"
        subtitle="A platform that makes finding free assistance fast, transparent, and accessible to everyone."
        badge={
          <span className="hero-live">
            <Heart
              className="inline"
              style={{ width: 14, height: 14, color: "#34d399" }}
            />
            About Us
          </span>
        }
      />

      <section id="our-story" className="page-section scroll-mt-20">
        <div className="container">
          <h2 className="section-title">Our Story</h2>
          <p className="prose-center" style={{ marginTop: "1.5rem" }}>
            Help Nearby was created to bridge the gap between people in crisis and
            the organizations ready to help. We believe everyone deserves easy
            access to food, shelter, and medical care — regardless of language,
            device, or internet speed.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="page-section alt scroll-mt-20">
        <div className="container">
          <div className="hiw-head">
            <h2>How It Works</h2>
            <span className="underline" />
          </div>
          <div className="page-card-grid cols-2" style={{ marginTop: "3rem" }}>
            {HOW_IT_WORKS_CARDS.map((card) => (
              <article key={card.title} className="page-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="hiw-head">
            <h2>Our Values</h2>
            <span className="underline" />
          </div>
          <div className="page-card-grid cols-3" style={{ marginTop: "3rem" }}>
            {VALUES_CARDS.map((card) => (
              <article
                key={card.title}
                className="page-card"
                style={{ textAlign: "center" }}
              >
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
          <div style={{ marginTop: "3rem", textAlign: "center" }}>
            <Link href="/" className="cta">
              <MapPin style={{ width: 18, height: 18 }} />
              Explore Organizations
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
