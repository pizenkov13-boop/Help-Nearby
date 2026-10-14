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

/** Production CSP — no unsafe-eval; Next.js inline boot scripts need unsafe-inline. */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com https://eu-assets.i.posthog.com",
  "script-src-elem 'self' 'unsafe-inline' https://us-assets.i.posthog.com https://eu-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${tileImgSource()} https://unpkg.com`,
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://*.i.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");
