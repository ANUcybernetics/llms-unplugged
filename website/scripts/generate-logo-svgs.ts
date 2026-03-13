import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import opentype from "opentype.js";
import { decompress } from "wawoff2";
import {
  generateBricks,
  tokenBits,
  gridLayout,
  fillLastRow,
  TITLE_TINTS,
  TITLE_TOKENS,
} from "../src/lib/token-logo.ts";

async function loadFont(weight: string): Promise<opentype.Font> {
  const fontsDir = join(import.meta.dirname, "../.astro/fonts");
  const exactPattern = `font-roboto-mono-${weight}-normal-latin-`;
  const anyPattern = "font-roboto-mono-";
  const allFiles = readdirSync(fontsDir).filter(
    (f) => f.endsWith(".woff2") && f.startsWith(anyPattern),
  );
  const files = allFiles.filter((f) => f.startsWith(exactPattern));
  if (files.length === 0 && allFiles.length === 0) {
    throw new Error(
      `No Roboto Mono font found in ${fontsDir} — run 'pnpm run build' first to populate the font cache`,
    );
  }
  const matched = files.length > 0 ? files[0] : allFiles[0];
  const woff2Buf = readFileSync(join(fontsDir, matched));
  const otfBuf = await decompress(woff2Buf);
  return opentype.parse(otfBuf.buffer.slice(otfBuf.byteOffset, otfBuf.byteOffset + otfBuf.byteLength));
}

function textToPath(
  font: opentype.Font,
  text: string,
  cx: number,
  cy: number,
  fontSize: number,
): string {
  const path = font.getPath(text, 0, 0, fontSize);
  const bb = path.getBoundingBox();
  const dx = cx - (bb.x1 + bb.x2) / 2;
  const dy = cy - (bb.y1 + bb.y2) / 2;
  const shifted = font.getPath(text, dx, dy, fontSize);
  return shifted.toSVG(2);
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

async function generateLogo(): Promise<string> {
  const W = 960;
  const H = 400;
  const FONT_SIZE = 80;
  const CHAR_W = 48;
  const LINE_H = 96;
  const LINE_GAP = 12;
  const LINE_W = 7 * CHAR_W; // both lines are 7 chars

  const font = await loadFont("700");

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

  // Background bricks (no dots — at 40% opacity they're subtle but visible)
  bricks.forEach((brick, i) => {
    if (brick.titleToken) return;
    const pos = positions[i];
    if (!pos || pos.y + pos.h > H) return;
    svg += `  <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="3" fill="#1a1a1a" stroke="rgba(190,131,14,0.15)" stroke-width="1" opacity="0.4"/>\n`;
  });

  // Title bricks with text as paths
  for (const tb of titleBricks) {
    const pos = assembled.get(tb.index)!;
    const tint = TITLE_TINTS[tb.titleIndex];
    svg += `  <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="3" fill="${tint}"/>\n`;
    const pathSvg = textToPath(
      font,
      tb.displayText,
      pos.x + pos.w / 2,
      pos.y + pos.h / 2,
      FONT_SIZE,
    );
    svg += `  ${pathSvg.replace('<path', '<path fill="white"')}\n`;
  }

  svg += `</svg>\n`;
  return svg;
}

writeFileSync("public/favicon.svg", generateFavicon());
console.log("Wrote public/favicon.svg");

generateLogo().then((svg) => {
  writeFileSync("public/logo.svg", svg);
  console.log("Wrote public/logo.svg");
});
