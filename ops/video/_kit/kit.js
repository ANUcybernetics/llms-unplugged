// The composition kit for the LLMs Unplugged explainer videos. Every video is
// an HTML composition rendered by HyperFrames (see ../STYLE.md and the
// styled-video skill); this file holds what the eight videos share: the
// participant's-view objects (word tiles, the grid, dice strip and d10 face,
// ledger rows and sheets, the cup and counters, paper and pencil writing, a
// booklet page) on top of astromotion's video motion engine (motion/, a
// symlink to website/node_modules/astromotion/video), which supplies the
// stage, timing, captions, the Web Animations timeline and the moves.
// Everything is flat vector that tweens transform, opacity and
// stroke-dashoffset only; nothing animates layout. Pencil marks (tallies and
// written words) draw on and then hold still.
//
// Data (word lists, ledger rows, booklet entries, page images) comes from
// kit/generated/data.js, which ops/video/build-data.py writes from data/ and
// the deck constants. Timing comes from the video's timing.json (align.py).
//
// Usage in a composition:
//   <link rel="stylesheet" href="kit/kit.css">
//   <script src="kit/generated/data.js"></script>
//   <script type="module" src="kit/kit.js"></script>
//   <script type="module"> ... KIT.ready(build).then(({ tl }) => { window.__timelines[id] = tl; })
//   fonts and timing.json load, build(tl, S, T) lays out and animates, and
//   the composition registers the compiled timeline for the renderer.

import * as M from "./motion/motion.js";

window.KIT = (() => {
  const { clamp, lerp, set, get, el, svg, layer } = M;

  // ---------------------------------------------------------------- tokens
  // The token colour hash from website/src/lib/tokenColors.ts (and
  // cli/cutout-common.typ): a word is the same colour here as on paper.
  function colourIndex(tok) {
    let h = 14564;
    for (const ch of tok) h = (h * 7 + ch.codePointAt(0)) % 1000003;
    return h % 8;
  }
  // the tc-N palette as literal values (kit.css has the same list), for SVG
  // fills that a contrast checker has to be able to read without CSS variables
  const TOKEN_COLOURS = [
    "oklch(0% 0 0deg)",
    "oklch(62.9% 0.008 145deg)",
    "oklch(57.9% 0.238 29deg)",
    "oklch(38.6% 0.089 62deg)",
    "oklch(61% 0.205 142deg)",
    "oklch(47.2% 0.241 263deg)",
    "oklch(45.2% 0.195 316deg)",
    "oklch(53.4% 0.221 353deg)",
  ];
  const tokenColour = (tok) => TOKEN_COLOURS[colourIndex(tok)];
  const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);
  const isPunct = (t) => PUNCT.has(t);
  const split = (s) => s.trim().split(/\s+/);

  // Bigram counts of a token list: vocab in first-appearance order (the grid's
  // row and column order, as the decks draw it) and counts[row][col].
  function bigrams(tokens, vocab) {
    const v = vocab ? [...vocab] : [];
    if (!vocab) for (const t of tokens) if (!v.includes(t)) v.push(t);
    const idx = new Map(v.map((w, i) => [w, i]));
    const counts = v.map(() => v.map(() => 0));
    const pairs = [];
    for (let i = 0; i + 1 < tokens.length; i++) {
      const r = idx.get(tokens[i]),
        c = idx.get(tokens[i + 1]);
      counts[r][c]++;
      pairs.push({ i, r, c, from: tokens[i], to: tokens[i + 1], nth: counts[r][c] });
    }
    return { vocab: v, counts, pairs, idx };
  }

  // Port of computeDiceBands (website/src/lib/diceBands.ts): d10 faces
  // apportioned over options, rounded after rescaling, so the strip matches
  // the printed booklet and the deck.
  function diceBands(options) {
    const total = options.reduce((s, o) => s + o.count, 0);
    if (!total) return [];
    const faces = Math.pow(10, String(total).length);
    const factor = faces / total;
    let cum = 0,
      from = 0;
    return options.map((o) => {
      cum += o.count;
      const to = Math.min(Math.max(Math.round(cum * factor), 1), faces) - 1;
      const band = { word: o.word, count: o.count, from, to };
      from = to + 1;
      return band;
    });
  }
  const rowOptions = (bg, row) =>
    bg.vocab.map((w, c) => ({ word: w, count: bg.counts[row][c] })).filter((o) => o.count > 0);

  // ---------------------------------------------------------------- DOM
  const measure = (() => {
    const ctx = document.createElement("canvas").getContext("2d");
    return (text, font) => {
      ctx.font = font;
      return ctx.measureText(text).width;
    };
  })();

  // Punctuation as a symbol tile, the way the printed sheets draw it (punct-box
  // in cli/booklet-common.typ): an enlarged bold mark centred on its ink in a
  // rounded square, so ".", ",", "!" all read as the same-sized tile. Drawn
  // into an SVG parent, centred on (x, y), for a word set at `size`. The
  // colour is currentColor, so it follows the surrounding text's colour; the
  // box is filled with whatever it sits on (paper, unless told otherwise), so
  // nothing behind it shows through.
  const inkMetrics = (() => {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.textAlign = "center";
    return (text, font) => {
      ctx.font = font;
      return ctx.measureText(text);
    };
  })();
  const PUNCT_BOX = 1.15, // box side, in ems of the surrounding word
    PUNCT_MARK = 1.3; // the mark's size, in the same ems
  function punctBox(parent, mark, { x = 0, y = 0, size, colour, fill = "var(--paper)" }) {
    const side = size * PUNCT_BOX,
      markSize = size * PUNCT_MARK;
    const m = inkMetrics(mark, `700 ${markSize}px "Libertinus Serif"`);
    const g = svg("g", colour ? { style: `color: ${colour}` } : {}, parent);
    svg(
      "rect",
      {
        x: x - side / 2,
        y: y - side / 2,
        width: side,
        height: side,
        rx: side * 0.12,
        fill,
        stroke: "currentColor",
        "stroke-width": Math.max(1.5, size * 0.05),
      },
      g,
    );
    svg(
      "text",
      {
        x: x + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2,
        y: y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
        "text-anchor": "middle",
        "font-size": markSize,
        "font-weight": 700,
        fill: "currentColor",
        text: mark,
      },
      g,
    );
    return g;
  }
  // The same tile for HTML: an inline SVG sized in ems, so it scales with the
  // element's font-size like the word it stands in for.
  function punctTile(parent, mark, { fill } = {}) {
    const U = 100,
      pad = U * 0.04,
      side = U * PUNCT_BOX + 2 * pad;
    const s = svg(
      "svg",
      {
        viewBox: `${-side / 2} ${-side / 2} ${side} ${side}`,
        style: `width: ${side / U}em; height: ${side / U}em; display: block; overflow: visible`,
      },
      parent,
    );
    punctBox(s, mark, { size: U, fill });
    return s;
  }

  // Turn an existing SVG text element into a symbol tile in place, centred on
  // (cx, cy), for rows whose compositions keep animating that text element
  // (its fill): the element stays the glyph, and the box is drawn beside it.
  function punctInPlace(textEl, parent, cx, cy, size) {
    const side = size * PUNCT_BOX,
      markSize = size * PUNCT_MARK;
    const m = inkMetrics(textEl.textContent, `700 ${markSize}px "Libertinus Serif"`);
    textEl.setAttribute("x", cx + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2);
    textEl.setAttribute("y", cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    textEl.setAttribute("text-anchor", "middle");
    textEl.removeAttribute("dominant-baseline");
    textEl.setAttribute("font-size", markSize);
    textEl.setAttribute("font-weight", 700);
    const box = svg(
      "rect",
      {
        x: cx - side / 2,
        y: cy - side / 2,
        width: side,
        height: side,
        rx: side * 0.12,
        fill: "var(--paper)",
        stroke: "var(--ink)",
        "stroke-width": Math.max(1.5, size * 0.05),
      },
      parent,
    );
    // under the glyph, which the box would otherwise cover
    textEl.before(box);
    return box;
  }

  // deterministic per-index jitter (never Math.random: frames must reproduce)
  const jitter = M.hash;

  // ---------------------------------------------------------------- objects
  // Word tiles: one paper tile per token, laid out in a row (wrapping into
  // rows of `maxW`), returned with each tile's slot so moves can be planned.
  function tiles(
    parent,
    tokens,
    { x = 0, y = 0, size = 56, gap = 18, maxW = 1800, padX = 26, h } = {},
  ) {
    const H = h || size * 1.5;
    const font = `${size}px "Libertinus Serif"`;
    const g = layer(parent, x, y);
    const items = [];
    let cx = 0,
      cy = 0;
    tokens.forEach((t, i) => {
      const w = isPunct(t)
        ? Math.ceil(size * PUNCT_BOX) + 2 * padX
        : Math.ceil(measure(t, font)) + 2 * padX;
      if (cx + w > maxW && cx > 0) {
        cx = 0;
        cy += H + gap;
      }
      const d = el(
        "div",
        {
          class: `tile${isPunct(t) ? " punct" : ""}`,
          ...(isPunct(t) ? {} : { text: t }),
          style: { width: `${w}px`, height: `${H}px`, fontSize: `${size}px` },
        },
        g,
      );
      if (isPunct(t)) punctTile(d, t);
      set(d, { x: cx, y: cy });
      items.push({ el: d, text: t, x: cx, y: cy, w, h: H, i });
      cx += w + gap;
    });
    return {
      el: g,
      tiles: items,
      width: Math.max(...items.map((t) => t.x + t.w)),
      height: cy + H,
      size: H,
    };
  }

  // Tally strokes: four uprights and a diagonal strike per five, as the printed
  // sheets draw them. Returns the paths in drawing order (for draw-on).
  function tally(g, n, x, y, h = 34, sp = 10) {
    const paths = [];
    for (let i = 0; i < n; i++) {
      const group = Math.floor(i / 5),
        k = i % 5;
      const gx = x + group * (sp * 5 + sp);
      const d =
        k < 4
          ? `M${gx + k * sp} ${y} L${gx + k * sp} ${y + h}`
          : `M${gx - sp * 0.4} ${y + h * 0.9} L${gx + sp * 3.4} ${y + h * 0.1}`;
      paths.push(svg("path", { d, class: "draw tally" }, g));
    }
    return paths;
  }
  const prepDraw = (paths) => M.prepDraw(paths);
  const drawOn = M.drawOn;

  // The grid: row and column headers in the vocab order, tally cells, gold
  // bands to light a row/column and a dimmer to fade the rest. One SVG so the
  // camera can push into it as a unit.
  function grid(parent, bg, { x = 0, y = 0, cell = 120, head = 170, tallyH = 34 } = {}) {
    const n = bg.vocab.length;
    const W = head + n * cell,
      H = head + n * cell;
    const g = layer(parent, x, y);
    const s = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, g);
    svg("rect", { x: 0, y: 0, width: W, height: H, fill: "var(--paper)" }, s);
    // bands (under the rules) light a row or column
    const rowBands = bg.vocab.map((_, r) =>
      svg("rect", { x: 0, y: head + r * cell, width: W, height: cell, class: "highlight" }, s),
    );
    const colBands = bg.vocab.map((_, c) =>
      svg("rect", { x: head + c * cell, y: 0, width: cell, height: H, class: "highlight" }, s),
    );
    for (const b of [...rowBands, ...colBands])
      (b.setAttribute("fill-opacity", "0.28"), b.setAttribute("fill", "var(--gold)"));
    // rules
    const rules = svg("g", { stroke: "rgb(0 0 0 / 30%)", "stroke-width": 1.5 }, s);
    for (let i = 0; i <= n; i++) {
      svg("line", { x1: 0, y1: head + i * cell, x2: W, y2: head + i * cell }, rules);
      svg("line", { x1: head + i * cell, y1: 0, x2: head + i * cell, y2: H }, rules);
    }
    svg("line", { x1: 0, y1: head, x2: W, y2: head, stroke: "var(--ink)", "stroke-width": 2.5 }, s);
    svg("line", { x1: head, y1: 0, x2: head, y2: H, stroke: "var(--ink)", "stroke-width": 2.5 }, s);
    // headers
    const fs = Math.round(cell * 0.42);
    const rowHead = bg.vocab.map((w, r) =>
      isPunct(w)
        ? punctBox(s, w, {
            x: head - 22 - (fs * PUNCT_BOX) / 2,
            y: head + r * cell + cell / 2,
            size: fs,
            colour: "var(--ink)",
          })
        : svg(
            "text",
            {
              x: head - 22,
              y: head + r * cell + cell / 2,
              "text-anchor": "end",
              "dominant-baseline": "central",
              "font-size": fs,
              text: w,
            },
            s,
          ),
    );
    const colHead = bg.vocab.map((w, c) =>
      isPunct(w)
        ? punctBox(s, w, {
            x: head + c * cell + cell / 2,
            y: head - 26 - (fs * PUNCT_BOX) / 2,
            size: fs,
            colour: "var(--ink)",
          })
        : svg(
            "text",
            {
              x: head + c * cell + cell / 2,
              y: head - 26,
              "text-anchor": "middle",
              "font-size": fs,
              text: w,
            },
            s,
          ),
    );
    // the reading hints only fit a grid drawn large; a small grid leaves them out
    const corner = svg("g", { class: "ui" }, s);
    if (cell >= 90) {
      // both hints live inside the blank corner cell, clear of the headers
      svg(
        "text",
        {
          x: head - 12,
          y: 30,
          "text-anchor": "end",
          "font-size": 22,
          fill: "var(--ink-muted)",
          class: "ui",
          text: "next →",
        },
        corner,
      );
      svg(
        "text",
        {
          x: 14,
          y: head - 14,
          "font-size": 22,
          fill: "var(--ink-muted)",
          class: "ui",
          text: "current ↓",
        },
        corner,
      );
    }
    // cells: tally strokes per count, prepped for draw-on, plus a dimmer on top
    const cells = bg.vocab.map((_, r) =>
      bg.vocab.map((_, c) => {
        const cg = svg("g", {}, s);
        const k = bg.counts[r][c];
        const sp = Math.max(8, Math.round(cell * 0.09));
        const strokes = prepDraw(
          tally(
            cg,
            k,
            head + c * cell + (cell - Math.min(k, 5) * sp) / 2 + sp * 0.2,
            head + r * cell + (cell - tallyH) / 2,
            tallyH,
            sp,
          ),
        );
        return {
          g: cg,
          strokes,
          r,
          c,
          x: head + c * cell,
          y: head + r * cell,
          w: cell,
          h: cell,
          cx: head + c * cell + cell / 2,
          cy: head + r * cell + cell / 2,
        };
      }),
    );
    const dimmer = svg("rect", { x: 0, y: 0, width: W, height: H, class: "dimmer" }, s);
    dimmer.setAttribute("fill", "var(--paper)");
    return {
      el: g,
      svg: s,
      width: W,
      height: H,
      head,
      cell,
      cells,
      rowBands,
      colBands,
      rowHead,
      colHead,
      dimmer,
      bg,
      // where a cell's centre is in the parent's coordinates (for tiles flying in)
      at: (r, c) => ({ x: x + head + c * cell + cell / 2, y: y + head + r * cell + cell / 2 }),
    };
  }

  // The dice strip: ten faces 0-9 in a row, shaded into blocks per band in the
  // word's token colour, the word above its block.
  function strip(
    parent,
    bands,
    { x = 0, y = 0, face = 96, gap = 6, labelSize = 40, pad = 20 } = {},
  ) {
    const g = layer(parent, x, y);
    const faces = 10,
      W = faces * face + (faces - 1) * gap + 2 * pad,
      H = face + labelSize + 30 + 2 * pad;
    const s = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, g);
    // the strip sits on paper, so a black block (tc-0) reads against it
    svg("rect", { x: 0, y: 0, width: W, height: H, fill: "var(--paper)" }, s);
    const fy = pad + labelSize + 30,
      fx = (i) => pad + i * (face + gap);
    const faceEls = [],
      blocks = [],
      labels = [],
      nums = [];
    for (let i = 0; i < faces; i++) {
      faceEls.push(
        svg(
          "rect",
          {
            x: fx(i),
            y: fy,
            width: face,
            height: face,
            fill: "var(--paper)",
            stroke: "rgb(0 0 0 / 30%)",
            "stroke-width": 2,
          },
          s,
        ),
      );
    }
    for (const b of bands) {
      const x0 = fx(b.from),
        x1 = fx(b.to) + face;
      blocks.push(
        svg(
          "rect",
          {
            x: x0,
            y: fy,
            width: x1 - x0,
            height: face,
            fill: tokenColour(b.word),
            opacity: 0,
          },
          s,
        ),
      );
      labels.push(
        svg(
          "text",
          {
            x: (x0 + x1) / 2,
            y: pad + labelSize,
            "text-anchor": "middle",
            "font-size": labelSize,
            "font-weight": 700,
            fill: tokenColour(b.word),
            opacity: 0,
            text: b.word,
          },
          s,
        ),
      );
    }
    // the numbers sit over the blocks: ink on paper, white once a block is under them
    for (let i = 0; i < faces; i++) {
      nums.push(
        svg(
          "text",
          {
            x: fx(i) + face / 2,
            y: fy + face / 2,
            "text-anchor": "middle",
            "dominant-baseline": "central",
            "font-size": face * 0.5,
            class: "ui",
            "font-weight": 600,
            fill: "#1a1a1a",
            text: String(i),
          },
          s,
        ),
      );
    }
    const faceAt = (i) => ({ x: x + fx(i) + face / 2, y: y + fy + face / 2 });
    // shade the strip: blocks grow from the left, word by word, numbers turn white
    const shade = (tl, t, dur = 0.5, stagger = 0.15) => {
      tl.set(blocks, { opacity: 1 }, t);
      tl.fromTo(blocks, { scaleX: 0, transformOrigin: "0 50%" }, { scaleX: 1 }, t, {
        dur,
        stagger,
        ease: "out-cubic",
      });
      tl.to(labels, { opacity: 1 }, t + 0.1, { dur: 0.3, stagger });
      tl.to(nums, { fill: "#ffffff" }, t + dur * 0.5, { dur: 0.3 });
    };
    // a face lights: the rolled one
    const light = (tl, i, t) =>
      tl.to(nums[i], { scale: 1.35, transformOrigin: "50% 50%" }, t, { dur: 0.25, yoyo: true });
    return {
      el: g,
      svg: s,
      width: W,
      height: H,
      faces: faceEls,
      blocks,
      labels,
      nums,
      bands,
      faceAt,
      shade,
      light,
    };
  }

  // The die: a decagon outline (ten faces) with its number in gold, centred
  // on the ink rather than the baseline. Lands with land().
  function die(parent, { x = 0, y = 0, size = 150, face = 7 } = {}) {
    const g = layer(parent, x, y);
    const s = svg("svg", { width: size, height: size, viewBox: "0 0 100 100" }, g);
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${(50 + 46 * Math.cos(a)).toFixed(2)} ${(50 + 46 * Math.sin(a)).toFixed(2)}`;
    });
    const outline = svg("path", { d: `M${pts.join(" L")} Z`, class: "line" }, s);
    // one text node per face, toggled by opacity (seek-safe; no text swaps)
    const texts = [];
    for (let n = 0; n < 10; n++) {
      const tx = svg(
        "text",
        {
          x: 50,
          y: 50,
          "text-anchor": "middle",
          "font-size": 44,
          "font-weight": 600,
          fill: "var(--gold-2)",
          class: "ui",
          opacity: n === face ? 1 : 0,
          text: String(n),
        },
        s,
      );
      const b = tx.getBBox();
      tx.setAttribute("y", (50 + 50 - (b.y + b.height / 2)).toFixed(2));
      texts.push(tx);
    }
    set(g, { transformOrigin: "50% 50%" });
    return { el: g, texts, size, outline };
  }

  // A ledger row as the sheets print it (cli/ledger.typ): the prefix in bold
  // on a grey tint at the left, then one cell per follower: the word, and a
  // strip tinted in the column's counter colour holding its tally marks. Every
  // cell sits on a rule along the bottom of the row --- grey under the prefix,
  // the full counter colour under a follower's word and strip --- and the
  // rules meet end to end, so the line changes colour where one follower
  // hands over to the next.
  const COUNTER = {
    red: "var(--counter-red)",
    blue: "var(--counter-blue)",
    green: "var(--counter-green)",
    yellow: "var(--counter-yellow)",
  };
  const TINT = { red: "#fde4e4", blue: "#dfe8fb", green: "#e2f2df", yellow: "#f6eedc" };
  function ledgerRow(
    parent,
    entry,
    palette,
    { x = 0, y = 0, w = 1600, h = 150, prefixW = 260, fontSize = 44, svgParent } = {},
  ) {
    const s =
      svgParent ||
      svg("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, layer(parent, x, y));
    const g = svg("g", {}, s);
    const oy = svgParent ? y : 0;
    const prefix = entry.prefix.join ? entry.prefix.join(" ") : entry.prefix;
    const cellW = (w - prefixW) / 4;
    // The rule's thickness and the gap above a row's contents, in proportion
    // to the row as the printed sheet has them.
    const rule = Math.max(6, Math.round(h * 0.08)),
      gap = Math.round(h * 0.06);
    const bodyY = oy + gap,
      bodyH = h - gap - rule,
      ruleY = oy + h - rule;
    svg("rect", { x: 0, y: oy, width: w, height: h, fill: "var(--paper)" }, g);
    svg("rect", { x: 0, y: bodyY, width: prefixW, height: bodyH, fill: "#eee" }, g);
    svg("rect", { x: 0, y: ruleY, width: prefixW, height: rule, fill: "#a0a0a0" }, g);
    const prefixEl = svg(
      "text",
      {
        x: 24,
        y: oy + h / 2,
        "dominant-baseline": "central",
        "font-size": fontSize,
        "font-weight": 700,
        text: prefix,
      },
      g,
    );
    if (isPunct(prefix))
      punctInPlace(prefixEl, g, 14 + (fontSize * PUNCT_BOX) / 2, oy + h / 2, fontSize);
    svg(
      "line",
      {
        x1: prefixW,
        y1: bodyY,
        x2: prefixW,
        y2: oy + h,
        stroke: "rgb(0 0 0 / 35%)",
      },
      g,
    );
    const cells = palette.map((p, c) => {
      const f = entry.followers[c];
      const cx = prefixW + c * cellW;
      const cg = svg("g", {}, g);
      // The strip runs to the cell's right edge, where the rule changes colour;
      // the next cell's word keeps its distance from it instead.
      const stripW = cellW * 0.42,
        stripX = cx + cellW - stripW;
      const box = svg(
        "rect",
        { x: stripX, y: bodyY, width: stripW, height: bodyH, fill: TINT[p.name] || "#eee" },
        cg,
      );
      const ruleEl = svg("rect", { x: cx, y: ruleY, width: cellW, height: rule, fill: p.hex }, cg);
      svg(
        "text",
        {
          x: stripX + stripW - 8,
          y: ruleY - 10,
          "text-anchor": "end",
          "font-size": 16,
          class: "ui",
          fill: "var(--ink-muted)",
          text: p.name,
        },
        cg,
      );
      let wordEl = null,
        strokes = [];
      if (f) {
        wordEl = svg(
          "text",
          {
            x: cx + 24,
            y: oy + h / 2,
            "dominant-baseline": "central",
            "font-size": fontSize,
            text: f.text,
          },
          cg,
        );
        if (isPunct(f.text))
          punctInPlace(wordEl, cg, cx + 18 + (fontSize * PUNCT_BOX) / 2, oy + h / 2, fontSize);
        strokes = prepDraw(tally(cg, f.count, stripX + 16, bodyY + 18, 34, 9));
      }
      const lit = svg(
        "rect",
        {
          x: cx,
          y: oy + 4,
          width: cellW - 4,
          height: h - 8,
          fill: "var(--gold)",
          "fill-opacity": 0.3,
          opacity: 0,
        },
        cg,
      );
      return {
        g: cg,
        box,
        rule: ruleEl,
        wordEl,
        strokes,
        lit,
        follower: f,
        colour: p.name,
        hex: p.hex,
        x: cx,
        w: cellW,
        cx: stripX + stripW / 2,
        cy: oy + h / 2,
      };
    });
    const lit = svg(
      "rect",
      {
        x: 2,
        y: oy + 2,
        width: w - 4,
        height: h - 4,
        fill: "var(--gold)",
        "fill-opacity": 0.25,
        opacity: 0,
      },
      g,
    );
    return { g, svg: s, el: s.parentNode, cells, prefixEl, lit, entry, x, y, w, h };
  }

  // A ledger sheet: a paper page with a header run and its rows.
  function sheet(
    parent,
    entries,
    palette,
    {
      x = 0,
      y = 0,
      w = 1600,
      rowH = 150,
      header = null,
      title = "",
      pad = 24,
      fontSize = 44,
      prefixW = 260,
    } = {},
  ) {
    const headH = header ? 90 : 0;
    const H = headH + entries.length * rowH + pad * 2;
    const g = layer(parent, x, y);
    const s = svg("svg", { width: w, height: H, viewBox: `0 0 ${w} ${H}` }, g);
    svg("rect", { x: 0, y: 0, width: w, height: H, fill: "var(--paper)" }, s);
    if (header) {
      svg(
        "text",
        {
          x: pad,
          y: 52,
          "font-size": 30,
          class: "ui",
          "font-weight": 600,
          fill: "var(--ink)",
          text: "LLMs Unplugged",
        },
        s,
      );
      svg(
        "text",
        {
          x: w / 2,
          y: 52,
          "text-anchor": "middle",
          "font-size": 30,
          class: "ui",
          fill: "var(--ink)",
          text: title,
        },
        s,
      );
      const hdr = svg(
        "text",
        {
          x: w - pad,
          y: 54,
          "text-anchor": "end",
          "font-size": 40,
          "font-weight": 700,
          text: `${header[0]} → ${header[1]}`,
        },
        s,
      );
      svg(
        "line",
        { x1: pad, y1: 78, x2: w - pad, y2: 78, stroke: "var(--gold)", "stroke-width": 2.5 },
        s,
      );
      s.__header = hdr;
    }
    const rows = entries.map((e, i) =>
      ledgerRow(parent, e, palette, {
        x: 0,
        y: headH + pad + i * rowH,
        w,
        h: rowH,
        fontSize,
        prefixW,
        svgParent: s,
      }),
    );
    for (const r of rows) r.el = g;
    return {
      el: g,
      svg: s,
      rows,
      width: w,
      height: H,
      headerEl: s.__header,
      rowAt: (i) => ({ x, y: y + headH + pad + i * rowH }),
    };
  }

  // The cup seen from above: a rim in line, counters placed in it deterministically.
  function cup(parent, { x = 0, y = 0, r = 170 } = {}) {
    const g = layer(parent, x, y);
    const D = r * 2 + 40;
    const s = svg("svg", { width: D, height: D, viewBox: `0 0 ${D} ${D}` }, g);
    const rim = svg("circle", { cx: D / 2, cy: D / 2, r: r + 12, class: "line" }, s);
    svg("circle", { cx: D / 2, cy: D / 2, r: r, class: "line faint" }, s);
    const pool = svg("g", {}, s);
    const counters = [];
    const cr = Math.round(r * 0.19);
    // a sunflower spiral fills the cup evenly for any count
    const slot = (i, n) => {
      const k = i + 0.5,
        rad = Math.sqrt(k / Math.max(n, 1)) * (r - cr - 8),
        th = k * 2.399963 + 0.7;
      return { x: D / 2 + rad * Math.cos(th), y: D / 2 + rad * Math.sin(th) };
    };
    return {
      el: g,
      svg: s,
      rim,
      D,
      r,
      cr,
      counters,
      pool,
      slot,
      centre: { x: x + D / 2, y: y + D / 2 },
      // add a counter (hidden) at its slot; returns the element to animate in
      add(colour, i, n) {
        const p = slot(i, n);
        const c = svg(
          "circle",
          {
            cx: 0,
            cy: 0,
            r: cr,
            fill: COUNTER[colour] || colour,
            stroke: "rgb(0 0 0 / 30%)",
            "stroke-width": 2,
          },
          pool,
        );
        set(c, { x: p.x, y: p.y, opacity: 0, transformOrigin: "0 0" });
        counters.push(c);
        return { el: c, x: p.x, y: p.y };
      },
    };
  }
  function counter(parent, colour, { x = 0, y = 0, r = 32 } = {}) {
    const g = layer(parent, x, y);
    const s = svg(
      "svg",
      { width: r * 2 + 8, height: r * 2 + 8, viewBox: `0 0 ${r * 2 + 8} ${r * 2 + 8}` },
      g,
    );
    svg(
      "circle",
      {
        cx: r + 4,
        cy: r + 4,
        r,
        fill: COUNTER[colour] || colour,
        stroke: "rgb(0 0 0 / 30%)",
        "stroke-width": 2,
      },
      s,
    );
    set(g, { transformOrigin: "50% 50%" });
    return { el: g, r };
  }

  // ------------------------------------------------------------ line art
  // Props that aren't paper are white line drawings (ANU brand illustration
  // style: single-weight fine lines, gold on the part that matters); see
  // STYLE.md. Class .line (kit.css) is the white line, .line.gold the gold one.

  // an iconoir icon (KIT_DATA.icons, 24x24) at `size` px, in line
  function icon(parent, name, { x = 0, y = 0, size = 96, gold = false } = {}) {
    const body = window.KIT_DATA?.icons?.[name];
    if (!body) throw new Error(`KIT.icon: no icon ${name} (run build-data.py)`);
    const g = layer(parent, x, y);
    const s = svg("svg", { width: size, height: size, viewBox: "0 0 24 24", class: "icon" }, g);
    s.innerHTML = body;
    if (gold) s.classList.add("gold");
    return { el: g, svg: s, size, paths: [...s.querySelectorAll("path")] };
  }

  // a CC0 silhouette (KIT_DATA.art: magpie, dog) as its outline only, fitted
  // into the box w x h; flip mirrors it, rotate tips it (degrees)
  function outline(
    parent,
    name,
    { x = 0, y = 0, w = 300, h = 240, flip = false, rotate = 0 } = {},
  ) {
    const body = window.KIT_DATA?.art?.[name];
    if (!body) throw new Error(`KIT.outline: no art ${name} (run build-data.py)`);
    const g = layer(parent, x, y);
    const s = svg("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}`, overflow: "visible" }, g);
    const fit = svg("g", {}, s);
    fit.innerHTML = body;
    const paths = [...fit.querySelectorAll("path")];
    for (const p of paths) p.setAttribute("class", "line");
    const b = fit.getBBox();
    const k = Math.min(w / b.width, h / b.height);
    fit.setAttribute(
      "transform",
      `translate(${w / 2} ${h / 2}) rotate(${rotate}) scale(${flip ? -k : k} ${k}) ` +
        `translate(${-(b.x + b.width / 2)} ${-(b.y + b.height / 2)})`,
    );
    return { el: g, svg: s, paths, w, h };
  }

  // the pencil: a line drawing with a gold point. (x, y) is the point;
  // `angle` is the direction the pencil lies from it (degrees, 0 = to the right)
  function pencil(parent, { x = 0, y = 0, len = 380, angle = 200, width = 36 } = {}) {
    const g = layer(parent, x, y);
    const s = svg("svg", { width: 1, height: 1, overflow: "visible" }, g);
    const h = width / 2,
      cone = width * 1.5,
      ferrule = width * 0.4,
      eraser = width * 0.7;
    const body = svg("g", { transform: `rotate(${angle})` }, s);
    const end = len - eraser;
    svg(
      "path",
      { class: "line", d: `M${cone} ${-h} L${end} ${-h} L${end} ${h} L${cone} ${h}` },
      body,
    );
    svg("path", { class: "line faint", d: `M${cone} 0 L${end - ferrule} 0` }, body);
    svg("path", { class: "line", d: `M${cone} ${-h} L0 0 L${cone} ${h}` }, body);
    svg(
      "path",
      { class: "gold-fill", d: `M${cone * 0.3} ${-h * 0.3} L0 0 L${cone * 0.3} ${h * 0.3} Z` },
      body,
    );
    svg("path", { class: "line", d: `M${end - ferrule} ${-h} L${end - ferrule} ${h}` }, body);
    svg(
      "path",
      { class: "line", d: `M${end} ${-h} L${len} ${-h} L${len} ${h} L${end} ${h}` },
      body,
    );
    return { el: g, len, angle };
  }

  // Glint: a short segment that travels once round an outline, eased in and
  // out, then rests; "gold" lays a gold segment over the line, "gap" opens
  // the line itself (a mask) so what's behind shows through. Drawn on every
  // seek as a pure function of t (tl.draw). `els` are SVG shapes (a path,
  // circle, rect, polygon); `from`/`to` bound when it runs.
  let glintId = 0;
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
  function glint(
    tl,
    els,
    { kind = "gold", phase = 0, lap = 3.2, rest = 2.4, seg = 0.09, from = 0, to = Infinity } = {},
  ) {
    const runs = [];
    for (const el of [els].flat()) {
      const L = el.getTotalLength();
      const o = el.cloneNode();
      o.removeAttribute("id");
      o.setAttribute("class", kind === "gold" ? "glint-gold" : "glint-gap");
      o.style.strokeDasharray = `${seg * L} ${L}`;
      if (kind === "gold") el.after(o);
      else {
        // the mask's content is in el's own user space, transform included
        o.removeAttribute("transform");
        const id = `kit-glint-${glintId++}`;
        // explicit bounds: a userSpaceOnUse mask otherwise spans only 120% of
        // the viewport, which clips a line drawn in a tiny overflowing svg
        const m = svg(
          "mask",
          { id, maskUnits: "userSpaceOnUse", x: -1e5, y: -1e5, width: 2e5, height: 2e5 },
          el.parentNode,
        );
        svg("rect", { x: -1e5, y: -1e5, width: 2e5, height: 2e5, fill: "#fff" }, m);
        m.append(o);
        el.parentNode.insertBefore(m, el);
        el.setAttribute("mask", `url(#${id})`);
      }
      runs.push({ o, L });
    }
    tl.draw((t) => {
      const u = t - from - phase;
      const k = Math.floor(u / (lap + rest)),
        w = u - k * (lap + rest);
      const on = u >= 0 && t < to && w < lap;
      const off = on ? -easeInOut(w / lap) : 0;
      const op = on ? Math.min(1, w / 0.4, (lap - w) / 0.4) : 0;
      for (const r of runs) {
        r.o.style.strokeDashoffset = `${off * r.L}`;
        r.o.style.opacity = op;
      }
    });
    return runs;
  }

  // Paper and pencil: a strip of paper, and words written on it one by one.
  function paper(parent, { x = 0, y = 0, w = 1600, h = 120, lines = 1 } = {}) {
    const d = el(
      "div",
      { class: "paper", style: { width: `${w}px`, height: `${h * lines}px` } },
      parent,
    );
    set(d, { x, y });
    return { el: d, w, h, x, y };
  }
  function pencilLine(parent, words, { x = 24, y = 30, size = 54 } = {}) {
    const d = el(
      "div",
      {
        class: "pencil",
        style: { position: "absolute", left: `${x}px`, top: `${y}px`, fontSize: `${size}px` },
      },
      parent,
    );
    const spans = words.map((w) => {
      const s = el("span", { class: "w", text: w }, d);
      set(s, { opacity: 0 });
      return s;
    });
    return { el: d, words: spans };
  }
  // write words in with a small pencil rise, each at its time
  const write = (tl, span, t, dur = 0.25) =>
    tl.fromTo(span, { opacity: 0, y: 6 }, { opacity: 1, y: 0 }, t, { dur, ease: "out-cubic" });

  // A page image (from build-data.py's pdf-assets run) shown in a paper frame,
  // with a crop that tweens: the point of interest tracks as the camera moves.
  function pageImage(parent, name, sheetNo, { x = 0, y = 0, w = 900, h = 900 } = {}) {
    const P = KIT_DATA.pages[name];
    const page = P.bbox[sheetNo - 1];
    const frame = el(
      "div",
      { class: "paper", style: { width: `${w}px`, height: `${h}px`, overflow: "hidden" } },
      parent,
    );
    set(frame, { x, y });
    // the image and its highlight box live in one wrapper that carries the crop transform
    const wrap = el(
      "div",
      { style: { position: "absolute", left: 0, top: 0, transformOrigin: "0 0" } },
      frame,
    );
    const img = el(
      "img",
      {
        src: `kit/generated/pages/${name}/pages/sheet-${String(sheetNo).padStart(3, "0")}.png`,
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          display: "block",
          width: `${P.imgW}px`,
          height: `${P.imgH}px`,
        },
      },
      wrap,
    );
    const hl = el(
      "div",
      {
        style: {
          position: "absolute",
          border: "4px solid var(--gold)",
          boxShadow: "0 0 0 6px rgb(190 131 14 / 22%)",
          opacity: 0,
        },
      },
      wrap,
    );
    const IW = P.imgW,
      IH = P.imgH,
      k = IW / page.w;
    // bbox of the text line whose first words are `words` (PDF points → image px)
    const lineBox = (words) => {
      const L = page.lines.find((l) => words.every((wd, i) => l.words[i] === wd));
      if (!L) throw new Error(`${words.join(" ")} not on ${name} sheet ${sheetNo}`);
      const [x0, y0, x1, y1] = L.bbox;
      return { x: x0 * k, y: y0 * k, w: (x1 - x0) * k, h: (y1 - y0) * k };
    };
    const fit = () => {
      const s = Math.min(w / IW, h / IH);
      return { cw: w / s, ch: h / s, cx: (IW - w / s) / 2, cy: (IH - h / s) / 2 };
    };
    const around = (box, cw) => {
      const ch = (cw * h) / w;
      return {
        cw,
        ch,
        cx: clamp(box.x + box.w / 2 - cw / 2, 0, IW - cw),
        cy: clamp(box.y + box.h / 2 - ch / 2, 0, IH - ch),
      };
    };
    const state = fit();
    const placement = (c) => {
      const s = w / c.cw;
      return { x: -c.cx * s, y: -c.cy * s, scale: s };
    };
    const apply = (c) => set(wrap, placement(c));
    apply(state);
    // a camera move within the page tweens the crop (log on width) so the point of interest tracks
    const moveTo = (tl, crop, t, dur = 0.7, ease = "in-out-cubic") => {
      const from = { ...state };
      tl.sample(
        wrap,
        t,
        dur,
        (p) => {
          const cw = Math.exp(lerp(Math.log(from.cw), Math.log(crop.cw), p)),
            ch = (cw * h) / w;
          return placement({
            cw,
            ch,
            cx: lerp(from.cx + from.cw / 2, crop.cx + crop.cw / 2, p) - cw / 2,
            cy: lerp(from.cy + from.ch / 2, crop.cy + crop.ch / 2, p) - ch / 2,
          });
        },
        { ease },
      );
      Object.assign(state, crop); // build-time bookkeeping for the next move
    };
    const cut = (tl, crop, t) => {
      tl.set(wrap, placement(crop), t);
      Object.assign(state, crop);
    };
    // the highlight box in image pixels (it scales with the page)
    const highlight = (box, pad = 14) =>
      set(hl, {
        left: box.x - pad,
        top: box.y - pad * 0.6,
        width: box.w + 2 * pad,
        height: box.h + 1.2 * pad,
      });
    return {
      el: frame,
      img,
      hl,
      wrap,
      w,
      h,
      IW,
      IH,
      k,
      page,
      lineBox,
      fit,
      around,
      moveTo,
      cut,
      highlight,
      state,
    };
  }

  // A drawn loop (for the overview and the agentic video): an SVG path in gold
  // that draws on, with labels at stations.
  function loop(
    parent,
    { x = 0, y = 0, w = 900, h = 700, labels = [], stroke = "var(--gold)" } = {},
  ) {
    const g = layer(parent, x, y);
    const s = svg("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, g);
    const rx = w / 2 - 190,
      ry = h / 2 - 70,
      cx = w / 2,
      cy = h / 2;
    // a rounded loop starting at the top, clockwise
    const d = `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 1 ${cx - 0.01} ${cy - ry}`;
    const path = M.prepDraw([svg("path", { d, class: "draw", stroke, "stroke-width": 8 }, s)]);
    const n = labels.length;
    const stations = labels.map((lab, i) => {
      const th = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const px = cx + rx * Math.cos(th),
        py = cy + ry * Math.sin(th);
      const dot = svg("circle", { cx: px, cy: py, r: 14, fill: stroke, opacity: 0 }, s);
      const anchor = Math.cos(th) > 0.3 ? "start" : Math.cos(th) < -0.3 ? "end" : "middle";
      const tx = px + 30 * Math.cos(th) * 1.3,
        ty =
          py + 30 * Math.sin(th) * 1.3 + (Math.sin(th) > 0.3 ? 30 : Math.sin(th) < -0.3 ? -12 : 12);
      const t = svg(
        "text",
        {
          x: tx,
          y: ty,
          "text-anchor": anchor,
          "font-size": 34,
          class: "ui",
          fill: "var(--text)",
          opacity: 0,
          text: lab,
        },
        s,
      );
      return { dot, text: t, x: px, y: py, th };
    });
    return { el: g, svg: s, path: path[0], stations, cx, cy, rx, ry };
  }

  // A gold ring: the bracket that sits over a pair of tiles, or rings a cell.
  // Moved and resized with x/y and scaleX/scaleY on a w x h box, as any layer;
  // the layer doesn't scale, its box takes its size from the scale channels
  // (.ring in kit.css), so the border and glow stay the same at any size.
  function ring(
    parent,
    { x = 0, y = 0, w = 100, h = 100, stroke = 5, color = "var(--gold)" } = {},
  ) {
    const g = layer(parent, x, y);
    g.classList.add("ring");
    const d = el(
      "div",
      {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          border: `${stroke}px solid ${color}`,
          boxShadow: "0 0 0 4px rgb(190 131 14 / 22%)",
        },
      },
      g,
    );
    d.style.setProperty("--w", `${w}px`);
    d.style.setProperty("--h", `${h}px`);
    set(g, { opacity: 0, transformOrigin: "0 0" });
    return {
      el: g,
      box: d,
      w,
      h,
      // land the ring around a box {x, y, w, h} (parent coordinates), padded
      around: (tl, b, t, dur = 0.45, pad = 10) =>
        tl.to(
          g,
          { x: b.x - pad, y: b.y - pad, scaleX: (b.w + 2 * pad) / w, scaleY: (b.h + 2 * pad) / h },
          t,
          { dur, ease: "in-out-cubic" },
        ),
    };
  }
  // the box (parent coordinates) spanning tiles a..b of a tiles() result
  const spanBox = (tiles, a, b) => {
    const A = tiles.tiles[a],
      B = tiles.tiles[b];
    const x0 = get(tiles.el, "x"),
      y0 = get(tiles.el, "y");
    const wrapped = B.y !== A.y;
    return { x: x0 + A.x, y: y0 + A.y, w: wrapped ? A.w : B.x + B.w - A.x, h: A.h };
  };
  // a page of a book: paper with the text set large in the book's serif
  function bookPage(parent, lines, { x = 0, y = 0, w = 800, h = 420, size = 60, pad = 56 } = {}) {
    const d = el(
      "div",
      {
        class: "paper",
        style: {
          width: `${w}px`,
          height: `${h}px`,
          padding: `${pad}px`,
          fontFamily: "var(--font-tok)",
          fontSize: `${size}px`,
          lineHeight: 1.35,
        },
      },
      parent,
    );
    set(d, { x, y });
    const ls = lines.map((t) => el("div", { text: t }, d));
    return { el: d, lines: ls, x, y, w, h };
  }

  // ---------------------------------------------------------------- motion
  // a d10 face landing: scale down onto the desk, ease-out
  const land = (tl, dieObj, face, t, dur = 0.45) => {
    dieObj.texts.forEach((tx, n) => tl.set(tx, { opacity: n === face ? 1 : 0 }, t));
    return tl.fromTo(
      dieObj.el,
      { opacity: 0, scale: 1.5, rotation: -18 },
      { opacity: 1, scale: 1, rotation: 0 },
      t,
      { dur, ease: "out-quart" },
    );
  };

  // ---------------------------------------------------------------- boot
  // Fonts must be loaded before anything is measured.
  const FONTS = [
    '400 20px "Public Sans"',
    '600 20px "Public Sans"',
    '400 20px "Libertinus Serif"',
    '700 20px "Libertinus Serif"',
    'italic 400 20px "Libertinus Serif"',
  ];
  const ready = (build) => M.ready((tl, S, T) => build(tl, S, T), { fonts: FONTS });

  return {
    colourIndex,
    tokenColour,
    TOKEN_COLOURS,
    isPunct,
    punctBox,
    punctTile,
    split,
    bigrams,
    diceBands,
    rowOptions,
    el,
    svg,
    layer,
    place: M.place,
    set,
    get,
    measure,
    jitter,
    stage: M.stage,
    timing: M.timing,
    captions: M.captions,
    tiles,
    icon,
    outline,
    pencil,
    glint,
    tally,
    prepDraw,
    drawOn,
    grid,
    strip,
    die,
    ledgerRow,
    sheet,
    cup,
    counter,
    paper,
    pencilLine,
    write,
    pageImage,
    loop,
    ring,
    spanBox,
    bookPage,
    appear: M.appear,
    vanish: M.vanish,
    show: M.show,
    hide: M.hide,
    land,
    flyTo: M.flyTo,
    camera: M.camera,
    ready,
    COUNTER,
    TINT,
    lerp,
    clamp,
  };
})();
