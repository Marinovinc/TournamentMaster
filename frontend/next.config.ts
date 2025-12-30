import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Static export for Capacitor APK (frontend included in app)
  output: "export",

  // Required for static export with dynamic routes
  trailingSlash: true,

  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },

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
