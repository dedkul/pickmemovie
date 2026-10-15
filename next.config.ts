import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // enables "use cache" for TMDb and Geoapify responses
};

export default nextConfig;
