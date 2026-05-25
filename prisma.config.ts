import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Fallback keeps `prisma generate` from failing during Vercel's install
    // phase when DATABASE_URL hasn't been injected yet.  Only migrate/push
    // commands actually connect to the database.
    url: process.env.DATABASE_URL ?? "postgresql://localhost/placeholder",
  },
});
