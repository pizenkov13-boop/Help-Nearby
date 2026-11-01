import { CONTENT_SECURITY_POLICY } from "./config/contentSecurityPolicy.mjs";

const MAIN_REPO_OWNER = "pizenkov13-boop";

/**
 * Build-time flags for sites deployed from the template. On Vercel the repository owner tells a fork
 * from the main site, so a copy is recognised even if its operator sets no variables at all.
 */
function copyModeEnv() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER?.trim().toLowerCase();
  const isFork = Boolean(owner) && owner !== MAIN_REPO_OWNER;
  const env = { NEXT_PUBLIC_IS_FORK: isFork ? "true" : "false" };
  if (isFork) {
    env.NEXT_PUBLIC_CHAT_ENABLED = process.env.AITUNNEL_API_KEY?.trim() ? "true" : "false";
    const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (!process.env.NEXT_PUBLIC_SITE_URL?.trim() && production) {
      env.NEXT_PUBLIC_SITE_URL = `https://${production}`;
    }
  }
  return env;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: copyModeEnv(),
  output: "standalone",
  transpilePackages: ["leaflet", "react-leaflet"],
  // Next.js 16 defaults to Turbopack; empty config acknowledges custom webpack (dev only).
  turbopack: {},
  images: {
    qualities: [100, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sdgs.un.org",
        pathname: "/sites/default/files/goals/**",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Avoid eval-based source maps — fixes "CSP blocks eval" warnings in dev.
      config.devtool = "cheap-module-source-map";
      config.plugins = config.plugins?.filter(
        (plugin) => plugin?.constructor?.name !== "EvalSourceMapDevToolPlugin",
      );
    }
    return config;
  },
  async headers() {
    const swHeaders = [
      {
        key: "Cache-Control",
        value: "no-cache, no-store, must-revalidate",
      },
      {
        key: "Service-Worker-Allowed",
        value: "/",
      },
    ];

    if (process.env.NODE_ENV !== "production") {
      return [{ source: "/sw.js", headers: swHeaders }];
    }

    const documentHeaders = [
      {
        key: "Cache-Control",
        value: "no-cache, must-revalidate",
      },
      {
        // Location is asked for on a tap, by this site only (never by an embedded frame).
        key: "Permissions-Policy",
        value: "geolocation=(self)",
      },
      {
        key: "Content-Security-Policy",
        value: CONTENT_SECURITY_POLICY,
      },
    ];

    return [
      {
        source: "/",
        headers: documentHeaders,
      },
      {
        source:
          "/((?!_next/static|_next/image|favicon.ico|icons|images|api/impact$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2)$).*)",
        headers: documentHeaders,
      },
      {
        source: "/sw.js",
        headers: swHeaders,
      },
    ];
  },
};

export default nextConfig;
