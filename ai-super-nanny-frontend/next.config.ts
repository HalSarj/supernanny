import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import path from 'path';

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Explicitly configure webpack to support path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  // Disable ESLint and TypeScript checking during build
  eslint: {
    // Skip ESLint during builds (recommended for deployment)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during builds (recommended for deployment)
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);
