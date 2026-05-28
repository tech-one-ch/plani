import baseConfig from "@plani/config/eslint/base";

export default [
  { ignores: ["eslint.config.mjs", "dist/**"] },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
