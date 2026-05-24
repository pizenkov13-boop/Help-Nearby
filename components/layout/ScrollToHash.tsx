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

    const timer = window.setTimeout(() => {
      scrollToSection(hash, "smooth");
    }, 100);

    return () => window.clearTimeout(timer);
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
