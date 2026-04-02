import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
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
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "prepend",
          properties: { class: "heading-anchor", ariaLabel: "Link to this section" },
          content: {
            type: "text",
            value: "#",
          },
        },
      ],
    ],
  },
  vite: {
    css: {
      transformer: "lightningcss",
    },
  },
  fonts: [
    {
      name: "Public Sans",
      cssVariable: "--font-public-sans",
      provider: fontProviders.google(),
    },
    {
      name: "Roboto Mono",
      cssVariable: "--font-roboto-mono",
      provider: fontProviders.google(),
      weights: ["400", "700"],
      styles: ["normal"],
      fallbacks: ["monospace"],
    },
  ],
});
