import type { NextConfig } from "next";

const externalBackend = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const localBackend = "http://127.0.0.1:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    // Vercel monorepo: /api is routed to the Python service via vercel.json — no Next proxy.
    if (process.env.VERCEL && !externalBackend) {
      return [];
    }

    const destination = externalBackend || localBackend;
    return [
      {
        source: "/api/:path*",
        destination: `${destination}/:path*`,
      },
    ];
  },
};

export default nextConfig;
