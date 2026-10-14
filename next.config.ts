import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets the Android emulator (which reaches this machine as 10.0.2.2) load the dev server's scripts.
  allowedDevOrigins: ["10.0.2.2"],
  // The customer app is the site's front door at "/" (app/(customer)); riders and admins use /rider and /admin.
  // Old /driver links keep working.
  async redirects() {
    return [{ source: "/driver", destination: "/rider", permanent: true }];
  },
};

export default nextConfig;
