import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this app — there is a stray lockfile in the
  // parent directory (C:\escapegoat\package-lock.json) that otherwise makes
  // Next.js infer the wrong workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
