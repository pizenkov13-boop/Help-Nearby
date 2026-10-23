/** img-src source for the configured map tile host ({s} subdomains become a wildcard). */
function tileImgSource() {
  const fallback = "https://tile.openstreetmap.org https://*.tile.openstreetmap.org";
  const template = process.env.NEXT_PUBLIC_MAP_TILES_URL?.trim();
  if (!template?.startsWith("https://")) return fallback;
  try {
    const hasSubdomain = template.includes("{s}");
    const { hostname } = new URL(template.replace("{s}", "a").replace(/\{[^}]*\}/g, "x"));
    const host = hasSubdomain ? hostname.replace(/^a\./, "*.") : hostname;
    return `${fallback} https://${host}`;
  } catch {
    return fallback;
  }
}

/**
 * Origin of the Umami tracker (from NEXT_PUBLIC_UMAMI_SRC), or "" when analytics is not configured.
 * It is the only analytics host the policy ever allows, for the script and for the events it posts.
 */
function umamiOrigin() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC?.trim();
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (!src || !websiteId) return "";
  try {
    const url = new URL(src);
    return url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

const withUmami = (base) => [base, umamiOrigin()].filter(Boolean).join(" ");

/** Production CSP — no unsafe-eval; Next.js inline boot scripts need unsafe-inline. */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  withUmami("script-src 'self' 'unsafe-inline'"),
  withUmami("script-src-elem 'self' 'unsafe-inline'"),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${tileImgSource()}`,
  "font-src 'self' data:",
  // The browser talks to our own API only (Supabase is reached from the server), plus the optional Umami host.
  withUmami("connect-src 'self'"),
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");
