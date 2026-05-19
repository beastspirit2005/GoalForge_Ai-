import type { NextConfig } from "next";

const externalBackend = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
/** Server-side proxy target (Docker: http://backend:8000). Baked in at `next build`. */
const proxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  externalBackend ||
  "http://127.0.0.1:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    // Vercel monorepo: /api is routed to the Python service via vercel.json — no Next proxy.
    if (process.env.VERCEL && !externalBackend && !process.env.API_PROXY_TARGET) {
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
