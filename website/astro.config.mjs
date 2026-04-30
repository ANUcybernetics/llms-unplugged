import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import anuTheme from "astro-theme-anu";
import { astromotion } from "astromotion";

export default defineConfig({
  site: "https://www.llmsunplugged.org",
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
      // socy-logo is a project-specific slide class defined in theme.css
      // for the ANU Society of Cybernetics animated logo slide.
      extraSlideClasses: ["socy-logo"],
    }),
    sitemap(),
    astromotion({ theme: "./src/decks/theme.css" }),
  ],
});
