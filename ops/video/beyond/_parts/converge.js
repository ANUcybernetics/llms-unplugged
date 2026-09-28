// "Run it ten thousand times and count what comes out: the counts come back."
// The model writes a long seeded text from its own counts; the text streams past
// at machine speed while its pairs are counted back into a blank sheet, and one
// row of the recount is held beside the book's: after twenty words it looks
// nothing like it, after ten thousand the shares match.
//
// Used by generation-grid and generation-ledger (and generation-cutouts, which
// cuts the result back into slips). The counting surface is the format's own
// (a blank grid, a blank ledger sheet): the caller hands `marks` the cells to
// mark as rectangles, and this part draws into them. Everything draws on
// canvases as a pure function of t; the text is seeded, so every render
// writes the same ten thousand words.
//
//   import * as CV from "./parts/converge.js";
//   const sim = CV.simulate(MAGPIE.rows, { n: 10000, seed: 3 });
//   const nAt = CV.schedule({ t0, t1, short: 20, hold, t2, long: 10000 });
//   CV.stream(tl, scene, sim, nAt, { x, y, w, h });
//   CV.marks(tl, scene, sim, nAt, { cells, ... });
//   CV.shares(tl, scene, sim, nAt, { row: "the", ... });

import * as C from "../kit/motion/canvas.js";

// The model writes n words after `start`, each drawn in proportion to its row's
// counts. pairIdx["a|b"] lists (ascending) the i where words[i-1], words[i] is
// a, b, so the count of a pair in the first k words is a binary search.
export function simulate(rows, { start = ".", n = 10000, seed = 1 } = {}) {
  const r = C.rng(seed);
  const words = [start];
  const pairIdx = new Map();
  for (let i = 1; i <= n; i++) {
    const a = words[i - 1];
    const row = rows[a];
    const total = row.reduce((s, [, c]) => s + c, 0);
    let x = r() * total;
    const b = (row.find(([, c]) => (x -= c) < 0) ?? row.at(-1))[0];
    words.push(b);
    const key = `${a}|${b}`;
    if (!pairIdx.has(key)) pairIdx.set(key, []);
    pairIdx.get(key).push(i);
  }
  // pairs among the first k words written (k may be fractional: floor)
  const count = (a, b, k) => {
    const L = pairIdx.get(`${a}|${b}`);
    if (!L) return 0;
    let lo = 0,
      hi = L.length;
    const K = Math.floor(k);
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      L[m] <= K ? (lo = m + 1) : (hi = m);
    }
    return lo;
  };
  return { words, n, count, rows };
}

// Words written by time t: 0 before t0, `short` by t1 (readable), held until
// `hold`, then a logarithmic race to `long` by t2, so every doubling takes as
// long and the early hundreds don't flash past.
export function schedule({ t0, t1, short = 20, hold, t2, long = 10000, ease = "in-out-quad" }) {
  return (t) => {
    if (t < hold) return short * C.phase(t, t0, t1 - t0, ease);
    const p = C.phase(t, hold, t2 - hold, ease);
    return Math.exp(Math.log(short) + (Math.log(long) - Math.log(short)) * p);
  };
}

// a punctuation mark as the kit's symbol tile, drawn on a canvas centred on
// (x, y) for words set at `size` (the kit's punctBox proportions)
function punctTile(ctx, mark, x, y, size, { ink, fill }) {
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
  const m = ctx.measureText(mark);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    mark,
    x + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2,
    y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
  );
  ctx.restore();
}

// The words streaming past along a band: the newest enters at the right as it
// is written and the text slides left, fading at the left edge. At machine
// speed the band jumps tens of words a frame and reads as a blur of text.
export function stream(
  tl,
  parent,
  sim,
  nAt,
  {
    x,
    y,
    w,
    h,
    size = 40,
    colour = "rgb(255 255 255 / 85%)",
    newest = "#e5a930",
    from = 0,
    to = Infinity,
  },
) {
  const K = window.KIT;
  const font = `italic 400 ${size}px "Libertinus Serif"`;
  const gap = size * 0.4;
  // each word's left edge along an endless line, by measured widths
  const xs = new Float64Array(sim.words.length + 1);
  for (let i = 0; i < sim.words.length; i++) {
    const wd = sim.words[i];
    xs[i + 1] = xs[i] + (K.isPunct(wd) ? size * 1.15 : K.measure(wd, font)) + gap;
  }
  const xAt = (k) => {
    const i = Math.min(Math.floor(k), sim.words.length - 1);
    return xs[i] + (xs[i + 1] - xs[i]) * (k - i);
  };
  const right = w - 40;
  return C.canvas(
    tl,
    parent,
    (ctx, t) => {
      if (t < from || t > to) return;
      const k = nAt(t);
      if (k <= 0) return;
      // the word being written (index ceil(k)) slides in; the line is placed
      // so the latest whole word ends at `right`
      const off = right - xAt(k + 1);
      ctx.font = font;
      ctx.textBaseline = "middle";
      const last = Math.min(Math.ceil(k), sim.words.length - 1);
      for (let i = last; i >= 1; i--) {
        const wx = off + xs[i];
        if (wx + (xs[i + 1] - xs[i]) < 0) break;
        const fade = Math.min(1, Math.max(0, wx / 200));
        const fresh = i === last ? C.phase(k + 1 - i, 0, 1) : 1;
        ctx.globalAlpha = fade * fresh;
        const wd = sim.words[i];
        const ink = i === Math.floor(k) ? newest : colour;
        if (K.isPunct(wd))
          punctTile(ctx, wd, wx + size * 0.575, h / 2, size * 0.8, { ink, fill: "#0d0d0d" });
        else {
          ctx.fillStyle = ink;
          ctx.fillText(wd, wx, h / 2);
        }
      }
    },
    { x, y, w, h },
  );
}

// Pencil marks counted into the format's cells: `cells` is a list of
// { a, b, x, y, w, h } (a pair's cell, in the canvas's coordinates). Up to
// `cap` marks a cell draws tallies (four and a strike); past that, the count
// itself, in pencil. The cell of the pair just written flashes gold while the
// stream is slow enough to follow.
export function marks(
  tl,
  parent,
  sim,
  nAt,
  {
    x,
    y,
    w,
    h,
    cells,
    cap = 10,
    ink = "#3a3a3a",
    th,
    sp,
    lw = 2,
    font = 15,
    flash = "rgb(190 131 14 / 45%)",
    from = 0,
  },
) {
  const byPair = new Map(cells.map((c) => [`${c.a}|${c.b}`, c]));
  return C.canvas(
    tl,
    parent,
    (ctx, t) => {
      if (t < from) return;
      const k = nAt(t);
      if (k < 1) return;
      const K = Math.floor(k);
      // the latest pair's cell flashes (only while a word takes a while)
      const rate = (nAt(t + 0.05) - nAt(t - 0.05)) / 0.1;
      if (rate < 12) {
        const c = byPair.get(`${sim.words[K - 1]}|${sim.words[K]}`);
        if (c) {
          ctx.globalAlpha = 1 - (k - K);
          ctx.fillStyle = flash;
          ctx.fillRect(c.x, c.y, c.w, c.h);
          ctx.globalAlpha = 1;
        }
      }
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `italic 400 ${font}px "Libertinus Serif"`;
      for (const c of cells) {
        const n = sim.count(c.a, c.b, k);
        if (!n) continue;
        if (n > cap) {
          ctx.fillText(n.toLocaleString("en-AU"), c.x + c.w / 2, c.y + c.h / 2);
          continue;
        }
        // tallies, centred in the cell (the kit's tally() layout)
        const H = th ?? c.h * 0.55,
          S = sp ?? Math.min(8, c.w / 10);
        const groups = Math.ceil(n / 5),
          span = (groups - 1) * S * 6 + Math.min(n - (groups - 1) * 5, 4) * S;
        const x0 = c.x + (c.w - span) / 2 + S * 0.3,
          y0 = c.y + (c.h - H) / 2;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const gx = x0 + Math.floor(i / 5) * S * 6,
            j = i % 5;
          if (j < 4) {
            ctx.moveTo(gx + j * S, y0);
            ctx.lineTo(gx + j * S, y0 + H);
          } else {
            ctx.moveTo(gx - S * 0.4, y0 + H * 0.9);
            ctx.lineTo(gx + S * 3.4, y0 + H * 0.1);
          }
        }
        ctx.stroke();
      }
    },
    { x, y, w, h },
  );
}

// One row held beside the book's: two bars split by each follower's share of
// the row, the book's counts above and the recount below, with the counts
// under each segment. When the shares match, the boundaries line up.
//   followers [{ word, count, colour }] the book's row, in the row's order
//   label(t, k) => [top label, bottom label]
export function shares(
  tl,
  parent,
  sim,
  nAt,
  {
    x,
    y,
    w,
    h,
    row,
    followers,
    from = 0,
    barH = 64,
    gap = 150,
    labels,
    labelFont = 26,
    wordFont = 34,
  },
) {
  const K = window.KIT;
  const total = followers.reduce((s, f) => s + f.count, 0);
  const bar = (ctx, top, counts, alpha) => {
    const sum = counts.reduce((s, c) => s + c, 0);
    ctx.fillStyle = "rgb(255 255 255 / 10%)";
    ctx.beginPath();
    ctx.roundRect(0, top, w, barH, 8);
    ctx.fill();
    if (!sum) return;
    let cx = 0;
    counts.forEach((c, i) => {
      const cw = (w * c) / sum;
      if (cw > 0) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = followers[i].colour;
        ctx.beginPath();
        ctx.roundRect(cx + 1.5, top, Math.max(0, cw - 3), barH, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.font = `600 ${labelFont}px "Public Sans"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (cw > labelFont * 1.6)
          ctx.fillText(c.toLocaleString("en-AU"), cx + cw / 2, top + barH / 2);
      }
      cx += cw;
    });
  };
  return C.canvas(
    tl,
    parent,
    (ctx, t) => {
      if (t < from) return;
      const k = nAt(t);
      // the followers' words, over the book's segments
      let cx = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      followers.forEach((f) => {
        const cw = (w * f.count) / total;
        if (K.isPunct(f.word))
          punctTile(ctx, f.word, cx + cw / 2, 30, wordFont * 0.8, {
            ink: "rgb(255 255 255 / 90%)",
            fill: "#0d0d0d",
          });
        else {
          ctx.font = `400 ${wordFont}px "Libertinus Serif"`;
          ctx.fillStyle = "rgb(255 255 255 / 90%)";
          ctx.fillText(f.word, cx + cw / 2, 44);
        }
        cx += cw;
      });
      const [la, lb] = labels(t, k);
      ctx.font = `400 ${labelFont}px "Public Sans"`;
      ctx.fillStyle = "rgb(255 255 255 / 64%)";
      ctx.textAlign = "left";
      ctx.fillText(la, 0, 60 + barH + 40);
      bar(
        ctx,
        60,
        followers.map((f) => f.count),
        1,
      );
      const got = followers.map((f) => sim.count(row, f.word, k));
      bar(ctx, 60 + gap, got, 1);
      ctx.font = `400 ${labelFont}px "Public Sans"`;
      ctx.fillStyle = "rgb(255 255 255 / 64%)";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(lb, 0, 60 + gap + barH + 40);
    },
    { x, y, w, h },
  );
}
