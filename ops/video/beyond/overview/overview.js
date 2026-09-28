// Overview (beyond): ops/video/beyond/scripts/overview.md. The website's
// landing video, shared by index.html (landscape) and
// compositions/portrait.html (9:16): one build(tl, S, T), branching on
// S.portrait. Nothing depends on side-by-side placement: in portrait the
// beats restack (grid over the strip, the row for "the" running down the
// frame, the tree growing downward), never a crop.
//
// It compresses the series' beats rather than rebuilding them: the book at
// machine speed (parts/stream.js), the morph (parts/morph.js, its steps cued
// on this line's words), the tree (parts/tree.js) and its pull-back into
// copies of itself (parts/making-tree.js's mesh). The gold thread through the
// pull-back and "the site" (lessons, tools, videos, drawn from the kit's
// paper objects) are its own. The tools beat pastes in The kookaburra, another of the
// ledger books, whose sheets come from the kit and whose grid and booklet
// come from parts/build-overview.py (window.OVERVIEW).

import * as C from "./kit/motion/canvas.js";
import { streamPairs, gridLander, pairBox, bracket, bracketSet } from "./parts/stream.js";
import { row, morph } from "./parts/morph.js";
import { tree, treeStyle, GOLD } from "./parts/tree.js";
import { mesh } from "./parts/making-tree.js";
import { WALK, tenFaces, paperLine } from "./parts/generation-walk.js";

const CSS = `
.ov-page { font-family: var(--font-tok); color: var(--ink); line-height: 1.45; }
.ov-cover { display: flex; flex-direction: column; align-items: center; font-family: var(--font-tok); color: var(--ink); }
.ov-year { position: absolute; left: 0; top: 0; font-family: var(--font-ui); font-weight: 600; color: var(--gold-2); white-space: nowrap; line-height: 1; }
.ov-name { position: absolute; left: 0; top: 0; font-family: var(--font-ui); color: var(--text-2); white-space: nowrap; line-height: 1; }
.ov-paste { position: absolute; font-family: var(--font-tok); color: var(--ink); line-height: 1.4; }
`;

export const build = (tl, S, T) => {
  const K = KIT,
    D = KIT_DATA,
    MG = MAGPIE,
    OV = OVERVIEW;
  const scene = document.getElementById("scene");
  const A = S.area,
    P = S.portrait;
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  treeStyle();

  // ---------------------------------------------------------------- helpers
  // appear without appear's scale, for things resting at a scale of their own
  const arrive = (els, t, { dy = 20, dur = 0.5, stagger = 0.06 } = {}) =>
    tl.fromTo(els, { opacity: 0, y: `+=${dy}` }, { opacity: 1, y: `-=${dy}` }, t, {
      dur,
      stagger,
      ease: "out-quart",
    });
  // (no yoyo: the engine's yoyo returns to an unresolved value)
  const pulse = (els, t, s = 1.15) => {
    tl.to(els, { scale: s, transformOrigin: "50% 50%" }, t, { dur: 0.22, ease: "out-quad" });
    tl.to(els, { scale: 1 }, t + 0.22, { dur: 0.25, ease: "in-out-quad" });
  };
  const flash = (els, prop, on, off, t, hold = 0.7) => {
    tl.to(els, { [prop]: on }, t, { dur: 0.2 });
    tl.to(els, { [prop]: off }, t + hold, { dur: 0.35 });
  };
  // a picture book's cover: the title and a fence along the bottom (as training-grid draws it)
  const cover = (parent, title, { x = 0, y = 0, w = 520, h = 640 } = {}) => {
    const d = K.el(
      "div",
      {
        class: "paper ov-cover",
        style: { width: `${w}px`, height: `${h}px`, padding: `${h * 0.14}px 40px 0` },
      },
      parent,
    );
    K.el(
      "div",
      {
        text: title,
        style: { fontSize: `${w * 0.16}px`, fontWeight: 600, lineHeight: 1.1, textAlign: "center" },
      },
      d,
    );
    const ph = h * 0.3;
    const s = K.svg(
      "svg",
      {
        width: w,
        height: ph,
        viewBox: `0 0 ${w} ${ph}`,
        style: "position: absolute; left: 0; bottom: 24px",
      },
      d,
    );
    K.svg("rect", { x: 30, y: ph * 0.45, width: w - 60, height: 10, fill: "#6b6b6b" }, s);
    K.svg("rect", { x: 30, y: ph * 0.75, width: w - 60, height: 10, fill: "#6b6b6b" }, s);
    for (let px = 44; px < w - 50; px += 38)
      K.svg(
        "path",
        {
          d: `M${px} ${ph} L${px} ${ph * 0.22} L${px + 11} ${ph * 0.12} L${px + 22} ${ph * 0.22} L${px + 22} ${ph} Z`,
          fill: "#8a8a8a",
        },
        s,
      );
    K.set(d, { x, y });
    return d;
  };
  // a pencil lying at an angle, its point at the layer's origin
  const pencil = (parent, { len = 300, angle = -40 } = {}) => {
    const L = K.layer(parent, 0, 0);
    const s = K.svg(
      "svg",
      {
        width: len + 40,
        height: 40,
        viewBox: `0 0 ${len + 40} 40`,
        style: "position: absolute; left: 0; top: -20px",
      },
      L,
    );
    K.svg("polygon", { points: "0 20 36 4 36 36", fill: "#e9dcc5" }, s);
    K.svg("polygon", { points: "0 20 12 15 12 25", fill: "#1a1a1a" }, s);
    K.svg("rect", { x: 36, y: 4, width: len - 40, height: 32, fill: "var(--gold)" }, s);
    K.svg("rect", { x: len - 4, y: 4, width: 44, height: 32, rx: 6, fill: "#d98c8c" }, s);
    K.set(L, { rotation: angle, opacity: 0 });
    return L;
  };
  // a flat card on the desk: a slide or a video frame
  const card = (parent, { w, h, x = 0, y = 0 }) => {
    const L = K.layer(parent, x, y);
    K.el(
      "div",
      {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: `${w}px`,
          height: `${h}px`,
          background: "#1c1c1c",
          border: "2px solid rgb(255 255 255 / 22%)",
          borderRadius: "10px",
        },
      },
      L,
    );
    return L;
  };
  // column words run up the page, so long words fit a narrow column (as training-grid)
  const rotateCols = (g, cell, head) => {
    const fs = Math.round(cell * 0.42);
    g.colHead.forEach((t, c) => {
      if (t.tagName !== "text") return;
      const X = head + c * cell + cell / 2 + fs * 0.33,
        Y = head - 16;
      const wrap = K.svg("g", { transform: `rotate(-90 ${X} ${Y})` }, g.svg);
      t.before(wrap);
      wrap.append(t);
      t.setAttribute("x", X);
      t.setAttribute("y", Y);
      t.setAttribute("text-anchor", "start");
    });
  };
  const drawAll = (g, t = 0) => g.cells.flat().forEach((c) => K.drawOn(tl, c.strokes, t, 0.01, 0));

  // the model
  const bg = K.bigrams(MG.words, MG.vocab);
  const theRow = MG.rows.the; // magpie 5, fence 6, postie 4, dog 4
  const options = theRow.map(([word, count]) => ({ word, count }));

  // ================================================================ line 0
  // a chat reply types itself one word at a time; the window folds flat onto
  // the desk into a strip of paper, and the next word writes on in pencil
  const CW = P ? 960 : 1200,
    CH = 300,
    CX = P ? A.x : (S.W - CW) / 2,
    CY = P ? 640 : 290;
  const panel = K.layer(scene, CX, CY);
  const panelBg = K.el(
    "div",
    {
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: `${CW}px`,
        height: `${CH}px`,
        background: "#161616",
        borderRadius: "22px",
        border: "1px solid rgb(255 255 255 / 10%)",
      },
    },
    panel,
  );
  K.set(panelBg, { transformOrigin: "50% 50%" });
  const bubble = K.el(
    "div",
    {
      style: {
        position: "absolute",
        left: "40px",
        right: "40px",
        top: "80px",
        height: "140px",
        background: "#2b2b2b",
        borderRadius: "18px",
      },
    },
    panel,
  );
  const typed = ["It", "sits", "on"].map((w) =>
    K.el(
      "span",
      {
        text: w,
        style: {
          position: "absolute",
          top: "38px",
          fontFamily: "var(--font-ui)",
          fontSize: "56px",
          lineHeight: 1,
          color: "var(--text)",
        },
      },
      bubble,
    ),
  );
  let tx = 36;
  const ends = typed.map((s) => {
    K.set(s, { x: tx, opacity: 0 });
    tx += s.offsetWidth + 16;
    return tx - 10;
  });
  const caret = K.el(
    "div",
    {
      style: {
        position: "absolute",
        left: 0,
        top: "36px",
        width: "4px",
        height: "60px",
        background: "var(--gold-2)",
      },
    },
    bubble,
  );
  K.set(caret, { x: 36, opacity: 0 });
  K.set(panel, { opacity: 0 });
  K.appear(tl, panel, 0.25, { y: 16 });
  const tType = [T.word(0, "write"), T.word(0, "Pick"), T.word(0, "write", 2)];
  const tFold = T.word(0, "And", 2);
  // the caret blinks while it waits, jumps after each word as it lands
  for (let t = 0.6, on = true; t < tFold; t += 0.42, on = !on)
    tl.set(caret, { opacity: on ? 1 : 0 }, t);
  typed.forEach((s, i) => {
    tl.fromTo(s, { opacity: 0, y: 6 }, { opacity: 1, y: 0 }, tType[i], {
      dur: 0.18,
      ease: "out-cubic",
    });
    tl.set(caret, { x: ends[i] }, tType[i]);
  });
  // the fold: the window flattens and whitens into the strip's shape
  const PW = P ? 960 : 1100,
    PH = 116;
  const paper = paperLine(scene, WALK.slice(1), { x: 0, y: 0, w: PW, h: PH, size: 62 });
  const PAPER0 = { x: CX + (CW - PW) / 2, y: CY + (CH - PH) / 2 };
  K.set(paper.el, { ...PAPER0, opacity: 0 });
  tl.to(bubble, { opacity: 0 }, tFold, { dur: 0.25 });
  tl.set(caret, { opacity: 0 }, tFold);
  tl.to(panelBg, { scaleY: PH / CH, scaleX: PW / CW, backgroundColor: "#ffffff" }, tFold + 0.1, {
    dur: 0.55,
    ease: "in-out-cubic",
  });
  tl.set(panel, { opacity: 0 }, tFold + 0.66);
  tl.set(paper.el, { opacity: 1 }, tFold + 0.65);
  [0, 1, 2].forEach((i) => K.write(tl, paper.words[i], tFold + 0.75 + i * 0.12));
  // the pencil comes in and writes the next word
  const pen = pencil(scene);
  const penAt = (i, place = PAPER0) => {
    const c = paper.centres({ ...place, scale: 1 })[i];
    return { x: c.x - 10, y: c.y + 22 };
  };
  tl.set(pen, penAt(2), 0);
  tl.to(pen, { opacity: 1 }, T.word(0, "exactly") - 0.2, { dur: 0.3 });
  tl.to(pen, penAt(3), T.word(0, "by"), { dur: 0.35, ease: "in-out-cubic" });
  K.write(tl, paper.words[3], T.word(0, "hand"));
  tl.to(pen, { x: `+=40`, y: "+=6" }, T.word(0, "hand"), { dur: 0.3, ease: "out-quad" });
  tl.to(pen, { opacity: 0 }, T.end(0) + 0.1, { dur: 0.3 });

  // ================================================================ line 1
  // the magpie book opens; its words lift off as tiles; two at a time, then
  // the whole book streams into a grid at machine speed
  tl.to(paper.el, { opacity: 0 }, T.start(1) - 0.5, { dur: 0.35 });
  const BX = P ? (S.W - 520) / 2 : 700,
    BY = P ? A.y + 430 : A.y + 40;
  const bookL = K.layer(scene, 0, 0);
  const firstWords = ["The", "magpie", "is", "back.", "It", "sits", "on", "the", "fence."];
  const pageEl = K.el(
    "div",
    {
      class: "paper ov-page",
      style: { width: "520px", height: "640px", padding: "56px", fontSize: "46px" },
    },
    bookL,
  );
  const spans = firstWords.map((t) => {
    const s = K.el("span", { text: t }, pageEl);
    pageEl.append(" ");
    return s;
  });
  spans[3].after(K.el("br", {}));
  K.set(pageEl, { x: BX, y: BY });
  spans.forEach(
    (sp) => (
      sp.setAttribute("data-layout-allow-overlap", ""),
      sp.setAttribute("data-layout-allow-occlusion", "")
    ),
  ); // under the cover until it opens
  const bookCover = cover(bookL, "The magpie", { x: BX, y: BY });
  K.set(bookCover, { transformOrigin: "0 50%" });
  K.set(bookL, { opacity: 0 });
  K.appear(tl, bookL, T.word(1, "picture") - 0.3, { y: 30 });
  const tOpen = T.word(1, "book") + 0.2;
  tl.to(bookCover, { scaleX: 0 }, tOpen, { dur: 0.35, ease: "in-quad" });
  tl.set(bookCover, { opacity: 0 }, tOpen + 0.35);

  // the strip: the whole book as tiles, lowercased
  const TS = { size: 40, gap: 12, padX: 16, maxW: 1e6 };
  const SX = A.x,
    SY = P ? A.y + 180 : A.y;
  const strip = K.tiles(scene, MG.words, { ...TS, x: SX, y: SY });
  K.set(
    strip.tiles.map((t) => t.el),
    { opacity: 0 },
  );
  const fromPage = [0, 1, 2, 3, 3, 4, 5, 6, 7, 8, 8]; // the page word each of the first tiles comes from
  const tLift = T.word(1, "Read") - 0.1;
  fromPage.forEach((a, j) => {
    const tile = strip.tiles[j],
      s = spans[a];
    const cx =
        BX + s.offsetLeft + s.offsetWidth / 2 + (K.isPunct(tile.text) ? s.offsetWidth / 2 - 10 : 0),
      cy = BY + s.offsetTop + s.offsetHeight / 2;
    tl.fromTo(
      tile.el,
      { opacity: 0, x: cx - SX - tile.w / 2, y: cy - SY - tile.h / 2, scale: 46 / 40 },
      { opacity: 1, x: tile.x, y: tile.y, scale: 1 },
      tLift + j * 0.06,
      { dur: 0.6, ease: "in-out-cubic" },
    );
  });
  tl.to(spans, { opacity: 0.15 }, tLift, { dur: 0.3, stagger: 0.06 });
  const onScreen = strip.tiles.filter((t, j) => j >= 11 && SX + t.x < S.W);
  K.appear(
    tl,
    onScreen.map((t) => t.el),
    tLift + 0.5,
    { y: 12, stagger: 0.02, dur: 0.35 },
  );
  // the rest of the book waits off the right edge
  const offScreen = strip.tiles.filter((t, j) => j >= 11 && SX + t.x >= S.W);
  tl.to(offScreen.map((t) => t.el), { opacity: 1 }, tLift + 0.5, { dur: 0.01 });
  tl.to(bookL, { opacity: 0 }, tLift + 0.6, { dur: 0.4 });

  // the grid, drawn large and fitted small
  const CELL = 60,
    HEAD = 150;
  const grid = K.grid(scene, bg, { x: 0, y: 0, cell: CELL, head: HEAD });
  const GW = grid.width;
  rotateCols(grid, CELL, HEAD);
  // the kit's tally groups sit from the cell's left; centre the ones with
  // more than five strokes so the second group stays in its box
  grid.cells.flat().forEach((c) => {
    const k = c.strokes.length;
    if (k <= 5) return;
    const sp = Math.max(8, Math.round(CELL * 0.09)),
      w = sp * 6 + (Math.min(k - 5, 4) - 1) * sp;
    K.set(c.g, { x: (CELL - w) / 2 - ((CELL - 5 * sp) / 2 + sp * 0.2) + sp * 0.4 });
  });
  K.set(
    grid.cells.flat().flatMap((c) => c.strokes),
    { opacity: 0 },
  );
  K.set([...grid.rowHead, ...grid.colHead], { opacity: 0 });
  const GP = P
    ? { x: (S.W - GW * 0.6) / 2, y: 390, s: 0.6 }
    : { x: (S.W - GW * 0.4) / 2, y: 170, s: 0.4 };
  K.set(grid.el, { x: GP.x, y: GP.y, scale: GP.s, opacity: 0 });
  const tCount = T.word(1, "count");
  arrive(grid.el, tCount - 0.6, { dy: 16 });

  // two words at a time: the bracket over the first pair
  const br = bracket(scene, { h: strip.size });
  const b0 = pairBox(strip, 0);
  bracketSet(tl, br, { ...b0, x: SX + b0.x, y: SY + b0.y }, 0);
  const tTwo = T.word(1, "two");
  tl.to(br.el, { opacity: 1 }, tTwo, { dur: 0.25 });
  tl.to([strip.tiles[0].el, strip.tiles[1].el], { y: -10 }, tTwo + 0.1, {
    dur: 0.2,
    ease: "out-cubic",
  });
  tl.to([strip.tiles[0].el, strip.tiles[1].el], { y: 0 }, tTwo + 0.3, {
    dur: 0.25,
    ease: "in-out-quad",
  });
  // then the whole book at machine speed
  const res = streamPairs(tl, scene, {
    strip,
    bracket: br,
    pairs: bg.pairs,
    t0: tCount,
    dur: 2.3,
    anchor: P ? 540 : 960,
    x0: SX,
    target: (p) => {
      const c = grid.cells[p.r][p.c];
      return { x: GP.x + c.cx * GP.s, y: GP.y + c.cy * GP.s };
    },
    land: gridLander(tl, grid, { seen: new Set() }),
  });
  const tStripOut = Math.max(res.end + 0.2, T.start(2) - 0.4);
  tl.to([br.el, ...strip.tiles.map((t) => t.el)], { opacity: 0 }, tStripOut, { dur: 0.35 });

  // ================================================================ line 2
  // the last word's row gives the choices; its tallies share out a die's faces
  const GS = P ? { x: A.x, y: A.y + 50, s: 0.5 } : { x: A.x, y: A.y, s: 0.38 };
  tl.to(grid.el, { x: GS.x, y: GS.y, scale: GS.s }, T.start(2) - 0.2, {
    dur: 0.8,
    ease: "in-out-cubic",
  });
  // the strip of paper comes back to the bottom of the desk
  const PAPER = P ? { x: A.x, y: 1390 } : { x: (S.W - PW) / 2, y: 690 };
  tl.set(paper.el, PAPER, T.word(2, "write") - 0.4);
  arrive(paper.el, T.word(2, "write"), { dy: 20 });
  const tLast = T.word(2, "last");
  flash(paper.words[3], "color", "#be830e", "#3a3a3a", tLast, 1.6);
  const rThe = bg.idx.get("the");
  tl.to(grid.rowBands[rThe], { opacity: 1 }, tLast + 0.2, { dur: 0.3 });

  // the row for "the" lifts out of the grid (running down the frame in portrait)
  const R = row(
    scene,
    "the",
    theRow,
    P ? { prefixW: 220, slotW: 260, headH: 200, rowH: 190 } : { x: 120, y: 60 },
  );
  const RB = R.geom.bot;
  const RP = P ? { x: A.x + A.w, y: A.y + 50, rotation: 90 } : { x: 120, y: 60, rotation: 0 };
  if (P) {
    K.set(R.el, RP);
    // everything that must read stays upright: the words, marks, numbers, slips
    const upright = [R.pre.g, ...R.words.map((w) => w.g), ...R.marks.map((m) => m.g), ...R.names];
    K.set(upright, { rotation: -90, transformOrigin: "50% 50%" });
    K.set(
      R.numbers.map((n) => n.el),
      { rotation: -90 },
    );
    R.slips.flat().forEach((o) => {
      K.set(o.el, { rotation: -90 });
      o.pile.rotation -= 90;
    });
  }
  const tLook = T.word(2, "look");
  const lift = K.el(
    "div",
    {
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100px",
        height: "100px",
        background: "var(--gold)",
        borderRadius: "4px",
        transformOrigin: "0 0",
      },
    },
    scene,
  );
  K.set(lift, { opacity: 0 });
  tl.set(
    lift,
    {
      x: GS.x,
      y: GS.y + (HEAD + rThe * CELL) * GS.s,
      scaleX: (GW * GS.s) / 100,
      scaleY: (CELL * GS.s) / 100,
    },
    tLook - 0.01,
  );
  tl.to(lift, { opacity: 0.6 }, tLook, { dur: 0.15 });
  tl.to(
    lift,
    { x: RP.x, y: RP.y, rotation: RP.rotation, scaleX: R.W / 100, scaleY: RB / 100 },
    tLook + 0.15,
    { dur: 0.8, ease: "in-out-cubic" },
  );
  tl.to(lift, { opacity: 0 }, tLook + 0.85, { dur: 0.4 });
  tl.fromTo(R.el, { opacity: 0 }, { opacity: 1 }, tLook + 0.6, { dur: 0.4 });
  R.drawMarks(tl, tLook + 0.6, 0.01, 0);
  tl.to(grid.el, { opacity: 0 }, tLook + 0.1, { dur: 0.5 });
  // what came after it: the four followers, in turn
  const followerText = R.words.map((w) => w.g.querySelector("text"));
  followerText.forEach((e, c) =>
    flash(e, "fill", "#be830e", "#1a1a1a", T.word(2, "after") + c * 0.15, 0.9),
  );

  // the dice strip: each follower's tallies share out the ten faces
  const bands = tenFaces(options);
  const dstrip = K.strip(scene, bands, { x: 0, y: 0, face: 80 });
  const DS = P ? { x: A.x, y: 750, s: 0.6 } : { x: 393, y: 340, s: 1 };
  K.set(dstrip.el, { x: DS.x, y: DS.y, scale: DS.s, opacity: 0 });
  const die = K.die(
    scene,
    P
      ? { x: A.x + 170, y: 860, size: 150 }
      : { x: DS.x + dstrip.width + 60, y: DS.y + 20, size: 150 },
  );
  K.set(die.el, { opacity: 0 });
  const tDraw = T.word(2, "draw");
  arrive(dstrip.el, tDraw - 0.35, { dy: 16 });
  const shadeBand = (i, t) => {
    const b = dstrip.bands[i];
    tl.set(dstrip.blocks[i], { opacity: 1 }, t);
    tl.fromTo(dstrip.blocks[i], { scaleX: 0, transformOrigin: "0 50%" }, { scaleX: 1 }, t, {
      dur: 0.4,
      ease: "out-cubic",
    });
    tl.to(dstrip.labels[i], { opacity: 1 }, t + 0.1, { dur: 0.3 });
    tl.to(dstrip.nums.slice(b.from, b.to + 1), { fill: "#ffffff" }, t + 0.2, { dur: 0.25 });
  };
  const markGold = (c, t, hold = 0.5) =>
    flash(R.marks[c].paths, "stroke", "#be830e", "#1a1a1a", t, hold);
  bands.forEach((_, i) => {
    const t = tDraw + 0.05 + i * 0.22;
    markGold(i, t - 0.1, 0.35);
    shadeBand(i, t);
  });
  // roll: nine, the band for "dog"; it writes on after "the"
  const tRoll = T.word(2, "counts") - 0.15;
  K.land(tl, die, 9, tRoll);
  pulse(dstrip.nums[9], tRoll + 0.35, 1.4);
  flash(followerText[3], "fill", "#be830e", "#1a1a1a", tRoll + 0.35, 0.8);
  tl.set(pen, penAt(3, PAPER), tRoll);
  tl.to(pen, { opacity: 1 }, tRoll, { dur: 0.25 });
  tl.to(pen, penAt(4, PAPER), tRoll + 0.2, { dur: 0.3, ease: "in-out-cubic" });
  K.write(tl, paper.words[4], T.word(2, "More") - 0.1);
  tl.to(pen, { opacity: 0 }, T.word(2, "More") + 0.4, { dur: 0.3 });
  // more counts, more likely: the two biggest counts hold the most faces
  const tMore = T.word(2, "More");
  [0, 1].forEach((c) => markGold(c, tMore + 0.1, 0.9));
  pulse([dstrip.blocks[0], dstrip.blocks[1]], T.word(2, "likely") - 0.1, 1.06);

  // ================================================================ line 3
  // the row morphs: tallies, ledger marks, counters, slips, numbers
  K.vanish(tl, [dstrip.el, die.el], T.start(3) - 0.35, { dur: 0.35 });
  const tTally = T.word(3, "tally");
  R.marks.forEach((m, c) => {
    tl.to(m.paths, { stroke: "#be830e" }, tTally + c * 0.1, { dur: 0.2 });
    tl.to(m.paths, { stroke: "#1a1a1a" }, tTally + c * 0.1 + 0.7, { dur: 0.3 });
  });
  const tLedger = T.word(3, "ledger");
  morph(tl, R, {
    ledger: tLedger - 0.1,
    colour: tLedger + 0.6,
    counters: T.word(3, "cup"),
    slips: T.word(3, "pile"),
    numbers: T.word(3, "just") - 0.1,
  });
  // one model: the same four followers, whatever they're made of
  followerText.forEach((e, c) =>
    flash(e, "fill", "#be830e", "#1a1a1a", T.word(3, "same") + c * 0.12, 0.8),
  );

  // ================================================================ lines 4-5
  // the tree: from the full stop, every path the counts allow, ". it sits on
  // the dog ." lit gold; then the pull-back until it's a fine mesh.
  // Everything here is drawn in a layer whose x runs with the words: across
  // in landscape, down the frame in portrait (the layer turned a quarter).
  const t4 = T.start(4);
  K.vanish(tl, [R.el, paper.el], T.end(3) + 0.4, { dur: 0.45 });
  const LW = P ? A.h : A.w,
    LH = P ? A.w : A.h;
  const wrap = K.layer(scene, P ? A.x + A.w : A.x, A.y);
  if (P) K.set(wrap, { rotation: 90 });
  const toStage = (u, v) => (P ? { x: A.x + A.w - v, y: A.y + u } : { x: A.x + u, y: A.y + v });
  const box = { x0: 70, x1: LW - 30, y0: 10, y1: LH - 10 };
  const tGrow = [T.word(4, "here's") - 0.1, T.word(4, "written")];
  const tWalk = T.word(4, "written") + 0.05,
    STEP = 0.15;
  const T3 = tree(tl, wrap, {
    rows: MG.rows,
    box,
    grow: tGrow,
    dim: { t: tWalk - 0.3, to: 0.4 },
    paths: [{ words: WALK, colour: GOLD, t0: tWalk, step: STEP }],
    canvasBox: { x: 0, y: 0, w: LW, h: LH },
  });
  K.set(T3.el, { opacity: 0 });
  tl.set(T3.el, { opacity: 1 }, tGrow[0] - 0.05);
  // the lit words, upright on the desk as the gold reaches them
  const walkNodes = T3.pathNodes(WALK);
  const litWords = walkNodes.map((n, k) => {
    const punct = K.isPunct(n.word);
    const e = K.el(
      "div",
      { class: `tree-word lit${punct ? " punct" : ""}`, ...(punct ? {} : { text: n.word }) },
      scene,
    );
    if (punct) K.punctTile(e, n.word, { fill: "var(--desk)" });
    const at = toStage(n.x, n.y);
    K.set(e, { x: at.x - e.offsetWidth / 2, y: at.y - e.offsetHeight / 2, opacity: 0 });
    tl.to(e, { opacity: 1 }, k ? tWalk + (k - 1) * STEP + STEP * 0.6 : t4 - 0.2, { dur: 0.2 });
    return e;
  });

  // the pull-back: the tree shrinks about the frame's centre (logarithmic on
  // scale) and turns out to be one of many like it (making-tree.js's mesh:
  // copies of its shape, few thick strokes each, receding). The gold keeps
  // going past the tree, one smooth thread through the copies.
  const ZOOM = { t: T.word(5, "real"), dur: T.word(5, "trillions") + 0.3 - T.word(5, "real"), to: 1 / 7, cx: LW / 2, cy: LH / 2 };
  const tZ0 = ZOOM.t;
  tl.to(litWords, { opacity: 0 }, tZ0 - 0.4, { dur: 0.3 });
  const M = mesh(tl, wrap, {
    nodes: T3.nodes,
    box,
    zoom: ZOOM,
    tiles: { r: 4, pitch: 1.12 },
    appear: { t: tZ0 + 0.8, dur: 0.8, ring: 0.45 },
    centre: { in: [tZ0 + 0.4, 1.2] },
    alpha: 0.45,
    minP: 0.02,
    minW: 2,
    canvasBox: { x: 0, y: 0, w: LW, h: LH },
  });
  K.set(M.el, { opacity: 0 });
  tl.set(M.el, { opacity: 1 }, tZ0);
  // the real tree shrinks with the mesh and hands over to its centre copy
  K.set(T3.el, { transformOrigin: "0 0" });
  tl.sample(T3.el, tZ0, ZOOM.dur, (p) => {
    const z = M.zAt(tZ0 + p * ZOOM.dur);
    return { x: ZOOM.cx * (1 - z), y: ZOOM.cy * (1 - z), scale: z };
  }, { ease: "linear", step: 0.005 });
  tl.to(T3.el, { opacity: 0 }, tZ0 + 0.4, { dur: 1.2, ease: "in-out-quad" });

  // the thread: the walk, six more words through the tree, then on in long
  // smooth curves past the edge of the widest view
  const ext = [...WALK];
  const r2 = C.rng(48);
  while (ext.length <= T3.DEPTH) {
    const opts = MG.rows[ext.at(-1)];
    const total = opts.reduce((s, [, c]) => s + c, 0);
    let x = r2() * total;
    ext.push(opts.find(([, c]) => (x -= c) < 0)[0]);
  }
  const thread = T3.pathNodes(ext).map((n) => ({ x: n.x, y: n.y }));
  const TH = box.y1 - box.y0,
    far = ZOOM.cx + (LW / 2) / ZOOM.to + LW;
  for (let x = box.x1 + (box.x1 - box.x0) * 0.35; x < far; x += (box.x1 - box.x0) * 0.35)
    thread.push({ x, y: LH / 2 + (r2() - 0.5) * TH * 0.5 });
  const walkLen = WALK.length - 1; // segments of the thread that are the walk
  // the level-tangent curve the tree draws its branches with, up to s
  const curveTo = (ctx, xa, ya, xb, yb, s = 1) => {
    const mx = (xa + xb) / 2;
    if (s >= 1) return ctx.bezierCurveTo(mx, ya, mx, yb, xb, yb);
    const L = (a, b) => a + (b - a) * s;
    const q1x = L(xa, mx), q1y = ya, rx = mx, ry = L(ya, yb);
    const q2x = L(q1x, rx), q2y = L(q1y, ry), ux = L(rx, L(mx, xb)), uy = L(ry, yb);
    ctx.bezierCurveTo(q1x, q1y, q2x, q2y, L(q2x, ux), L(q2y, uy));
  };
  const tThread = [tZ0 + 0.4, tZ0 + ZOOM.dur + 0.4];
  const tLoop = T.word(5, "same"),
    tLoopEnd = T.end(5) + 0.5;
  const threadLayer = C.canvas(tl, wrap, (ctx, t) => {
    if (t < tZ0 - 0.1 || t > T.end(5) + 1.5) return;
    const z = M.zAt(t);
    ctx.setTransform(ctx.getTransform().multiply(new DOMMatrix([z, 0, 0, z, ZOOM.cx * (1 - z), ZOOM.cy * (1 - z)])));
    const px = 1 / z; // one screen px in world units
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `rgb(${GOLD.join(" ")})`;
    ctx.lineWidth = (4 + z) * px;
    const segs = thread.length - 1;
    const upto = walkLen + (segs - walkLen) * C.phase(t, tThread[0], tThread[1] - tThread[0], "in-out-quad");
    ctx.beginPath();
    ctx.moveTo(thread[0].x, thread[0].y);
    for (let i = 1; i <= segs && i - 1 < upto; i++) {
      const a = thread[i - 1], b = thread[i];
      curveTo(ctx, a.x, a.y, b.x, b.y, Math.min(1, upto - (i - 1)));
    }
    ctx.stroke();
    // "the same loop": a bright point runs the thread
    if (t > tLoop && t < tLoopEnd + 0.4) {
      const u = C.phase(t, tLoop, tLoopEnd - tLoop, "in-out-quad") * segs;
      const i = Math.min(segs - 1, Math.floor(u)), f = u - i;
      const a = thread[i], b = thread[i + 1];
      const mx = (a.x + b.x) / 2;
      const bx = (1 - f) ** 3 * a.x + 3 * (1 - f) ** 2 * f * mx + 3 * (1 - f) * f * f * mx + f ** 3 * b.x;
      const by = (1 - f) ** 3 * a.y + 3 * (1 - f) ** 2 * f * a.y + 3 * (1 - f) * f * f * b.y + f ** 3 * b.y;
      ctx.globalAlpha = 1 - C.phase(t, tLoopEnd, 0.4);
      ctx.fillStyle = "#fff4d6";
      ctx.beginPath();
      ctx.arc(bx, by, 9 * px, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { x: 0, y: 0, w: LW, h: LH });
  K.set(threadLayer.el, { opacity: 0 });
  tl.set(threadLayer.el, { opacity: 1 }, tZ0 - 0.1);
  // the mesh dims under the thread for "the same loop"
  tl.to(M.el, { opacity: 0.45 }, tLoop - 0.2, { dur: 0.6, ease: "in-out-quad" });
  const tTreeOut = T.end(5) + 0.4;
  tl.to([M.el, threadLayer.el], { opacity: 0 }, tTreeOut, { dur: 0.45 });

  // ================================================================ line 6
  // a timeline draws on as one stroke, a pencil riding it: 1913 Markov,
  // 1948 Shannon, on to today
  const tlL = K.layer(scene, 0, 0);
  const TLW = P ? 1300 : 1450;
  const tlS = P ? { x: 300, y: A.y + 100 } : { x: 160, y: 330 };
  const fr = P ? [0.03, 0.46, 0.96] : [0.04, 0.34, 0.96];
  const along = (f) => (P ? { x: tlS.x, y: tlS.y + f * TLW } : { x: tlS.x + f * TLW, y: tlS.y });
  const tsvg = K.svg(
    "svg",
    {
      width: S.W,
      height: S.H,
      viewBox: `0 0 ${S.W} ${S.H}`,
      style: "position: absolute; left: 0; top: 0; overflow: visible",
    },
    tlL,
  );
  const end = along(1);
  const stroke = K.svg(
    "path",
    {
      d: `M${tlS.x} ${tlS.y} L${end.x} ${end.y}`,
      class: "draw",
      stroke: "var(--gold)",
      "stroke-width": 8,
    },
    tsvg,
  );
  K.prepDraw([stroke]);
  const dots = fr.map((f) => {
    const p = along(f);
    const d = K.svg("circle", { cx: p.x, cy: p.y, r: 16, fill: "var(--gold)" }, tsvg);
    K.set(d, { opacity: 0, transformOrigin: "50% 50%" });
    return d;
  });
  // in portrait the pencil leans left, clear of the labels beside the line
  const tlPen = pencil(scene, { len: 220, angle: P ? -140 : -40 });
  // the pencil's point rides the stroke's head: at 1913, at 1948, then today
  const tStart6 = T.start(6) + 0.1;
  const keys = [
    [tStart6, 0],
    [T.word(6, "1913"), fr[0]],
    [T.word(6, "Shannon") - 0.2, fr[1]],
    [T.word(6, "everyone"), fr[2]],
    [T.word(6, "everyone") + 0.5, 1],
  ];
  const fAt = (t) => {
    for (let i = 1; i < keys.length; i++) {
      const [ta, fa] = keys[i - 1],
        [tb, fb] = keys[i];
      if (t <= tb) return fa + (fb - fa) * C.phase(t, ta, tb - ta, "in-out-quad");
    }
    return 1;
  };
  const Ltot = TLW;
  tl.set(tlL, { opacity: 1 }, tStart6 - 0.5);
  tl.sample(
    stroke,
    tStart6,
    keys.at(-1)[0] - tStart6,
    (p) => ({ strokeDashoffset: Ltot * (1 - fAt(tStart6 + p * (keys.at(-1)[0] - tStart6))) }),
    { ease: "linear", step: 0.005 },
  );
  tl.sample(
    tlPen,
    tStart6,
    keys.at(-1)[0] - tStart6,
    (p) => {
      const q = along(fAt(tStart6 + p * (keys.at(-1)[0] - tStart6)));
      return { x: q.x, y: q.y };
    },
    { ease: "linear", step: 0.005 },
  );
  tl.to(tlPen, { opacity: 1 }, tStart6 - 0.3, { dur: 0.3 });
  // station labels: the year in gold, the name under it (beside it in portrait)
  const label = (cls, text, size, at) => {
    const e = K.el("div", { class: cls, text, style: { fontSize: `${size}px` } }, tlL);
    K.set(e, { x: at.x, y: at.y, opacity: 0 });
    return e;
  };
  const stationAt = (f, dy) => {
    const p = along(f);
    return P ? { x: p.x + 50, y: p.y - 30 + dy } : { x: p.x - 20, y: p.y + 50 + dy };
  };
  const y1913 = label("ov-year", "1913", 64, stationAt(fr[0], 0));
  const nMarkov = label("ov-name", "Andrey Markov", 44, stationAt(fr[0], 80));
  const y1948 = label("ov-year", "1948", 64, stationAt(fr[1], 0));
  const nShannon = label("ov-name", "Claude Shannon", 44, stationAt(fr[1], 80));
  tl.to(dots[0], { opacity: 1 }, T.word(6, "1913"), { dur: 0.2 });
  pulse(dots[0], T.word(6, "1913"), 1.4);
  K.appear(tl, y1913, T.word(6, "1913"), { y: 12 });
  K.appear(tl, nMarkov, T.word(6, "Markov"), { y: 12 });
  // Markov's count: vowel or consonant next, a two-by-two grid
  const vcBg = {
    vocab: ["vowel", "consonant"],
    counts: [
      [0, 0],
      [0, 0],
    ],
    pairs: [],
    idx: new Map([
      ["vowel", 0],
      ["consonant", 1],
    ]),
  };
  const vc = K.grid(tlL, vcBg, { x: 0, y: 0, cell: 90, head: 250 });
  rotateCols(vc, 90, 250);
  const vcAt = P ? stationAt(fr[0], 160) : { x: along(fr[0]).x - 20, y: tlS.y + 200 };
  K.set(vc.el, { x: vcAt.x, y: vcAt.y, scale: P ? 0.8 : 0.62, opacity: 0 });
  arrive(vc.el, T.word(6, "counting") - 0.1);
  tl.to(vc.rowBands[0], { opacity: 1 }, T.word(6, "vowel"), { dur: 0.25 });
  tl.to(vc.colBands[1], { opacity: 1 }, T.word(6, "consonant"), { dur: 0.25 });
  tl.to([vc.rowBands[0], vc.colBands[1]], { opacity: 0 }, T.word(6, "Claude") - 0.2, { dur: 0.3 });
  tl.to(dots[1], { opacity: 1 }, T.word(6, "Shannon") - 0.1, { dur: 0.2 });
  pulse(dots[1], T.word(6, "Shannon") - 0.1, 1.4);
  K.appear(tl, nShannon, T.word(6, "Shannon"), { y: 12 });
  K.appear(tl, y1948, T.word(6, "1948"), { y: 12 });
  // Shannon's count: words, two at a time
  const pair = K.tiles(tlL, ["sits", "on"], { size: 40, gap: 12, padX: 16 });
  const pairAt = P ? stationAt(fr[1], 160) : { x: along(fr[1]).x - 20, y: tlS.y + 200 };
  K.set(pair.el, { x: pairAt.x, y: pairAt.y });
  K.set(
    pair.tiles.map((t) => t.el),
    { opacity: 0 },
  );
  K.appear(
    tl,
    pair.tiles.map((t) => t.el),
    T.word(6, "words"),
    { y: 12, stagger: 0.12 },
  );
  const pairBr = bracket(tlL, { h: pair.size, pad: 8 });
  bracketSet(tl, pairBr, { x: pairAt.x, y: pairAt.y, w: pair.width, h: pair.size }, 0);
  tl.to(pairBr.el, { opacity: 1 }, T.word(6, "words") + 0.35, { dur: 0.25 });
  // today: everyone else's go, the strip of paper with its sentence
  tl.to(dots[2], { opacity: 1 }, T.word(6, "everyone"), { dur: 0.2 });
  pulse(dots[2], T.word(6, "everyone"), 1.4);
  const today = paperLine(tlL, WALK.slice(1), { x: 0, y: 0, w: 640, h: 90, size: 46 });
  const todayAt = P
    ? { x: along(fr[2]).x + 50, y: along(fr[2]).y - 45 }
    : { x: along(fr[2]).x - 600, y: tlS.y + 200 };
  K.set(today.el, { ...todayAt, opacity: 0 });
  today.words.forEach((w) => K.set(w, { opacity: 1 }));
  arrive(today.el, T.word(6, "everyone") + 0.2);
  tl.to(tlPen, { opacity: 0 }, T.word(6, "go") + 0.1, { dur: 0.3 });
  K.set(tlL, { opacity: 0 });
  tl.to(tlL, { opacity: 0 }, T.word(7, "has") - 0.2, { dur: 0.4 });

  // ================================================================ line 7
  // the site, drawn from the desk's objects: the lessons, the slides, the
  // printouts, a short video for every step; then the tools: a text pasted
  // in, and out come its grid, its ledger sheet and its booklet
  const siteL = K.layer(scene, 0, 0);
  // slots: a row of four in landscape, two by two in portrait
  const slot4 = (i) =>
    P
      ? { x: A.x + (i % 2) * 500, y: A.y + 190 + Math.floor(i / 2) * 600, w: 460, h: 520 }
      : { x: A.x + i * 460, y: 200, w: 420, h: 440 };
  const fitIn = (el, w, h, sl, pad = 0) => {
    const s = Math.min((sl.w - 2 * pad) / w, (sl.h - 2 * pad) / h);
    K.set(el, { x: sl.x + (sl.w - w * s) / 2, y: sl.y + (sl.h - h * s) / 2, scale: s });
    return s;
  };
  // the lessons: a page of the plan, ruled with its steps
  const lesson = K.layer(siteL, 0, 0);
  {
    const pg = K.el("div", { class: "paper", style: { width: "360px", height: "460px" } }, lesson);
    K.el(
      "div",
      {
        style: {
          position: "absolute",
          left: "36px",
          top: "40px",
          width: "200px",
          height: "22px",
          background: "var(--gold)",
          borderRadius: "4px",
        },
      },
      pg,
    );
    for (let i = 0; i < 9; i++)
      K.el(
        "div",
        {
          style: {
            position: "absolute",
            left: `${i % 3 ? 60 : 36}px`,
            top: `${100 + i * 36}px`,
            width: `${(i % 3 ? 220 : 250) - ((i * 37) % 70)}px`,
            height: "12px",
            background: "#d6d6d6",
            borderRadius: "3px",
          },
        },
        pg,
      );
  }
  fitIn(lesson, 360, 460, slot4(0));
  // the slides: a dark slide with the decks' grid on it
  const slide = card(siteL, { w: 480, h: 270 });
  {
    const gbg = K.bigrams(K.split(D.grid.tokens), K.split(D.grid.vocab));
    const sg = K.grid(slide, gbg, { x: 0, y: 0, cell: 60, head: 90 });
    drawAll(sg);
    K.set(sg.el, { x: (480 - sg.width * 0.62) / 2, y: (270 - sg.height * 0.62) / 2, scale: 0.62 });
  }
  fitIn(slide, 480, 270, slot4(1));
  // the printouts: a magpie ledger sheet
  const LM = D.ledger["the-magpie"];
  const printL = K.layer(siteL, 0, 0);
  const sh = K.sheet(printL, LM.sheets[4].pages[0].slice(0, 4), D.palette, {
    w: 1100,
    rowH: 120,
    header: [LM.sheets[4].range[0].join(" "), LM.sheets[4].range[1].join(" ")],
    title: LM.title,
    fontSize: 40,
    prefixW: 200,
  });
  drawAll({ cells: sh.rows.map((r) => r.cells) });
  fitIn(printL, 1100, sh.height, slot4(2));
  // a short video: a frame on the desk with a play mark
  const video = card(siteL, { w: 480, h: 270 });
  {
    const s = K.svg(
      "svg",
      {
        width: 480,
        height: 270,
        viewBox: "0 0 480 270",
        style: "position: absolute; left: 0; top: 0",
      },
      video,
    );
    K.svg(
      "circle",
      { cx: 240, cy: 135, r: 62, fill: "none", stroke: "var(--gold)", "stroke-width": 6 },
      s,
    );
    K.svg("polygon", { points: "222 105 222 165 272 135", fill: "var(--gold)" }, s);
  }
  fitIn(video, 480, 270, slot4(3));
  const four = [lesson, slide, printL, video];
  // "for every step": each has more of its kind behind it
  const behind = four.map((el) => {
    const s = K.get(el, "scale"),
      x = K.get(el, "x"),
      y = K.get(el, "y");
    const w = (el === lesson ? 360 : el === printL ? 1100 : 480) * s,
      h = (el === lesson ? 460 : el === printL ? sh.height : 270) * s;
    const dark = el === slide || el === video;
    return [2, 1].map((k) => {
      const b = K.el(
        "div",
        {
          style: {
            position: "absolute",
            left: 0,
            top: 0,
            width: `${w}px`,
            height: `${h}px`,
            borderRadius: dark ? "10px" : "3px",
            background: dark ? "#1c1c1c" : "#f0f0f0",
            border: dark ? "2px solid rgb(255 255 255 / 16%)" : "1px solid rgb(0 0 0 / 20%)",
          },
        },
        siteL,
      );
      siteL.insertBefore(b, siteL.firstChild);
      K.set(b, { x: x + k * 16, y: y - k * 16, opacity: 0 });
      return b;
    });
  });
  K.set(four, { opacity: 0 });
  const t7 = [
    T.word(7, "lessons"),
    T.word(7, "slides"),
    T.word(7, "printouts"),
    T.word(7, "video"),
  ];
  four.forEach((el, i) => arrive(el, t7[i] - 0.1));
  behind.forEach((bs, i) => arrive(bs, T.word(7, "every") + i * 0.08, { dy: 10, stagger: 0.1 }));
  const tTools = T.word(7, "tools");
  tl.to(siteL, { opacity: 0, y: -40 }, tTools - 0.5, { dur: 0.45, ease: "in-cubic" });

  // the tool: a sheet of paper, a text pasted in
  const toolL = K.layer(scene, 0, 0);
  const TB = P ? { x: A.x, y: A.y, w: 960, h: 440 } : { x: 260, y: A.y + 10, w: 1400, h: 280 };
  const tbox = K.el(
    "div",
    {
      class: "paper",
      style: { width: `${TB.w}px`, height: `${TB.h}px`, border: "4px solid var(--gold)" },
    },
    toolL,
  );
  K.set(tbox, { x: TB.x, y: TB.y });
  const paste = K.el(
    "div",
    {
      class: "ov-paste",
      text: OV.text,
      style: { left: "36px", right: "36px", top: "28px", fontSize: P ? "38px" : "36px" },
    },
    tbox,
  );
  K.set(paste, { opacity: 0 });
  K.set(toolL, { opacity: 0 });
  arrive(toolL, tTools - 0.05);
  tl.set(paste, { opacity: 1 }, T.word(7, "paste") + 0.1);
  pulse(tbox, T.word(7, "paste") + 0.1, 1.02);
  // out come its grid, its sheet and its booklet
  const slot3 = (i) =>
    P ? { x: A.x, y: 540 + i * 330, w: 960, h: 310 } : { x: A.x + i * 610, y: 350, w: 580, h: 470 };
  const kbg = K.bigrams(OV.words, OV.vocab);
  const kgrid = K.grid(toolL, kbg, { x: 0, y: 0, cell: 30, head: 110 });
  rotateCols(kgrid, 30, 110);
  drawAll(kgrid);
  const KL = D.ledger["outdoors-kookaburra"];
  const ksheet = K.sheet(toolL, KL.sheets[0].pages[0].slice(0, 4), D.palette, {
    w: 1100,
    rowH: 120,
    header: [KL.sheets[0].range[0].join(" "), KL.sheets[0].range[1].join(" ")],
    title: KL.title,
    fontSize: 40,
    prefixW: 200,
  });
  drawAll({ cells: ksheet.rows.map((r) => r.cells) });
  // the booklet: its cover and its first page of entries, side by side
  const bk = K.layer(toolL, 0, 0);
  const BKH = 600,
    pg0 = OV.pages[0],
    BKW = (pg0.w / pg0.h) * BKH;
  [1, 4].forEach((n, i) => {
    const f = K.el(
      "div",
      {
        class: "paper",
        style: { width: `${BKW}px`, height: `${BKH}px`, overflow: "hidden", borderRadius: "3px" },
      },
      bk,
    );
    K.set(f, { x: i * (BKW + 8), y: 0 });
    K.el(
      "img",
      {
        src: `parts/generated/overview/pages/sheet-00${n}.png`,
        style: { position: "absolute", left: 0, top: 0, width: `${BKW}px`, height: `${BKH}px` },
      },
      f,
    );
  });
  const outs = [
    [kgrid.el, kgrid.width, kgrid.height, T.word(7, "grids")],
    [ksheet.el, 1100, ksheet.height, T.word(7, "sheets")],
    [bk, 2 * BKW + 8, BKH, T.word(7, "booklets")],
  ];
  outs.forEach(([el, w, h, t], i) => {
    const s = fitIn(el, w, h, slot3(i), 6);
    const x = K.get(el, "x"),
      y = K.get(el, "y");
    K.set(el, { opacity: 0 });
    // each slides out from under the tool's sheet
    tl.fromTo(
      el,
      { opacity: 0, x: TB.x + TB.w / 2 - (w * s * 0.3) / 2, y: TB.y + TB.h / 2, scale: s * 0.3 },
      { opacity: 1, x, y, scale: s },
      t - 0.2,
      { dur: 0.6, ease: "out-cubic" },
    );
  });
  toolL.append(tbox); // the tool's sheet lies over what comes out of it
  tl.to(toolL, { opacity: 0 }, T.end(7) + 0.3, { dur: 0.45 });

  // ================================================================ line 8
  // llmsunplugged.org over the desk, the magpie book beside it, the strip of
  // paper with the sentence we wrote
  const endL = K.layer(scene, 0, 0);
  const endCover = cover(
    endL,
    "The magpie",
    P
      ? { x: (S.W - 440) / 2, y: A.y + 290, w: 440, h: 540 }
      : { x: 180, y: A.y + 70, w: 440, h: 540 },
  );
  const url = K.el(
    "div",
    {
      class: "wordmark",
      text: "llmsunplugged.org",
      style: { position: "absolute", left: 0, top: 0, fontSize: P ? "92px" : "104px" },
    },
    endL,
  );
  const urlAt = P ? { x: (S.W - url.offsetWidth) / 2, y: 970 } : { x: 760, y: 250 };
  K.set(url, { ...urlAt, opacity: 0 });
  const endPaper = paperLine(endL, WALK.slice(1), {
    x: 0,
    y: 0,
    w: P ? 900 : 1000,
    h: 116,
    size: 62,
  });
  K.set(endPaper.el, P ? { x: (S.W - 900) / 2, y: 1150 } : { x: 760, y: 450 });
  endPaper.words.forEach((w) => K.set(w, { opacity: 1 }));
  K.set([endCover, endPaper.el], { opacity: 0 });
  const t8 = T.start(8);
  arrive(endCover, t8 + 0.1);
  arrive(endPaper.el, t8 + 0.6);
  // the scratch alignment starts the address late (after a long "at"), so it
  // comes up as "at" ends, at full strength in 0.3 s, and holds
  arrive(url, T.wordEnd(8, "at"), { dy: 12, dur: 0.3 });
  const cb = P
    ? { x: (S.W - 440) / 2, y: A.y + 290, w: 440, h: 540 }
    : { x: 180, y: A.y + 70, w: 440, h: 540 };
  const coverRing = K.ring(endL, { x: cb.x - 14, y: cb.y - 14, w: cb.w + 28, h: cb.h + 28 });
  tl.to(coverRing.el, { opacity: 1 }, T.word(8, "picture"), { dur: 0.3 });
};
