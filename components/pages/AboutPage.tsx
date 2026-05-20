"use client";

import { Heart, MapPin, Search } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";

const ABOUT_STATS = [
  { value: "304", label: "Organizations Ready to Help" },
  { value: "260", label: "Cities Covered Worldwide" },
  { value: "50", label: "Countries Connected" },
] as const;

const HOW_IT_WORKS_CARDS = [
  {
    icon: Search,
    title: "Search & Discover",
    text: "Enter your location and find nearby assistance organizations filtered by category and your specific needs.",
  },
  {
    icon: MapPin,
    title: "Get Help",
    text: "Connect with verified organizations that can provide the support you need.",
  },
] as const;

function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-gray-50 px-4 pb-0 pt-16 transition-colors duration-300 dark:bg-gray-900 sm:px-6 sm:pt-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl pb-20 text-center sm:pb-24">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-4 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
          <Heart className="h-4 w-4 fill-emerald-400 text-emerald-400" />
          <span>About Us</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-gradient-hero">Connecting People with Help</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
          A platform that makes finding and accessing local assistance organizations
          easy and transparent
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

export function AboutPage() {
  return (
    <SiteLayout>
      <AboutHero />

      <section className="bg-gray-50 px-4 py-14 transition-colors duration-300 dark:bg-gray-900 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Our Story
          </h2>
          <p className="mt-6 text-center text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Help Nearby was created to bridge the gap between people in need and the
            organizations ready to help. We believe that everyone deserves easy access
            to support services in their community.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-4 py-14 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/50 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            How the Site Works
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {HOW_IT_WORKS_CARDS.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-colors hover:border-blue-500/30 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-emerald-500/30"
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

      <section className="border-t border-gray-200 bg-gray-50 px-4 py-14 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Why This Matters
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {ABOUT_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-extrabold text-gradient-hero sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-base">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Access to help can change lives. We&apos;re removing barriers between people
            in need and the organizations ready to serve them.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
