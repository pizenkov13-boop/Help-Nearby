"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Heart,
  Users,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";

const CRISIS_STATS = [
  { value: "700M", label: "people live in extreme poverty" },
  { value: "150M", label: "homeless people worldwide" },
  { value: "2.3B", label: "people lack food security" },
] as const;

const PROBLEM_CARDS = [
  {
    title: "Hard to Find",
    text: "People in crisis don't know where to turn. Resources are scattered, and information is hard to find.",
  },
  {
    title: "No Transparency",
    text: "No reviews, no opening hours, no real-time information. People waste time going to closed locations.",
  },
  {
    title: "No Connection",
    text: "Organizations and people in need are disconnected, making it harder to provide effective help.",
  },
] as const;

const SOLUTION_CARDS = [
  {
    icon: Building2,
    title: "All in One Place",
    text: "We gather all local assistance organizations in one easy-to-use map interface.",
  },
  {
    icon: Clock,
    title: "Real-Time Info",
    text: "See which places are open now, read reviews, get directions, and contact organizations instantly.",
  },
  {
    icon: Users,
    title: "Connected Community",
    text: "We bridge the gap between people in need and organizations ready to help.",
  },
] as const;

function WhyHero() {
  return (
    <section className="relative overflow-hidden bg-gray-50 px-4 pb-0 pt-16 transition-colors duration-300 dark:bg-gray-900 sm:px-6 sm:pt-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl pb-20 text-center sm:pb-24">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-4 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
          <Heart className="h-4 w-4 fill-emerald-400 text-emerald-400" />
          <span>Why It Matters</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-gradient-hero">Help Should Be Accessible To All</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
          No one should be left without help
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 leading-[0]">
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="h-12 w-full text-gray-50 dark:text-gray-900 sm:h-16"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,42.7C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z"
          />
        </svg>
      </div>
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  iconClassName,
  title,
}: {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
}) {
  return (
    <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
      <span
        className={`inline-flex rounded-full p-2.5 ${iconClassName}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

export function WhyItMattersPage() {
  return (
    <SiteLayout>
      <WhyHero />

      <section className="bg-gray-50 px-4 py-14 transition-colors duration-300 dark:bg-gray-900 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            icon={AlertTriangle}
            iconClassName="bg-blue-500/20 text-blue-400"
            title="The Problem"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CRISIS_STATS.map((stat) => (
              <div
                key={stat.value}
                className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-6 text-center shadow-lg shadow-blue-900/30"
              >
                <p className="text-3xl font-extrabold text-white sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-3">
            {PROBLEM_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-4 py-14 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/50 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            icon={CheckCircle2}
            iconClassName="bg-emerald-500/20 text-emerald-400"
            title="Our Solution"
          />

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
            {SOLUTION_CARDS.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-colors hover:border-emerald-500/30 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-emerald-500/30"
              >
                <span className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 p-3">
                  <Icon className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
