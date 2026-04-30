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
      // Disable post-build checks until layouts are migrated to theme components
      // (C1+). Re-enable checkA11y and checkDecks in Phase G.
      checkA11y: false,
      checkDecks: false,
    }),
    sitemap(),
    astromotion({ theme: "./src/decks/theme.css" }),
  ],
});
