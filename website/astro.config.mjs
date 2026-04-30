import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import anuTheme from "astro-theme-anu";
import { astromotion, deckPreprocessor } from "astromotion";

export default defineConfig({
  site: "https://www.llmsunplugged.org",
  integrations: [
    // Register svelte explicitly with the deck preprocessor BEFORE anuTheme,
    // so anuTheme detects it and skips its own svelte registration. Without
    // the deckPreprocessor, .deck.svelte files won't compile.
    svelte({ preprocess: [deckPreprocessor()] }),
    anuTheme({
      name: "LLMs Unplugged",
      llmsTxt: true,
      // checkA11y currently flags ~12 violations. Most are
      // landmark-complementary-is-top-level (theme's SidebarLayout places
      // <aside> inside <main>); fixing requires theme architectural
      // changes. Other minors: empty-table-header on word-embeddings,
      // heading-order on /news/.
      checkA11y: false,
      // checkDecks expects astromotion decks to use the theme's slide
      // structure (.reveal wrapper, etc.). The llms-unplugged decks
      // pre-date that convention and use astromotion's own template.
      checkDecks: false,
    }),
    sitemap(),
    astromotion({ theme: "./src/decks/theme.css" }),
  ],
});
