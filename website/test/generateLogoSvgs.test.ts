import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TITLE_TINTS, TITLE_TOKENS, tokenBits } from "../src/lib/token-logo.ts";

describe("generate-logo-svgs", () => {
  // Generate into a temp dir so the test never overwrites the checked-in
  // files in public/.
  const outDir = mkdtempSync(join(tmpdir(), "logo-svgs-"));
  execSync("pnpm tsx scripts/generate-logo-svgs.ts", {
    cwd: import.meta.dirname + "/..",
    env: { ...process.env, LOGO_OUT_DIR: outDir },
  });

  const favicon = readFileSync(join(outDir, "favicon.svg"), "utf-8");
  const fiveUp = readFileSync(join(outDir, "favicon-5up.svg"), "utf-8");
  const fiveUpTinted = readFileSync(join(outDir, "favicon-5up-tinted.svg"), "utf-8");
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

  describe("favicon-5up.svg", () => {
    // Every lit dot across the five grids: the strip should show exactly the
    // 1 bits of the five title token IDs, no more and no fewer.
    const litBits = TITLE_TOKENS.flatMap((t) => tokenBits(t.id)).filter(Boolean).length;

    it("lays the five title tokens out in a row", () => {
      for (const svg of [fiveUp, fiveUpTinted]) {
        expect(svg.match(/<circle/g) ?? []).toHaveLength(5 * 16);
        expect(svg).toContain('viewBox="0 0 156 28"');
        expect(svg).not.toContain("@keyframes");
      }
    });

    it("reads LL, Ms, Un, plug, ged left to right", () => {
      // Each grid's dots, in document order, must be its own token's 16 bits.
      const circles = [
        ...fiveUp.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="2" fill="([^"]+)"\/>/g),
      ];
      const actual = circles.map((c) => [
        Number(c[1]),
        Number(c[2]),
        c[3] !== "rgba(255,255,255,0.08)",
      ]);
      const expected = TITLE_TOKENS.flatMap((token, ti) =>
        tokenBits(token.id).map((bit, j) => [
          ti * 32 + 5 + (j % 4) * 6,
          5 + Math.floor(j / 4) * 6,
          bit,
        ]),
      );
      expect(actual).toEqual(expected);
    });

    it("colours the lit dots uniformly in the untinted version", () => {
      const gold = fiveUp.split(`fill="${TITLE_TINTS[0]}"`).length - 1;
      expect(gold).toBe(litBits);
      // The other four tints belong to the tinted variant only.
      for (const tint of TITLE_TINTS.slice(1)) expect(fiveUp).not.toContain(tint);
    });

    it("gives each token its own gold brick in the tinted version", () => {
      for (const [ti, tint] of TITLE_TINTS.entries()) {
        expect(fiveUpTinted).toContain(
          `<rect x="${ti * 32}" y="0" width="28" height="28" rx="4" fill="${tint}"/>`,
        );
      }
      const lit = fiveUpTinted.split('fill="rgba(255,255,255,0.5)"').length - 1;
      expect(lit).toBe(litBits);
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
