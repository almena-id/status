import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, for the Docker image.
  output: "standalone",
  // `task dev` behind a proxy (../develop): let the portal's public origin
  // reach the dev server's resources (hot reload).
  allowedDevOrigins: [
    new URL(process.env.NEXT_PUBLIC_STATUS_WEB_URL ?? "http://localhost").hostname,
  ],
};

export default nextConfig;
