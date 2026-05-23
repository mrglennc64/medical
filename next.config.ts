import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-parse pulls in pdfjs-dist, which loads its worker via a runtime path
  // that Next's bundler rewrites and then can't find. Marking it external
  // makes Next leave the require()s alone and resolve them from node_modules
  // at runtime.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  async redirects() {
    return [
      // /demo was renamed to /coder; preserve any old bookmarks or external
      // references (and the ?chart=... query param) by 308-redirecting.
      { source: "/demo", destination: "/coder", permanent: true },
      { source: "/demo/:path*", destination: "/coder/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
