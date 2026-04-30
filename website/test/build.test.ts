import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, globSync } from "node:fs";
import { join } from "node:path";
import { findBrokenPdfLinks } from "./utils/linkChecker";

const DIST_DIR = "dist";

function findBrokenInternalLinks(htmlFiles: string[], distDir: string): string[] {
  const linkRegex = /href="(\/[^"#]*)(?:#[^"]*)?"/g;
  const broken: string[] = [];

  for (const htmlFile of htmlFiles) {
    const content = readFileSync(htmlFile, "utf-8");
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const linkPath = match[1];
      if (linkPath.startsWith("/assets/")) {
        if (!existsSync(join(distDir, linkPath))) {
          broken.push(`${htmlFile}: ${linkPath}`);
        }
      } else {
        const withTrailingSlash = linkPath.endsWith("/") ? linkPath : linkPath + "/";
        const indexPath = join(distDir, withTrailingSlash, "index.html");
        const directPath = join(distDir, linkPath);
        if (!existsSync(indexPath) && !existsSync(directPath)) {
          broken.push(`${htmlFile}: ${linkPath}`);
        }
      }
    }
  }

  return [...new Set(broken)];
}

describe("Astro Build", () => {
  beforeAll(() => {
    execSync("npm run build", { stdio: "inherit" });
  }, 120000);

  it("creates dist directory", () => {
    expect(existsSync(DIST_DIR)).toBe(true);
  });

  it("generates index.html", () => {
    expect(existsSync(join(DIST_DIR, "index.html"))).toBe(true);
  });

  it("generates lesson pages", () => {
    const lessonsDir = join(DIST_DIR, "lessons");
    expect(existsSync(lessonsDir)).toBe(true);

    const expectedLessons = [
      "training",
      "generation",
      "trigram",
      "weighted-randomness",
      "context-columns",
      "pretrained-generation",
      "word-embeddings",
      "lora",
      "synthetic-data",
      "sampling",
    ];

    for (const lesson of expectedLessons) {
      expect(
        existsSync(join(lessonsDir, lesson, "index.html")),
        `Missing lesson page: ${lesson}`,
      ).toBe(true);
    }
  });

  it("generates static pages", () => {
    expect(existsSync(join(DIST_DIR, "about/index.html"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "faq/index.html"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "educators/index.html"))).toBe(true);
  });

  it("copies static assets", () => {
    expect(existsSync(join(DIST_DIR, "favicon.svg"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "CNAME"))).toBe(true);
  });

  it("has no broken internal links", () => {
    const htmlFiles = globSync(join(DIST_DIR, "**/*.html"));
    const brokenLinks = findBrokenInternalLinks(htmlFiles, DIST_DIR);

    expect(brokenLinks, `Broken internal links:\n${brokenLinks.join("\n")}`).toEqual([]);
  });

  it("has no broken links to PDF files", () => {
    const htmlFiles = globSync(join(DIST_DIR, "**/*.html"));
    const brokenLinks = findBrokenPdfLinks(htmlFiles, DIST_DIR);

    expect(brokenLinks, `Broken PDF links:\n${brokenLinks.join("\n")}`).toEqual([]);
  });

  // Regression test for ISSUE-001 from the 2026-04-13 dogfood audit: markdown
  // pages (faq.md, about.md) rendered "undefined | LLMs Unplugged" because
  // PageLayout read `Astro.props.title` directly rather than unwrapping the
  // `frontmatter` prop Astro passes to layouts used via `layout:` frontmatter.
  it("every page has a non-empty, non-'undefined' browser title", () => {
    const htmlFiles = globSync(join(DIST_DIR, "**/*.html"));
    const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
    const bad: string[] = [];

    for (const file of htmlFiles) {
      const content = readFileSync(file, "utf-8");
      const m = content.match(titleRegex);
      const title = m ? m[1].trim() : "";
      if (!title || /undefined|null/i.test(title)) {
        bad.push(`${file}: <title>${title}</title>`);
      }
    }

    expect(bad, `Pages with bad <title>:\n${bad.join("\n")}`).toEqual([]);
  });

  // Regression test for ISSUE-003 from the 2026-04-13 dogfood audit: the nav
  // overflowed at mobile widths because every nav item was visible inline.
  // The nav now ships a hamburger toggle; if someone removes it, this fails.
  it("ships a hamburger toggle for mobile nav", () => {
    const home = readFileSync(join(DIST_DIR, "index.html"), "utf-8");
    const buttonMatch = home.match(/<button[^>]*class="[^"]*at-nav-toggle[^"]*"[^>]*>/);
    expect(buttonMatch, "nav hamburger button not found").not.toBeNull();
    const buttonTag = buttonMatch![0];
    expect(buttonTag).toContain('aria-expanded="false"');
    expect(buttonTag).toContain('aria-controls="at-nav-menu"');
  });

  it("copies image assets", () => {
    const imagesDir = join(DIST_DIR, "assets/images");
    expect(existsSync(imagesDir)).toBe(true);

    const files = readdirSync(imagesDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.startsWith("hero-"))).toBe(true);
  });

  it("generates RSS feed", () => {
    const feedPath = join(DIST_DIR, "feed.xml");
    expect(existsSync(feedPath)).toBe(true);

    const content = readFileSync(feedPath, "utf-8");
    expect(content).toContain("<rss");
    expect(content).toContain("LLMs Unplugged");
    expect(content).toContain("https://www.llmsunplugged.org");
  });
});
