import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import anuTheme from "astro-theme-anu";
import { astromotion, deckRemarkPlugins } from "astromotion";

export default defineConfig({
  site: "https://www.llmsunplugged.org",
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
