import { CONTENT_SECURITY_POLICY } from "./config/contentSecurityPolicy.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    const securityHeaders =
      process.env.NODE_ENV === "production"
        ? [
            {
              key: "Content-Security-Policy",
              value: CONTENT_SECURITY_POLICY,
            },
          ]
        : [];

    const documentHeaders =
      process.env.NODE_ENV === "production"
        ? [
            {
              key: "Cache-Control",
              value: "no-cache, must-revalidate",
            },
            ...securityHeaders,
          ]
        : [];

    return [
      {
        source: "/",
        headers: documentHeaders,
      },
      {
        source:
          "/((?!_next/static|_next/image|favicon.ico|icons|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2)$).*)",
        headers: documentHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
