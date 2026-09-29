// One row of the model in every body it can take: grid tallies, ledger marks
// in coloured boxes, counters in four columns, cutout slips in four piles,
// and plain numbers. The followers hold their places left to right in every
// form, so the forms read as one object changing shape.
//
// Used by `same-algorithm` (the morph beat, the walk's grid rows and slip
// piles) and `overview` (the whole morph compressed into one beat: `quick`).
//
//   import { row, morph, quick, jump } from "./parts/morph.js";
//   const R = row(scene, "the", MAGPIE.rows.the, { x, y });
//   R.drawMarks(tl, t);                       // the grid form's tallies draw on
//   morph(tl, R, { ledger, colour, counters, slips, numbers });   // absolute times
//   quick(tl, R, t0, 4);                      // the same, evenly inside 4 s
//   jump(tl, R, "slips", t);                  // cut straight to a form
//
// A row is built in its grid form and hidden (`R.el` at opacity 0): the caller
// brings it in. Followers are `[[word, count], …]` (MAGPIE.rows order is the
// ledger's colour order); colours come from KIT_DATA.palette in that order.
// Slips look like the CLI's printed cutouts (cli/cutout-common.typ): the
// previous word boxed in its token colour, white and bold, then the next word
// bold in its own token colour.

const FORMS = ["grid", "ledger", "colour", "counters", "slips", "numbers"];

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const s = document.createElement("style");
  s.textContent = `
    .same-slip { position: absolute; left: 0; top: 0; transform-origin: 50% 50%; }
    .same-slip > .front, .same-slip > .back {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      gap: 0.3em; background: var(--paper); border: 1.5px solid rgb(0 0 0 / 45%);
      box-shadow: 0 1px 0 var(--paper-edge), 0 6px 14px rgb(0 0 0 / 35%);
      font-family: var(--font-tok); line-height: 1; white-space: nowrap;
    }
    .same-slip .back { background: #f4f1ea; }
    .same-slip .tok.box { padding: 0.06em 0.16em 0.1em; }
    .same-number {
      position: absolute; left: 0; top: 0; font-family: var(--font-ui); font-weight: 600;
      color: var(--text); line-height: 1; white-space: nowrap; transform-origin: 50% 50%;
    }
  `;
  document.head.append(s);
}

// A token as it prints on a cutout: boxed (the previous word) or free (the
// next word). Punctuation is the kit's symbol tile, in the token's colour.
function token(K, parent, w, boxed) {
  const c = `tc-${K.colourIndex(w)}`;
  if (!K.isPunct(w))
    return K.el("span", { class: `tok ${boxed ? "box " : ""}${c}`, text: w }, parent);
  const span = K.el("span", { class: `tok ${c}`, style: { display: "inline-block" } }, parent);
  if (boxed) span.style.color = "#fff";
  K.punctTile(span, w, { fill: boxed ? "var(--c)" : "var(--paper)" });
  return span;
}

// A cutout slip, front and back, centred on its own origin (x, y is its
// centre once placed with `set(el, { x: cx - w / 2, y: cy - h / 2 })`).
export function slip(parent, prev, next, { size = 34 } = {}) {
  const K = window.KIT;
  style();
  const font = `700 ${size}px "Libertinus Serif"`;
  const tw = (w) => (K.isPunct(w) ? size * 1.3 : K.measure(w, font) + size * 0.32);
  const w = Math.round(tw(prev) + tw(next) + size * 0.3 + size * 0.9),
    h = Math.round(size * 1.75);
  const el = K.el(
    "div",
    { class: "same-slip", style: { width: `${w}px`, height: `${h}px`, fontSize: `${size}px` } },
    parent,
  );
  const back = K.el("div", { class: "back" }, el);
  const front = K.el("div", { class: "front" }, el);
  // slips pile and scatter over each other, as paper does: their words may overlap
  for (const t of [token(K, front, prev, true), token(K, front, next, false)])
    for (const e of [t, ...t.querySelectorAll("text")])
      e.setAttribute("data-layout-allow-overlap", "");
  K.set(back, { opacity: 0 });
  return { el, front, back, w, h };
}

// width of n tally marks drawn by K.tally with spacing sp
const tallyW = (n, sp) => {
  const groups = Math.ceil(n / 5),
    last = n - (groups - 1) * 5;
  return (groups - 1) * sp * 6 + (last === 5 ? sp * 3.8 : (last - 1) * sp);
};
// the centre of mark k of a K.tally run (its local coordinates)
const markAt = (k, sp, h) => {
  const gx = Math.floor(k / 5) * sp * 6,
    i = k % 5;
  return i < 4 ? { x: gx + i * sp, y: h / 2 } : { x: gx + sp * 1.5, y: h / 2 };
};

export function row(
  parent,
  prefix,
  followers,
  {
    x = 0,
    y = 0,
    prefixW = 300,
    slotW = 345,
    headH = 90,
    rowH = 150,
    font = 50,
    tallyH = 46,
    tallySp = 11,
    below = 36, // from the row's bottom edge to the form area
    counterR = 23,
    counterGap = 52,
    slipSize = 40,
    pileStep = slipSize * 0.3, // how far each slip in a pile sits above the one under it
    numberSize = 140,
    palette = window.KIT_DATA.palette,
  } = {},
) {
  const K = window.KIT;
  style();
  const n = followers.length;
  const W = prefixW + n * slotW;
  const top = headH,
    bot = headH + rowH;
  const maxCount = Math.max(...followers.map(([, c]) => c));
  const formTop = bot + below;
  const colBottom = formTop + maxCount * counterGap; // counters stack up from here
  const pileY = formTop + (maxCount * counterGap) / 2; // where piles and numbers centre
  const H = colBottom + 20;

  const root = K.layer(parent, x, y);
  K.set(root, { opacity: 0 });
  const s = K.svg(
    "svg",
    { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: "overflow: visible" },
    root,
  );
  const dom = K.layer(root, 0, 0);

  const slotX = (c) => prefixW + c * slotW;
  const slotC = (c) => slotX(c) + slotW / 2;

  // ---- paper: the header band (grid only) and the row itself
  const paperRow = K.svg(
    "rect",
    { x: 0, y: top, width: W, height: rowH, fill: "var(--paper)" },
    s,
  );
  const paperHead = K.svg(
    "rect",
    { x: 0, y: 0, width: W, height: top + 10, fill: "var(--paper)" },
    s,
  );
  s.insertBefore(paperHead, paperRow);

  // ---- grid rules: header line, row-header line, cell walls
  const gridRules = K.svg("g", {}, s);
  K.svg(
    "line",
    { x1: 0, y1: top, x2: W, y2: top, stroke: "var(--ink)", "stroke-width": 2.5 },
    gridRules,
  );
  K.svg(
    "line",
    { x1: prefixW, y1: 0, x2: prefixW, y2: bot, stroke: "var(--ink)", "stroke-width": 2.5 },
    gridRules,
  );
  for (let c = 1; c < n; c++)
    K.svg(
      "line",
      {
        x1: slotX(c),
        y1: 0,
        x2: slotX(c),
        y2: bot,
        stroke: "rgb(0 0 0 / 30%)",
        "stroke-width": 1.5,
      },
      gridRules,
    );

  // ---- ledger furniture (cli/ledger.typ via the kit's ledgerRow): the grey
  // prefix tint and rule, a strip per follower, tinted and ruled in its colour
  const rule = Math.max(6, Math.round(rowH * 0.08)),
    gap = Math.round(rowH * 0.06);
  const bodyY = top + gap,
    bodyH = rowH - gap - rule,
    ruleY = bot - rule;
  const stripW = slotW * 0.42;
  const stripX = (c) => slotX(c) + slotW - stripW;
  const ledger = K.svg("g", {}, s);
  K.set(ledger, { opacity: 0 });
  K.svg("rect", { x: 0, y: bodyY, width: prefixW, height: bodyH, fill: "#eee" }, ledger);
  K.svg("rect", { x: 0, y: ruleY, width: prefixW, height: rule, fill: "#a0a0a0" }, ledger);
  K.svg(
    "line",
    { x1: prefixW, y1: bodyY, x2: prefixW, y2: bot, stroke: "rgb(0 0 0 / 35%)" },
    ledger,
  );
  const plain = [],
    tints = [],
    rules = [],
    names = [];
  followers.forEach((_, c) => {
    const p = palette[c];
    plain.push(
      K.svg("rect", { x: stripX(c), y: bodyY, width: stripW, height: bodyH, fill: "#eee" }, ledger),
    );
    K.svg("rect", { x: slotX(c), y: ruleY, width: slotW, height: rule, fill: "#a0a0a0" }, ledger);
    const tint = K.svg(
      "rect",
      { x: stripX(c), y: bodyY, width: stripW, height: bodyH, fill: K.TINT[p.name] },
      ledger,
    );
    const r = K.svg(
      "rect",
      { x: slotX(c), y: ruleY, width: slotW, height: rule, fill: p.hex },
      ledger,
    );
    const nm = K.svg(
      "text",
      {
        x: stripX(c) + stripW - 8,
        y: ruleY - 10,
        "text-anchor": "end",
        "font-size": 16,
        class: "ui",
        fill: "var(--ink-muted)",
        text: p.name,
      },
      ledger,
    );
    K.set([tint, nm], { opacity: 0 });
    K.set(r, { scaleX: 0, transformOrigin: "0 50%" });
    (tints.push(tint), rules.push(r), names.push(nm));
  });

  // ---- words: the prefix, and each follower (a column header in the grid,
  // then inside its cell on the ledger)
  const fontStr = `${font}px "Libertinus Serif"`;
  const word = (w, weight) => {
    const g = K.svg("g", {}, s);
    if (K.isPunct(w)) K.punctBox(g, w, { x: font * 0.6, y: 0, size: font, colour: "var(--ink)" });
    else
      K.svg(
        "text",
        {
          x: 0,
          y: 0,
          "dominant-baseline": "central",
          "font-size": font,
          "font-weight": weight,
          text: w,
        },
        g,
      );
    return {
      g,
      w: K.isPunct(w) ? font * 1.2 : K.measure(w, `${weight === 700 ? "700 " : ""}${fontStr}`),
    };
  };
  const pre = word(prefix, 700);
  K.set(pre.g, { x: 26, y: top + rowH / 2 });
  const words = followers.map(([w], c) => {
    const o = word(w, 400);
    o.grid = { x: slotC(c) - o.w / 2, y: top / 2 + 2 };
    o.ledger = { x: slotX(c) + 22, y: top + rowH / 2 };
    K.set(o.g, o.grid);
    return o;
  });

  // ---- tallies: one group per follower, centred in its grid cell, then in
  // its ledger strip, prepped for draw-on.
  const marks = followers.map(([, count], c) => {
    const g = K.svg("g", {}, s);
    const paths = K.prepDraw(K.tally(g, count, 0, 0, tallyH, tallySp));
    const w = tallyW(count, tallySp);
    const grid = { x: slotC(c) - w / 2, y: top + (rowH - tallyH) / 2 };
    const led = { x: stripX(c) + (stripW - w) / 2, y: bodyY + (bodyH - tallyH) / 2 };
    K.set(g, grid);
    return { g, paths, grid, ledger: led, count };
  });

  // ---- counters: one per mark, in its colour, stacked in a column per
  // follower from the bottom up
  const cg = K.svg("g", {}, s);
  const counters = followers.map(([, count], c) =>
    Array.from({ length: count }, (_, k) => {
      const el = K.svg(
        "circle",
        {
          cx: 0,
          cy: 0,
          r: counterR,
          fill: palette[c].hex,
          stroke: "rgb(0 0 0 / 30%)",
          "stroke-width": 2,
        },
        cg,
      );
      const m = markAt(k, tallySp, tallyH);
      const from = { x: marks[c].ledger.x + m.x, y: marks[c].ledger.y + m.y };
      const to = { x: slotC(c), y: colBottom - counterR - k * counterGap };
      K.set(el, { x: from.x, y: from.y, opacity: 0, scale: 0.4, transformOrigin: "50% 50%" });
      return { el, from, to };
    }),
  );

  // ---- slips: one per pair, piled per follower
  const slips = followers.map(([w, count], c) =>
    Array.from({ length: count }, (_, k) => {
      const o = slip(dom, prefix, w, { size: slipSize });
      const j = window.KIT.jitter(c * 31 + k * 7);
      const jr = window.KIT.jitter(c * 17 + k * 13 + 5);
      o.pile = {
        x: slotC(c) - o.w / 2 + (j - 0.5) * 14,
        y: pileY - o.h / 2 - (k - (count - 1) / 2) * pileStep,
        rotation: (jr - 0.5) * 8,
      };
      o.from = counters[c][k].to;
      K.set(o.el, { x: o.from.x - o.w / 2, y: o.from.y - o.h / 2, scale: 0.3, opacity: 0 });
      return o;
    }),
  );

  // ---- numbers
  const numbers = followers.map(([, count], c) => {
    const el = K.el(
      "div",
      { class: "same-number", text: String(count), style: { fontSize: `${numberSize}px` } },
      dom,
    );
    const w = K.measure(String(count), `600 ${numberSize}px "Public Sans"`);
    const at = { x: slotC(c) - w / 2, y: pileY - numberSize * 0.5 };
    K.set(el, { ...at, opacity: 0, scale: 0.6 });
    return { el, w, h: numberSize, at, cx: slotC(c), cy: pileY };
  });

  return {
    el: root,
    svg: s,
    dom,
    x,
    y,
    W,
    H,
    n,
    prefix,
    followers,
    geom: { prefixW, slotW, headH, rowH, top, bot, formTop, colBottom, pileY, stripW },
    slotX,
    slotC,
    stripX,
    paperRow,
    paperHead,
    gridRules,
    ledger,
    plain,
    tints,
    rules,
    names,
    pre,
    words,
    marks,
    counters,
    slips,
    numbers,
    // the grid form's tallies draw on
    drawMarks: (tl, t, dur = 0.35, stagger = 0.06) =>
      marks.forEach((m, c) => K.drawOn(tl, m.paths, t + c * stagger * 2, dur, stagger)),
    // a point in the row, in the parent's coordinates (at the row's resting place)
    at: (px, py) => ({ x: x + px, y: y + py }),
    // the centre of mark k of follower c, in the parent's coordinates, in
    // the "grid" or "ledger" form
    markPos: (c, k, form = "grid") => {
      const m = markAt(k, tallySp, tallyH);
      return { x: x + marks[c][form].x + m.x, y: y + marks[c][form].y + m.y };
    },
  };
}

// ---- the steps between forms. `p` scales every duration (1 = the pace a
// line of voice-over gives the morph; the overview's quick run is faster).
const STEPS = {
  ledger(tl, R, t, p) {
    tl.to(R.paperHead, { opacity: 0 }, t + 0.3 * p, { dur: 0.35 * p }); // once the words are down in their cells
    tl.to(R.gridRules, { opacity: 0 }, t, { dur: 0.35 * p });
    tl.to(R.ledger, { opacity: 1 }, t + 0.15 * p, { dur: 0.4 * p });
    R.words.forEach((w, c) =>
      tl.to(w.g, w.ledger, t + c * 0.06 * p, { dur: 0.6 * p, ease: "in-out-cubic" }),
    );
    R.marks.forEach((m, c) =>
      tl.to(m.g, m.ledger, t + 0.1 * p + c * 0.06 * p, { dur: 0.6 * p, ease: "in-out-cubic" }),
    );
  },
  colour(tl, R, t, p) {
    tl.to(R.rules, { scaleX: 1 }, t, { dur: 0.45 * p, stagger: 0.14 * p, ease: "out-cubic" });
    tl.to(R.tints, { opacity: 1 }, t + 0.05 * p, { dur: 0.35 * p, stagger: 0.14 * p });
    tl.to(R.names, { opacity: 1 }, t + 0.2 * p, { dur: 0.3 * p, stagger: 0.14 * p });
  },
  counters(tl, R, t, p) {
    R.marks.forEach((m, c) => {
      const tc = t + c * 0.14 * p;
      tl.to(m.g, { opacity: 0 }, tc, { dur: 0.2 * p });
      R.counters[c].forEach((k, i) => {
        const ti = tc + i * 0.05 * p;
        tl.to(k.el, { opacity: 1, scale: 1 }, ti, { dur: 0.2 * p, ease: "out-cubic" });
        tl.to(k.el, { x: k.to.x, y: k.to.y }, ti + 0.12 * p, {
          dur: 0.55 * p,
          ease: "in-out-cubic",
        });
      });
    });
  },
  slips(tl, R, t, p) {
    R.slips.forEach((pile, c) =>
      pile.forEach((o, i) => {
        const ti = t + c * 0.12 * p + i * 0.05 * p;
        const k = R.counters[c][i];
        tl.to(k.el, { scaleY: 0.2, opacity: 0 }, ti, { dur: 0.22 * p, ease: "in-cubic" });
        tl.to(o.el, { opacity: 1 }, ti + 0.05 * p, { dur: 0.15 * p });
        tl.to(
          o.el,
          { x: o.pile.x, y: o.pile.y, scale: 1, rotation: o.pile.rotation },
          ti + 0.05 * p,
          { dur: 0.6 * p, ease: "in-out-cubic" },
        );
      }),
    );
  },
  numbers(tl, R, t, p) {
    R.slips.forEach((pile, c) => {
      const N = R.numbers[c];
      const tc = t + c * 0.1 * p;
      pile.forEach((o) =>
        tl.to(
          o.el,
          { x: N.cx - o.w / 2, y: N.cy - o.h / 2, scale: 0.35, rotation: 0, opacity: 0 },
          tc,
          { dur: 0.35 * p, ease: "in-cubic" },
        ),
      );
      tl.to(N.el, { opacity: 1, scale: 1 }, tc + 0.22 * p, { dur: 0.4 * p, ease: "out-back(1.4)" });
    });
  },
};

// Straight from marks to slips, skipping the counters (the walk's "the" row
// as nineteen slips): each mark's slip rises from it and goes to its pile.
export function slipsFromMarks(tl, R, t, { pace: p = 1, form = "ledger" } = {}) {
  R.marks.forEach((m, c) => tl.to(m.g, { opacity: 0 }, t + c * 0.12 * p, { dur: 0.25 * p }));
  R.slips.forEach((pile, c) =>
    pile.forEach((o, i) => {
      const ti = t + c * 0.12 * p + i * 0.05 * p;
      const from = R.markPos(c, i, form);
      tl.set(
        o.el,
        { x: from.x - R.x - o.w / 2, y: from.y - R.y - o.h / 2, scale: 0.3 },
        ti - 0.002,
      );
      tl.to(o.el, { opacity: 1 }, ti, { dur: 0.15 * p });
      tl.to(o.el, { x: o.pile.x, y: o.pile.y, scale: 1, rotation: o.pile.rotation }, ti, {
        dur: 0.6 * p,
        ease: "in-out-cubic",
      });
    }),
  );
}

// Run the morph: each form arrives at its cue (absolute seconds). A missing
// cue skips nothing: the forms must go in order, so every cue is required
// from the first given to the last.
export function morph(tl, R, cues, { pace = 1 } = {}) {
  for (const f of FORMS.slice(1)) if (cues[f] != null) STEPS[f](tl, R, cues[f], pace);
}

// The whole morph inside [t0, t0 + dur]: the tallies draw on, then each form
// in turn, evenly spaced, each holding a beat before the next.
export function quick(tl, R, t0, dur = 4) {
  const step = dur / FORMS.length;
  const pace = Math.min(1, step / 1.1);
  R.drawMarks(tl, t0, 0.3 * pace, 0.04 * pace);
  const cues = {};
  FORMS.slice(1).forEach((f, i) => (cues[f] = t0 + (i + 1) * step));
  morph(tl, R, cues, { pace });
  return cues;
}

// Cut to a form at t (the row is usually hidden then): every step up to it,
// instantly.
export function jump(tl, R, form, t) {
  const upto = FORMS.indexOf(form);
  if (upto < 0) throw new Error(`no form ${form}`);
  window.KIT.drawOn(
    tl,
    R.marks.flatMap((m) => m.paths),
    t,
    0.01,
    0,
  );
  FORMS.slice(1, upto + 1).forEach((f, i) => STEPS[f](tl, R, t + 0.001 * (i + 1), 0.001));
}

export { FORMS };
