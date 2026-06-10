import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import anuTheme from "astro-theme-anu";
import { astromotion, deckRemarkPlugins } from "astromotion";
import { collectIncludePaths } from "astromotion/src/vite-plugin-watch-includes.ts";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DECKS_DIR = fileURLToPath(new URL("./src/decks", import.meta.url));

interface HmrContext {
  file: string;
  server: {
    moduleGraph: { onFileChange: (file: string) => void };
    ws: { send: (payload: { type: "full-reload" }) => void };
  };
}

// astromotion's watch-includes plugin (≤ v0.5.3) watches deck partials and
// sends a full-reload on edit, but never invalidates the compiled parent
// .deck.mdx module, so the reload re-serves stale output (astromotion
// task-2). Until that lands upstream, invalidate the parents here so a
// partial edit behaves like an edit to the deck itself. Remove once the
// upstream fix ships.
function deckPartialHmrShim() {
  return {
    name: "llms-unplugged:deck-partial-hmr-shim",
    apply: "serve" as const,
    handleHotUpdate({ file, server }: HmrContext) {
      if (!file.endsWith(".mdx") || !file.includes("/decks/partials/")) return;
      const decks = readdirSync(DECKS_DIR)
        .filter((f) => f.endsWith(".deck.mdx"))
        .map((f) => join(DECKS_DIR, f))
        .filter((deck) => collectIncludePaths(readFileSync(deck, "utf-8"), deck).includes(file));
      for (const deck of decks) {
        server.moduleGraph.onFileChange(deck);
      }
      if (decks.length > 0) {
        server.ws.send({ type: "full-reload" });
      }
    },
  };
}

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
      // checkA11y currently flags ~12 violations. Most are
      // landmark-complementary-is-top-level (theme's SidebarLayout places
      // <aside> inside <main>); fixing requires theme architectural
      // changes. Other minors: empty-table-header on word-embeddings,
      // heading-order on /news/.
      checkA11y: false,
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
  vite: {
    plugins: [deckPartialHmrShim()],
  },
});
