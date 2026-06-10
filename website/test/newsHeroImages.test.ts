import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const NEWS_DIR = join(process.cwd(), "src/content/news");
const IMAGES_DIR = join(process.cwd(), "src/assets/images");

describe("News hero images", () => {
  it("has a hero image for every news post", () => {
    const newsFiles = readdirSync(NEWS_DIR)
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => f.replace(/\.mdx?$/, ""));

    for (const slug of newsFiles) {
      const heroPath = join(IMAGES_DIR, `hero-news-${slug}.avif`);
      expect(
        existsSync(heroPath),
        `Missing news hero image: src/assets/images/hero-news-${slug}.avif`,
      ).toBe(true);
    }
  });
});
