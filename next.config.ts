import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/josephwibowo.github.io',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
