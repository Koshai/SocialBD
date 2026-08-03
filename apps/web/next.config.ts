import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Load monorepo root .env (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@socialbd/ui", "@socialbd/db"],
  // Ensure root .env flags are available to the client bundle.
  env: {
    NEXT_PUBLIC_AGENTS_ENABLED: process.env.NEXT_PUBLIC_AGENTS_ENABLED ?? "",
  },
};

export default nextConfig;
