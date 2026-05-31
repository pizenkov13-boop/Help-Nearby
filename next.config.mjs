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
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid eval-based source maps — fixes "CSP blocks eval" console warnings in dev.
      config.devtool = "cheap-module-source-map";
    }
    return config;
  },
  async headers() {
    return [
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
