import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@plani/ui", "@plani/auth", "@plani/db", "@plani/email", "@plani/types"],
};

export default nextConfig;
