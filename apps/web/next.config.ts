import { config } from "dotenv";
import type { NextConfig } from "next";
import { resolve } from "path";

// In a monorepo, Next.js looks for .env in apps/web/ but we keep a single
// .env at the repo root. Load it here so all server-side code has access.
// override: false means explicit process.env vars (e.g. from Docker) win.
config({ path: resolve(__dirname, "../../.env"), override: false });

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@plani/ui", "@plani/auth", "@plani/db", "@plani/email", "@plani/types"],
};

export default nextConfig;
