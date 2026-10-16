"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Siren, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { AnchorNavLink } from "@/components/navigation/AnchorNavLink";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { openEmergencyHelp } from "@/lib/emergencyEvents";
import { trackLanguageChanged } from "@/lib/analytics.client";
import type { LanguageCode } from "@/lib/types";
import { cn } from "@/lib/utils";

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
          <ChevronDown className="chev" aria-hidden />
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest("[data-dd]")) {
        return;
      }
      setAboutOpen(false);
      setWhyOpen(false);
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

            <Link
              href="/recent"
              className={cn("nav-link", pathname === "/recent" && "active")}
              onClick={closeAll}
            >
              {t("navRecent")}
            </Link>
          </nav>

          <div className="header-toolbar">
            <button
              type="button"
              className="emergency-icon-btn"
              aria-label={t("emergencyHelp")}
              onClick={() => {
                closeAll();
                openEmergencyHelp();
              }}
            >
              <Siren aria-hidden />
            </button>

            <LanguageMenu
              language={language}
              label={t("languageMenu")}
              closeLabel={t("closeLabel")}
              open={langOpen}
              onOpenChange={(open) => {
                if (open) {
                  setAboutOpen(false);
                  setWhyOpen(false);
                  setMenuOpen(false);
                }
                setLangOpen(open);
              }}
              onSelect={(code) => {
                if (code !== language) {
                  trackLanguageChanged(language, code);
                }
                setLanguage(code as LanguageCode);
              }}
            />

            <ThemeToggle className="theme-btn-desktop" />

            <button
              type="button"
              className="mobile-toggle"
              aria-label={t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mmenu"
              onClick={() => {
                setLangOpen(false);
                setMenuOpen((o) => !o);
              }}
            >
              {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
            </button>
          </div>
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
        <Link href="/recent" className="nav-link" onClick={closeAll}>
          {t("navRecent")}
        </Link>
        <div className="m-theme-row">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
