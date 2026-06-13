import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        source: "/api/:path*",
        destination: isDev
          ? "http://localhost:4062/:path*"
          : "http://fr1.orionhost.xyz:4062/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
