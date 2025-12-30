declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    sw?: string;
    scope?: string;
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    fallbacks?: {
      document?: string;
      image?: string;
      font?: string;
      audio?: string;
      video?: string;
    };
    runtimeCaching?: Array<{
      urlPattern: RegExp | string;
      handler: string;
      options?: object;
    }>;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
