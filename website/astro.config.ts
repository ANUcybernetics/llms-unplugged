import fs from "node:fs";
import path from "node:path";
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import universityTheme from "astro-theme-university";
import { astromotion, deckRemarkPlugins } from "astromotion";

// Paths of unlisted (`listed: false`) modules and lessons, so the sitemap can
// skip them. The config runs before the content layer exists, so this scans
// the frontmatter directly.
function unlistedContentPaths(): string[] {
  const collections = [
    ["src/content/modules", "modules"],
    ["src/content/lessons", "lessons"],
  ] as const;
  return collections.flatMap(([dir, route]) =>
    fs
      .readdirSync(dir)
      .filter(
        (f) =>
          f.endsWith(".mdx") &&
          /^listed:\s*false/m.test(fs.readFileSync(path.join(dir, f), "utf-8")),
      )
      .map((f) => `/${route}/${f.replace(/\.mdx$/, "")}/`),
  );
}

const unlistedPaths = unlistedContentPaths();

export default defineConfig({
  site: "https://www.llmsunplugged.org",
  // Pages build as directories, so every route URL ends in a slash. Declaring
  // it keeps internal links honest: the dev server rejects the slash-less form,
  // so a hardcoded "/lessons/training" can't quietly reintroduce the 301 hop
  // that GitHub Pages serves for it.
  trailingSlash: "always",
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
    // The July 2026 restructure renamed the per-activity pages from "lessons"
    // to "modules" (a lesson is now a deck-backed workshop journey built from
    // modules). Slugs are unchanged; every old /lessons/<slug>/ URL redirects
    // to its /modules/<slug>/ counterpart.
    "/lessons/agentic-ai/": "/modules/agentic-ai/",
    "/lessons/generation/": "/modules/generation/",
    "/lessons/in-context-memory/": "/modules/in-context-memory/",
    "/lessons/induction-heads/": "/modules/induction-heads/",
    "/lessons/lora/": "/modules/lora/",
    "/lessons/more-context/": "/modules/more-context/",
    "/lessons/pretrained-generation/": "/modules/pretrained-generation/",
    "/lessons/rlhf/": "/modules/rlhf/",
    "/lessons/sampling/": "/modules/sampling/",
    "/lessons/sycophancy/": "/modules/sycophancy/",
    "/lessons/synthetic-data/": "/modules/synthetic-data/",
    "/lessons/training/": "/modules/training/",
    "/lessons/weighted-randomness/": "/modules/weighted-randomness/",
    "/lessons/word-embeddings/": "/modules/word-embeddings/",
    // module renamed from "Agentic tool use" (June 2026)
    "/lessons/agentic-tool-use/": "/modules/agentic-ai/",
    // The workshop-formats page was superseded by the lessons index (its
    // "Going deeper" format seeds task-131).
    "/workshops/": "/lessons/",
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
    universityTheme({
      name: "LLMs Unplugged",
      llmsTxt: true,
      // ANU brand palette from the branding package — loads the gold palette
      // and the legacy --anu-* aliases that the site's own CSS (deck theme,
      // widgets, components) references, on every page including decks.
      brandCss: "astro-theme-anu/anu.css",
      // The axe/JSDOM accessibility scan adds ~8 min to a build, so keep it out
      // of the every-push deploy. It runs opt-in via CHECK_A11Y=true — in the
      // weekly a11y-audit workflow and locally via `pnpm run build:a11y`.
      checkA11y: process.env.CHECK_A11Y === "true",
      // Deck plugins run through the theme's markdown processor; the plain
      // mdx() the theme auto-registers inherits them.
      extraRemarkPlugins: deckRemarkPlugins,
    }),
    sitemap({
      // Decks are interactive Reveal.js presentations, not indexable pages;
      // unlisted modules/lessons are reachable only via direct links.
      filter: (page) => !page.includes("/decks/") && !unlistedPaths.some((p) => page.endsWith(p)),
    }),
    astromotion({
      theme: "./src/decks/theme.css",
      fontVariables: ["--font-libertinus-serif"],
      favicon: "/favicon.svg",
    }),
  ],
});
