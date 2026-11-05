
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudflare Tunnel during development
  allowedDevOrigins: [
    "wherever-november-recommends-indianapolis.trycloudflare.com",
  ],

  // Broker Portal security headers — preserved
  async headers() {
    return [
      {
        source: "/broker/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
