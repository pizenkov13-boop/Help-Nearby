"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const DARK_COLOR = "#0a0f1f";
const LIGHT_COLOR = "#ffffff";

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "dark" ? DARK_COLOR : LIGHT_COLOR;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", color);
  }, [resolvedTheme]);

  return null;
}
