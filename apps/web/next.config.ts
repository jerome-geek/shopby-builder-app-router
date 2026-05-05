import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui', '@repo/blocks', '@repo/utils', '@repo/database']
};

export default nextConfig;
