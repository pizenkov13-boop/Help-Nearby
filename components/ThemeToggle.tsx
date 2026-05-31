"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/80"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300",
        "border-gray-200 bg-white text-slate-700 hover:border-teal-500/50 hover:bg-slate-50",
        "dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:border-teal-500/40 dark:hover:bg-gray-800",
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" aria-hidden />
      )}
    </button>
  );
}
