// The book at machine speed: a bracket runs along a strip of word tiles,
// accelerating until it's a blur, and every pair it passes flies into the
// model (a grid box, a ledger box) as a gold spark that lands as a tally.
// The strip scrolls under the bracket once it reaches its anchor, so a whole
// book streams past a fixed window.
//
// Used by `training-grid` and `training-ledger` (the rest of The magpie in
// about two seconds) and meant for `overview` (the book streaming into a grid
// at machine speed, compressed): the caller gives the time window and says
// where each pair lands (`target`) and what landing does (`land`), so the
// same stream feeds a grid, ledger sheets or anything else.
//
//   const br = bracket(scene, { h: strip.size });   // stretches without thickening
//   const run = streamPairs(tl, scene, {
//     strip, bracket, pairs, t0, dur,
//     target: (p) => ({ x, y }),       // where pair p lands, in scene px
//     land: (p, t) => { … },           // its tally, headers, …, at time t
//   });
//
// Everything is scheduled on the timeline at build time (only the timeline
// decides a frame); nothing here keeps state between frames.

import { clamp, ease as easeFn, get, hash, lerp } from "../kit/motion/motion.js";

// The times at which a bracket moving with `ease` reaches each of n pairs in
// [t0, t0 + dur]: pair k is reached when the eased progress is k / (n - 1).
export function pairTimes(n, t0, dur, ease = "in-out-quad") {
  const f = easeFn(ease);
  const inv = (v) => {
    let a = 0,
      b = 1;
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      f(m) < v ? (a = m) : (b = m);
    }
    return (a + b) / 2;
  };
  return Array.from({ length: n }, (_, k) => t0 + dur * inv(n > 1 ? k / (n - 1) : 1));
}

// The bracket's box over tiles i and i + 1 of a K.tiles strip, in the strip's
// own coordinates.
export const pairBox = (strip, i) => {
  const A = strip.tiles[i],
    B = strip.tiles[i + 1];
  return { x: A.x, y: A.y, w: B.x + B.w - A.x, h: A.h };
};

// Where the strip sits (its x) so the pair at token i is at `anchor` on the
// stage, never scrolling back past `x0` (the strip's resting x).
export const stripXFor = (strip, i, anchor, x0) => {
  const b = pairBox(strip, i);
  return Math.min(x0, anchor - (b.x + b.w / 2));
};

// The bracket: a gold rounded box that stretches to any width without its
// border stretching with it (a K.ring scaled wide thickens its sides). Two
// end caps and a top and bottom rule; `at(box)` gives each part's properties
// for a box in its parent's px, to set, tween or sample.
export function bracket(parent, { h, pad = 10, stroke = 5, colour = "var(--gold)", cap = 36 } = {}) {
  const H = h + 2 * pad;
  const g = KIT.layer(parent, 0, 0);
  const part = (style) => KIT.el("div", { style: { position: "absolute", left: 0, top: 0, ...style } }, g);
  const edge = `${stroke}px solid ${colour}`;
  const L = part({ width: `${cap}px`, height: `${H}px`, borderLeft: edge, borderTop: edge, borderBottom: edge, borderRadius: "12px 0 0 12px" });
  const R = part({ width: `${cap}px`, height: `${H}px`, borderRight: edge, borderTop: edge, borderBottom: edge, borderRadius: "0 12px 12px 0" });
  const T = part({ width: "100px", height: `${stroke}px`, background: colour });
  const B = part({ width: "100px", height: `${stroke}px`, background: colour, top: `${H - stroke}px` });
  KIT.set([T, B], { x: cap, transformOrigin: "0 0" });
  KIT.set(g, { opacity: 0 });
  const at = (box) => {
    const w = Math.max(2 * cap + 2, box.w + 2 * pad);
    return [
      [g, { x: box.x - pad, y: box.y + box.h / 2 - H / 2 }],
      [R, { x: w - cap }],
      [T, { scaleX: (w - 2 * cap) / 100 }],
      [B, { scaleX: (w - 2 * cap) / 100 }],
    ];
  };
  return { el: g, parts: { L, R, T, B }, h, pad, at };
}
// place, or move, a bracket around a box
export const bracketSet = (tl, br, box, t) => br.at(box).forEach(([el, p]) => tl.set(el, p, t));
export const bracketTo = (tl, br, box, t, dur = 0.45, ease = "in-out-cubic") =>
  br.at(box).forEach(([el, p]) => tl.to(el, p, t, { dur, ease }));

// Step the bracket to the pair at token i with an eased move, scrolling the
// strip when the pair is past the anchor: the walkthrough's move. Returns the
// strip's x after the move (the caller keeps it for the next one).
export function stepTo(tl, { strip, bracket, i, t, dur = 0.5, anchor, x0, stripX }) {
  const sx = stripXFor(strip, i, anchor, x0);
  const b = pairBox(strip, i),
    y0 = get(strip.el, "y");
  if (sx !== stripX) tl.to(strip.el, { x: sx }, t, { dur, ease: "in-out-cubic" });
  bracketTo(tl, bracket, { ...b, x: sx + b.x, y: y0 + b.y }, t, dur);
  return sx;
}

// Run the bracket over `pairs` (each { i, … }: the pair of tokens i, i + 1)
// from t0 to t0 + dur, accelerating with `ease`, the strip scrolling under it
// past `anchor`. Each pair not `skip`ped sends a spark from the bracket to
// `target(p)` (stage px) and calls `land(p, t)` when it arrives. Returns the
// times each pair is reached and lands, and the strip's final x.
export function streamPairs(
  tl,
  parent,
  {
    strip,
    bracket,
    pairs,
    t0,
    dur,
    ease = "in-out-quad",
    anchor = 960,
    x0 = get(strip.el, "x"),
    target,
    land,
    skip = () => false,
    flight = 0.38,
    spark = 16,
    colour = "var(--gold-2)",
  },
) {
  const n = pairs.length;
  const times = pairTimes(n, t0, dur, ease);
  const y0 = get(strip.el, "y");
  // the bracket and strip, sampled along the run: fractional progress u
  // interpolates between the pairs' boxes
  const at = (u) => {
    const k = clamp(u, 0, n - 1),
      a = Math.floor(k),
      b = Math.min(n - 1, a + 1),
      f = k - a;
    const A = pairBox(strip, pairs[a].i),
      B = pairBox(strip, pairs[b].i);
    const box = { x: lerp(A.x, B.x, f), y: A.y, w: lerp(A.w, B.w, f), h: A.h };
    const sx = Math.min(x0, anchor - (box.x + box.w / 2));
    return { box, sx };
  };
  const f = easeFn(ease);
  const u = (p) => f(p) * (n - 1);
  tl.sample(strip.el, t0, dur, (p) => ({ x: at(u(p)).sx }), { ease: "linear", step: 0.004 });
  const parts = bracket.at({ x: 0, y: 0, w: 0, h: 0 }).map(([el]) => el);
  parts.forEach((el, j) =>
    tl.sample(
      el,
      t0,
      dur,
      (p) => {
        const { box, sx } = at(u(p));
        return bracket.at({ ...box, x: sx + box.x, y: y0 + box.y })[j][1];
      },
      { ease: "linear", step: 0.004 },
    ),
  );
  // sparks: one per pair, from the bracket's centre where it is when the
  // pair is reached, arcing a little (deterministic jitter) to its target
  const lands = [];
  pairs.forEach((p, k) => {
    const t = times[k];
    lands.push(t + flight);
    if (skip(p)) return;
    const { box, sx } = at(k);
    const from = { x: sx + box.x + box.w / 2, y: y0 + box.y + box.h };
    const to = target(p);
    const s = KIT.el(
      "div",
      {
        style: {
          position: "absolute",
          left: `${-spark / 2}px`,
          top: `${-spark / 2}px`,
          width: `${spark}px`,
          height: `${spark}px`,
          borderRadius: "50%",
          background: colour,
          boxShadow: "0 0 0 3px rgb(190 131 14 / 30%)",
        },
      },
      parent,
    );
    KIT.set(s, { x: from.x, y: from.y, opacity: 0 });
    const bend = (hash(k) - 0.5) * 120;
    tl.set(s, { opacity: 1 }, t);
    tl.sample(
      s,
      t,
      flight,
      (q) => ({
        x: lerp(from.x, to.x, q) + bend * Math.sin(Math.PI * q),
        y: lerp(from.y, to.y, q),
        scale: 1 - 0.4 * q,
      }),
      { ease: "in-out-quad", step: 0.1 },
    );
    tl.to(s, { opacity: 0 }, t + flight - 0.02, { dur: 0.08 });
    land(p, t + flight);
  });
  return { times, lands, end: t0 + dur + flight, stripX: at(n - 1).sx };
}

// The lander for a kit grid (K.grid): a new word's headers appear on both
// edges, the box flashes gold and its next tally stroke draws on (the
// caller hides the grid's strokes to begin with; see the note inside). `seen` is a
// Set of the vocab indices already on the edges, updated as words land.
export function gridLander(tl, grid, { seen, flash = 0.25, draw = 0.12 } = {}) {
  return (p, t) => {
    for (const w of [p.r, p.c]) {
      if (seen.has(w)) continue;
      seen.add(w);
      tl.to([grid.rowHead[w], grid.colHead[w]], { opacity: 1 }, t, { dur: 0.15 });
    }
    const cell = grid.cells[p.r][p.c],
      stroke = cell.strokes[p.nth - 1];
    // strokes wait hidden: a round cap shows as a dot before its draw-on
    tl.set(stroke, { opacity: 1 }, t);
    KIT.drawOn(tl, [stroke], t, draw, 0);
    if (flash) {
      tl.to(grid.rowBands[p.r], { opacity: 0.8 }, t, { dur: 0.04 });
      tl.to(grid.rowBands[p.r], { opacity: 0 }, t + 0.04, { dur: flash });
    }
  };
}
