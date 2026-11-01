/**
 * Per-deployment settings. Every value has a default equal to the main Help Nearby site,
 * so an unconfigured build behaves exactly like https://www.help-nearby.org/.
 * NEXT_PUBLIC_* variables are inlined at build time, so they must be read as literal `process.env.X`.
 */

function text(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function parseZoom(value: string | undefined, fallback: number): number {
  const zoom = Number(value);
  return Number.isFinite(zoom) && zoom >= 1 && zoom <= 19 ? zoom : fallback;
}

/** "lat,lng" → tuple, or null when unset/invalid. */
function parseCenter(value: string | undefined): [number, number] | null {
  const [lat, lng] = (value ?? "").split(",").map((part) => Number(part.trim()));
  if (lat === undefined || lng === undefined) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

export const MAIN_SITE_URL = "https://www.help-nearby.org";

/** Hostnames of the main site; every other host is a copy. */
export const MAIN_HOSTNAMES: ReadonlySet<string> = new Set([
  "www.help-nearby.org",
  "help-nearby.org",
]);

const siteUrl = text(process.env.NEXT_PUBLIC_SITE_URL, MAIN_SITE_URL).replace(/\/+$/, "");

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Copy mode: this deployment is not the main Help Nearby site. It is on when the site URL points to
 * another domain, or when next.config.mjs detected a build from someone else's fork (NEXT_PUBLIC_IS_FORK).
 * The main site sets neither, so it is never in copy mode.
 */
const isCopy =
  !MAIN_HOSTNAMES.has(hostnameOf(siteUrl)) || process.env.NEXT_PUBLIC_IS_FORK === "true";

export const siteConfig = {
  /** True for sites deployed from the template: no main-site branding, contacts, partners or history. */
  isCopy,
  /** NEXT_PUBLIC_OPERATOR_NAME — who runs this copy (shown in the copyright line and privacy page). */
  operatorName: text(process.env.NEXT_PUBLIC_OPERATOR_NAME, ""),
  /** NEXT_PUBLIC_INSTAGRAM — Instagram handle or URL of the operator (copy mode only). */
  instagram: text(process.env.NEXT_PUBLIC_INSTAGRAM, ""),
  /** The assistant is always on for the main site; a copy has it only with its own AI key (set by next.config.mjs). */
  chatEnabled: !isCopy || process.env.NEXT_PUBLIC_CHAT_ENABLED === "true",
  /** NEXT_PUBLIC_SITE_NAME — shown in page metadata and the PWA manifest. */
  name: text(process.env.NEXT_PUBLIC_SITE_NAME, "Help Nearby"),
  /** NEXT_PUBLIC_SITE_URL — canonical origin of this deployment (no trailing slash). */
  url: siteUrl,
  /** NEXT_PUBLIC_DEFAULT_LANGUAGE — first-visit language code (en, ru, es, fr, de, zh, ar). */
  defaultLanguage: text(process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE, "en"),
  /** NEXT_PUBLIC_CONTACT_EMAIL — public contact address (footer, privacy page). */
  contactEmail: text(process.env.NEXT_PUBLIC_CONTACT_EMAIL, isCopy ? "" : "hello@help-nearby.org"),
  /** NEXT_PUBLIC_MAP_CENTER ("lat,lng") — optional regional map center; null keeps "no default location". */
  mapCenter: parseCenter(process.env.NEXT_PUBLIC_MAP_CENTER),
  /** NEXT_PUBLIC_MAP_ZOOM — initial map zoom (1–19). */
  mapZoom: parseZoom(process.env.NEXT_PUBLIC_MAP_ZOOM, 14),
  /** NEXT_PUBLIC_FOOTER_LINK_URL — the project/community link in the footer (default: this repository). */
  footerLinkUrl: text(
    process.env.NEXT_PUBLIC_FOOTER_LINK_URL,
    "https://github.com/pizenkov13-boop/Help-Nearby",
  ),
} as const;
