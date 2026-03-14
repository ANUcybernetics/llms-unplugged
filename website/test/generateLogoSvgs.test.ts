import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

describe("generate-logo-svgs", () => {
  execSync("pnpm tsx scripts/generate-logo-svgs.ts", { cwd: import.meta.dirname + "/.." });

  const logo = readFileSync("public/logo.svg", "utf-8");
  const favicon = readFileSync("public/favicon.svg", "utf-8");

  describe("logo.svg", () => {
    it("is valid SVG", () => {
      expect(logo).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(logo.trimEnd()).toMatch(/<\/svg>$/);
    });

    it("uses path outlines instead of text elements", () => {
      expect(logo).not.toContain("<text");
      expect(logo).toContain("<path");
    });

    it("does not depend on external fonts", () => {
      expect(logo).not.toContain("font-family");
      expect(logo).not.toContain("@font-face");
    });

    it("has white fill on text paths", () => {
      const paths = logo.match(/<path[^>]*>/g) ?? [];
      expect(paths.length).toBeGreaterThan(0);
      for (const path of paths) {
        expect(path).toContain('fill="white"');
      }
    });

    it("has coloured title brick rects before each path", () => {
      const titleRects = logo.match(/<rect[^>]*fill="hsl\([^"]+\)"[^>]*\/>/g) ?? [];
      expect(titleRects).toHaveLength(5);
    });

    it("has background brick rects", () => {
      const bgRects = logo.match(/<rect[^>]*fill="#1a1a1a"[^>]*\/>/g) ?? [];
      expect(bgRects.length).toBeGreaterThan(100);
    });
  });

  describe("favicon.svg", () => {
    it("is valid SVG", () => {
      expect(favicon).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(favicon.trimEnd()).toMatch(/<\/svg>$/);
    });

    it("has exactly 16 circles for the 4x4 bit grid", () => {
      const circles = favicon.match(/<circle/g) ?? [];
      expect(circles).toHaveLength(16);
    });

    it("has CSS animations cycling through title token bit patterns", () => {
      expect(favicon).toContain("<style>");
      expect(favicon).toContain("@keyframes");
      const animClasses = favicon.match(/class="f-[01]{5}"/g) ?? [];
      expect(animClasses).toHaveLength(16);
    });

    it("uses initial fills from the first token's bit pattern", () => {
      const fills = favicon.match(/fill="[^"]+"/g) ?? [];
      const circleFills = fills.filter(
        (f) => !f.includes("#1a1a1a"),
      );
      expect(circleFills.length).toBeGreaterThan(0);
    });
  });
});
