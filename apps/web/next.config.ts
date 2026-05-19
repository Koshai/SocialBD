import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Load monorepo root .env (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@socialbd/ui", "@socialbd/db"],
};

export default nextConfig;
