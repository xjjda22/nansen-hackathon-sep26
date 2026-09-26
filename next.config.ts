import type { NextConfig } from "next";
import path from "path";

const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  turbopack: {
    root: path.join(__dirname),
  },
  ...(staticExport
    ? {
        output: "export" as const,
        trailingSlash: true,
        distDir: ".next-export",
      }
    : {}),
};

export default nextConfig;
