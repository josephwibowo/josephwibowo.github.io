import type { NextConfig } from "next";

// GitHub Pages' configure-pages step rewrites this config on deploy to exactly output, basePath "" and unoptimized
// images, so anything else set here would differ between local builds and the live site.
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
