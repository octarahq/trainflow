import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

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

export default withNextIntl(nextConfig);
