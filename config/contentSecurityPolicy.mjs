/** img-src source for the configured map tile host ({s} subdomains become a wildcard). */
/** @param {Record<string, string | undefined>} env */
function tileImgSource(env) {
  const fallback = "https://tile.openstreetmap.org https://*.tile.openstreetmap.org";
  const template = env.NEXT_PUBLIC_MAP_TILES_URL?.trim();
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

const UMAMI_CLOUD_ORIGIN = "https://cloud.umami.is";
/** The Umami Cloud tracker (script.js) posts its events to this host, not to the script's own origin. */
const UMAMI_CLOUD_GATEWAY_ORIGIN = "https://gateway.umami.is";

/**
 * Origin of the Umami tracker (from NEXT_PUBLIC_UMAMI_SRC), or "" when analytics is not configured
 * (both NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_SRC must be set, and the script must be https).
 */
/** @param {Record<string, string | undefined>} env */
function umamiOrigin(env) {
  const src = env.NEXT_PUBLIC_UMAMI_SRC?.trim();
  const websiteId = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (!src || !websiteId) return "";
  try {
    const url = new URL(src);
    return url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

/**
 * connect-src sources for the tracker: the script's origin, plus the gateway only for Umami Cloud.
 * A self-hosted Umami posts to its own origin, so nothing else is allowed for it.
 */
/** @param {Record<string, string | undefined>} env */
function umamiConnectSources(env) {
  const origin = umamiOrigin(env);
  if (!origin) return [];
  return origin === UMAMI_CLOUD_ORIGIN ? [origin, UMAMI_CLOUD_GATEWAY_ORIGIN] : [origin];
}

/**
 * Production CSP — no unsafe-eval; Next.js inline boot scripts need unsafe-inline.
 * @param {Record<string, string | undefined>} [env] defaults to process.env; a parameter so it can be tested
 * @returns {string}
 */
export function buildContentSecurityPolicy(env = process.env) {
  const umami = umamiOrigin(env);
  const withUmami = (base) => [base, umami].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    withUmami("script-src 'self' 'unsafe-inline'"),
    withUmami("script-src-elem 'self' 'unsafe-inline'"),
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${tileImgSource(env)}`,
    "font-src 'self' data:",
    // The browser talks to our own API only (Supabase is reached from the server), plus the optional Umami hosts.
    ["connect-src 'self'", ...umamiConnectSources(env)].join(" "),
    "worker-src 'self'",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

export const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();
