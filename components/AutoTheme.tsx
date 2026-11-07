"use client";

import { useEffect } from "react";

const DARK_COLOR = "#0a0f1f";
const LIGHT_COLOR = "#ffffff";

/**
 * The theme is automatic and has no switch: light for visitors from a SUNNY_COUNTRY_CODES country
 * (the server's yes/no from the Vercel country header), otherwise the device setting
 * (prefers-color-scheme), also when it changes while the page is open. public/theme-init.js applies
 * the same rule before the first paint; this keeps it live and updates the browser's theme colour.
 */
export function AutoTheme({ sunnyCountry }: { sunnyCountry: boolean }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = !sunnyCountry && media.matches;
      const root = document.documentElement;
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? DARK_COLOR : LIGHT_COLOR);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [sunnyCountry]);

  return null;
}
