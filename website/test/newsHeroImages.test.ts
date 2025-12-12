import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const NEWS_DIR = join(process.cwd(), "news");
const IMAGES_DIR = join(process.cwd(), "public/assets/images");

describe("News hero images", () => {
  it("has a hero image for every news post", () => {
    const newsFiles = readdirSync(NEWS_DIR)
      .filter((f) => f.endsWith(".md") && f !== "index.md")
      .map((f) => f.replace(/\.md$/, ""));

    for (const slug of newsFiles) {
      const heroPath = join(IMAGES_DIR, `hero-news-${slug}.avif`);
      expect(
        existsSync(heroPath),
        `Missing news hero image: public/assets/images/hero-news-${slug}.avif`,
      ).toBe(true);
    }
  });
});
