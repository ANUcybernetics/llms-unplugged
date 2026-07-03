import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import anuTheme from "astro-theme-anu";
import { astromotion, deckRemarkPlugins } from "astromotion";

export default defineConfig({
  site: "https://www.llmsunplugged.org",
  vite: {
    // The typst.ts runtime loads its own wasm and pulls in many internal ESM
    // modules; letting Vite's dev dep-optimizer pre-bundle it stalls the tools
    // page at "Loading compiler...". Serving it unbundled in dev sidesteps that
    // (production builds don't use the optimizer and bundle it normally).
    optimizeDeps: {
      exclude: [
        "@myriaddreamin/typst.ts",
        "@myriaddreamin/typst-ts-web-compiler",
        "@myriaddreamin/typst-ts-renderer",
      ],
    },
  },
  // The default (true) strips newline-only whitespace between inline elements,
  // which deletes meaningful spaces wherever Prettier wraps a line at an
  // <a>/<em>/<strong> boundary in an .astro template ("then\n<a>" renders as
  // "then<a>").
  compressHTML: false,
  redirects: {
    // lesson renamed from "Agentic tool use" (June 2026)
    "/lessons/agentic-tool-use": "/lessons/agentic-ai",
  },
  fonts: [
    {
      name: "Libertinus Serif",
      cssVariable: "--font-libertinus-serif",
      provider: fontProviders.google(),
      weights: ["400", "700"],
      styles: ["normal"],
      fallbacks: ["serif"],
    },
  ],
  integrations: [
    svelte(),
    anuTheme({
      name: "LLMs Unplugged",
      llmsTxt: true,
      // The axe/JSDOM accessibility scan adds ~8 min to a build, so keep it out
      // of the every-push deploy. It runs opt-in via CHECK_A11Y=true — in the
      // weekly a11y-audit workflow and locally via `pnpm run build:a11y`.
      checkA11y: process.env.CHECK_A11Y === "true",
      // Deck plugins run through the theme's markdown processor; the plain
      // mdx() the theme auto-registers inherits them.
      extraRemarkPlugins: deckRemarkPlugins,
    }),
    sitemap({
      // Decks are interactive Reveal.js presentations, not indexable pages.
      filter: (page) => !page.includes("/decks/"),
    }),
    astromotion({
      theme: "./src/decks/theme.css",
      fontVariables: ["--font-libertinus-serif"],
    }),
  ],
});
