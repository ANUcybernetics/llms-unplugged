import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import opentype from "opentype.js";
import {
  generateBricks,
  tokenBits,
  gridLayout,
  TITLE_TINTS,
  TITLE_TOKENS,
} from "../src/lib/token-logo.ts";

function loadFont(): opentype.Font {
  const ttfPath = join(import.meta.dirname, "RobotoMono-Bold.ttf");
  const buf = readFileSync(ttfPath);
  return opentype.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  );
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
  const size = 28;
  const pad = 5;
  const spacing = 6;
  const cycleDuration = 15;
  const dim = "rgba(255,255,255,0.08)";

  const patterns = TITLE_TOKENS.map((t) => tokenBits(t.id));
  const positionKeys: string[] = [];
  for (let j = 0; j < 16; j++) {
    positionKeys.push(patterns.map((p) => (p[j] ? "1" : "0")).join(""));
  }

  const uniqueKeys = [...new Set(positionKeys)];
  let css = "";
  for (const key of uniqueKeys) {
    const frames: string[] = [];
    for (let t = 0; t < 5; t++) {
      const pct = t * 20;
      const hold = pct + 17;
      const color = key[t] === "1" ? TITLE_TINTS[t] : dim;
      frames.push(`${pct}%{fill:${color}}${hold}%{fill:${color}}`);
    }
    const startColor = key[0] === "1" ? TITLE_TINTS[0] : dim;
    frames.push(`100%{fill:${startColor}}`);
    css += `@keyframes f-${key}{${frames.join("")}}`;
    css += `.f-${key}{animation:f-${key} ${cycleDuration}s infinite}`;
  }

  const circles = positionKeys
    .map((key, j) => {
      const cx = pad + (j % 4) * spacing;
      const cy = pad + Math.floor(j / 4) * spacing;
      const fill = patterns[0][j] ? TITLE_TINTS[0] : dim;
      return `  <circle class="f-${key}" cx="${cx}" cy="${cy}" r="2" fill="${fill}"/>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <style>${css}</style>
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

  const font = loadFont();

  const bricks = generateBricks(250, 42);
  const positions = gridLayout(bricks, W, H);

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

  bricks.forEach((brick, i) => {
    if (brick.titleToken) return;
    const pos = positions[i];
    if (!pos || pos.y + pos.h > H) return;
    svg += `  <rect x="${pos.x}" y="${pos.y}" width="${pos.w}" height="${pos.h}" rx="3" fill="#1a1a1a" stroke="rgba(190,131,14,0.15)" stroke-width="1" opacity="0.4"/>\n`;
  });

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

const logoSvg = generateLogo();
writeFileSync("public/logo.svg", logoSvg);
console.log("Wrote public/logo.svg");
