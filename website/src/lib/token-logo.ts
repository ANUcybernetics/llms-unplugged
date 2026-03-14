export interface TitleToken {
  id: number;
  text: string;
  displayText: string;
  word: number;
}

export interface Brick {
  id: number;
  charWidth: number;
  titleToken: TitleToken | null;
  titleIndex: number;
}

export const TITLE_TINTS = [
  "hsl(38, 90%, 38%)",
  "hsl(42, 85%, 42%)",
  "hsl(36, 82%, 36%)",
  "hsl(40, 87%, 40%)",
  "hsl(44, 80%, 44%)",
];

export const TITLE_TOKENS: TitleToken[] = [
  { id: 3069, text: "LL", displayText: "LL", word: 0 },
  { id: 5765, text: "Ms", displayText: "Ms", word: 0 },
  { id: 1252, text: " Un", displayText: " Un", word: 0 },
  { id: 37729, text: "plug", displayText: "plug", word: 1 },
  { id: 2004, text: "ged", displayText: "ged", word: 1 },
];

export const BRICK_COUNT = 295;

const BRICK_H = 28;
const CHAR_W = 12;
const BASE_PAD = 10;
const GAP = 3;
const ASSEMBLED_CHAR_W = 74;
const ASSEMBLED_H = 145;
const ASSEMBLED_LINE_GAP = 14;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleCharWidth(rng: () => number): number {
  const r = rng();
  if (r < 0.1) return 1;
  if (r < 0.3) return 2;
  if (r < 0.55) return 3;
  if (r < 0.75) return 4;
  if (r < 0.88) return 5;
  if (r < 0.95) return 6;
  return 7;
}

export function brickW(charWidth: number): number {
  return BASE_PAD + charWidth * CHAR_W;
}

export function generateBricks(count: number = BRICK_COUNT, seed = 42): Brick[] {
  const rng = mulberry32(seed);
  const titleMap = new Map<number, number>();
  for (let i = 0; i < TITLE_TOKENS.length; i++) {
    let pos: number;
    do {
      pos = Math.floor(rng() * count);
    } while (titleMap.has(pos));
    titleMap.set(pos, i);
  }

  const bricks: Brick[] = [];
  for (let i = 0; i < count; i++) {
    if (titleMap.has(i)) {
      const ti = titleMap.get(i)!;
      const t = TITLE_TOKENS[ti];
      bricks.push({
        id: t.id,
        charWidth: t.text.length,
        titleToken: t,
        titleIndex: ti,
      });
    } else {
      bricks.push({
        id: Math.floor(rng() * 49744) + 256,
        charWidth: sampleCharWidth(rng),
        titleToken: null,
        titleIndex: -1,
      });
    }
  }
  return bricks;
}

export function tokenBits(id: number): boolean[] {
  return Array.from({ length: 16 }, (_, i) => ((id >> (15 - i)) & 1) === 1);
}

export interface Pos {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function gridLayout(bricks: Brick[], width: number, height: number): Pos[] {
  const positions: Pos[] = [];
  let x = 0;
  let y = 0;
  for (const b of bricks) {
    const w = brickW(b.charWidth);
    if (x + w > width && x > 0) {
      x = 0;
      y += BRICK_H + GAP;
    }
    positions.push({ x, y, w, h: BRICK_H });
    x += w + GAP;
  }
  const totalH = y + BRICK_H;
  const offsetY = (height - totalH) / 2;
  if (offsetY > 0) {
    for (const p of positions) p.y += offsetY;
  }
  return positions;
}

export function fillLastRow(
  bricks: Brick[],
  positions: Pos[],
  containerWidth: number,
  seed = 99999,
): void {
  const rng = mulberry32(seed);
  const last = positions[positions.length - 1];
  let x = last.x + last.w + GAP;
  const y = last.y;

  while (x + BASE_PAD < containerWidth) {
    const charWidth = sampleCharWidth(rng);
    const w = brickW(charWidth);
    if (x + w > containerWidth) break;
    bricks.push({
      id: Math.floor(rng() * 49744) + 256,
      charWidth,
      titleToken: null,
      titleIndex: -1,
    });
    positions.push({ x, y, w, h: BRICK_H });
    x += w + GAP;
  }
}

export function shuffledGridLayout(
  bricks: Brick[],
  width: number,
  height: number,
  seed: number,
): Pos[] {
  const rng = mulberry32(seed);
  const n = bricks.length;
  const order = Array.from({ length: n }, (_, i) => i);
  for (let j = n - 1; j > 0; j--) {
    const k = Math.floor(rng() * (j + 1));
    [order[j], order[k]] = [order[k], order[j]];
  }
  const shuffledPos = gridLayout(
    order.map((i) => bricks[i]),
    width,
    height,
  );
  const positions: Pos[] = new Array(n);
  for (let j = 0; j < n; j++) {
    positions[order[j]] = shuffledPos[j];
  }
  return positions;
}

export function assembledLayout(
  bricks: Brick[],
  width: number,
  height: number,
): Map<number, Pos> {
  const result = new Map<number, Pos>();
  const words = new Map<number, { i: number; b: Brick }[]>();

  bricks.forEach((b, i) => {
    if (!b.titleToken) return;
    const w = b.titleToken.word;
    if (!words.has(w)) words.set(w, []);
    words.get(w)!.push({ i, b });
  });

  for (const group of words.values()) {
    group.sort((a, b) => a.b.titleIndex - b.b.titleIndex);
  }

  const lines = [...words.keys()].sort();
  const totalH =
    lines.length * ASSEMBLED_H + (lines.length - 1) * ASSEMBLED_LINE_GAP;
  let cy = (height - totalH) / 2;

  for (const wordIdx of lines) {
    const group = words.get(wordIdx)!;
    const lineChars = group.reduce(
      (sum, { b }) => sum + b.titleToken!.displayText.length,
      0,
    );
    const lineW = lineChars * ASSEMBLED_CHAR_W;
    let cx = (width - lineW) / 2;

    for (const { i, b } of group) {
      const w = b.titleToken!.displayText.length * ASSEMBLED_CHAR_W;
      result.set(i, { x: cx, y: cy, w, h: ASSEMBLED_H });
      cx += w;
    }
    cy += ASSEMBLED_H + ASSEMBLED_LINE_GAP;
  }

  return result;
}
