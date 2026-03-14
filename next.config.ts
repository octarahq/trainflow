import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://fr1.orionhost.xyz:4013/:path*",
      },
    ];
  },
};

export default nextConfig;
