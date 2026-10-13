import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Until the real app is built, the home page serves the latest static
  // prototype (public/prototype/index.html, a copy of prototypes/v10.html).
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/prototype/index.html" }],
    };
  },
};

export default nextConfig;
