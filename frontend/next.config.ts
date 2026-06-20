import type { NextConfig } from "next";

const externalBackend = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
/** Server-side proxy target (Docker: http://backend:8000). Baked in at `next build`. */
const proxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  externalBackend ||
  "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_URL || !!process.env.VERCEL_ENV;
    if (isVercel && !externalBackend && !process.env.API_PROXY_TARGET) {
      // In Vercel serverless environment, if we don't have an explicit external backend
      return [];
    }

    const destination = proxyTarget;
    return [
      {
        source: "/api/:path*",
        destination: `${destination}/:path*`,
      },
    ];
  },
};

export default nextConfig;
