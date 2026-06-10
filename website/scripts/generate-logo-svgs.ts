import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { TITLE_TINTS, TITLE_TOKENS, titleOnlyLayout, tokenBits } from "../src/lib/token-logo.ts";

// Defaults to the checked-in location; tests override LOGO_OUT_DIR so they
// don't clobber the committed files in public/.
const OUT_DIR = process.env.LOGO_OUT_DIR || "public";

const REF_W = 960;
const REF_H = 540;
const BG = "#0a0a0a";

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

const faviconPath = join(OUT_DIR, "favicon.svg");
writeFileSync(faviconPath, generateFavicon());
console.log(`Wrote ${faviconPath}`);

const titleLogoPath = join(OUT_DIR, "title-logo.svg");
writeFileSync(titleLogoPath, generateTitleSvg());
console.log(`Wrote ${titleLogoPath}`);
