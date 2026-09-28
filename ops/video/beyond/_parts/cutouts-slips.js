// The magpie's cutouts on the desk: one slip per pair of the book (132 of
// them), each drawn by morph.js's slip() to match the printed set (the
// previous word boxed in its token colour, the next word bold in its own), with
// a gold outline to light it and the layouts that move them around: a spread
// across the desk, a loose row, piles by next word, a chain end to end.
//
// Used by generation-cutouts (the walk, the domino chain and the hand-off).
//
//   import { cutouts, spread, row, piles, heap, tokenBox } from "./parts/cutouts-slips.js";
//   const C = cutouts(scene, MAGPIE, { size: 44, last: (p) => … });
//   const FULL = spread(C.slips, { x0, x1, y0, y1, cols: 12, rows: 11, scale: 0.5 });
//   K.set(C.slips[k].el, FULL[k]);
//
// A place is { x, y, scale, rotation } for the slip's element (x, y its top
// left before scaling about its centre), so `tl.to(o.el, place, t)` moves it.
//
// The printed cutouts (`llms_unplugged cutouts`) keep the corpus's casing,
// canonicalised: a word that ever appears in lower case prints in lower case
// ("It" is "it"), one that never does keeps its capital ("Here", "Down",
// "Swoop"). The colour hash runs on that printed form, so the slips here do
// too. The printed set also has one context-free slip, the book's first word
// with no box; it isn't a pair, so it isn't drawn.

import { slip } from "./morph.js";

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const s = document.createElement("style");
  s.textContent = `
    .cut-lit {
      position: absolute; inset: -9px; border: 8px solid var(--gold); border-radius: 10px;
      box-shadow: 0 0 0 5px rgb(190 131 14 / 25%);
    }
    .same-slip .tok { display: inline-block; transform-origin: 50% 50%; }
  `;
  document.head.append(s);
}

// the printed form of each lowercased word
export function canonOf(tokens) {
  const lower = new Set(tokens.filter((t) => t === t.toLowerCase()));
  const form = new Map();
  for (const t of tokens) {
    const k = t.toLowerCase();
    if (!form.has(k)) form.set(k, lower.has(k) ? k : t);
  }
  return (w) => form.get(w) ?? w;
}

// Every pair of the book as a slip. `last(pair)` puts those slips last in the
// DOM, so they pass over the rest when lifted across the spread.
export function cutouts(parent, MG, { size = 44, last = () => false } = {}) {
  const K = window.KIT;
  style();
  const canon = canonOf(MG.tokens);
  const pairs = [];
  for (let i = 1; i < MG.words.length; i++) {
    const a = MG.words[i - 1],
      b = MG.words[i];
    pairs.push({ i, a, b, A: canon(a), B: canon(b) });
  }
  const order = [...pairs.filter((p) => !last(p)), ...pairs.filter(last)];
  const built = new Map();
  for (const p of order) {
    const o = slip(parent, p.A, p.B, { size });
    const lit = K.el("div", { class: "cut-lit" }, o.el);
    K.set(lit, { opacity: 0 });
    const [prevTok, nextTok] = o.front.children;
    built.set(p.i, { ...p, ...o, lit, prevTok, nextTok });
  }
  // back in book order: slips[k] is pair k + 1
  const slips = pairs.map((p) => built.get(p.i));
  slips.forEach((o, k) => (o.k = k));
  // the slips for a pair (either word may be left out), in book order
  const of = (a, b) => slips.filter((o) => (a == null || o.a === a) && (b == null || o.b === b));
  return { slips, of, canon };
}

const place = (o, cx, cy, scale, rotation = 0) => ({
  x: cx - o.w / 2,
  y: cy - o.h / 2,
  scale,
  rotation,
});

// A loose spread: each slip gets a cell of a cols x rows grid (a seeded
// shuffle), jittered and turned a little, as slips land when tipped out.
// The same seed gives the same cells at any size, so a spread can shrink
// into a corner of the desk and every slip keeps its neighbours.
export function spread(
  slips,
  { x0, x1, y0, y1, cols, rows, scale, jx = 20, jy = 10, rot = 6, seed = 1 },
) {
  const K = window.KIT;
  const cells = slips
    .map((_, k) => k)
    .sort((a, b) => K.jitter(a * 7 + seed) - K.jitter(b * 7 + seed));
  const cw = (x1 - x0) / cols,
    ch = (y1 - y0) / rows;
  const out = [];
  cells.forEach((k, s) => {
    const o = slips[k];
    const cx = x0 + ((s % cols) + 0.5) * cw + (K.jitter(k * 13 + 1) - 0.5) * jx;
    const cy = y0 + (Math.floor(s / cols) + 0.5) * ch + (K.jitter(k * 17 + 2) - 0.5) * jy;
    out[k] = place(o, cx, cy, scale, (K.jitter(k * 11 + 3) - 0.5) * rot * 2);
  });
  return out;
}

// slips side by side, centred on (cx, cy), each turned a touch
export function row(list, { cx, cy, scale, gap = 16, rot = 3 }) {
  const K = window.KIT;
  const total = list.reduce((s, o) => s + o.w * scale, 0) + gap * (list.length - 1);
  let x = cx - total / 2;
  return list.map((o) => {
    const p = place(o, x + (o.w * scale) / 2, cy, scale, (K.jitter(o.k * 5 + 9) - 0.5) * rot * 2);
    x += o.w * scale + gap;
    return p;
  });
}

// one pile per group (a list of slips), side by side and centred on (cx, cy);
// each slip sits `step` above the one under it, so a pile shows its count
export function piles(groups, { cx, cy, scale, gap = 60, step = 11, rot = 3 }) {
  const K = window.KIT;
  const widths = groups.map((g) => Math.max(...g.map((o) => o.w)) * scale);
  const total = widths.reduce((s, v) => s + v, 0) + gap * (groups.length - 1);
  let x = cx - total / 2;
  return groups.map((g, i) => {
    const gx = x + widths[i] / 2;
    x += widths[i] + gap;
    return g.map((o, j) =>
      place(
        o,
        gx + (K.jitter(o.k * 3 + 4) - 0.5) * 10,
        cy - (j - (g.length - 1) / 2) * step,
        scale,
        (K.jitter(o.k * 7 + 6) - 0.5) * rot * 2,
      ),
    );
  });
}

// every slip in one loose heap on (cx, cy), shuffled: `mix` picks a different
// scatter for each shuffle of the same heap
export function heap(list, { cx, cy, scale, spreadX = 26, spreadY = 12, rot = 9, mix = 0 }) {
  const K = window.KIT;
  return list.map((o) =>
    place(
      o,
      cx + (K.jitter(o.k * 19 + mix * 101) - 0.5) * spreadX * 2,
      cy + (K.jitter(o.k * 23 + mix * 103) - 0.5) * spreadY * 2,
      scale,
      (K.jitter(o.k * 29 + mix * 107) - 0.5) * rot * 2,
    ),
  );
}

// the slip at the centre (cx, cy), square to the camera
export const at = (o, cx, cy, scale) => place(o, cx, cy, scale, 0);

// a slip's token (0: the box, 1: the next word) as a box in the parent's
// coordinates, for the slip at an unrotated place
export function tokenBox(o, p, which) {
  const t = which ? o.nextTok : o.prevTok;
  const cx = p.x + o.w / 2,
    cy = p.y + o.h / 2;
  return {
    x: cx + (t.offsetLeft - o.w / 2) * p.scale,
    y: cy + (t.offsetTop - o.h / 2) * p.scale,
    w: t.offsetWidth * p.scale,
    h: t.offsetHeight * p.scale,
  };
}
