// Frankenstein's real bigram counts, drawn on a Canvas 2D layer: a grid (or a
// stack of ledger sheets) that fills in reading order and can be drawn whole
// or through a window at any scale, from readable boxes with numbers down to
// a texture of points.
//
// Used by `training-grid` and `training-ledger` (the bigger book at machine
// speed, a logarithmic pull-back until the table is a texture) and meant for
// `real-models` (the powers-of-ten beat: 49,322,529 boxes, 41,018 of them
// lit, 0.08%). The data is generated/frankenstein.js (build-frankenstein.py,
// checked against the CLI): load it with
// `<script src="parts/generated/frankenstein.js">`, then
//
//   const M = F.model();                        // counts, first uses, orderings
//   C.canvas(tl, scene, (ctx, t) => F.drawGrid(ctx, M, { pairs, x, y, cell, clip }), …)
//
// Everything here is a pure function of its arguments: a draw call redraws
// the whole picture for the pairs read so far, so a frame never depends on
// the frames before it (the canvas layer's contract). Geometry is in the
// kit grid's proportions (a header band two cells wide, header type at 0.42
// of a cell), so a kit grid can hand over to this drawing at the same size.

// The book as a model: counts, when each word and box first turns up, and the
// orderings the drawing can use. `F` is window.FRANKENSTEIN.
export function model(F = window.FRANKENSTEIN) {
  const n = F.vocab.length,
    m = F.cellR.length,
    P = F.seq.length; // pairs (tokens - 1)
  const firstPair = new Int32Array(m).fill(-1),
    total = new Int32Array(m);
  F.seq.forEach((c, k) => {
    if (firstPair[c] < 0) firstPair[c] = k;
    total[c]++;
  });
  // the token at which each word first turns up (vocab is in first-use order,
  // so this rises with the word index)
  const wordFirst = new Int32Array(n).fill(-1);
  const meet = (w, tok) => wordFirst[w] < 0 && (wordFirst[w] = tok);
  meet(F.cellR[F.seq[0]], 0);
  F.seq.forEach((c, k) => meet(F.cellC[c], k + 1));
  // each box's place in its row (the ledger's box order: the order the row
  // first meets its followers), and each row's box count
  const rowLen = new Int32Array(n),
    slot = new Int32Array(m);
  for (let c = 0; c < m; c++) slot[c] = rowLen[F.cellR[c]]++;
  const rowTotal = new Int32Array(n);
  for (let c = 0; c < m; c++) rowTotal[F.cellR[c]] += total[c];
  let maxCount = 0;
  for (const v of total) maxCount = Math.max(maxCount, v);
  return {
    F,
    vocab: F.vocab,
    n,
    m,
    P,
    tokens: F.tokens,
    R: F.cellR,
    C: F.cellC,
    seq: F.seq,
    firstPair,
    total,
    wordFirst,
    rowLen,
    rowTotal,
    slot,
    maxCount,
  };
}

// Counts after the first `pairs` pairs of the text, per box. Memoised on the
// last call (a cache, not state: the result depends only on the arguments).
let memo = { M: null, pairs: -1, counts: null };
export function countsAt(M, pairs) {
  pairs = Math.max(0, Math.min(M.P, Math.floor(pairs)));
  if (memo.M === M && memo.pairs === pairs) return memo.counts;
  const counts = new Int32Array(M.m);
  for (let k = 0; k < pairs; k++) counts[M.seq[k]]++;
  memo = { M, pairs, counts };
  return counts;
}

// how many words have turned up once `pairs` pairs are read (pairs + 1 tokens)
export function wordsAt(M, pairs) {
  const tok = Math.floor(pairs); // the last token read is index `pairs`
  let lo = 0,
    hi = M.n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    M.wordFirst[mid] <= tok ? (lo = mid + 1) : (hi = mid);
  }
  return lo;
}
// the pairs to read before `words` words have turned up (fractional words
// interpolate, so a zoom driven by vocabulary size moves smoothly)
export function pairsForWords(M, words) {
  const w = Math.max(1, Math.min(M.n, words));
  const i = Math.floor(w) - 1,
    f = w - 1 - i;
  const a = M.wordFirst[i],
    b = M.wordFirst[Math.min(M.n - 1, i + 1)];
  return Math.min(M.P, a + (b - a) * f);
}

// Row and column orderings. The natural one is first use (index = word); a
// caller wanting another passes `perm` (perm[word] = position) to the draw.
// By frequency puts the busiest rows and columns top left.
export function byFrequency(M) {
  const order = [...M.vocab.keys()].sort((a, b) => M.rowTotal[b] - M.rowTotal[a] || a - b);
  const perm = new Int32Array(M.n);
  order.forEach((w, i) => (perm[w] = i));
  return perm;
}

// how bright a box with `count` tallies is drawn: logarithmic, 0..1
export const brightness = (M, count) =>
  count > 0 ? Math.log1p(count) / Math.log1p(M.maxCount) : 0;

const smooth = (a, b, x) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);

// The dark "table of numbers" look training-grid's magpie grid turns into
// before handing over to this drawing (see its line 7).
export const TABLE_STYLE = {
  ground: "rgb(255 255 255 / 4%)", // the table's extent on the desk
  rule: [255, 255, 255, 0.14],
  head: "rgb(255 255 255 / 72%)",
  lit: [229, 169, 48], // --gold-2
  num: "#e5a930",
  zero: "rgb(255 255 255 / 22%)",
};

// A symbol tile for punctuation in a header (the kit's punctBox, in canvas):
// a rounded square with the bold mark centred on its ink.
function punctMark(ctx, mark, cx, cy, size, colour) {
  const side = size * 1.15,
    ms = size * 1.3;
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.beginPath();
  ctx.roundRect(cx - side / 2, cy - side / 2, side, side, side * 0.12);
  ctx.stroke();
  ctx.font = `700 ${ms}px "Libertinus Serif"`;
  const m = ctx.measureText(mark);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    mark,
    cx - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
    cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
  );
  ctx.restore();
}

// Scratch pixels for the texture mode, reused between calls (a buffer, not
// state: every call clears what it uses).
let scratch = null;
const scratchCanvas = (w, h) => {
  if (!scratch) scratch = document.createElement("canvas");
  if (scratch.width !== w || scratch.height !== h) {
    scratch.width = w;
    scratch.height = h;
  }
  return scratch;
};

// Draw the grid after `pairs` pairs: cell (0, 0) of the table at (x, y) in the
// canvas's CSS px, `cell` px a box, clipped to `clip` {x, y, w, h}. Rows and
// columns are ruled as far as the words met so far (`size` overrides, e.g.
// M.n for the whole table from the start). Boxes are drawn by how big they
// land on the device pixels:
//   - big enough to read: rules, headers (the words), numerals for nonzero
//     boxes and, with `zeros`, a faint 0 in the empty ones
//   - smaller: each nonzero box a filled square as bright as its count
//   - under a pixel and a half: a texture, each nonzero box a point of at least a
//     pixel, overlapping points screening brighter
// `head` is the header band in cells (the kit grid's 2), `alpha` fades it all.
export function drawGrid(
  ctx,
  M,
  {
    pairs = M.P,
    x = 0,
    y = 0,
    cell = 10,
    clip,
    size,
    perm = null,
    head = 2,
    zeros = false,
    headers = true,
    alpha = 1,
    style = TABLE_STYLE,
  } = {},
) {
  const dpr = ctx.getTransform().a;
  const cw = clip || { x: 0, y: 0, w: ctx.canvas.width / dpr, h: ctx.canvas.height / dpr };
  const counts = countsAt(M, pairs);
  const words = size ?? wordsAt(M, pairs);
  const pos = perm ? (w) => perm[w] : (w) => w;
  const ext = words * cell; // the table's side in px
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(cw.x, cw.y, cw.w, cw.h);
  ctx.clip();
  // the visible window, in rows/columns
  const i0 = Math.max(0, Math.floor((cw.x - x) / cell)),
    i1 = Math.min(words, Math.ceil((cw.x + cw.w - x) / cell));
  const j0 = Math.max(0, Math.floor((cw.y - y) / cell)),
    j1 = Math.min(words, Math.ceil((cw.y + cw.h - y) / cell));
  // the table's extent
  ctx.fillStyle = style.ground;
  ctx.fillRect(x, y, ext, ext);
  // rules, fading out as boxes get too small to rule
  const ruleA = style.rule[3] * smooth(4, 14, cell);
  if (ruleA > 0.002 && i1 - i0 < 4000) {
    ctx.strokeStyle = `rgb(${style.rule.slice(0, 3).join(" ")} / ${ruleA})`;
    ctx.lineWidth = Math.max(0.5, Math.min(1.5, cell * 0.02));
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      ctx.moveTo(x + i * cell, Math.max(y, cw.y));
      ctx.lineTo(x + i * cell, Math.min(y + ext, cw.y + cw.h));
    }
    for (let j = j0; j <= j1; j++) {
      ctx.moveTo(Math.max(x, cw.x), y + j * cell);
      ctx.lineTo(Math.min(x + ext, cw.x + cw.w), y + j * cell);
    }
    ctx.stroke();
  }
  const [lr, lg, lb] = style.lit;
  const numA = smooth(16, 24, cell);
  if (cell >= 1.5) {
    // boxes as squares (fading to numerals when there's room for them)
    for (let c = 0; c < M.m && M.firstPair[c] < pairs; c++) {
      const r = pos(M.R[c]),
        k = pos(M.C[c]);
      if (k < i0 || k >= i1 || r < j0 || r >= j1) continue;
      const b = brightness(M, counts[c]);
      ctx.fillStyle = `rgb(${lr} ${lg} ${lb} / ${(0.4 + 0.6 * Math.pow(b, 0.6)) * (1 - numA)})`;
      const inset = cell > 6 ? cell * 0.12 : 0;
      ctx.fillRect(x + k * cell + inset, y + r * cell + inset, cell - 2 * inset, cell - 2 * inset);
    }
  } else {
    // a texture: one point per nonzero box, screened together per CSS pixel
    // (so a 4K render looks like the 1080p one, only sharper), the busiest
    // boxes burning towards white
    const W = Math.ceil(cw.w),
      H = Math.ceil(cw.h);
    const sc = scratchCanvas(W, H),
      sctx = sc.getContext("2d");
    const img = sctx.createImageData(W, H);
    const acc = new Float32Array(W * H),
      hot = new Float32Array(W * H);
    const ox = x - cw.x,
      oy = y - cw.y;
    for (let c = 0; c < M.m && M.firstPair[c] < pairs; c++) {
      const px = Math.floor(ox + (pos(M.C[c]) + 0.5) * cell),
        py = Math.floor(oy + (pos(M.R[c]) + 0.5) * cell);
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const b = brightness(M, counts[c]);
      const a = 0.4 + 0.6 * Math.pow(b, 0.6);
      const i = py * W + px;
      acc[i] = 1 - (1 - acc[i]) * (1 - a);
      hot[i] = Math.max(hot[i], b);
    }
    for (let i = 0; i < acc.length; i++) {
      if (!acc[i]) continue;
      const o = i * 4,
        wh = hot[i] * hot[i];
      img.data[o] = lr + (255 - lr) * wh;
      img.data[o + 1] = lg + (255 - lg) * wh;
      img.data[o + 2] = lb + (255 - lb) * wh;
      img.data[o + 3] = Math.round(255 * acc[i]);
    }
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sc, Math.round(cw.x), Math.round(cw.y));
  }
  // numerals: the counts themselves, once a box can hold one
  if (numA > 0) {
    const fs = cell * 0.42;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${fs}px "Public Sans"`;
    ctx.globalAlpha = alpha * numA;
    const lit = new Set();
    for (let c = 0; c < M.m && M.firstPair[c] < pairs; c++) {
      const r = pos(M.R[c]),
        k = pos(M.C[c]);
      if (k < i0 || k >= i1 || r < j0 || r >= j1) continue;
      lit.add(r * M.n + k);
      ctx.fillStyle = style.num;
      ctx.fillText(String(counts[c]), x + (k + 0.5) * cell, y + (r + 0.5) * cell);
    }
    if (zeros) {
      ctx.font = `400 ${fs}px "Public Sans"`;
      ctx.fillStyle = style.zero;
      for (let r = j0; r < j1; r++)
        for (let k = i0; k < i1; k++)
          if (!lit.has(r * M.n + k)) ctx.fillText("0", x + (k + 0.5) * cell, y + (r + 0.5) * cell);
    }
    ctx.globalAlpha = alpha;
  }
  ctx.restore();
  // headers: the words, in the band left of and above the table, once they
  // can be read (the kit grid's layout: right-aligned rows, centred columns)
  const headA = smooth(16, 24, cell);
  if (headers && headA > 0) {
    const fs = cell * 0.42,
      band = head * cell;
    const inv = perm ? invert(perm) : null;
    const word = (i) => M.vocab[inv ? inv[i] : i];
    // in reading order, only the words met so far have been written in
    const met = perm ? words : Math.min(words, wordsAt(M, pairs));
    ctx.save();
    ctx.globalAlpha = alpha * headA;
    ctx.beginPath();
    ctx.rect(cw.x - band, cw.y - band, cw.w + band, cw.h + band);
    ctx.clip();
    ctx.fillStyle = style.head;
    ctx.font = `400 ${fs}px "Libertinus Serif"`;
    ctx.textBaseline = "middle";
    for (let j = j0; j < Math.min(j1, met); j++) {
      const w = word(j),
        cy = y + (j + 0.5) * cell;
      if (PUNCT.has(w)) punctMark(ctx, w, x - cell * 0.275 - (fs * 1.15) / 2, cy, fs, style.head);
      else {
        ctx.textAlign = "right";
        ctx.fillText(w, x - cell * 0.275, cy);
      }
    }
    ctx.textBaseline = "alphabetic";
    for (let i = i0; i < Math.min(i1, met); i++) {
      const w = word(i),
        cx = x + (i + 0.5) * cell;
      if (PUNCT.has(w)) punctMark(ctx, w, cx, y - cell * 0.2 - (fs * 1.15) / 2, fs, style.head);
      else {
        // column words run up the page, as training-grid's rotated headers do
        ctx.save();
        ctx.translate(cx + fs * 0.33, y - cell * 0.2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "left";
        ctx.fillText(w, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }
}
const invCache = new WeakMap();
function invert(perm) {
  if (!invCache.has(perm)) {
    const inv = new Int32Array(perm.length);
    perm.forEach((p, w) => (inv[p] = w));
    invCache.set(perm, inv);
  }
  return invCache.get(perm);
}

// ---------------------------------------------------------------- ledger
// The same counts as a hand-filled stack of ledger sheets: a line is opened
// when it's needed, in reading order: when a word first turns up (its row)
// and when a row's four boxes are full and its next new follower needs
// another line (a continuation, the word written again at its start). The
// boxes on a line are in the order the row first meets its followers, in the
// counter colours; `lines` lines to a sheet. That makes the same lines as
// the CLI's layout (7,023 rows taking 14,129 lines at four boxes a line), but
// a continuation sits where the reader got to rather than straight under its
// row, so the stack never holds lines kept empty for later. Sheets tile out
// from the top-left corner in square shells (shell s holds the sheets whose
// larger coordinate is s), so the sheets in use fill a square that grows
// from the corner as the text is read.
export function ledgerLayout(M, { lines = 5, columns = 4 } = {}) {
  const lineOf = new Int32Array(M.m),
    lineWord = [],
    lineOpen = [];
  const current = new Int32Array(M.n).fill(-1);
  for (let c = 0; c < M.m; c++) {
    const w = M.R[c];
    if (M.slot[c] % columns === 0) {
      current[w] = lineWord.length;
      lineWord.push(w);
      // a word's first line opens as the word is read, a continuation as
      // the follower that needs it is
      lineOpen.push(M.slot[c] === 0 ? Math.max(0, M.firstPair[c] - 1) : M.firstPair[c]);
    }
    lineOf[c] = current[w];
  }
  const nLines = lineWord.length;
  return { lines, columns, lineOf, lineWord, lineOpen, nLines, nSheets: Math.ceil(nLines / lines) };
}
// sheet s → its column and row in the shells
export function shellPos(s) {
  const m = Math.floor(Math.sqrt(s)),
    j = s - m * m;
  return j < m ? { col: m, row: j } : { col: j - m, row: m };
}
// lines open after `pairs` pairs
export function linesAt(L, pairs) {
  let lo = 0,
    hi = L.nLines;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    L.lineOpen[mid] < pairs ? (lo = mid + 1) : (hi = mid);
  }
  return lo;
}
// sheets in use after `pairs` pairs
export const sheetsAt = (M, L, pairs) => Math.ceil(linesAt(L, pairs) / L.lines);
// the pairs to read before `sheets` sheets are in use (fractional sheets
// interpolate between the lines that start them)
export function pairsForSheets(M, L, sheets) {
  const line = Math.max(0, Math.min(L.nLines - 1, (sheets - 1) * L.lines)),
    i = Math.floor(line),
    f = line - i;
  const a = L.lineOpen[i],
    b = L.lineOpen[Math.min(L.nLines - 1, i + 1)];
  return Math.min(M.P, a + (b - a) * f + 1);
}

// The palette the magpie ledger prints in (KIT_DATA.palette): red, blue,
// green, yellow, and the strips' tints (the kit's TINT).
export const LEDGER_STYLE = {
  paper: "#ffffff",
  prefix: "#eeeeee",
  prefixRule: "#a0a0a0",
  ink: "#1a1a1a",
  colours: ["#e50002", "#0043df", "#129f01", "#eab308"],
  tints: ["#fde4e4", "#dfe8fb", "#e2f2df", "#f6eedc"],
  // numerals in the box's colour; yellow deepened so it reads on its tint
  numColours: ["#e50002", "#0043df", "#129f01", "#b88700"],
};

// Draw the sheets after `pairs` pairs: sheet (0, 0)'s top-left at (x, y), each
// sheet `sw` px wide (its height follows the kit sheet's proportions), `gap`
// px between sheets. Up close a line shows its words and each box its count
// as a numeral in its colour; further out, the paper, the grey prefix blocks
// and the coloured boxes; at the far end, a texture of colour. Sheets not yet
// in use aren't drawn.
//
// `far: "dots"` quiets the far end: as sheets shrink past readable
// (`sw` under about 100 px) the lines cross-fade to flat paper blocks, each box
// a small dot of its colour somewhere along its line (deterministic), so a
// big stack reads as a lot of sheets rather than as stripes of thin
// saturated rules (which bleed and shimmer under H.264). The default,
// "lines", draws the lines at every scale.
export function drawLedger(
  ctx,
  M,
  L,
  {
    pairs = M.P,
    x = 0,
    y = 0,
    sw = 400,
    gap = 20,
    ghost = 0,
    clip,
    alpha = 1,
    far = "lines",
    style = LEDGER_STYLE,
  } = {},
) {
  const dpr = ctx.getTransform().a;
  const cw = clip || { x: 0, y: 0, w: ctx.canvas.width / dpr, h: ctx.canvas.height / dpr };
  // the kit sheet's proportions, per 1600-unit-wide sheet: rows 150, pad 24
  const k = sw / 1600,
    rowH = 150 * k,
    pad = 24 * k,
    sh = L.lines * rowH + 2 * pad;
  const prefixW = 260 * k,
    boxW = ((1600 - 260) / L.columns) * k,
    rule = Math.max(6, Math.round(150 * 0.08)) * k;
  const counts = countsAt(M, pairs);
  const nSheets = sheetsAt(M, L, pairs);
  // how far the lines have given way to dots (far: "dots"); the gutters
  // between sheets close as they do, since a mesh of one-pixel gutters
  // shimmers too, and the sheets tell apart by their paper's tone instead
  const dots = far === "dots" ? 1 - smooth(0.04, 0.08, k) : 0;
  gap *= 1 - dots;
  const origin = (s) => {
    const p = shellPos(s);
    return { sx: x + p.col * (sw + gap), sy: y + p.row * (sh + gap) };
  };
  const visible = (sx, sy) =>
    sx + sw >= cw.x && sx <= cw.x + cw.w && sy + sh >= cw.y && sy <= cw.y + cw.h;
  const lineY = (line) => {
    const s = Math.floor(line / L.lines),
      o = origin(s);
    return { ...o, s, ly: o.sy + pad + (line % L.lines) * rowH };
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(cw.x, cw.y, cw.w, cw.h);
  ctx.clip();
  // sheets still to come, as faint paper (`ghost` of them from the corner)
  ctx.fillStyle = "rgb(255 255 255 / 10%)";
  for (let s = nSheets; s < ghost; s++) {
    const { sx, sy } = origin(s);
    if (visible(sx, sy)) ctx.fillRect(sx, sy, sw, sh);
  }
  // paper
  ctx.fillStyle = style.paper;
  for (let s = 0; s < nSheets; s++) {
    const { sx, sy } = origin(s);
    if (dots > 0) {
      const v = Math.round(255 - dots * 22 * hash01(s * 31 + 5));
      ctx.fillStyle = `rgb(${v} ${v} ${v})`;
    }
    if (visible(sx, sy)) {
      if (sw > 60) {
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 8 * k);
        ctx.fill();
      } else ctx.fillRect(sx, sy, sw, sh);
    }
  }
  const base = alpha;
  alpha = base * (1 - dots);
  ctx.globalAlpha = alpha;
  // entries: the prefix block, the boxes met so far
  const textA = smooth(0.13, 0.2, k),
    fs = 44 * k;
  const open = linesAt(L, pairs);
  for (let line = 0; line < open; line++) {
    const { sx, sy, ly } = lineY(line);
    if (!visible(sx, sy)) continue;
    const w = L.lineWord[line];
    ctx.fillStyle = style.prefix;
    ctx.fillRect(sx, ly + 9 * k, prefixW, rowH - 9 * k - rule);
    ctx.fillStyle = style.prefixRule;
    ctx.fillRect(sx, ly + rowH - rule, prefixW, rule);
    if (textA > 0) {
      ctx.globalAlpha = alpha * textA;
      ctx.fillStyle = style.ink;
      const word = M.vocab[w];
      if (PUNCT.has(word))
        punctMark(ctx, word, sx + 14 * k + (fs * 1.15) / 2, ly + rowH / 2, fs, style.ink);
      else {
        ctx.font = `700 ${fs}px "Libertinus Serif"`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(word, sx + 24 * k, ly + rowH / 2);
      }
      ctx.globalAlpha = alpha;
    }
  }
  for (let c = 0; c < M.m && M.firstPair[c] < pairs; c++) {
    const w = M.R[c],
      j = M.slot[c],
      box = j % L.columns;
    const { sx, sy, ly } = lineY(L.lineOf[c]);
    if (!visible(sx, sy)) continue;
    const bx = sx + prefixW + box * boxW,
      stripW = boxW * 0.42;
    ctx.fillStyle = style.tints[box];
    ctx.fillRect(bx + boxW - stripW, ly + 9 * k, stripW, rowH - 9 * k - rule);
    // far out, the pale tints would wash to white: deepen them into the
    // counter colour as the sheets shrink, so the stack reads as colour
    const deep = 0.75 * (1 - smooth(0.02, 0.08, k));
    if (deep > 0) {
      ctx.globalAlpha = alpha * deep;
      ctx.fillStyle = style.colours[box];
      ctx.fillRect(bx + boxW - stripW, ly + 9 * k, stripW, rowH - 9 * k);
      ctx.globalAlpha = alpha;
    }
    ctx.fillStyle = style.colours[box];
    ctx.fillRect(bx, ly + rowH - rule, boxW, rule);
    if (textA > 0) {
      ctx.globalAlpha = alpha * textA;
      const word = M.vocab[M.C[c]];
      if (PUNCT.has(word))
        punctMark(ctx, word, bx + 18 * k + (fs * 1.15) / 2, ly + rowH / 2, fs, style.ink);
      else {
        ctx.fillStyle = style.ink;
        ctx.font = `400 ${fs}px "Libertinus Serif"`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(word, bx + 24 * k, ly + rowH / 2);
      }
      ctx.fillStyle = style.numColours[box];
      ctx.font = `600 ${fs * 1.1}px "Public Sans"`; // a weight the kit loads before the first frame
      ctx.textAlign = "center";
      ctx.fillText(String(counts[c]), bx + boxW - stripW / 2, ly + rowH / 2);
      ctx.globalAlpha = alpha;
    }
  }
  if (dots > 0) {
    ctx.globalAlpha = base * dots * 0.9;
    const d = Math.max(1.6, rowH * 0.6);
    for (let c = 0; c < M.m && M.firstPair[c] < pairs; c++) {
      const box = M.slot[c] % L.columns;
      const { sx, sy, ly } = lineY(L.lineOf[c]);
      if (!visible(sx, sy)) continue;
      // anywhere along its line: kept to its own box, the first box of
      // every line would line up into columns down the stack
      const jx = hash01(c) * (L.columns * boxW - d),
        jy = (hash01(c + 7919) - 0.5) * 0.5 * rowH;
      ctx.fillStyle = style.colours[box];
      ctx.fillRect(sx + prefixW + jx, ly + rowH / 2 + jy - d / 2, d, d);
    }
  }
  ctx.restore();
  return { sh, rowH, nSheets };
}
// deterministic noise in [0, 1) per index (never Math.random: frames reproduce)
const hash01 = (i) => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
