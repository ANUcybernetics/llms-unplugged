// Semantic CSS linting — oxfmt owns formatting, so the standard rules that
// contest it (comment/custom-property spacing, keyword case, import notation)
// are off, along with the naming patterns the theme's --at-* tokens and
// BEM-ish class names don't follow. Shared baseline across the theme-family
// repos — repo-specific deltas below the marked line.
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["dist/**", ".astro/**", "node_modules/**"],
  rules: {
    "no-descending-specificity": null,
    "comment-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "value-keyword-case": null,
    "import-notation": null,
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    // --- repo-specific deltas below ---
  },
  overrides: [
    // Scoped <style> blocks in Astro and Svelte components, via postcss-html.
    // Svelte's :global() and Astro's is:global are not pseudo-classes stylelint
    // knows, Svelte compiles global keyframes to a -global- prefix, and the
    // blank-line rules contest what oxfmt and prettier emit for these blocks.
    {
      files: ["**/*.astro", "**/*.svelte"],
      customSyntax: "postcss-html",
      rules: {
        "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
        "keyframes-name-pattern": "^(-global-)?[a-z][a-z0-9-]*$",
        "rule-empty-line-before": null,
        "at-rule-empty-line-before": null,
      },
    },
  ],
};
