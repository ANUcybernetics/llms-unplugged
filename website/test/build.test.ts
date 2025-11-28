import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = ".vitepress/dist";

describe("VitePress Build", () => {
  beforeAll(() => {
    // Build the site - this also validates dead links
    execSync("npm run build", { stdio: "inherit" });
  }, 60000); // 60 second timeout for build

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
      "basic-training.html",
      "basic-generation.html",
      "weighted-randomness.html",
      "trigram-model.html",
      "context-columns-training.html",
      "context-columns-generation.html",
      "pretrained-generation.html",
      "word-embeddings.html",
      "lora.html",
      "synthetic-data.html",
      "sampling.html",
    ];

    const files = readdirSync(lessonsDir);
    for (const lesson of expectedLessons) {
      expect(files).toContain(lesson);
    }
  });

  it("generates topic pages", () => {
    const topicsDir = join(DIST_DIR, "topics");
    expect(existsSync(topicsDir)).toBe(true);

    const expectedTopics = [
      "index.html",
      "fundamentals.html",
      "scaling-up.html",
      "how-models-understand.html",
      "adaptation-and-data.html",
      "controlling-output.html",
    ];

    const files = readdirSync(topicsDir);
    for (const topic of expectedTopics) {
      expect(files).toContain(topic);
    }
  });

  it("generates static pages", () => {
    expect(existsSync(join(DIST_DIR, "about.html"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "faq.html"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "educators.html"))).toBe(true);
  });

  it("copies static assets", () => {
    expect(existsSync(join(DIST_DIR, "favicon.svg"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "CNAME"))).toBe(true);
  });

  it("copies PDF assets if they exist", () => {
    const pdfsDir = join(DIST_DIR, "assets/pdfs");
    if (!existsSync(pdfsDir)) {
      return;
    }

    const expectedPdfs = [
      "basic-training.pdf",
      "basic-generation.pdf",
      "weighted-randomness.pdf",
    ];

    const files = readdirSync(pdfsDir);
    for (const pdf of expectedPdfs) {
      expect(files).toContain(pdf);
    }
  });

  it("copies image assets", () => {
    const imagesDir = join(DIST_DIR, "assets/images");
    expect(existsSync(imagesDir)).toBe(true);

    const files = readdirSync(imagesDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.startsWith("hero-"))).toBe(true);
  });

  it("generates 404 page", () => {
    expect(existsSync(join(DIST_DIR, "404.html"))).toBe(true);
  });

  it("generates RSS feed", () => {
    const feedPath = join(DIST_DIR, "feed.rss");
    expect(existsSync(feedPath)).toBe(true);

    const content = readFileSync(feedPath, "utf-8");
    expect(content).toContain("<rss");
    expect(content).toContain("LLMs Unplugged");
    expect(content).toContain("https://www.llmsunplugged.org");
  });
});
