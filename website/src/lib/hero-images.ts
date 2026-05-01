import type { ImageMetadata } from "astro";

const modules = import.meta.glob<ImageMetadata>(
  "../assets/images/*.avif",
  { eager: true, import: "default" },
);

const byFilename: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path.split("/").pop()!.replace(/\.avif$/, ""),
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
