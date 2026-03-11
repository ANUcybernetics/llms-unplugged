import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import remarkSmartypants from "remark-smartypants";
import { astromotion, deckPreprocessor } from "astromotion";

export default defineConfig({
  site: "https://www.llmsunplugged.org",
  integrations: [
    mdx(),
    svelte({ preprocess: [deckPreprocessor()] }),
    sitemap(),
    astromotion({ theme: "./src/decks/theme.css" }),
  ],
  markdown: {
    remarkPlugins: [[remarkSmartypants, { dashes: "oldschool" }]],
  },
  vite: {
    css: {
      transformer: "lightningcss",
    },
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Public Sans",
      cssVariable: "--font-public-sans",
      provider: fontProviders.google(),
    },
  ],
});
