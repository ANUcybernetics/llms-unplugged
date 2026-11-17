// Old deck URLs and where they live now. Astro's `redirects` config emits a
// meta refresh, which drops the query string and the hash, and a deck link
// carries both (`?presenters=cb&teachers`, `#/12`). These are served instead by
// src/components/DeckRedirect.astro, which keeps them; astro.config.ts injects
// one route per entry.
export const DECK_REDIRECTS: Record<string, string> = {
  "/decks/how-ai-writes-stories/": "/decks/how-ai-writes-stories-cutouts/",
  "/decks/how-ai-writes-stories-ledger/": "/decks/how-ai-writes-stories-90min/",
  "/decks/how-ai-writes-stories-ledger-45min/": "/decks/how-ai-writes-stories-60min/",
  "/decks/how-ai-writes-stories-ledger-60min/": "/decks/how-ai-writes-stories-60min/",
  "/decks/how-ai-writes-stories-ledger-90min/": "/decks/how-ai-writes-stories-90min/",
  // Slugs from before the July 2026 lessons restructure.
  "/decks/grid-2h/": "/decks/my-first-language-model-2h/",
  "/decks/grid-60min/": "/decks/my-first-language-model-60min/",
  "/decks/cutouts-yr5-6/": "/decks/how-ai-writes-stories-cutouts/",
  // As-delivered talk records (published: false), superseded by their
  // reusable versions.
  "/decks/unplugged-age-of-ai/": "/decks/unplugged-in-the-age-of-ai/",
  "/decks/visionaries-showcase/": "/decks/demystifying-large-language-models/",
};
