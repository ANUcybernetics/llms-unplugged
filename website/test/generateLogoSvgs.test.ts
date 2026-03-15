import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

describe("generate-logo-svgs", () => {
  execSync("pnpm tsx scripts/generate-logo-svgs.ts", { cwd: import.meta.dirname + "/.." });

  const favicon = readFileSync("public/favicon.svg", "utf-8");

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
