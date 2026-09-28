// The recount, in cutouts: the model's own writing (converge.js's simulate and
// schedule) cut back into slips and sorted into piles by the word in their
// box, and the piles for one word held beside the book's. After twenty words
// they look nothing like the book's; after ten thousand, the same proportions.
//
// Used by generation-cutouts, beside converge.js's stream. converge.js's
// `marks` counts into cells (a grid, a ledger sheet); a cutouts desk has no
// cells, only piles, so this part draws those instead. Everything draws on
// canvases as a pure function of t.
//
//   import * as CV from "./parts/converge.js";
//   import { sortPiles, rowPiles } from "./parts/cutouts-converge.js";
//   const sim = CV.simulate(rows, { n: 10000, seed: 37 });
//   sortPiles(tl, scene, sim, nAt, { area, words, from });
//   rowPiles(tl, scene, sim, nAt, { x, y, w, h, row: "the", followers, labels });

import * as C from "../kit/motion/canvas.js";

const INK = "#1a1a1a",
  EDGE = "rgb(0 0 0 / 38%)";

// a punctuation mark as the kit's symbol tile, centred on (x, y), for a word
// set at `size` (the kit's punctBox proportions; converge.js has the same)
function tile(ctx, mark, x, y, size, { ink, fill }) {
  const side = size * 1.15;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  ctx.beginPath();
  ctx.roundRect(x - side / 2, y - side / 2, side, side, side * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.font = `700 ${size * 1.3}px "Libertinus Serif"`;
  ctx.fillStyle = ink;
  // align and baseline first: the ink metrics are measured against them
  // (as the kit's punctBox measures with a centred, alphabetic baseline)
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(mark);
  ctx.fillText(
    mark,
    x + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2,
    y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
  );
  ctx.restore();
}

// the width a word takes on a slip at `size` (morph.js's slip())
const tokW = (ctx, w, size) => {
  if (window.KIT.isPunct(w)) return size * 1.3;
  ctx.font = `700 ${size}px "Libertinus Serif"`;
  return ctx.measureText(w).width + size * 0.32;
};
export const slipW = (ctx, prev, next, size) =>
  tokW(ctx, prev, size) + (next == null ? 0 : tokW(ctx, next, size) + size * 0.3) + size * 0.9;

// the previous-word box: the word white on its colour (a punctuation mark is a
// tile in that colour), left edge at x, centred on y
function box(ctx, w, x, y, size) {
  const K = window.KIT;
  const colour = K.tokenColour(w);
  const bw = tokW(ctx, w, size);
  if (K.isPunct(w)) {
    tile(ctx, w, x + bw / 2, y, size, { ink: "#fff", fill: colour });
    return bw;
  }
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(x, y - size * 0.58, bw, size * 1.16, size * 0.1);
  ctx.fill();
  ctx.font = `700 ${size}px "Libertinus Serif"`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(w, x + bw / 2, y + size * 0.04);
  return bw;
}

// A slip centred on (cx, cy): paper, the box, then the next word in its
// colour. `next` null draws the box alone (a pile's top, where the next words
// differ).
export function drawSlip(ctx, prev, next, cx, cy, size, { alpha = 1, rot = 0 } = {}) {
  const K = window.KIT;
  const w = slipW(ctx, prev, next, size),
    h = size * 1.75;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 3);
  ctx.fill();
  ctx.stroke();
  let x = -w / 2 + size * 0.45;
  x += box(ctx, prev, x, 0, size);
  if (next != null) {
    x += size * 0.3;
    const nw = tokW(ctx, next, size);
    if (K.isPunct(next))
      tile(ctx, next, x + nw / 2, 0, size, { ink: K.tokenColour(next), fill: "#fff" });
    else {
      ctx.font = `700 ${size}px "Libertinus Serif"`;
      ctx.fillStyle = K.tokenColour(next);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(next, x + size * 0.16, size * 0.04);
    }
  }
  ctx.restore();
  return { w, h };
}

// paper edges under a pile's top slip: `n` of them, `step` apart, rising from
// the pile's base at (cx, base)
function stack(ctx, n, cx, base, w, h, step) {
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.2;
  for (let j = 0; j < n; j++) {
    const jx = (window.KIT.jitter(j * 7 + Math.round(cx)) - 0.5) * 6;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + jx, base - h - j * step, w, h, 3);
    ctx.fill();
    ctx.stroke();
  }
}

// A slip for every pair written so far, sorted into a pile per box word (one
// pile per word of `words`, in a cols-wide grid inside `area`). While the text
// is slow enough to follow, the newest pair flies as a whole slip from `from`
// (the stream's newest word) onto its pile. Up to `cap` slips a pile draws
// every edge; past that it stays at `cap` and its count, above it, does the
// rest. `hi` { word, t } rings one pile in gold from t.
export function sortPiles(
  tl,
  parent,
  sim,
  nAt,
  { area, words, cols = 6, from, size = 22, cap = 14, step = 4, hi, x = 0, y = 0, w, h, start = 0 },
) {
  const rows = Math.ceil(words.length / cols);
  const cw = area.w / cols,
    ch = area.h / rows;
  const sh = size * 1.75,
    sw = cw - 34;
  const cell = new Map(
    words.map((wd, i) => {
      const cx = area.x + ((i % cols) + 0.5) * cw;
      const base = area.y + (Math.floor(i / cols) + 1) * ch - 14;
      return [wd, { cx, base }];
    }),
  );
  const followers = new Map(words.map((wd) => [wd, (sim.rows[wd] ?? []).map(([b]) => b)]));
  const pileN = (a, k) => followers.get(a).reduce((s, b) => s + sim.count(a, b, k), 0);
  const top = (a, n) => cell.get(a).base - sh / 2 - Math.max(0, Math.min(n, cap) - 1) * step;
  return C.canvas(
    tl,
    parent,
    (ctx, t) => {
      if (t < start) return;
      const k = nAt(t);
      const K = Math.floor(k);
      const rate = (nAt(t + 0.05) - nAt(t - 0.05)) / 0.1;
      const flying =
        rate < 12 && K >= 1 ? { a: sim.words[K - 1], b: sim.words[K], f: k - K } : null;
      const landed = flying ? C.phase(flying.f, 0.1, 0.75, "in-out-cubic") : 1;
      if (hi && t >= hi.t) {
        const c = cell.get(hi.word);
        ctx.globalAlpha = C.phase(t, hi.t, 0.4);
        ctx.strokeStyle = "#be830e";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(c.cx - cw / 2 + 6, c.base - ch + 14, cw - 12, ch - 8, 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      for (const wd of words) {
        const c = cell.get(wd);
        let n = pileN(wd, k);
        if (flying && flying.a === wd && landed < 1) n -= 1;
        if (n <= 0) {
          // the pile's place, empty: its box, faint
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = "rgb(255 255 255 / 30%)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(c.cx - sw / 2, c.base - sh, sw, sh, 3);
          ctx.stroke();
          ctx.restore();
          ctx.globalAlpha = 0.4;
          const bw = tokW(ctx, wd, size);
          box(ctx, wd, c.cx - bw / 2, c.base - sh / 2, size);
          ctx.globalAlpha = 1;
          continue;
        }
        const L = Math.min(n, cap);
        stack(ctx, L - 1, c.cx, c.base, sw, sh, step);
        const ty = top(wd, n);
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = EDGE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(c.cx - sw / 2, ty - sh / 2, sw, sh, 3);
        ctx.fill();
        ctx.stroke();
        const bw = tokW(ctx, wd, size);
        box(ctx, wd, c.cx - bw / 2, ty, size);
        ctx.font = `600 ${size}px "Public Sans"`;
        ctx.fillStyle = "rgb(255 255 255 / 90%)";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(n.toLocaleString("en-AU"), c.cx, ty - sh / 2 - 10);
      }
      if (flying && landed < 1) {
        const c = cell.get(flying.a);
        const to = { x: c.cx, y: top(flying.a, pileN(flying.a, k)) };
        const px = from.x + (to.x - from.x) * landed,
          py = from.y + (to.y - from.y) * landed;
        drawSlip(ctx, flying.a, flying.b, px, py, size * (1.3 - 0.3 * landed), {
          alpha: C.phase(flying.f, 0, 0.1),
        });
      }
    },
    { x, y, w, h },
  );
}

// One word's piles held beside the book's: the book's slips for `row` in a
// pile per next word (followers [[word, count]], the book's counts), and
// below them the recount's, piled to the same total height (each pile its
// share of the book's slips, so matching shares mean matching piles), with
// the real counts over them. labels(t, k) => [top, bottom].
export function rowPiles(
  tl,
  parent,
  sim,
  nAt,
  { x, y, w, h, row, followers, labels, size = 25, step = 10, labelFont = 26, start = 0 },
) {
  const total = followers.reduce((s, [, c]) => s + c, 0);
  const n = followers.length;
  const cw = w / n,
    sh = size * 1.75;
  const half = h / 2;
  const drawRow = (ctx, top, counts, heights) => {
    const base = top + half - 20;
    followers.forEach(([b], i) => {
      const cx = (i + 0.5) * cw;
      const L = heights[i];
      if (L <= 0) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        drawSlip(ctx, row, b, cx, base - sh / 2, size);
        ctx.restore();
        ctx.font = `600 ${labelFont}px "Public Sans"`;
        ctx.fillStyle = "rgb(255 255 255 / 64%)";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("0", cx, base - sh - 12);
        return;
      }
      const sw = slipW(ctx, row, b, size);
      stack(ctx, L - 1, cx, base, sw, sh, step);
      const ty = base - sh / 2 - (L - 1) * step;
      drawSlip(ctx, row, b, cx, ty, size);
      ctx.font = `600 ${labelFont}px "Public Sans"`;
      ctx.fillStyle = "rgb(255 255 255 / 90%)";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(counts[i].toLocaleString("en-AU"), cx, ty - sh / 2 - 12);
    });
  };
  // a pile's height in slips for counts shared out over `total` slips
  const heights = (counts) => {
    const sum = counts.reduce((s, c) => s + c, 0);
    return counts.map((c) => (sum ? Math.round((c / sum) * total) : 0));
  };
  return C.canvas(
    tl,
    parent,
    (ctx, t) => {
      if (t < start) return;
      const k = nAt(t);
      const [la, lb] = labels(t, k);
      ctx.font = `400 ${labelFont}px "Public Sans"`;
      ctx.fillStyle = "rgb(255 255 255 / 64%)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(la, 0, 0);
      ctx.fillText(lb, 0, half);
      const book = followers.map(([, c]) => c);
      drawRow(ctx, 0, book, book);
      const got = followers.map(([b]) => sim.count(row, b, k));
      ctx.textBaseline = "top";
      drawRow(ctx, half, got, heights(got));
    },
    { x, y, w, h },
  );
}
