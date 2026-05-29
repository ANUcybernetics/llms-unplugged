import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
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
    mdx({ remarkPlugins: [...deckRemarkPlugins] }),
    anuTheme({
      name: "LLMs Unplugged",
      llmsTxt: true,
      // checkA11y currently flags ~12 violations. Most are
      // landmark-complementary-is-top-level (theme's SidebarLayout places
      // <aside> inside <main>); fixing requires theme architectural
      // changes. Other minors: empty-table-header on word-embeddings,
      // heading-order on /news/.
      checkA11y: false,
      // mdx: false because we register @astrojs/mdx above (with deck remark
      // plugins from astromotion) before anuTheme runs.
      mdx: false,
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
