// The sentence tree and the mesh, for making-things-up.
//
// `sentenceTree` wraps ./tree.js (unchanged) into the tree of every sentence
// the magpie can write: from a full stop to the first full stop or exclamation
// mark, at most `maxLen` words and marks. tree.js grows every path to a fixed
// depth, straight through a sentence's end, so the wrapper
//   - roots the tree at a stand-in word "^" whose followers are the full
//     stop's, and gives "." and "!" no followers, so a sentence's end is a
//     leaf;
//   - prunes what never ends within maxLen: those nodes collapse onto their
//     last live ancestor (a zero-length branch draws nothing), and the live
//     leaves are re-spread evenly down the box. This leans on tree.js reading
//     each node's x and y when it draws, not when it builds, so every branch
//     keeps its true probability (a pruned row is not renormalised).
// Depth is maxLen + 1, so tree.js's fade on its last column falls past the
// longest sentence rather than on it.
//
// `mesh` is the pull-back: copies of the tree's shape tiled outward from it,
// under a logarithmic zoom, each branch turning one of two colours at its own
// seeded time. It is illustrative, not measured (the reads note in
// scripts/making-things-up.md): the split is a fixed seeded fraction, and the
// composition draws no axis, number or legend with it.

import * as C from "../kit/motion/canvas.js";
import { tree } from "./tree.js";

export const ROOT = "^";
const ENDS = [".", "!"];

// the book's own sentences, as lowercased token strings ("it watches .")
export function bookSentences(words) {
  const out = new Set();
  let cur = [];
  for (const w of words) {
    cur.push(w);
    if (ENDS.includes(w)) (out.add(cur.join(" ")), (cur = []));
  }
  return out;
}

// Options as tree()'s, plus maxLen (10) and book (a Set from bookSentences).
// `colour(node, { book, path })` gets whether the branch lies on one of the
// book's sentences. Returns tree()'s handle plus
//   live      Set of the nodes on some complete sentence
//   ends      [{ words, p, node, book }] the sentences, likeliest first
//             (words without the root)
//   onBook    node -> the branch is on one of the book's sentences
export function sentenceTree(tl, parent, { rows, maxLen = 10, book, colour, ...opts }) {
  const rows2 = { ...rows, [ROOT]: rows["."], ".": [], "!": [] };
  // which prefixes (as token strings) are on a book sentence
  const bookPrefixes = new Set();
  for (const s of book) {
    const ws = s.split(" ");
    for (let k = 1; k <= ws.length; k++) bookPrefixes.add(ws.slice(0, k).join(" "));
  }
  const pathOf = (n) => {
    const ws = [];
    for (let m = n; m.parent; m = m.parent) ws.unshift(m.word);
    return ws;
  };
  const onBook = (n) => bookPrefixes.has(pathOf(n).join(" "));
  const T3 = tree(tl, parent, {
    ...opts,
    rows: rows2,
    root: ROOT,
    depth: maxLen + 1,
    colour: colour ? (n) => colour(n, { book: onBook(n) }) : undefined,
  });

  // live: on a path that ends within maxLen
  const live = new Set();
  const mark = (n) => {
    let ok = n.parent && ENDS.includes(n.word) && n.depth <= maxLen;
    for (const k of n.kids) ok = mark(k) || ok;
    if (ok) live.add(n);
    return ok;
  };
  mark(T3.root);
  live.add(T3.root);

  // re-spread the live leaves down the box; the dead collapse onto their parent
  const { y0: Y0, y1: Y1 } = T3.box;
  let leaves = 0;
  const place = (n) => {
    n.leaf0 = leaves;
    const kids = n.kids.filter((k) => live.has(k));
    if (!kids.length) leaves++;
    else kids.forEach(place);
    n.leaves = leaves - n.leaf0;
  };
  place(T3.root);
  const LH = (Y1 - Y0) / leaves;
  for (const n of T3.nodes) {
    if (live.has(n)) n.y = Y0 + (n.leaf0 + n.leaves / 2) * LH;
    else ((n.x = n.parent.x), (n.y = n.parent.y));
  }

  const ends = T3.sentences(ENDS)
    .filter((s) => live.has(s.node))
    .map((s) => {
      const words = s.words.slice(1);
      return { ...s, words, book: book.has(words.join(" ")) };
    });
  return { ...T3, live, ends, onBook, leaves, liveNodes: T3.nodes.filter((n) => live.has(n)) };
}

// The pull-back: small copies of the tree's shape receding under a
// logarithmic zoom, so the one tree reads as one of many like it. Each copy
// keeps only its likelier branches (p >= minP) and draws them as few, thick
// strokes, so a copy stays recognisable when small and nothing shimmers.
//   nodes, box                    a sentenceTree's live nodes and its box
//   zoom { t, dur, to, cx, cy }   scale 1 -> `to` about (cx, cy), logarithmic
//   tiles { r, pitch }            copies within r rings of the centre, their
//                                 centres `pitch` tree-sizes apart (jittered,
//                                 resized, some mirrored top to bottom)
//   appear { t, dur, ring }       ring k fades in from t + (k - 1) * ring
//   centre { in: [t, dur] }       the centre copy fades in (the real tree
//                                 crossfades out above it)
//   turn [{ t, spread, colour, share, inherit }]  colour changes: each
//                                 branch draws a seeded u in [0, 1); the first
//                                 entry whose share covers u turns it (shares
//                                 count from the entries before), at t + spread
//                                 * its copy's seeded delay. With `inherit`, a
//                                 branch whose parent took that entry takes it
//                                 too, so it runs down whole continuations
//   base [r, g, b], alpha         the colour before any turn
//   minP, minW                    the branches kept, and the thinnest stroke
//   canvasBox { x, y, w, h }      the canvas in the parent
export function mesh(tl, parent, opts) {
  const {
    nodes,
    box,
    zoom,
    tiles = { r: 3, pitch: 1.12 },
    appear,
    turn = [],
    base = [255, 255, 255],
    alpha = 0.5,
    centre,
    canvasBox,
    minP = 0.004,
    minW = 1.6,
    seed = 91,
  } = opts;
  const TW = box.x1 - box.x0,
    TH = box.y1 - box.y0;
  const midX = (box.x0 + box.x1) / 2,
    midY = (box.y0 + box.y1) / 2;
  const branches = nodes.filter(
    (n) => n.parent && n.p >= minP && (n.x !== n.parent.x || n.y !== n.parent.y),
  );
  const R = tiles.r,
    PX = TW * tiles.pitch,
    PY = TH * tiles.pitch;
  const list = [];
  for (let j = -R; j <= R; j++)
    for (let i = -R; i <= R; i++) {
      const centre = i === 0 && j === 0;
      const r = C.rng(seed + (i + 50) * 997 + (j + 50) * 131);
      const jx = (r() - 0.5) * 0.2 * PX,
        jy = (r() - 0.5) * 0.2 * PY;
      list.push({
        cx: midX + i * PX + (centre ? 0 : jx),
        cy: midY + j * PY + (centre ? 0 : jy),
        k: centre ? 1 : 0.7 + 0.3 * r(),
        fy: centre || r() < 0.5 ? 1 : -1,
        ring: Math.max(Math.abs(i), Math.abs(j)),
        centre,
        d: r(),
        br: branches.map(() => ({ u: r() })),
      });
    }
  const at = new Map(branches.map((n, k) => [n, k]));
  for (const tile of list)
    branches.forEach((n, k) => {
      const up = at.get(n.parent);
      const b = tile.br[k];
      b.turn = turn.findIndex((T, i) => T.inherit && up !== undefined && tile.br[up].turn === i);
      if (b.turn < 0) {
        let acc = 0;
        b.turn = turn.findIndex((T) => b.u < (acc += T.share));
      }
    });
  const lz1 = Math.log(zoom.to);
  const zAt = (t) => Math.exp(lz1 * C.phase(t, zoom.t, zoom.dur, "in-out-cubic"));
  const W = (p) => 0.4 + 11 * Math.sqrt(p);
  const cb = canvasBox;
  const layer = C.canvas(
    tl,
    parent,
    (ctx, t) => {
      ctx.translate(-cb.x, -cb.y);
      const z = zAt(t);
      ctx.lineCap = "round";
      // strokes batched by colour, opacity and width bin
      const batches = new Map();
      for (const tile of list) {
        const a = tile.centre
          ? C.phase(t, centre.in[0], centre.in[1], "in-out-quad")
          : C.phase(t, appear.t + (tile.ring - 1) * appear.ring, appear.dur, "out-quad");
        if (a <= 0) continue;
        const sx = (x) => zoom.cx + (tile.cx + (x - midX) * tile.k - zoom.cx) * z;
        const sy = (y) => zoom.cy + (tile.cy + (y - midY) * tile.k * tile.fy - zoom.cy) * z;
        const bx0 = sx(box.x0),
          bx1 = sx(box.x1),
          by0 = Math.min(sy(box.y0), sy(box.y1)),
          by1 = Math.max(sy(box.y0), sy(box.y1));
        if (bx1 < cb.x || bx0 > cb.x + cb.w || by1 < cb.y || by0 > cb.y + cb.h) continue;
        branches.forEach((n, k) => {
          const T = turn[tile.br[k].turn];
          const on = T && t >= T.t + T.spread * tile.d;
          const rgb = on ? T.colour : base;
          const o = Math.round((on ? 0.95 : alpha) * a * 20) / 20;
          const w = Math.round(Math.max(minW, W(n.p) * z * tile.k) * 4) / 4;
          const key = `${rgb.join(" ")}|${w}|${o}`;
          if (!batches.has(key)) batches.set(key, { rgb, w, o, segs: [] });
          batches.get(key).segs.push([sx(n.parent.x), sy(n.parent.y), sx(n.x), sy(n.y)]);
        });
      }
      for (const B of [...batches.values()].sort((a, b) => a.o - b.o)) {
        if (B.o <= 0) continue;
        ctx.strokeStyle = `rgb(${B.rgb.join(" ")} / ${B.o})`;
        ctx.lineWidth = B.w;
        ctx.beginPath();
        for (const [xa, ya, xb, yb] of B.segs) {
          const mx = (xa + xb) / 2;
          ctx.moveTo(xa, ya);
          ctx.bezierCurveTo(mx, ya, mx, yb, xb, yb);
        }
        ctx.stroke();
      }
    },
    cb,
  );
  return { el: layer.el, zAt };
}
