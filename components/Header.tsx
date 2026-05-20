"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, Heart, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/translations";
import type { LanguageCode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Header() {
  const { language, setLanguage, t, dir } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass =
    "text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gradient-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/20">
            <Heart className="h-5 w-5 fill-white text-white" />
          </span>
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-lg font-bold text-transparent">
            {t("brand")}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className={navLinkClass}>
            {t("navHome")}
          </Link>
          <Link href="/about" className={navLinkClass}>
            {t("navAbout")}
          </Link>
          <Link href="/why-it-matters" className={navLinkClass}>
            {t("navWhy")}
          </Link>
          <Link href="/reviews" className={navLinkClass}>
            {t("navReviews")}
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-100 px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-500/50 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
            >
              <Globe className="h-4 w-4 text-blue-400" />
              <span className="font-medium uppercase">{language}</span>
            </button>
            {langOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40"
                  aria-label="Close language menu"
                  onClick={() => setLangOpen(false)}
                />
                <ul
                  role="listbox"
                  className={cn(
                    "absolute top-full z-50 mt-1 min-w-[5rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800",
                    dir === "rtl" ? "left-0" : "right-0",
                  )}
                >
                  {LANGUAGES.map(({ code, label }) => (
                    <li key={code} role="option" aria-selected={language === code}>
                      <button
                        type="button"
                        onClick={() => {
                          setLanguage(code as LanguageCode);
                          setLangOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                          language === code &&
                            "bg-blue-500/20 font-semibold text-blue-400",
                        )}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-200 bg-white/95 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/95 md:hidden">
          <Link
            href="/"
            onClick={closeMenu}
            className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            {t("navHome")}
          </Link>
          <Link
            href="/about"
            onClick={closeMenu}
            className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            {t("navAbout")}
          </Link>
          <Link
            href="/why-it-matters"
            onClick={closeMenu}
            className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            {t("navWhy")}
          </Link>
          <Link
            href="/reviews"
            onClick={closeMenu}
            className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            {t("navReviews")}
          </Link>
        </nav>
      )}
    </header>
  );
}
