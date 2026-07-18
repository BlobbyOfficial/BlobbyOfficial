import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      // The old static site used British spelling and a /pages/ prefix.
      { source: "/licencing", destination: "/licensing", permanent: true },
      { source: "/pages/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
