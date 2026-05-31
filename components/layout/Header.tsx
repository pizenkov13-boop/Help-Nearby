"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { AnchorNavLink } from "@/components/navigation/AnchorNavLink";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/translations";
import { openEmergencyHelp } from "@/lib/emergencyEvents";
import type { LanguageCode } from "@/lib/types";
import { cn } from "@/lib/utils";

function ChevronIcon() {
  return (
    <svg
      className="chev"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="globe"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

interface NavSectionMenuProps {
  href: string;
  label: string;
  items: { label: string; href: string }[];
  toggleAriaLabel: string;
  active?: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function NavSectionMenu({
  href,
  label,
  items,
  toggleAriaLabel,
  active,
  open,
  onToggle,
  onClose,
}: NavSectionMenuProps) {
  return (
    <div className={cn("dd nav-dd", open && "open")} data-dd>
      <Link
        href={href}
        className={cn("nav-link", active && "active")}
        onClick={onClose}
      >
        {label}
      </Link>
      {items.length > 0 && (
        <button
          type="button"
          className="dd-chevron"
          aria-label={toggleAriaLabel}
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <ChevronIcon />
        </button>
      )}
      {items.length > 0 && (
        <div className="dd-menu">
          {items.map((item) => (
            <AnchorNavLink
              key={item.href}
              href={item.href}
              className="nav-link"
              onNavigate={onClose}
            >
              {item.label}
            </AnchorNavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setLangOpen(false);
    setAboutOpen(false);
    setWhyOpen(false);
  }, []);

  const aboutItems = [
    { label: t("navOurStory"), href: "/about#our-story" },
    { label: t("navHowItWorks"), href: "/about#how-it-works" },
  ];

  const whyItems = [
    { label: t("navTheProblem"), href: "/why-it-matters#the-problem" },
    { label: t("navOurSolution"), href: "/why-it-matters#our-solution" },
    { label: t("navCitiesInNeed"), href: "/why-it-matters#cities-in-need" },
  ];

  const isAboutActive =
    pathname === "/about" || pathname.startsWith("/about/");
  const isWhyActive =
    pathname === "/why-it-matters" || pathname.startsWith("/why-it-matters/");

  const currentLangLabel =
    LANGUAGES.find((l) => l.code === language)?.label ?? "EN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest("[data-dd]") || target?.closest(".lang-wrap")) {
        return;
      }
      setAboutOpen(false);
      setWhyOpen(false);
      setLangOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header ref={headerRef} className={cn("header", scrolled && "scrolled")}>
      <div className="header-inner">
        <Link href="/" className="brand" onClick={closeAll}>
          <BrandLogo barId="hn-bar-nav" />
          <span>{t("brand")}</span>
        </Link>

        <div className="header-end">
          <nav className="nav" id="nav">
            <button
              type="button"
              className="nav-emergency"
              onClick={(e) => {
                e.stopPropagation();
                openEmergencyHelp();
              }}
            >
              {t("emergencyHelp")}
            </button>

            <Link
              href="/"
              className={cn("nav-link", pathname === "/" && "active")}
              onClick={closeAll}
            >
              {t("navHome")}
            </Link>

            <NavSectionMenu
              href="/about"
              label={t("navAbout")}
              items={aboutItems}
              toggleAriaLabel={t("openMenu")}
              active={isAboutActive}
              open={aboutOpen}
              onToggle={() => {
                setWhyOpen(false);
                setLangOpen(false);
                setAboutOpen((o) => !o);
              }}
              onClose={closeAll}
            />

            <NavSectionMenu
              href="/why-it-matters"
              label={t("navWhy")}
              items={whyItems}
              toggleAriaLabel={t("openMenu")}
              active={isWhyActive}
              open={whyOpen}
              onToggle={() => {
                setAboutOpen(false);
                setLangOpen(false);
                setWhyOpen((o) => !o);
              }}
              onClose={closeAll}
            />

            <Link
              href="/reviews"
              className={cn("nav-link", pathname === "/reviews" && "active")}
              onClick={closeAll}
            >
              {t("navReviewsShort")}
            </Link>
          </nav>

          <ThemeToggle />

          <div className={cn("lang-wrap", langOpen && "open")}>
            <button
              type="button"
              className="lang-btn"
              aria-label={t("languageMenu")}
              aria-haspopup="true"
              aria-expanded={langOpen}
              onClick={() => {
                setAboutOpen(false);
                setWhyOpen(false);
                setLangOpen((o) => !o);
              }}
            >
              <GlobeIcon />
              <span className="current">{currentLangLabel}</span>
              <ChevronIcon />
            </button>
            <div className="lang-menu" role="menu" aria-label={t("languageMenu")}>
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  role="menuitem"
                  className={cn("lang-item", language === code && "on")}
                  onClick={() => {
                    setLanguage(code as LanguageCode);
                    setLangOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="mobile-toggle"
            aria-label={t("openMenu")}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <nav className={cn("mobile-menu", menuOpen && "open")} id="mmenu">
        <button
          type="button"
          className="nav-emergency"
          style={{ marginBottom: 8, width: "100%", justifyContent: "center" }}
          onClick={() => {
            closeAll();
            openEmergencyHelp();
          }}
        >
          {t("emergencyHelp")}
        </button>
        <Link href="/" className="nav-link" onClick={closeAll}>
          {t("navHome")}
        </Link>
        <Link href="/about" className="nav-link" onClick={closeAll}>
          {t("navAbout")}
        </Link>
        {aboutItems.map((item) => (
          <AnchorNavLink
            key={item.href}
            href={item.href}
            className="nav-link m-sub"
            onNavigate={closeAll}
          >
            {item.label}
          </AnchorNavLink>
        ))}
        <Link href="/why-it-matters" className="nav-link" onClick={closeAll}>
          {t("navWhy")}
        </Link>
        {whyItems.map((item) => (
          <AnchorNavLink
            key={item.href}
            href={item.href}
            className="nav-link m-sub"
            onNavigate={closeAll}
          >
            {item.label}
          </AnchorNavLink>
        ))}
        <Link href="/reviews" className="nav-link" onClick={closeAll}>
          {t("navReviews")}
        </Link>
      </nav>
    </header>
  );
}
