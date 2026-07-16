import type { ImageMetadata } from "astro";

const modules = import.meta.glob<ImageMetadata>("../assets/images/*.avif", {
  eager: true,
  import: "default",
});

const byFilename: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path
      .split("/")
      .pop()!
      .replace(/\.avif$/, ""),
    mod,
  ]),
);

export function findHeroImage(slug: string): ImageMetadata | undefined {
  return byFilename[slug];
}

// Modules whose hero image doesn't share the module slug. This is the single
// source of truth — the module page (og:image) and CardList both use it.
const MODULE_HERO_ALIASES: Record<string, string> = {
  training: "grid-training",
  generation: "grid-generation",
  "agentic-ai": "tool-use",
};

export function moduleHeroImage(slug: string): ImageMetadata | undefined {
  return findHeroImage(`hero-${MODULE_HERO_ALIASES[slug] ?? slug}`);
}
