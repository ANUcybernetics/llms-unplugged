// The tree of everything a model could write: every path its counts allow from
// a root word, DEPTH words deep, drawn on a canvas as a pure function of t, each
// branch as thick as it is likely. Extracted from ../prototype-tree/ (the look
// Ben reviewed and kept).
//
// Used by generation-grid, generation-ledger and generation-cutouts (the whole
// tree grows, then the walk lights gold through it), making-things-up (recolour
// the branches with `colour`, rank complete sentences with `sentences`) and
// overview (compressed: a smaller `box`, no labels, one path lit).
//
//   import { tree, walkWords, samplePaths } from "./parts/tree.js";
//   const T3 = tree(tl, scene, { rows: MAGPIE.rows, box, grow: [t0, t1],
//     dim: { t, to: 0.35 }, paths: [{ words: WALK, colour: GOLD, t0, step }] });
//
// `rows` is { word: [[next, count], ...] } (window.MAGPIE.rows). Everything
// lands at the absolute times the caller passes in.

import * as C from "../kit/motion/canvas.js";

const L = (a, b, s) => a + (b - a) * s;
export const GOLD = [229, 169, 48]; // --gold-2, the walk's colour on the desk
const WHITE = [255, 255, 255];

// a row's followers with probabilities, the likeliest in the middle and the
// rest alternating outwards, so the tree's bold paths run through its middle
// and the rare ones fan to the edges
const followersOf = (rows) => (w) => {
  const row = rows[w] ?? [];
  const total = row.reduce((s, [, n]) => s + n, 0);
  const byCount = row
    .map(([word, n], i) => ({ word, p: n / total, i }))
    .sort((a, b) => b.p - a.p || a.i - b.i);
  const out = [];
  byCount.forEach((f, k) => (k % 2 ? out.unshift(f) : out.push(f)));
  return out;
};

// a branch is a cubic with level tangents from its parent to its node; drawn up
// to the growth front, it is split at the parameter s where its x reaches the
// front (x(s) = 1.5s - 1.5s^2 + s^3 of the step)
const sAt = (f) => {
  let s = f;
  for (let i = 0; i < 6; i++) s -= (1.5 * s - 1.5 * s * s + s ** 3 - f) / (1.5 - 3 * s + 3 * s * s);
  return Math.max(0, Math.min(1, s));
};
const branch = (ctx, n, s) => {
  const xa = n.parent.x,
    xb = n.x,
    ya = n.parent.y,
    yb = n.y;
  const p1x = (xa + xb) / 2,
    p2x = p1x;
  ctx.moveTo(xa, ya);
  if (s >= 1) return ctx.bezierCurveTo(p1x, ya, p2x, yb, xb, yb);
  // de Casteljau: the first part of the curve, up to s
  const q1x = L(xa, p1x, s),
    q1y = ya;
  const rx = L(p1x, p2x, s),
    ry = L(ya, yb, s);
  const q2x = L(q1x, rx, s),
    q2y = L(q1y, ry, s);
  const ux = L(rx, L(p2x, xb, s), s),
    uy = L(ry, yb, s);
  ctx.bezierCurveTo(q1x, q1y, q2x, q2y, L(q2x, ux, s), L(q2y, uy, s));
};

// Build and draw the tree. Options:
//   rows, root (".")           the model and the word every path starts from
//   depth (12)                 words deep
//   box { x0, x1, y0, y1 }     the root sits at x0; leaves share y0..y1
//   grow [t0, t1], growEase    the front sweeps left to right over [t0, t1]
//   dim { t, dur, to }         the whole tree dims (for a lit path to read)
//   colour (node) => [r,g,b]   a branch's colour (white); node.parent chains to
//                              the root, so a colour can depend on the path
//   paths [{ words, colour, width, t0, step, out }]
//                              lit overlays, each drawn word by word from t0,
//                              `step` s a word; `out` fades it (the walk's gold
//                              stays unless given one)
//   seed (167)                 the seeded x stagger of the deep junctions
//   canvasBox { x, y, w, h }   the canvas's extent in the parent (the scene)
//   width, ink                 branch width by p, and the ink gain (the look)
export function tree(tl, parent, opts) {
  const {
    rows,
    root: rootWord = ".",
    depth: DEPTH = 12,
    box,
    grow,
    growEase = "in-out-quad",
    dim = null,
    colour = () => WHITE,
    paths = [],
    seed = 167,
    canvasBox,
    width = (p) => 0.4 + 11 * Math.sqrt(p),
    ink: INK = 15,
  } = opts;
  const { x0: X0, x1: X1, y0: Y0, y1: Y1 } = box;
  const DX = (X1 - X0) / DEPTH;
  const colX = (d) => X0 + d * DX;
  const followers = followersOf(rows);

  // ---- every path from the root DEPTH words deep, one node per prefix.
  // Leaves share the height evenly; a node sits at the middle of its leaves.
  const nodes = []; // { word, depth, parent, p, leaf0, leaves, kids, x, y }
  let leafCount = 0;
  const growNode = (word, d, parentNode, p) => {
    const n = { word, depth: d, parent: parentNode, p, leaf0: leafCount, leaves: 0, kids: [] };
    nodes.push(n);
    if (d === DEPTH || !rows[word]?.length) leafCount++;
    else for (const f of followers(word)) n.kids.push(growNode(f.word, d + 1, n, p * f.p));
    n.leaves = leafCount - n.leaf0;
    return n;
  };
  const root = growNode(rootWord, 0, null, 1);
  const LH = (Y1 - Y0) / leafCount;
  for (const n of nodes) n.y = Y0 + (n.leaf0 + n.leaves / 2) * LH;
  // past the walk's last word, nodes stagger a little in x (seeded), so the
  // thousands of junctions don't line up into vertical seams
  const r = C.rng(seed);
  for (const n of nodes)
    n.x = colX(n.depth) + (n.depth > 6 && n.depth < DEPTH ? (r() - 0.5) * 0.6 * DX : 0);

  // the node at the end of a path of words from the root (words[0] is the root)
  const pathNodes = (words) => {
    const out = [root];
    for (const w of words.slice(1)) {
      const k = out.at(-1).kids.find((c) => c.word === w);
      if (!k) throw new Error(`the tree has no path ${words.join(" ")}`);
      out.push(k);
    }
    return out;
  };

  // ---- the growth front, and when it reaches x (for labels and cues)
  const frontX = (t) => X0 + (X1 - X0 + 2) * C.phase(t, grow[0], grow[1] - grow[0], growEase);
  const tAt = (x) => {
    let a = grow[0],
      b = grow[1];
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      frontX(m) < x ? (a = m) : (b = m);
    }
    return b;
  };

  // ---- branch style: each branch is as thick as it is likely, and its ink
  // (opacity times width) is its probability times a gain that grows smoothly
  // left to right. Probability is conserved at every node (the branches
  // leaving it add up to the one arriving), so the ink does not step at a
  // column edge; the gain keeps the deep columns' thousands of hairlines
  // visible, and fades the last column out. The opacity rides a gradient along
  // x, and branches are grouped into buckets (colour, width, ink) so a frame
  // strokes a few hundred paths, not ten thousand.
  const GAIN = Math.log(12) / DEPTH;
  const gain = (x) => {
    const d = (x - X0) / DX;
    return Math.exp(GAIN * d) * (d > DEPTH - 1 ? 1 - 0.8 * (d - DEPTH + 1) : 1);
  };
  const q = (a) => +Math.exp(Math.round(Math.log(a) * 32) / 32).toFixed(5);
  const STOPS = Array.from({ length: 4 * DEPTH + 1 }, (_, i) => i / (4 * DEPTH));
  const buckets = new Map();
  for (const n of nodes) {
    if (!n.parent) continue;
    const w = +width(n.p).toFixed(2);
    const k = q((INK * n.p) / w); // opacity per unit of gain
    const rgb = colour(n).join(" ");
    const key = `${rgb}|${w}|${k}`;
    if (!buckets.has(key))
      buckets.set(key, {
        rgb,
        w,
        stops: STOPS.map((f) => Math.min(0.95, k * gain(L(X0, X1, f)))),
        nodes: [],
      });
    buckets.get(key).nodes.push(n);
  }
  const styles = [...buckets.values()].sort((a, b) => a.w - b.w);
  const lit = paths.map((P) => ({ ...P, nodes: pathNodes(P.words) }));

  const cb = canvasBox ?? { x: 0, y: 0, w: parent.offsetWidth, h: parent.offsetHeight };
  const layer = C.canvas(
    tl,
    parent,
    (ctx, t) => {
      ctx.translate(-cb.x, -cb.y);
      const fx = frontX(t);
      if (fx > X0) {
        // how far along each branch the front has reached
        const sOf = (n) =>
          fx >= n.x ? 1 : fx <= n.parent.x ? 0 : sAt((fx - n.parent.x) / (n.x - n.parent.x));
        ctx.globalAlpha = dim
          ? 1 - (1 - dim.to) * C.phase(t, dim.t, dim.dur ?? 0.8, "in-out-quad")
          : 1;
        for (const st of styles) {
          const g = ctx.createLinearGradient(X0, 0, X1, 0);
          STOPS.forEach((f, i) => g.addColorStop(f, `rgb(${st.rgb} / ${st.stops[i].toFixed(4)})`));
          ctx.strokeStyle = g;
          ctx.lineWidth = st.w;
          ctx.beginPath();
          for (const n of st.nodes) {
            const s = sOf(n);
            if (s > 0) branch(ctx, n, s);
          }
          ctx.stroke();
        }
      }
      // the lit paths, one word at a time
      ctx.lineCap = "round";
      for (const P of lit) {
        const a = P.out ? 1 - C.phase(t, P.out, P.outDur ?? 0.4, "in-quad") : 1;
        if (t < P.t0 || a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.strokeStyle = `rgb(${(P.colour ?? GOLD).join(" ")})`;
        ctx.lineWidth = P.width ?? 5;
        ctx.beginPath();
        for (let k = 1; k < P.nodes.length; k++) {
          const s = C.phase(t, P.t0 + (k - 1) * P.step, P.step * 0.7, "in-out-quad");
          if (s > 0) branch(ctx, P.nodes[k], sAt(s));
        }
        ctx.stroke();
      }
    },
    cb,
  );

  // complete sentences: paths from the root to the first `ends` word, with
  // their probabilities, likeliest first (making-things-up ranks these)
  const sentences = (ends = [".", "!"]) => {
    const out = [];
    for (const n of nodes) {
      if (!n.parent || !ends.includes(n.word)) continue;
      const words = [];
      let m = n,
        clean = true;
      while (m) {
        words.unshift(m.word);
        m = m.parent;
        if (m?.parent && ends.includes(m.word)) clean = false;
      }
      if (clean) out.push({ words, p: n.p, node: n });
    }
    return out.sort((a, b) => b.p - a.p);
  };

  return {
    el: layer.el,
    nodes,
    root,
    leaves: leafCount,
    pathNodes,
    tAt,
    frontX,
    colX,
    sentences,
    box,
    DEPTH,
  };
}

// Word labels on the tree, for depths [from, to]: each appears as the front
// reaches it. Returns Map(node -> element); the caller dims or hides them.
export function labels(tl, parent, T3, { from = 1, to = 3, cls = "tree-word" } = {}) {
  const out = new Map();
  for (const n of T3.nodes) {
    if (n.depth < from || n.depth > to) continue;
    const e = word(parent, n.word, cls);
    centreAt(e, T3.colX(n.depth), n.y);
    M_set(e, { opacity: 0 });
    tl.to(e, { opacity: 1 }, T3.tAt(T3.colX(n.depth) - 8), { dur: 0.3 });
    out.set(n, e);
  }
  return out;
}

// The walk's words: a column at the left edge (arriving from `from`, the
// words' places on the strip of paper, when given), the root word moves to the
// root, and each word flies from the column onto its node as the gold path
// reaches it, and lights. Words sit on the desk as white type; a punctuation
// word is a symbol tile.
//   times: { col, root, walk, step } (walk and step as the gold path's t0, step)
export function walkWords(
  tl,
  parent,
  T3,
  words,
  { from, colX, gap = 64, times, labels: lab, lit = "tree-word lit", col = "tree-word col" },
) {
  const path = T3.pathNodes(words);
  const midY = (T3.box.y0 + T3.box.y1) / 2;
  const colTop = midY - ((words.length - 1) * gap) / 2;
  const column = words.map((w, i) => {
    const el = word(parent, w, col);
    const to = { x: colX - el.offsetWidth / 2, y: colTop + i * gap - el.offsetHeight / 2 };
    if (from) {
      const f = from[i];
      M_set(el, { x: f.x - el.offsetWidth / 2, y: f.y - el.offsetHeight / 2, opacity: 0 });
      tl.to(el, { opacity: 1 }, times.col, { dur: 0.25 });
      tl.to(el, to, times.col + 0.1 + i * 0.05, { dur: 0.6, ease: "in-out-cubic" });
    } else {
      M_set(el, { ...to, opacity: 0 });
      tl.to(el, { opacity: 1 }, times.col, { dur: 0.3 });
    }
    return el;
  });
  // the first word becomes the root
  const rootEl = column[0];
  tl.to(column.slice(1), { opacity: 0.4 }, times.root - 0.2, { dur: 0.4 });
  tl.to(
    rootEl,
    { x: T3.colX(0) - rootEl.offsetWidth / 2 - 18, y: path[0].y - rootEl.offsetHeight / 2 },
    times.root,
    { dur: 0.7, ease: "in-out-cubic" },
  );
  tl.to(rootEl, { color: `rgb(${GOLD.join(" ")})` }, times.walk - 0.3, { dur: 0.3 });
  const litEls = [];
  path.slice(1).forEach((n, i) => {
    const el = column[i + 1];
    const t = times.walk + i * times.step + times.step * 0.35;
    const l = word(parent, n.word, lit);
    centreAt(l, n.x, n.y);
    M_set(l, { opacity: 0 });
    const to = {
      x: M_get(l, "x") + (l.offsetWidth - el.offsetWidth) / 2,
      y: M_get(l, "y") + (l.offsetHeight - el.offsetHeight) / 2,
    };
    const fly = Math.min(0.45, times.step * 1.2);
    tl.to(el, { ...to, scale: 0.75, opacity: 1 }, t - fly + 0.3, {
      dur: fly,
      ease: "in-out-cubic",
    });
    tl.to(el, { opacity: 0 }, t + 0.3, { dur: 0.15 });
    tl.to(l, { opacity: 1 }, t + 0.2, { dur: 0.2 });
    if (lab?.has(n)) tl.to(lab.get(n), { opacity: 0 }, t + 0.2, { dur: 0.2 });
    litEls.push(l);
  });
  return { column, rootEl, lit: litEls, all: [...column, ...litEls] };
}

// Paths the model could take instead: `n` walks sampled from the counts
// (seeded), each `len` words or to the first full stop, all different from
// `avoid` and from each other. For "every roll picks a different path".
export function samplePaths(
  rows,
  { root = ".", n = 3, len = 12, seed = 7, avoid = [], ends = [".", "!"] } = {},
) {
  const r = C.rng(seed);
  const seen = new Set([avoid.join(" ")]);
  const out = [];
  for (let tries = 0; out.length < n && tries < 500; tries++) {
    const w = [root];
    while (w.length <= len) {
      const row = rows[w.at(-1)];
      if (!row?.length) break;
      const total = row.reduce((s, [, c]) => s + c, 0);
      let x = r() * total;
      const next = row.find(([, c]) => (x -= c) < 0)[0];
      w.push(next);
      if (ends.includes(next) && w.length > 3) break;
    }
    const key = w.join(" ");
    if (!seen.has(key)) (seen.add(key), out.push(w));
  }
  return out;
}

// ---- small DOM helpers (the kit's, reached through window.KIT at call time)
const M_set = (...a) => window.KIT.set(...a);
const M_get = (...a) => window.KIT.get(...a);
function word(parent, text, cls) {
  const K = window.KIT;
  const punct = K.isPunct(text);
  const e = K.el(
    "div",
    { class: `${cls}${punct ? " punct" : ""}`, ...(punct ? {} : { text }) },
    parent,
  );
  if (punct) K.punctTile(e, text, { fill: "var(--desk)" });
  return e;
}
function centreAt(el, x, y) {
  M_set(el, { x: x - el.offsetWidth / 2, y: y - el.offsetHeight / 2 });
}

// The words' look, shared by every video that draws the tree (insert once).
export const TREE_CSS = `
.tree-word {
  position: absolute; left: 0; top: 0; transform-origin: 50% 50%;
  font-family: var(--font-tok); font-size: 30px; line-height: 1; white-space: nowrap;
  color: var(--text-2); background: var(--desk); padding: 4px 8px 7px; border-radius: 6px;
}
.tree-word.punct { padding: 4px; }
.tree-word.col { font-size: 40px; color: var(--text); background: none; }
.tree-word.lit { color: var(--gold-2); font-weight: 700; }
`;
export const treeStyle = () => {
  const s = document.createElement("style");
  s.textContent = TREE_CSS;
  document.head.appendChild(s);
};
