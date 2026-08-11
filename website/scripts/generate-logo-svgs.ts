import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { TITLE_TINTS, TITLE_TOKENS, titleOnlyLayout, tokenBits } from "../src/lib/token-logo.ts";
import { WORDMARK_ADVANCE, WORDMARK_CAP_HEIGHT, WORDMARK_PATH } from "./wordmark-path.ts";

// Defaults to the checked-in location; tests override LOGO_OUT_DIR so they
// don't clobber the committed files in public/.
const OUT_DIR = process.env.LOGO_OUT_DIR || "public";

const REF_W = 960;
const REF_H = 540;
const BG = "#0a0a0a";

// The 4x4 dot grid, shared by the favicon and the lockup: a 28-unit rounded
// tile with 2-unit dots on a 6-unit pitch.
const TILE = 28;
const TILE_RADIUS = 4;
const DOT_PAD = 5;
const DOT_SPACING = 6;
const DOT_RADIUS = 2;
const TILE_FILL = "#1a1a1a";
const DIM = "rgba(255,255,255,0.08)";
const CYCLE_SECONDS = 15;

/**
 * For each of the 16 grid positions, the bit that position takes in each of the
 * five title tokens, as a string like "10110". Positions sharing a key share an
 * animation.
 */
function positionKeys(): string[] {
  const patterns = TITLE_TOKENS.map((t) => tokenBits(t.id));
  return Array.from({ length: 16 }, (_, j) => patterns.map((p) => (p[j] ? "1" : "0")).join(""));
}

/** CSS keyframes cycling each position through the five tokens' bit patterns. */
function gridAnimationCss(keys: string[]): string {
  let css = "";
  for (const key of new Set(keys)) {
    const frames: string[] = [];
    for (let t = 0; t < 5; t++) {
      const pct = t * 20;
      const hold = pct + 17;
      const color = key[t] === "1" ? TITLE_TINTS[t] : DIM;
      frames.push(`${pct}%{fill:${color}}${hold}%{fill:${color}}`);
    }
    frames.push(`100%{fill:${key[0] === "1" ? TITLE_TINTS[0] : DIM}}`);
    css += `@keyframes f-${key}{${frames.join("")}}`;
    css += `.f-${key}{animation:f-${key} ${CYCLE_SECONDS}s infinite}`;
  }
  return css;
}

/**
 * The 16 dots of one grid, resting on the first token's pattern ("LL"). When
 * `animated`, each dot also carries the class that cycles it through all five.
 */
function gridDots(keys: string[], animated: boolean, indent: string): string {
  return keys
    .map((key, j) => {
      const cx = DOT_PAD + (j % 4) * DOT_SPACING;
      const cy = DOT_PAD + Math.floor(j / 4) * DOT_SPACING;
      const fill = key[0] === "1" ? TITLE_TINTS[0] : DIM;
      const cls = animated ? ` class="f-${key}"` : "";
      return `${indent}<circle${cls} cx="${cx}" cy="${cy}" r="${DOT_RADIUS}" fill="${fill}"/>`;
    })
    .join("\n");
}

function generateFavicon(): string {
  const keys = positionKeys();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}">
  <style>${gridAnimationCss(keys)}</style>
  <rect width="${TILE}" height="${TILE}" rx="${TILE_RADIUS}" fill="${TILE_FILL}"/>
${gridDots(keys, true, "  ")}
</svg>
`;
}

// Horizontal lockup geometry, in the same 28-unit tile the favicon uses. The
// cap height is half the tile, which is what keeps the grid reading as an equal
// partner rather than a bullet point in front of a heading; the gap is roughly
// the same again. Centring the cap-height box alone leaves the word looking
// low, because "plug" and "ged" hang three deep descenders below the baseline,
// so the whole wordmark lifts a unit to put the ink back on the tile's axis.
const LOCKUP_CAP_HEIGHT = 14;
const LOCKUP_GAP = 13;
const LOCKUP_DESCENDER_LIFT = 1;
const WORDMARK_SCALE = LOCKUP_CAP_HEIGHT / WORDMARK_CAP_HEIGHT;
const LOCKUP_TEXT_X = TILE + LOCKUP_GAP;
const LOCKUP_BASELINE = (TILE + LOCKUP_CAP_HEIGHT) / 2 - LOCKUP_DESCENDER_LIFT;
const LOCKUP_W = Math.round((LOCKUP_TEXT_X + WORDMARK_ADVANCE * WORDMARK_SCALE) * 10) / 10;

/**
 * The favicon grid with the title set beside it in Public Sans Bold: the
 * horizontal lockup for headers, footers, letterhead and slide corners, where
 * the square marks don't fit and the dot patterns alone don't say who this is.
 *
 * The background is transparent, so `tone` only picks the wordmark colour ---
 * "dark" for placing on dark surfaces, "light" for placing on light ones.
 */
function generateLockup(tone: "dark" | "light", animated: boolean): string {
  const keys = positionKeys();
  const style = animated ? `\n  <style>${gridAnimationCss(keys)}</style>` : "";
  const wordmarkFill = tone === "dark" ? "#ffffff" : TILE_FILL;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOCKUP_W} ${TILE}">${style}
  <rect width="${TILE}" height="${TILE}" rx="${TILE_RADIUS}" fill="${TILE_FILL}"/>
${gridDots(keys, animated, "  ")}
  <g transform="translate(${LOCKUP_TEXT_X} ${LOCKUP_BASELINE}) scale(${WORDMARK_SCALE})">
    <path d="${WORDMARK_PATH}" fill="${wordmarkFill}"/>
  </g>
</svg>
`;
}

function generateTitleSvg(): string {
  const positions = titleOnlyLayout(REF_W, REF_H);
  const bricks = TITLE_TOKENS.map((token, ti) => {
    const pos = positions[ti];
    const bits = tokenBits(token.id);
    const dotSize = pos.h * 0.65;
    const dotX = (pos.w - dotSize) / 2;
    const dotY = (pos.h - dotSize) / 2;
    const dots = bits
      .map((bit, j) => {
        const cx = (j % 4) * 4.5 + 2.25;
        const cy = Math.floor(j / 4) * 4.5 + 2.25;
        const fill = bit ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)";
        return `      <circle cx="${cx}" cy="${cy}" r="1.5" fill="${fill}"/>`;
      })
      .join("\n");

    return `  <g transform="translate(${pos.x} ${pos.y})">
    <rect width="${pos.w}" height="${pos.h}" rx="6" fill="${TITLE_TINTS[ti]}"/>
    <svg x="${dotX}" y="${dotY}" width="${dotSize}" height="${dotSize}" viewBox="0 0 18 18" opacity="0">
${dots}
    </svg>
    <text x="${pos.w / 2}" y="${pos.h / 2}" text-anchor="middle" dominant-baseline="central"
      fill="white" font-family="'Roboto Mono', monospace" font-weight="700"
      font-size="${pos.h * 0.75}px">${token.displayText}</text>
  </g>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${REF_W} ${REF_H}">
  <style>@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@700');</style>
  <rect width="${REF_W}" height="${REF_H}" fill="${BG}"/>
${bricks}
</svg>
`;
}

const outputs: [string, string][] = [
  ["favicon.svg", generateFavicon()],
  ["lockup.svg", generateLockup("dark", false)],
  ["lockup-light.svg", generateLockup("light", false)],
  ["lockup-animated.svg", generateLockup("dark", true)],
  ["title-logo.svg", generateTitleSvg()],
];

for (const [name, svg] of outputs) {
  const path = join(OUT_DIR, name);
  writeFileSync(path, svg);
  console.log(`Wrote ${path}`);
}
