import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { TITLE_TINTS, TITLE_TOKENS, titleOnlyLayout, tokenBits } from "../src/lib/token-logo.ts";

/** Trims float noise out of generated coordinates. */
const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Opening tag for a mark. Every one of these files is a picture of the project
 * name, so each carries that as its accessible name for the cases where the SVG
 * is inlined rather than dropped in an `<img>` with its own alt text.
 */
function svgOpen(width: number, height: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"` +
    ` role="img" aria-label="LLMs Unplugged">`
  );
}
import {
  TOKEN_CAP_HEIGHT,
  TOKEN_CELL_ADVANCE,
  TOKEN_LABELS,
  WORDMARK_ADVANCE,
  WORDMARK_CAP_HEIGHT,
  WORDMARK_PATH,
} from "./wordmark-path.ts";

// Defaults to the checked-in location; tests override LOGO_OUT_DIR so they
// don't clobber the committed files in public/.
const OUT_DIR = process.env.LOGO_OUT_DIR || "public";

const TITLE_BITS = TITLE_TOKENS.map((t) => tokenBits(t.id));

const TILE_FILL = "#1a1a1a";
const DIM = "rgba(255,255,255,0.08)";
const CYCLE_SECONDS = 15;

/**
 * Every mark on this site is built from the same shape: a token ID written out
 * as sixteen bits in a 4x4 grid of dots, centred in a square box. Only the size
 * of that box and the colours of the lit and unlit dots change.
 */
interface DotGeometry {
  /** Side of the square the dots are centred in. */
  box: number;
  /** Distance between dot centres. */
  spacing: number;
  radius: number;
}

/** The tile every dot mark is built on: the favicon, the lockup, the five-up. */
const TILE: DotGeometry = { box: 28, spacing: 6, radius: 2 };
const TILE_CORNER = 4;

interface DotOptions {
  /** Fill for a 1 bit and for a 0 bit. */
  on: string;
  off: string;
  /** Shifts the whole grid right, for laying grids out in a row. */
  x?: number;
  /**
   * Per-position animation keys. When given, each dot also carries the class
   * that cycles it through all five title tokens.
   */
  keys?: string[];
  indent?: string;
}

function dotGrid(
  { box, spacing, radius }: DotGeometry,
  bits: boolean[],
  { on, off, x = 0, keys, indent = "  " }: DotOptions,
): string {
  const pad = (box - 3 * spacing) / 2;
  return bits
    .map((bit, j) => {
      const cx = x + pad + (j % 4) * spacing;
      const cy = pad + Math.floor(j / 4) * spacing;
      const cls = keys ? ` class="f-${keys[j]}"` : "";
      return `${indent}<circle${cls} cx="${cx}" cy="${cy}" r="${radius}" fill="${bit ? on : off}"/>`;
    })
    .join("\n");
}

/**
 * For each of the 16 grid positions, the bit that position takes in each of the
 * five title tokens, as a string like "10110". Positions sharing a key hold the
 * same dot through the whole cycle, so they can share one animation.
 */
const POSITION_KEYS = Array.from({ length: 16 }, (_, j) =>
  TITLE_BITS.map((bits) => (bits[j] ? "1" : "0")).join(""),
);

/**
 * CSS keyframes cycling each position through the five tokens' bit patterns.
 * Readers who ask for less motion get the first token's pattern, held still.
 */
function animationCss(): string {
  let css = "";
  for (const key of new Set(POSITION_KEYS)) {
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
  // Scoped to our own classes, and last so it wins on order alone: an inlined
  // SVG's <style> applies to the whole document, so a bare `*` here would stop
  // every animation on the page.
  const selector = Array.from(new Set(POSITION_KEYS), (key) => `.f-${key}`).join(",");
  return `${css}@media (prefers-reduced-motion:reduce){${selector}{animation:none}}`;
}

/** The animated single grid: 15 seconds through all five title tokens. */
function generateFavicon(): string {
  return `${svgOpen(TILE.box, TILE.box)}
  <style>${animationCss()}</style>
  <rect width="${TILE.box}" height="${TILE.box}" rx="${TILE_CORNER}" fill="${TILE_FILL}"/>
${dotGrid(TILE, TITLE_BITS[0], { on: TITLE_TINTS[0], off: DIM, keys: POSITION_KEYS })}
</svg>
`;
}

// Five-up geometry: the five title grids laid out left to right on one dark
// strip, reading LL - Ms - Un - plug - ged.
const FIVE_UP_GAP = 4;
const FIVE_UP_PITCH = TILE.box + FIVE_UP_GAP;
const FIVE_UP_W = 5 * FIVE_UP_PITCH - FIVE_UP_GAP;

/**
 * All five token grids side by side, with no animation --- the version for
 * t-shirts, stickers and anywhere else a still image is all you get.
 *
 * `tinted` gives each token its own gold brick, matching the word mark; without
 * it every grid is the same gold on the same dark strip.
 */
function generateFiveUp(tinted: boolean): string {
  const bricks = TITLE_BITS.map((bits, ti) => {
    const x = ti * FIVE_UP_PITCH;
    const dots = dotGrid(TILE, bits, {
      x,
      on: tinted ? "rgba(255,255,255,0.5)" : TITLE_TINTS[0],
      off: tinted ? "rgba(255,255,255,0.12)" : DIM,
    });
    if (!tinted) return dots;
    const tile = `  <rect x="${x}" y="0" width="${TILE.box}" height="${TILE.box}" rx="${TILE_CORNER}" fill="${TITLE_TINTS[ti]}"/>`;
    return `${tile}\n${dots}`;
  }).join("\n");

  return `${svgOpen(FIVE_UP_W, TILE.box)}
  <rect width="${FIVE_UP_W}" height="${TILE.box}" rx="${TILE_CORNER}" fill="${TILE_FILL}"/>
${bricks}
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
const LOCKUP_TEXT_X = TILE.box + LOCKUP_GAP;
const LOCKUP_BASELINE = (TILE.box + LOCKUP_CAP_HEIGHT) / 2 - LOCKUP_DESCENDER_LIFT;
const LOCKUP_W = Math.round((LOCKUP_TEXT_X + WORDMARK_ADVANCE * WORDMARK_SCALE) * 10) / 10;

/**
 * The favicon grid with the title set beside it in Public Sans Bold: the
 * horizontal lockup for headers, footers, letterhead and slide corners, where
 * the square marks don't fit and the dot patterns alone don't say who this is.
 *
 * The background is transparent, so `tone` only picks the wordmark colour ---
 * "dark" for placing on dark surfaces, "light" for placing on light ones.
 *
 * `token` picks which of the five title tokens the grid spells, defaulting to
 * the first. A static lockup for token t is exactly frame t of the animated
 * one, which is what lets a print run cycle the mark by placing the five in
 * turn: the reader sees the same thing the favicon does, one token at a time.
 */
function generateLockup(tone: "dark" | "light", animated: boolean, token = 0): string {
  const style = animated ? `\n  <style>${animationCss()}</style>` : "";

  return `${svgOpen(LOCKUP_W, TILE.box)}${style}
  <rect width="${TILE.box}" height="${TILE.box}" rx="${TILE_CORNER}" fill="${TILE_FILL}"/>
${dotGrid(TILE, TITLE_BITS[token], { on: TITLE_TINTS[token], off: DIM, keys: animated ? POSITION_KEYS : undefined })}
  <g transform="translate(${LOCKUP_TEXT_X} ${LOCKUP_BASELINE}) scale(${WORDMARK_SCALE})">
    <path d="${WORDMARK_PATH}" fill="${tone === "dark" ? "#ffffff" : TILE_FILL}"/>
  </g>
</svg>
`;
}

const REF_W = 960;
const REF_H = 540;
const BG = "#0a0a0a";

/**
 * The word mark: five gold bricks spelling the title over two lines, each
 * labelled with the token it stands for.
 *
 * Every brick is exactly one monospaced cell per character wide, so the type
 * size falls out of the brick width rather than being guessed at, and the
 * labels fill their bricks edge to edge whatever the layout does. All five sit
 * on a common baseline, cap height centred, so "plug" hangs its descender below
 * the others instead of drifting up to meet them.
 */
function generateTitleSvg(): string {
  const positions = titleOnlyLayout(REF_W, REF_H);
  const fontSize = (positions[0].w / TOKEN_LABELS[0].label.length / TOKEN_CELL_ADVANCE) * 1000;
  const scale = fontSize / 1000;

  const bricks = TOKEN_LABELS.map(({ advance, path }, ti) => {
    const pos = positions[ti];
    const x = (pos.w - advance * scale) / 2;
    const baseline = (pos.h + TOKEN_CAP_HEIGHT * scale) / 2;

    return `  <g transform="translate(${pos.x} ${pos.y})">
    <rect width="${pos.w}" height="${pos.h}" rx="6" fill="${TITLE_TINTS[ti]}"/>
    <g transform="translate(${round(x)} ${round(baseline)}) scale(${round(scale)})">
      <path d="${path}" fill="#ffffff"/>
    </g>
  </g>`;
  }).join("\n");

  return `${svgOpen(REF_W, REF_H)}
  <rect width="${REF_W}" height="${REF_H}" fill="${BG}"/>
${bricks}
</svg>
`;
}

const outputs: [string, string][] = [
  ["favicon.svg", generateFavicon()],
  ["favicon-5up.svg", generateFiveUp(false)],
  ["favicon-5up-tinted.svg", generateFiveUp(true)],
  ["lockup.svg", generateLockup("dark", false)],
  ["lockup-light.svg", generateLockup("light", false)],
  ["lockup-animated.svg", generateLockup("dark", true)],
  ["title-logo.svg", generateTitleSvg()],
  // The five frames of the animated lockup as separate static files, for print,
  // where nothing can animate: the CLI's search sheets cycle them across the
  // deal so a set spells the title out over five pages rather than repeating
  // one frame 120 times. Number 1 is `lockup-light.svg` again, which is what
  // makes "the first frame" and "the lockup" the same file to a reader
  // comparing them.
  ...TITLE_TOKENS.map((_, ti): [string, string] => [
    `lockup-light-${ti + 1}.svg`,
    generateLockup("light", false, ti),
  ]),
];

for (const [name, svg] of outputs) {
  const path = join(OUT_DIR, name);
  writeFileSync(path, svg);
  console.log(`Wrote ${path}`);
}
