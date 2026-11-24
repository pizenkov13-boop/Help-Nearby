"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { scrollToSection } from "@/lib/scrollToSection";

/** Scroll to URL hash after navigation (dropdown anchor links, shared links). */
export function ScrollToHash() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    // The page can still be streaming its loading state when the layout mounts.
    // Wait for the destination rather than guessing when it will exist.
    let frame = 0;
    let pending = false;
    const observer = new MutationObserver(tryScroll);
    const timeout = window.setTimeout(() => observer.disconnect(), 10_000);

    function tryScroll() {
      if (pending || !document.getElementById(hash)) return;
      pending = true;
      observer.disconnect();
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => scrollToSection(hash, "smooth"));
      });
    }

    observer.observe(document.body, { childList: true, subtree: true });
    tryScroll();

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) scrollToSection(hash, "smooth");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
