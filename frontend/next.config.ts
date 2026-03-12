import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/learn-more", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
