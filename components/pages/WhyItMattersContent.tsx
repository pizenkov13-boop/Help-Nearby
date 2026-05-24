import { Heart } from "lucide-react";
import { CitiesSection } from "@/components/home/CitiesSection";
import { ImageHero } from "@/components/layout/ImageHero";

const CRISIS_STATS = [
  { value: "700M", label: "people live in extreme poverty" },
  { value: "150M", label: "homeless people worldwide" },
  { value: "2.3B", label: "people lack food security" },
] as const;

const PROBLEM_CARDS = [
  {
    title: "Hard to Find",
    text: "People in crisis don't know where to turn. Resources are scattered and information is hard to find.",
  },
  {
    title: "No Transparency",
    text: "No operating hours, no real-time info. People waste time going to closed locations.",
  },
  {
    title: "No Connection",
    text: "Organizations and people in need are disconnected, making effective help harder to reach.",
  },
] as const;

const SOLUTION_CARDS = [
  {
    title: "All in One Place",
    text: "Every local assistance organization in one easy-to-use map interface.",
  },
  {
    title: "Real-Time Info",
    text: "See what's open now, get directions, call instantly.",
  },
  {
    title: "Works Everywhere",
    text: "7 languages, offline mode, optimized for 2G networks in crisis zones.",
  },
] as const;

export function WhyItMattersContent() {
  return (
    <>
      <ImageHero
        imageSrc="/images/why-it-matters.jpg"
        title="Help Should Be Accessible To All"
        subtitle="No one should face crisis alone — anywhere in the world."
        badge={
          <span className="hero-live">
            <Heart
              className="inline"
              style={{ width: 14, height: 14, color: "#34d399" }}
            />
            Why It Matters
          </span>
        }
      />

      <section id="the-problem" className="page-section scroll-anchor">
        <div className="container">
          <div className="hiw-head">
            <h2>The Problem</h2>
            <span className="underline" />
          </div>

          <div className="page-card-grid cols-3" style={{ marginTop: "2.5rem" }}>
            {CRISIS_STATS.map((stat) => (
              <div
                key={stat.value}
                className="page-card"
                style={{
                  textAlign: "center",
                  background: "var(--gradient-brand)",
                  border: "none",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "2.25rem",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,.9)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="page-card-grid cols-3" style={{ marginTop: "1.5rem" }}>
            {PROBLEM_CARDS.map((card) => (
              <article key={card.title} className="page-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="our-solution" className="page-section alt scroll-anchor">
        <div className="container">
          <div className="hiw-head">
            <h2>Our Solution</h2>
            <span className="underline" />
          </div>
          <div className="page-card-grid cols-3" style={{ marginTop: "3rem" }}>
            {SOLUTION_CARDS.map((card) => (
              <article key={card.title} className="page-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CitiesSection />
    </>
  );
}
