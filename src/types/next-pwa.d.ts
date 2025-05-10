declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  interface PWAOptions {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    runtimeCaching?: any[];
    buildExcludes?: Array<string | RegExp>;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    fallbacks?: {
      [key: string]: string;
    };
  }
  
  function withPWA(options?: PWAOptions): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
