import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import markdownIt from "markdown-it";

const siteDir = join(process.cwd(), "_site");

describe("build output", () => {
  beforeAll(() => {
    if (!existsSync(siteDir)) {
      throw new Error(
        "_site directory does not exist. Run npm run build first.",
      );
    }
  });

  it("generates index.html", () => {
    const indexPath = join(siteDir, "index.html");
    expect(existsSync(indexPath)).toBe(true);
  });

  it("generates CSS bundle", () => {
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    const cssFiles = files.filter((f) => f.endsWith(".css"));
    expect(cssFiles.length).toBeGreaterThan(0);
  });

  it("generates JS bundle", () => {
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    const jsFiles = files.filter((f) => f.endsWith(".js"));
    expect(jsFiles.length).toBeGreaterThan(0);
  });

  it("includes Tailwind CSS in the bundle", () => {
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    const cssFile = files.find((f) => f.endsWith(".css"));
    const cssPath = join(assetsDir, cssFile);
    const css = readFileSync(cssPath, "utf-8");
    expect(css.length).toBeGreaterThan(1000);
  });

  it("includes Tailwind utility classes in CSS", () => {
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    const cssFile = files.find((f) => f.endsWith(".css"));
    const cssPath = join(assetsDir, cssFile);
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toMatch(/\.min-h-screen/);
    expect(css).toMatch(/\.bg-anu-black/);
    expect(css).toMatch(/\.text-anu-white/);
  });

  it("includes custom ANU color definitions in CSS", () => {
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    const cssFile = files.find((f) => f.endsWith(".css"));
    const cssPath = join(assetsDir, cssFile);
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain("--color-anu-gold");
    expect(css).toContain("#be830e");
  });

  it("includes prose styling in CSS", () => {
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    const cssFile = files.find((f) => f.endsWith(".css"));
    const cssPath = join(assetsDir, cssFile);
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain(".prose");
  });

  it("includes modern CSS features", () => {
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    const cssFile = files.find((f) => f.endsWith(".css"));
    const cssPath = join(assetsDir, cssFile);
    const css = readFileSync(cssPath, "utf-8");

    // Focus visible styles
    expect(css).toContain(":focus-visible");

    // Reduced motion support
    expect(css).toContain("prefers-reduced-motion");

    // Print styles
    expect(css).toContain("@media print");

    // Skip link styles
    expect(css).toContain(".skip-link");
  });

  it("generates valid HTML with correct structure", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("LLMs Unplugged");
    expect(html).toContain('<link rel="stylesheet"');
    expect(html).toContain('href="/assets/');
    expect(html).toContain('<script type="module"');
    expect(html).toContain('src="/assets/');
  });

  it("includes key content in the HTML", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("LLMs Unplugged");
  });

  it("CSS is linked independently of JavaScript", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");

    // CSS should be linked as a stylesheet, not imported via JS
    const linkMatch = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/);
    expect(linkMatch).toBeTruthy();

    // The CSS file should exist and be a hashed bundle
    const cssHref = linkMatch[1];
    expect(cssHref).toMatch(/\/assets\/main-[a-zA-Z0-9_-]+\.css$/);

    // Verify the CSS file exists
    const cssFileName = cssHref.replace("/assets/", "");
    const assetsDir = join(siteDir, "assets");
    const files = readdirSync(assetsDir);
    expect(files).toContain(cssFileName);
  });
});

describe("navigation", () => {
  it("includes semantic header with nav element", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("<header");
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Main navigation"');
  });

  it("includes all navigation links", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('href="/about/"');
    expect(html).toContain('href="/contact/"');
  });

  it("includes site branding link", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>\s*Home\s*<\/a>/);
  });

  it("includes semantic main element", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("<main");
  });

  it("includes semantic footer", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("<footer");
    expect(html).toContain("Cybernetic Studio");
  });

  it("includes LLM-friendly markdown link in footer", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('href="/index.md"');
    expect(html).toContain('rel="alternate"');
    expect(html).toContain('type="text/markdown"');
    expect(html).toContain("LLM-friendly version");
  });

  it("includes licensing information in footer", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain("© Ben Swift");
    expect(html).toContain("CC BY-NC-SA 4.0");
    expect(html).toContain("creativecommons.org/licenses/by-nc-sa/4.0");
  });

  it("generates about page", () => {
    const aboutPath = join(siteDir, "about", "index.html");
    expect(existsSync(aboutPath)).toBe(true);
    const html = readFileSync(aboutPath, "utf-8");
    expect(html).toContain("About");
  });

  it("generates contact page", () => {
    const contactPath = join(siteDir, "contact", "index.html");
    expect(existsSync(contactPath)).toBe(true);
    const html = readFileSync(contactPath, "utf-8");
    expect(html).toContain("Contact");
  });
});

describe("accessibility", () => {
  it("includes meta description for SEO", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('<meta name="description"');
  });

  it("includes lang attribute on html element", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('<html lang="en">');
  });

  it("includes viewport meta tag for responsive design", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('<meta name="viewport"');
  });

  it("includes skip link for keyboard navigation", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('class="skip-link"');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to main content");
  });

  it("includes main content id for skip link target", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('id="main-content"');
  });

  it("includes Open Graph meta tags", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('<meta property="og:type"');
    expect(html).toContain('<meta property="og:url"');
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta property="og:description"');
    expect(html).toContain('<meta property="og:image"');
  });

  it("includes Twitter Card meta tags", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('<meta name="twitter:card"');
    expect(html).toContain('<meta name="twitter:url"');
    expect(html).toContain('<meta name="twitter:title"');
    expect(html).toContain('<meta name="twitter:description"');
    expect(html).toContain('<meta name="twitter:image"');
  });

  it("includes favicon link", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('rel="icon"');
    expect(html).toContain('href="/favicon.svg"');
  });

  it("includes theme color meta tag", () => {
    const indexPath = join(siteDir, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    expect(html).toContain('<meta name="theme-color" content="#be830e"');
  });

  it("includes favicon.svg in build output", () => {
    const faviconPath = join(siteDir, "favicon.svg");
    expect(existsSync(faviconPath)).toBe(true);
    const svg = readFileSync(faviconPath, "utf-8");
    expect(svg).toContain("<svg");
  });

  it("includes CNAME in build output", () => {
    const cnamePath = join(siteDir, "CNAME");
    expect(existsSync(cnamePath)).toBe(true);
    const cname = readFileSync(cnamePath, "utf-8");
    expect(cname.trim()).toBe("www.llmsunplugged.org");
  });
});

describe("markdown processing", () => {
  it("converts --- to em dashes", () => {
    const md = markdownIt({ typographer: true });
    const result = md.render("test---value");
    expect(result).toContain("test—value");
  });
});

describe("llms.txt plugin", () => {
  it("copies markdown source files to output directory", () => {
    expect(existsSync(join(siteDir, "index.md"))).toBe(true);
    expect(existsSync(join(siteDir, "about.md"))).toBe(true);
    expect(existsSync(join(siteDir, "contact.md"))).toBe(true);
  });

  it("preserves markdown content in copied files", () => {
    const indexMd = readFileSync(join(siteDir, "index.md"), "utf-8");
    expect(indexMd).toContain("# LLMs Unplugged");
    expect(indexMd).toContain("layout: base.njk");
  });

  it("generates llms.txt file", () => {
    const llmsTxtPath = join(siteDir, "llms.txt");
    expect(existsSync(llmsTxtPath)).toBe(true);
  });

  it("llms.txt follows specification with H1 site name", () => {
    const llmsTxt = readFileSync(join(siteDir, "llms.txt"), "utf-8");
    expect(llmsTxt).toMatch(/^# LLMs Unplugged\n/);
  });

  it("llms.txt includes blockquote with site description", () => {
    const llmsTxt = readFileSync(join(siteDir, "llms.txt"), "utf-8");
    expect(llmsTxt).toContain(
      "> Ready-to-use teaching resources for understanding how large language models work through hands-on activities.",
    );
  });

  it("llms.txt includes H2 section for documentation", () => {
    const llmsTxt = readFileSync(join(siteDir, "llms.txt"), "utf-8");
    expect(llmsTxt).toContain("## Documentation");
  });

  it("llms.txt includes links to markdown files with titles from frontmatter", () => {
    const llmsTxt = readFileSync(join(siteDir, "llms.txt"), "utf-8");
    expect(llmsTxt).toContain(
      "[LLMs Unplugged](https://www.llmsunplugged.org/index.md)",
    );
    expect(llmsTxt).toContain(
      "[About](https://www.llmsunplugged.org/about.md)",
    );
    expect(llmsTxt).toContain(
      "[Contact](https://www.llmsunplugged.org/contact.md)",
    );
  });

  it("llms.txt uses proper markdown list format", () => {
    const llmsTxt = readFileSync(join(siteDir, "llms.txt"), "utf-8");
    const lines = llmsTxt.split("\n");
    const listItems = lines.filter((line) => line.startsWith("- ["));
    expect(listItems.length).toBeGreaterThanOrEqual(3);
  });
});
