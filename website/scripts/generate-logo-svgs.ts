import { writeFileSync } from "node:fs";
import {
  tokenBits,
  TITLE_TINTS,
  TITLE_TOKENS,
} from "../src/lib/token-logo.ts";

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

writeFileSync("public/favicon.svg", generateFavicon());
console.log("Wrote public/favicon.svg");
