"use client";

import { Check, Siren, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { AnchorNavLink } from "@/components/navigation/AnchorNavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { trackLanguageChanged } from "@/lib/analytics.client";
import { openEmergencyHelp } from "@/lib/emergencyEvents";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGES, LANGUAGE_NATIVE_NAMES } from "@/lib/i18n/translations";
import type { LanguageCode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/** Same breakpoint as the mobile header; wider screens never show this menu. */
const DESKTOP_QUERY = "(min-width: 769px)";

/**
 * Freezes the page behind a full-screen layer. `position: fixed` + a negative top is the only
 * approach iOS Safari honours (overflow: hidden alone still lets the page scroll under the layer).
 * Returns an idempotent release that restores the exact scroll position.
 */
function lockBodyScroll(): () => void {
  const body = document.body;
  const scrollY = window.scrollY;
  const previous = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";

  let released = false;
  return () => {
    if (released) return;
    released = true;
    body.style.overflow = previous.overflow;
    body.style.position = previous.position;
    body.style.top = previous.top;
    body.style.left = previous.left;
    body.style.right = previous.right;
    body.style.width = previous.width;
    // The page uses `scroll-behavior: smooth`; restore the position without animating.
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, scrollY);
    root.style.scrollBehavior = previousBehavior;
  };
}

/**
 * Full-screen phone menu. It is rendered in a portal on <body>: the header has a
 * backdrop-filter (dark mode), and a filtered ancestor becomes the containing block of
 * `position: fixed` descendants, which collapsed the old in-header menu to a thin strip.
 */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const layerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const releaseScroll = useRef<(() => void) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Release the scroll lock synchronously (before navigating / scrolling to an anchor).
  const close = useCallback(() => {
    releaseScroll.current?.();
    releaseScroll.current = null;
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    releaseScroll.current = lockBodyScroll();
    closeRef.current?.focus();

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => desktop.matches && close();
    desktop.addEventListener("change", onChange);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // Keep keyboard focus inside the layer.
      const focusable = layerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onChange);
      releaseScroll.current?.();
      releaseScroll.current = null;
      returnFocus.current?.focus?.();
    };
  }, [open, close]);

  if (!open || !mounted) return null;

  const aboutItems = [
    { label: t("navOurStory"), href: "/about#our-story" },
    { label: t("navHowItWorks"), href: "/about#how-it-works" },
  ];
  const whyItems = [
    { label: t("navTheProblem"), href: "/why-it-matters#the-problem" },
    { label: t("navOurSolution"), href: "/why-it-matters#our-solution" },
    { label: t("navCitiesInNeed"), href: "/why-it-matters#cities-in-need" },
  ];
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return createPortal(
    <div
      id="mmenu"
      ref={layerRef}
      className="mm-layer"
      role="dialog"
      aria-modal="true"
      aria-label={t("menuTitle")}
    >
      <div className="mm-top">
        <Link href="/" className="brand" onClick={close}>
          <BrandLogo barId="hn-bar-mm" />
          <span>{t("brand")}</span>
        </Link>
        <button
          ref={closeRef}
          type="button"
          className="mm-close"
          aria-label={t("closeLabel")}
          onClick={close}
        >
          <X aria-hidden />
        </button>
      </div>

      <div className="mm-scroll">
        <button
          type="button"
          className="mm-emergency"
          onClick={() => {
            close();
            openEmergencyHelp();
          }}
        >
          <Siren aria-hidden />
          {t("emergencyHelp")}
        </button>

        <nav className="mm-nav" aria-label={t("menuTitle")}>
          <Link
            href="/"
            className={cn("mm-link", active("/") && "active")}
            aria-current={active("/") ? "page" : undefined}
            onClick={close}
          >
            {t("navHome")}
          </Link>

          <Link
            href="/about"
            className={cn("mm-link", active("/about") && "active")}
            aria-current={active("/about") ? "page" : undefined}
            onClick={close}
          >
            {t("navAbout")}
          </Link>
          {aboutItems.map((item) => (
            <AnchorNavLink key={item.href} href={item.href} className="mm-link mm-sub" onNavigate={close}>
              {item.label}
            </AnchorNavLink>
          ))}

          <Link
            href="/why-it-matters"
            className={cn("mm-link", active("/why-it-matters") && "active")}
            aria-current={active("/why-it-matters") ? "page" : undefined}
            onClick={close}
          >
            {t("navWhy")}
          </Link>
          {whyItems.map((item) => (
            <AnchorNavLink key={item.href} href={item.href} className="mm-link mm-sub" onNavigate={close}>
              {item.label}
            </AnchorNavLink>
          ))}

          <Link
            href="/reviews"
            className={cn("mm-link", active("/reviews") && "active")}
            aria-current={active("/reviews") ? "page" : undefined}
            onClick={close}
          >
            {t("navReviews")}
          </Link>
          <Link
            href="/recent"
            className={cn("mm-link", active("/recent") && "active")}
            aria-current={active("/recent") ? "page" : undefined}
            onClick={close}
          >
            {t("navRecent")}
          </Link>
        </nav>

        <section className="mm-section" aria-labelledby="mm-lang-title">
          <h3 id="mm-lang-title" className="mm-section-title">
            {t("languageMenu")}
          </h3>
          <div className="mm-langs" role="group" aria-labelledby="mm-lang-title">
            {LANGUAGES.map(({ code }) => {
              const current = code === language;
              return (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  aria-pressed={current}
                  className={cn("mm-lang", current && "on")}
                  onClick={() => {
                    if (!current) {
                      trackLanguageChanged(language, code);
                      setLanguage(code as LanguageCode);
                    }
                  }}
                >
                  <span>{LANGUAGE_NATIVE_NAMES[code]}</span>
                  {current && <Check aria-hidden />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mm-section">
          <div className="mm-row">
            <span className="mm-section-title">{t("themeLabel")}</span>
            <ThemeToggle />
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
