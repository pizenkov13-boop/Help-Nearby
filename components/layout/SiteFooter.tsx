"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Circle, Heart, Home } from "lucide-react";

const SDG_ICONS = [
  {
    goal: 1,
    src: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-01.jpg",
    alt: "UN SDG Goal 1: No Poverty",
  },
  {
    goal: 2,
    src: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-02.jpg",
    alt: "UN SDG Goal 2: Zero Hunger",
  },
  {
    goal: 3,
    src: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-03.jpg",
    alt: "UN SDG Goal 3: Good Health and Well-being",
  },
  {
    goal: 10,
    src: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-10.jpg",
    alt: "UN SDG Goal 10: Reduced Inequalities",
  },
] as const;

const INSTAGRAM_URL =
  "https://www.instagram.com/help.nearby1?igsh=MWx4ZzYxMnA2MXR5Mg%3D%3D&utm_source=qr";

const footerBtnClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white sm:w-auto";

const quickLinkClass =
  "flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-gray-900 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* 3 columns */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {/* Left */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 fill-emerald-400 text-emerald-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">Help Nearby</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              Connecting people to the help they need. Fast, free, accessible.
            </p>
          </div>

          {/* Middle — Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <nav className="flex flex-col gap-3">
              <Link href="/" className={quickLinkClass}>
                <Home className="h-4 w-4 shrink-0 text-gray-500" />
                Home
              </Link>
              <Link href="/why-it-matters" className={quickLinkClass}>
                <Circle className="h-4 w-4 shrink-0 text-gray-500" />
                Why It Matters
              </Link>
              <Link href="/about" className={quickLinkClass}>
                <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
                About Us
              </Link>
            </nav>
          </div>

          {/* Right — Contact */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
              Contact
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={footerBtnClass}
              >
                Inst: @help.nearby1
              </a>

              <p className="pt-1 text-xs font-bold uppercase tracking-wider text-white">
                OUR PARTNER
              </p>

              <a
                href="https://t.me/kindnesscorp"
                target="_blank"
                rel="noopener noreferrer"
                className={footerBtnClass}
              >
                <TelegramIcon className="h-4 w-4 shrink-0 text-[#26A5E4]" />
                tg: The Kindness Corp.
              </a>

              <a
                href="https://www.kindnesscorporation.ru/"
                target="_blank"
                rel="noopener noreferrer"
                className={footerBtnClass}
              >
                Web: kindnesscorporation.ru
              </a>

              <p className="text-sm text-gray-500">The Kindness Co.</p>
            </div>
          </div>
        </div>

        {/* Divider + SDG section */}
        <div className="mt-10 border-t border-gray-800 pt-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex flex-wrap justify-center gap-3">
              {SDG_ICONS.map((icon) => (
                <Image
                  key={icon.goal}
                  src={icon.src}
                  alt={icon.alt}
                  width={70}
                  height={70}
                  className="rounded-lg"
                />
              ))}
            </div>
            <p className="max-w-lg text-sm text-gray-300">
              Our mission is aligned with UN Sustainable Development Goals
            </p>
            <p className="max-w-2xl text-xs text-gray-500">
              This website is an independent initiative and is not an official
              organ of the United Nations.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center dark:border-gray-800">
          <p className="text-sm text-gray-400">
            © 2026 Help Nearby · Helping find assistance worldwide
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Made with <span className="text-red-400">❤️</span> for communities
            in need
          </p>
        </div>
      </div>
    </footer>
  );
}
