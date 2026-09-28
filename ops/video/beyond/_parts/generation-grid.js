// Grid-format pieces of the generation walk (generation-grid): the magpie's
// whole grid, drawn wide enough to read on one screen, and a row lifted out of
// it onto the desk with its tallied boxes spread wide.
//
// The kit's K.grid has square cells, and 24 words of square cells leave the
// headers too small to read at 1080p; this grid has wide, short cells (the
// same rows, columns, bands and pencil tallies), so the whole model fits one
// frame. The cells' tallies are the kit's (K.tally, K.prepDraw: they boil).

// The grid: `bg` from K.bigrams(words, vocab). Options: cellW, cellH, headW,
// headH, font (row and column headers), tallies (false for a blank grid).
// Returns { el, svg, width, height, cells[r][c] { strokes, x, y, w, h, cx, cy },
// rowBands, colBands, rowHead, colHead, box(r, c) }; box() is a cell's rect in
// the parent's coordinates, for the layer at scale 1 and its build-time x, y.
export function magpieGrid(
  parent,
  bg,
  {
    x = 0,
    y = 0,
    cellW = 72,
    cellH = 34,
    headW = 130,
    headH = 40,
    font = 21,
    tallies = true,
    sp = 6,
    th,
  } = {},
) {
  const K = window.KIT;
  const n = bg.vocab.length;
  const W = headW + n * cellW,
    H = headH + n * cellH;
  const g = K.layer(parent, x, y);
  const s = K.svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, g);
  K.svg("rect", { x: 0, y: 0, width: W, height: H, rx: 8, fill: "var(--paper)" }, s);
  const band = (a) => {
    const b = K.svg("rect", { ...a, fill: "var(--gold)", "fill-opacity": 0.3, opacity: 0 }, s);
    return b;
  };
  const rowBands = bg.vocab.map((_, r) =>
    band({ x: 0, y: headH + r * cellH, width: W, height: cellH }),
  );
  const colBands = bg.vocab.map((_, c) =>
    band({ x: headW + c * cellW, y: 0, width: cellW, height: H }),
  );
  const rules = K.svg("g", { stroke: "rgb(0 0 0 / 22%)", "stroke-width": 1 }, s);
  for (let i = 0; i <= n; i++) {
    K.svg("line", { x1: 0, y1: headH + i * cellH, x2: W, y2: headH + i * cellH }, rules);
    K.svg("line", { x1: headW + i * cellW, y1: 0, x2: headW + i * cellW, y2: H }, rules);
  }
  K.svg("line", { x1: 0, y1: headH, x2: W, y2: headH, stroke: "var(--ink)", "stroke-width": 2 }, s);
  K.svg("line", { x1: headW, y1: 0, x2: headW, y2: H, stroke: "var(--ink)", "stroke-width": 2 }, s);
  const rowHead = bg.vocab.map((w, r) =>
    K.isPunct(w)
      ? K.punctBox(s, w, {
          x: headW - 14 - (font * 1.15) / 2,
          y: headH + (r + 0.5) * cellH,
          size: font * 0.9,
          colour: "var(--ink)",
        })
      : K.svg(
          "text",
          {
            x: headW - 14,
            y: headH + (r + 0.5) * cellH,
            "text-anchor": "end",
            "dominant-baseline": "central",
            "font-size": font,
            text: w,
          },
          s,
        ),
  );
  const colHead = bg.vocab.map((w, c) =>
    K.isPunct(w)
      ? K.punctBox(s, w, {
          x: headW + (c + 0.5) * cellW,
          y: headH / 2,
          size: font * 0.9,
          colour: "var(--ink)",
        })
      : K.svg(
          "text",
          {
            x: headW + (c + 0.5) * cellW,
            y: headH / 2,
            "text-anchor": "middle",
            "dominant-baseline": "central",
            "font-size": font,
            text: w,
          },
          s,
        ),
  );
  const TH = th ?? cellH * 0.56;
  const cells = bg.vocab.map((_, r) =>
    bg.vocab.map((_, c) => {
      const cg = K.svg("g", { class: "gg-tally" }, s);
      const k = tallies ? bg.counts[r][c] : 0;
      const groups = Math.ceil(k / 5);
      const span = k ? (groups - 1) * sp * 6 + Math.min(k - (groups - 1) * 5, 4) * sp : 0;
      const strokes = K.prepDraw(
        K.tally(
          cg,
          k,
          headW + c * cellW + (cellW - span) / 2 + sp * 0.3,
          headH + r * cellH + (cellH - TH) / 2,
          TH,
          sp,
        ),
      );
      return {
        g: cg,
        strokes,
        r,
        c,
        count: bg.counts[r][c],
        x: headW + c * cellW,
        y: headH + r * cellH,
        w: cellW,
        h: cellH,
        cx: headW + (c + 0.5) * cellW,
        cy: headH + (r + 0.5) * cellH,
      };
    }),
  );
  const box = (r, c) => ({
    x: x + headW + c * cellW,
    y: y + headH + r * cellH,
    w: cellW,
    h: cellH,
  });
  const rowHeadBox = (r) => ({ x, y: y + headH + r * cellH, w: headW, h: cellH });
  return {
    el: g,
    svg: s,
    width: W,
    height: H,
    cells,
    rowBands,
    colBands,
    rowHead,
    colHead,
    box,
    rowHeadBox,
    bg,
    headW,
    headH,
    cellW,
    cellH,
  };
}

// A row lifted out onto the desk: the row's word, then one paper box per word
// that followed it, the word at the top and its tallies below, spread wide.
// Each box is its own layer so it can fly in from its cell on the grid.
//   options [{ word, count }] in the row's (column) order
// Returns { head, boxes[{ el, lit, strokes, w, h, x, y }], all, slot(i) }.
export function liftedRow(
  parent,
  word,
  options,
  { x = 0, y = 0, headW = 170, boxW = 190, boxH = 150, gap = 16, size = 44 } = {},
) {
  const K = window.KIT;
  const mkBox = (w, h, bx) => {
    const L = K.layer(parent, bx, y);
    const s = K.svg("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, L);
    K.svg("rect", { x: 0, y: 0, width: w, height: h, rx: 8, fill: "var(--paper)" }, s);
    const lit = K.svg(
      "rect",
      {
        x: 0,
        y: 0,
        width: w,
        height: h,
        rx: 8,
        fill: "var(--gold)",
        "fill-opacity": 0.35,
        opacity: 0,
      },
      s,
    );
    K.set(L, { transformOrigin: "0 0" });
    return { el: L, svg: s, lit, w, h, x: bx, y };
  };
  const head = mkBox(headW, boxH, x);
  if (K.isPunct(word))
    K.punctBox(head.svg, word, {
      x: headW / 2,
      y: boxH / 2,
      size: size * 1.1,
      colour: "var(--ink)",
    });
  else
    K.svg(
      "text",
      {
        x: headW / 2,
        y: boxH / 2,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": size * 1.1,
        "font-weight": 700,
        text: word,
      },
      head.svg,
    );
  const boxes = options.map((o, i) => {
    const b = mkBox(boxW, boxH, x + headW + gap + i * (boxW + gap));
    if (K.isPunct(o.word))
      K.punctBox(b.svg, o.word, {
        x: boxW / 2,
        y: size * 0.95,
        size: size * 0.85,
        colour: "var(--ink)",
      });
    else
      K.svg(
        "text",
        {
          x: boxW / 2,
          y: size * 0.95,
          "text-anchor": "middle",
          "dominant-baseline": "central",
          "font-size": size,
          text: o.word,
        },
        b.svg,
      );
    const sp = 12,
      th = 44;
    const groups = Math.ceil(o.count / 5);
    const span = (groups - 1) * sp * 6 + Math.min(o.count - (groups - 1) * 5, 4) * sp;
    const tg = K.svg("g", { class: "lr-tally" }, b.svg);
    b.strokes = K.prepDraw(
      K.tally(tg, o.count, (boxW - span) / 2 + sp * 0.3, boxH - th - 22, th, sp),
    );
    K.set(b.strokes, { strokeDashoffset: 0 });
    // where each tally's upright sits, in the box (for tallies that leave it)
    b.tallyAt = (k) => {
      const gx = (boxW - span) / 2 + sp * 0.3 + Math.floor(k / 5) * sp * 6;
      return { x: gx + (k % 5 < 4 ? (k % 5) * sp : sp * 1.5), y: boxH - th / 2 - 22 };
    };
    b.word = o.word;
    b.count = o.count;
    return b;
  });
  const all = [head, ...boxes];
  return { head, boxes, all, width: headW + gap + options.length * (boxW + gap) - gap };
}

// Fly a lifted row out of the grid: each box starts over its cell (the row's
// head over the row header) at the grid's placement `gp` ({ x, y, scale } of
// the grid layer at t) and lands in its slot on the desk.
export function liftOut(tl, lr, grid, r, cols, gp, t, { dur = 0.75, stagger = 0.05 } = {}) {
  const K = window.KIT;
  const from = (rect, b) => {
    const sx = (rect.w * gp.scale) / b.w;
    return {
      x: gp.x + (rect.x - K.get(grid.el, "x")) * gp.scale + (rect.w * gp.scale - b.w * sx) / 2,
      y: gp.y + (rect.y - K.get(grid.el, "y")) * gp.scale + (rect.h * gp.scale - b.h * sx) / 2,
      scale: sx,
    };
  };
  const pairs = [
    [grid.rowHeadBox(r), lr.head],
    ...cols.map((c, i) => [grid.box(r, c), lr.boxes[i]]),
  ];
  pairs.forEach(([rect, b], i) => {
    const f = from(rect, b);
    tl.fromTo(b.el, { ...f, opacity: 0 }, { opacity: 1 }, t + i * stagger, { dur: 0.2 });
    tl.fromTo(b.el, f, { x: b.x, y: b.y, scale: 1 }, t + i * stagger, {
      dur,
      ease: "in-out-cubic",
    });
  });
}

// the grid's tally strokes (and the lifted rows') are a little finer than the
// kit's default, to suit the small cells
export const GRID_CSS = `
.gg-tally .tally { stroke-width: 2.2; }
.lr-tally .tally { stroke-width: 3.5; }
`;
export const gridStyle = () => {
  const s = document.createElement("style");
  s.textContent = GRID_CSS;
  document.head.appendChild(s);
};
