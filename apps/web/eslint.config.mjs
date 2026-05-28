import nextConfig from "@plani/config/eslint/nextjs";

export default [
  {
    ignores: [
      "eslint.config.mjs",
      "next-env.d.ts",
      "next.config.ts",
      "vitest.config.ts",
      "playwright.config.ts",
      ".next/**",
      "dist/**",
    ],
  },
  ...nextConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
