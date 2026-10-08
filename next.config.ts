import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets the Android emulator (which reaches this machine as 10.0.2.2) load the dev server's scripts.
  allowedDevOrigins: ["10.0.2.2"],
  // The driver app now lives at /rider — keep old links working.
  async redirects() {
    return [{ source: "/driver", destination: "/rider", permanent: true }];
  },
  // The site's front door is the customer app (splash → phone login); the URL stays "/".
  // Riders and admins use /rider and /admin.
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/customer" }], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
