import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("generate-logo-svgs", () => {
  // Generate into a temp dir so the test never overwrites the checked-in
  // files in public/.
  const outDir = mkdtempSync(join(tmpdir(), "logo-svgs-"));
  execSync("pnpm tsx scripts/generate-logo-svgs.ts", {
    cwd: import.meta.dirname + "/..",
    env: { ...process.env, LOGO_OUT_DIR: outDir },
  });

  const favicon = readFileSync(join(outDir, "favicon.svg"), "utf-8");
  const lockup = readFileSync(join(outDir, "lockup.svg"), "utf-8");
  const lockupLight = readFileSync(join(outDir, "lockup-light.svg"), "utf-8");
  const lockupAnimated = readFileSync(join(outDir, "lockup-animated.svg"), "utf-8");

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
      const circleFills = fills.filter((f) => !f.includes("#1a1a1a"));
      expect(circleFills.length).toBeGreaterThan(0);
    });
  });

  describe("lockup.svg", () => {
    it("is valid SVG", () => {
      expect(lockup).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(lockup.trimEnd()).toMatch(/<\/svg>$/);
    });

    it("pairs the 4x4 bit grid with the wordmark on one line", () => {
      expect(lockup.match(/<circle/g) ?? []).toHaveLength(16);
      expect(lockup.match(/<path/g) ?? []).toHaveLength(1);

      const [, w, h] = lockup.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) ?? [];
      expect(Number(w) / Number(h)).toBeGreaterThan(5);
    });

    it("bakes the wordmark to outlines so no font has to load", () => {
      expect(lockup).not.toContain("<text");
      expect(lockup).not.toContain("font-family");
      expect(lockup).not.toContain("@import");
    });

    it("leaves the page background transparent behind the wordmark", () => {
      // The only filled rect is the grid's own tile.
      expect(lockup.match(/<rect/g) ?? []).toHaveLength(1);
      expect(lockup).toContain('<rect width="28" height="28"');
    });

    it("is static, unlike the favicon", () => {
      expect(lockup).not.toContain("@keyframes");
      expect(lockupAnimated).toContain("@keyframes");
      expect(lockupAnimated.match(/class="f-[01]{5}"/g) ?? []).toHaveLength(16);
    });

    it("differs from the light variant only in the wordmark colour", () => {
      expect(lockup).toContain('fill="#ffffff"');
      expect(lockupLight).toContain('fill="#1a1a1a"');
      expect(lockup.replace('fill="#ffffff"', 'fill="#1a1a1a"')).toBe(lockupLight);
    });
  });
});
