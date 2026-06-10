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

export function heroImage(slug: string): ImageMetadata {
  const img = byFilename[slug];
  if (!img) throw new Error(`hero image not found: ${slug}.avif`);
  return img;
}

export function findHeroImage(slug: string): ImageMetadata | undefined {
  return byFilename[slug];
}

// Lessons whose hero image doesn't share the lesson slug. This is the single
// source of truth — the lesson page (og:image) and CardList both use it.
const LESSON_HERO_ALIASES: Record<string, string> = {
  training: "grid-training",
  generation: "grid-generation",
  "agentic-tool-use": "tool-use",
};

export function lessonHeroImage(slug: string): ImageMetadata | undefined {
  return findHeroImage(`hero-${LESSON_HERO_ALIASES[slug] ?? slug}`);
}
