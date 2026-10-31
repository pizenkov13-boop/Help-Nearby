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
 * Production CSP — no unsafe-eval; Next.js inline boot scripts need unsafe-inline.
 *
 * Vercel Web Analytics needs no entry of its own: its script is served from our own origin
 * (/_vercel/insights/script.js, covered by script-src 'self') and it reports to the same origin
 * (/_vercel/insights/*, covered by connect-src 'self'). No external analytics host is allowed.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-elem 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${tileImgSource()}`,
  "font-src 'self' data:",
  // The browser talks to our own origin only (the API and Vercel Web Analytics); Supabase is reached from the server.
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");
