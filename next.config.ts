import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude `.ts` from page/proxy detection so that the legacy `middleware.ts`
  // (can't be deleted) is silently ignored. All real route files use `.tsx`.
  // The active auth proxy is `src/proxy.tsx`.
  pageExtensions: ["tsx", "jsx", "js"],
};

export default nextConfig;
