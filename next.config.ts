import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.sandbox.midtrans.com',
      },
    ],
  },
};

export default nextConfig;
