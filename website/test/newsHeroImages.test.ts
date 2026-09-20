import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const NEWS_DIR = join(process.cwd(), "src/content/news");
const IMAGES_DIR = join(process.cwd(), "src/assets/images");

describe("News hero images", () => {
  it("has a hero image for every published news post", () => {
    const newsFiles = readdirSync(NEWS_DIR)
      .filter((f) => /\.mdx?$/.test(f))
      .filter((f) => {
        const source = readFileSync(join(NEWS_DIR, f), "utf8");
        const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!frontmatter) throw new Error(`Missing frontmatter in ${f}`);
        return parse(frontmatter[1]).published !== false;
      })
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
