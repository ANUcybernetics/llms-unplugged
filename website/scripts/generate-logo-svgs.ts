import { writeFileSync } from "node:fs";
import {
  generateBricks,
  tokenBits,
  gridLayout,
  fillLastRow,
  TITLE_TINTS,
  TITLE_TOKENS,
} from "../src/lib/token-logo.ts";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateFavicon(): string {
  const bits = tokenBits(TITLE_TOKENS[0].id); // "LL" token (3069)
  const size = 28;
  const pad = 5;
  const spacing = 6;

  const circles = bits
    .map((bit, i) => {
      const cx = pad + (i % 4) * spacing;
      const cy = pad + Math.floor(i / 4) * spacing;
      return `  <circle cx="${cx}" cy="${cy}" r="2" fill="${bit ? "#be830e" : "rgba(255,255,255,0.08)"}"/>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="4" fill="#1a1a1a"/>
${circles}
</svg>
`;
}

function generateLogo(): string {
  const W = 960;
  const H = 400;
  const FONT_SIZE = 80;
  const CHAR_W = 48;
  const LINE_H = 96;
  const LINE_GAP = 12;
  const LINE_W = 7 * CHAR_W; // both lines are 7 chars

  const bricks = generateBricks(250, 42);
  const positions = gridLayout(bricks, W, H);
  fillLastRow(bricks, positions, W);

  const titleBricks: {
    index: number;
    titleIndex: number;
    displayText: string;
    word: number;
    charLen: number;
  }[] = [];
  bricks.forEach((b, i) => {
    if (b.titleToken) {
      titleBricks.push({
        index: i,
        titleIndex: b.titleIndex,
        displayText: b.titleToken.displayText,
        word: b.titleToken.word,
        charLen: b.titleToken.displayText.length,
      });
    }
  });
  titleBricks.sort((a, b) => a.titleIndex - b.titleIndex);

  const totalTextH = 2 * LINE_H + LINE_GAP;
  const textTop = (H - totalTextH) / 2;
  const textLeft = (W - LINE_W) / 2;

  const assembled = new Map<
    number,
    { x: number; y: number; w: number; h: number }
  >();
  let x1 = textLeft;
  let x2 = textLeft;
  for (const tb of titleBricks) {
    const w = tb.charLen * CHAR_W;
    if (tb.word === 0) {
      assembled.set(tb.index, { x: x1, y: textTop, w, h: LINE_H });
      x1 += w;
    } else {
      assembled.set(tb.index, {
        x: x2,
        y: textTop + LINE_H + LINE_GAP,
        w,
        h: LINE_H,
      });
      x2 += w;
    }
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">\n`;
  svg += `  <rect width="${W}" height="${H}" fill="#0a0a0a"/>\n`;

  // Background bricks (no dots — at 12% opacity they're not visible)
  bricks.forEach((brick, i) => {
    if (brick.titleToken) return;
    const pos = positions[i];
    if (!pos || pos.y + pos.h > H) return;
    svg += `  <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="3" fill="#1a1a1a" stroke="rgba(190,131,14,0.15)" stroke-width="1" opacity="0.12"/>\n`;
  });

  // Title bricks (assembled)
  for (const tb of titleBricks) {
    const pos = assembled.get(tb.index)!;
    const tint = TITLE_TINTS[tb.titleIndex];
    svg += `  <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="3" fill="${tint}"/>\n`;
    svg += `  <text x="${pos.x + pos.w / 2}" y="${pos.y + pos.h / 2}" fill="white" font-family="'Roboto Mono', monospace" font-weight="700" font-size="${FONT_SIZE}" text-anchor="middle" dominant-baseline="central">${escapeXml(tb.displayText)}</text>\n`;
  }

  svg += `</svg>\n`;
  return svg;
}

writeFileSync("public/favicon.svg", generateFavicon());
console.log("Wrote public/favicon.svg");

writeFileSync("public/logo.svg", generateLogo());
console.log("Wrote public/logo.svg");
