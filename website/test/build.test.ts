import { beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, globSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findBrokenPdfLinks } from "./utils/linkChecker";

const DIST_DIR = "dist";
const SITE_ORIGIN = "https://www.llmsunplugged.org";

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
    // Building is slow, so reuse an existing dist/ where possible; set
    // FORCE_BUILD=1 to rebuild unconditionally.
    if (!existsSync(join(DIST_DIR, "index.html")) || process.env.FORCE_BUILD) {
      execSync("pnpm run build", { stdio: "inherit" });
    }
  }, 120000);

  it("creates dist directory", () => {
    expect(existsSync(DIST_DIR)).toBe(true);
  });

  it("generates index.html", () => {
    expect(existsSync(join(DIST_DIR, "index.html"))).toBe(true);
  });

  it("generates module pages", () => {
    const modulesDir = join(DIST_DIR, "modules");
    expect(existsSync(modulesDir)).toBe(true);

    // Derived from the module content collection so every module --- listed or
    // unlisted --- is checked automatically rather than from a hand-maintained
    // copy here.
    const slugs = globSync("src/content/modules/*.mdx").map((f) =>
      f
        .split("/")
        .pop()!
        .replace(/\.mdx$/, ""),
    );
    expect(slugs.length).toBeGreaterThan(0);
    for (const module of slugs) {
      expect(
        existsSync(join(modulesDir, module, "index.html")),
        `Missing module page: ${module}`,
      ).toBe(true);
    }
  });

  it("generates static pages", () => {
    expect(existsSync(join(DIST_DIR, "about/index.html"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "faq/index.html"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "lessons/index.html"))).toBe(true);
    expect(existsSync(join(DIST_DIR, "modules/index.html"))).toBe(true);
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

  it("emits optimised image assets", () => {
    const astroDir = join(DIST_DIR, "_astro");
    expect(existsSync(astroDir)).toBe(true);

    const files = readdirSync(astroDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.startsWith("hero-"))).toBe(true);
  });

  // Guards the regression where og:image pointed at source asset paths
  // (e.g. /src/assets/images/...) that don't exist in the built site.
  it("og:image URLs on module and news pages resolve to built files", () => {
    const pages = [
      ...globSync(join(DIST_DIR, "modules/*/index.html")),
      ...globSync(join(DIST_DIR, "news/*/index.html")),
    ];
    expect(pages.length).toBeGreaterThan(0);

    const broken: string[] = [];
    for (const file of pages) {
      const content = readFileSync(file, "utf-8");
      const match = content.match(/<meta property="og:image" content="([^"]+)"/);
      if (!match) continue;
      const url = new URL(match[1], SITE_ORIGIN);
      // Off-site image URLs are out of scope for this check
      if (url.origin !== SITE_ORIGIN) continue;
      const assetPath = decodeURIComponent(url.pathname);
      if (!existsSync(join(DIST_DIR, assetPath))) {
        broken.push(`${file}: ${match[1]}`);
      }
    }

    expect(broken, `og:image URLs without a built file:\n${broken.join("\n")}`).toEqual([]);
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
