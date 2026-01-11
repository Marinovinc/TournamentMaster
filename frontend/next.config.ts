import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone for Docker/server deployment
  output: "standalone",

  // Base path for Apache reverse proxy (http://localhost/tm/)
  basePath: "/tm",

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["@turf/turf"],
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disabilita in dev per evitare problemi
});

export default pwaConfig(withNextIntl(nextConfig));
