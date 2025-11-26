import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        console: "readonly",
        Reveal: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: [
      "*.config.js",
      "eleventy-plugin-*.js",
      "scripts/**/*.js",
      "test/**/*.js",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
  {
    ignores: ["_site/**", "node_modules/**"],
  },
];
