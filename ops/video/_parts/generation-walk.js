// The generation walk every how-it-works generation video shares, whatever the
// format: the walk ". it sits on the dog ." through the magpie's counts, the
// strip of paper it is written on, and the reveal that the book never says it
// (its halves come from two sentences the book does say). The format's own
// chooser (the die and its strip, the cup and counters, the cutouts) sits
// between these in each composition.
//
// Used by generation-grid and generation-ledger; generation-cutouts builds on
// it too. The tree (./tree.js) and the recount (./converge.js) follow it.

// the walk, as tokens: a sentence the book never says
export const WALK = [".", "it", "sits", "on", "the", "dog", "."];

// Ten die faces shared across a row's options by its counts: the booklet's
// rounding (K.diceBands, a port of computeDiceBands in
// website/src/lib/diceBands.ts), held at one d10. K.diceBands picks the number
// of faces from the row total (a total of 10 or more gets 100 faces, as a
// booklet's two dice do); the grid lesson rolls one die whatever the total, so
// the faces are fixed at ten here and the arithmetic is otherwise the same.
export function tenFaces(options) {
  const total = options.reduce((s, o) => s + o.count, 0);
  const factor = 10 / total;
  let cum = 0,
    from = 0;
  return options.map((o) => {
    cum += o.count;
    const to = Math.min(Math.max(Math.round(cum * factor), 1), 10) - 1;
    const band = { word: o.word, count: o.count, from, to };
    from = to + 1;
    return band;
  });
}

// Word times that survive a collapsed alignment: where the scratch aligner
// gives three or more consecutive words (nearly) the same start, their times
// are spread across the gap by character count, from the end of the word
// before the run to the start of the word after it. Otherwise T.word.
export function wordTimes(T) {
  const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
  const fixed = new Map();
  const line = (i) => {
    if (fixed.has(i)) return fixed.get(i);
    const L = T.line(i);
    const ws = L.words.map((w) => ({ ...w }));
    for (let a = 0; a < ws.length;) {
      let b = a;
      while (b + 1 < ws.length && ws[b + 1].start - ws[b].start < 0.07) b++;
      if (b - a >= 2) {
        const t0 = a > 0 ? ws[a - 1].end : L.start,
          t1 = b + 1 < ws.length ? ws[b + 1].start : L.end;
        const chars = ws.slice(a, b + 1).map((w) => w.w.length + 1);
        const total = chars.reduce((s, c) => s + c, 0);
        let acc = 0;
        for (let k = a; k <= b; k++) {
          ws[k].start = t0 + ((t1 - t0) * acc) / total;
          acc += chars[k - a];
          ws[k].end = t0 + ((t1 - t0) * acc) / total;
        }
      }
      a = b + 1;
    }
    fixed.set(i, ws);
    return ws;
  };
  const find = (i, w, nth = 1) => {
    let n = 0;
    for (const x of line(i)) if (norm(x.w) === norm(w) && ++n === nth) return x;
    throw new Error(`"${w}" (${nth}) not in line ${i}: ${T.line(i).caption}`);
  };
  return {
    word: (i, w, nth) => find(i, w, nth).start,
    wordEnd: (i, w, nth) => find(i, w, nth).end,
  };
}

// The strip of paper the text is written on, in pencil; a punctuation word is
// the kit's symbol tile. `centres(place)` gives each word's centre in the
// parent's coordinates for the paper at `place` ({ x, y, scale }), for words
// that leave the paper (to the tree's column).
export function paperLine(
  parent,
  words,
  { x = 0, y = 0, w = 1300, h = 120, size = 60, padX = 36 } = {},
) {
  const K = window.KIT;
  const L = K.layer(parent, x, y);
  const paper = K.paper(L, { x: 0, y: 0, w, h });
  const line = K.pencilLine(paper.el, words, { x: padX, y: (h - size) / 2, size });
  line.words.forEach((s, i) => {
    if (!K.isPunct(words[i])) return;
    s.textContent = "";
    s.style.verticalAlign = "-0.12em";
    K.punctTile(s, words[i], { fill: "var(--paper)" });
    s.firstChild.style.width = "0.9em";
    s.firstChild.style.height = "0.9em";
  });
  const centres = (place = { x, y, scale: 1 }) =>
    line.words.map((s) => ({
      x: place.x + (padX + s.offsetLeft + s.offsetWidth / 2) * place.scale,
      y: place.y + ((h - size) / 2 + s.offsetTop + s.offsetHeight / 2) * place.scale,
    }));
  return { el: L, paper, words: line.words, w, h, centres };
}

// "The book never says that": two of the book's sentences, in its type, whose
// halves hold the walk ("It sits on the | fence." and "Here comes the | dog.").
// They appear at `show`; the halves that make the walk light at `pieces`; at
// `join` the rest falls away and the halves slide together into "It sits on
// the dog.", centred on cx at `y`.
export function splice(tl, parent, { cx, y, size = 64, lead = 1.7, times }) {
  const K = window.KIT;
  const A = ["It", "sits", "on", "the", "fence."],
    B = ["Here", "comes", "the", "dog."];
  const keepA = 4,
    keepB = 3; // A's first four words, B's last
  const font = `${size}px "Libertinus Serif"`;
  const space = K.measure(" ", font);
  const widths = (ws) => ws.map((w) => K.measure(w, font));
  const layout = (ws) => {
    const wd = widths(ws);
    const total = wd.reduce((s, v) => s + v, 0) + space * (ws.length - 1);
    let x = cx - total / 2;
    return wd.map((v) => {
      const at = x;
      x += v + space;
      return at;
    });
  };
  const mk = (ws, xs, top) =>
    ws.map((w, i) => {
      const e = K.el(
        "div",
        { class: "splice-word", text: w, style: { fontSize: `${size}px` } },
        parent,
      );
      K.set(e, { x: xs[i], y: top, opacity: 0 });
      return e;
    });
  const yA = y - size * lead * 0.5 - size * 0.5,
    yB = y + size * lead * 0.5 - size * 0.5;
  const a = mk(A, layout(A), yA),
    b = mk(B, layout(B), yB);
  const joined = [...A.slice(0, keepA), B[keepB]];
  const jx = layout(joined);
  K.appear(tl, a, times.show, { y: 12, stagger: 0.04 });
  K.appear(tl, b, times.show + 0.35, { y: 12, stagger: 0.04 });
  // the halves that make the walk light; the rest greys
  tl.to([...a.slice(0, keepA), b[keepB]], { color: "var(--gold-2)" }, times.pieces, { dur: 0.35 });
  tl.to([a[keepA], ...b.slice(0, keepB)], { opacity: 0.35 }, times.pieces, { dur: 0.35 });
  // the rest falls away and the halves slide together
  K.vanish(tl, [a[keepA], ...b.slice(0, keepB)], times.join, { dur: 0.3 });
  const y0 = y - size * 0.5;
  a.slice(0, keepA).forEach((e, i) =>
    tl.to(e, { x: jx[i], y: y0 }, times.join + 0.15, { dur: 0.7, ease: "in-out-cubic" }),
  );
  tl.to(b[keepB], { x: jx[keepA], y: y0 }, times.join + 0.15, { dur: 0.7, ease: "in-out-cubic" });
  return { a, b, all: [...a, ...b], joined: [...a.slice(0, keepA), b[keepB]] };
}

// The splice's words' look (insert once).
export const WALK_CSS = `
.splice-word {
  position: absolute; left: 0; top: 0; font-family: var(--font-tok); line-height: 1;
  white-space: nowrap; color: var(--text);
}
`;
export const walkStyle = () => {
  const s = document.createElement("style");
  s.textContent = WALK_CSS;
  document.head.appendChild(s);
};
