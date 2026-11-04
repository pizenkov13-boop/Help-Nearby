/**
 * Optional regional access limit for the main site, driven only by the BLOCKED_COUNTRIES
 * environment variable (comma-separated two-letter ISO codes; empty by default, which blocks nothing).
 */

/** Parses the variable: trims, upper-cases, keeps only two-letter codes. */
export function parseBlockedCountries(value: string | undefined): ReadonlySet<string> {
  const codes = (value ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
  return new Set(codes);
}

/** A missing header or a code outside the list is let through. */
export function isCountryBlocked(country: string | null | undefined, blocked: ReadonlySet<string>): boolean {
  if (!country || blocked.size === 0) return false;
  return blocked.has(country.trim().toUpperCase());
}

/** Service files that must keep working everywhere: pings, indexing, static assets. */
export function isRegionExemptPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/cron/") ||
    pathname === "/api/deployments" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sitemap/") ||
    pathname === "/manifest.webmanifest" ||
    // Any other file with an extension (icons, fonts, images, scripts).
    /\.[a-z0-9]{2,5}$/i.test(pathname)
  );
}

interface UnavailableCopy {
  lang: string;
  dir: "ltr" | "rtl";
  text: string;
}

const COPY: Record<string, UnavailableCopy> = {
  en: { lang: "en", dir: "ltr", text: "Service unavailable" },
  ru: { lang: "ru", dir: "ltr", text: "Сервис недоступен" },
  es: { lang: "es", dir: "ltr", text: "Servicio no disponible" },
  fr: { lang: "fr", dir: "ltr", text: "Service indisponible" },
  de: { lang: "de", dir: "ltr", text: "Dienst nicht verfügbar" },
  zh: { lang: "zh", dir: "ltr", text: "服务不可用" },
  ar: { lang: "ar", dir: "rtl", text: "الخدمة غير متاحة" },
};

/** First language of the Accept-Language header that the site has; English otherwise. */
export function pickUnavailableCopy(acceptLanguage: string | null | undefined): UnavailableCopy {
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.split(";")[0]?.trim().toLowerCase().split("-")[0] ?? "";
    const match = COPY[code];
    if (match) return match;
  }
  return COPY.en!;
}

/** Neutral page: no policy, no reasons, no places. */
export function unavailablePageHtml(acceptLanguage: string | null | undefined): string {
  const { lang, dir, text } = pickUnavailableCopy(acceptLanguage);
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${text}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font:18px/1.5 system-ui,sans-serif;background:#f8fafc;color:#0f172a;text-align:center;padding:24px}@media(prefers-color-scheme:dark){body{background:#0a0f1f;color:#e2e8f0}}</style></head><body><p>${text}</p></body></html>`;
}
