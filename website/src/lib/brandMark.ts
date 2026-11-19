/**
 * The videos' end card (`K.endCard` in ops/video/_kit/kit.js) for a deck
 * slide: the site's brick field, the five title tokens lighting and sliding in
 * to spell LLMs Unplugged, each flipping to its 4x4 dot grid (its token id in
 * binary), the grids flying together into the lockup's grid, the wordmark
 * beside it, and the URL and YouTube handle below. Same timeline and engine as
 * the video; the field is the site's 960x540 reference rather than the video
 * stage, and the desk cover and scene hand-off are dropped because a slide has
 * no scene underneath. Change the two together.
 *
 * `lockupOnly` keeps just the second half: the lockup's grid with the "LL"
 * dots, the wordmark, the contact row and the glint, with no brick field.
 */
import { type Controller, ease, set, svg, timeline } from "astromotion/video/motion.js";
import { TITLE_TINTS, TITLE_TOKENS, tokenBits } from "./token-logo";

export interface Brand {
  wordmark: { d: string; transform: string };
  lockupW: number;
  lockupH: number;
}

/** The lockup's wordmark outline and the transform that sets it beside the grid. */
export function parseLockup(lockupSvg: string): Brand {
  const m = lockupSvg.match(/<g transform="([^"]+)">\s*<path d="([^"]+)"/);
  const view = lockupSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!m || !view) throw new Error("lockup.svg: no wordmark group or viewBox");
  return {
    wordmark: { transform: m[1], d: m[2] },
    lockupW: Number(view[1]),
    lockupH: Number(view[2]),
  };
}

export const FW = 960;
export const FH = 540;

const TL = {
  gap: 3,
  brickH: (540 - 15 * 3) / 16,
  charW: 12,
  pad: 10,
  assCharW: 74,
  assH: 145,
  assGap: 14,
  // the video's lockup is 150 stage px over a 1.65x field scale: keep its share of the height
  lockupH: 91,
};

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const widthOf = (r: number) =>
  r < 0.1 ? 1 : r < 0.3 ? 2 : r < 0.55 ? 3 : r < 0.75 ? 4 : r < 0.88 ? 5 : r < 0.95 ? 6 : 7;

// a token's id as a 4x4 grid of dots, in a box `size` units square
const dotsOf = (
  parent: Element,
  id: number,
  box: { x: number; y: number; size: number },
  on: string,
  off: string,
) => {
  const d = svg("g", {}, parent);
  tokenBits(id).forEach((bit, j) =>
    svg(
      "circle",
      {
        cx: box.x + ((j % 4) * 4.5 + 2.25) * (box.size / 18),
        cy: box.y + (Math.floor(j / 4) * 4.5 + 2.25) * (box.size / 18),
        r: 1.5 * (box.size / 18),
        fill: bit ? on : off,
      },
      d,
    ),
  );
  return d;
};

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Build the card into `s` (an empty svg with viewBox 0 0 960 540) and return
 * its paused controller. Call it while the svg is rendered: the contact row
 * measures its text.
 */
export function buildBrandMark(
  s: SVGSVGElement,
  B: Brand,
  { lockupOnly = false }: { lockupOnly?: boolean } = {},
): Controller {
  const rng = mulberry32(42);
  const count = Math.round(270 * 1.1);
  const titleAt = new Map<number, number>();
  while (titleAt.size < 5) {
    const i = Math.floor(rng() * count);
    if (!titleAt.has(i)) titleAt.set(i, titleAt.size);
  }
  const bricks = Array.from({ length: count }, (_, i) => {
    const ti = titleAt.get(i);
    return ti !== undefined
      ? { id: TITLE_TOKENS[ti].id, chars: TITLE_TOKENS[ti].text.length, ti }
      : { id: Math.floor(rng() * 49744) + 256, chars: widthOf(rng()), ti: -1 };
  });
  // shuffled rows, as the site lays its field
  const order = bricks.map((_, i) => i);
  const sh = mulberry32(7);
  for (let j = order.length - 1; j > 0; j--) {
    const q = Math.floor(sh() * (j + 1));
    [order[j], order[q]] = [order[q], order[j]];
  }
  const pos: Box[] = [];
  let x = 0,
    y = 0;
  for (const i of order) {
    const w = TL.pad + bricks[i].chars * TL.charW;
    if (x + w > FW && x > 0) {
      x = 0;
      y += TL.brickH + TL.gap;
    }
    pos[i] = { x, y, w, h: TL.brickH };
    x += w + TL.gap;
  }
  // the title, assembled in two lines at the middle
  const ass: Box[] = [];
  let cy = (FH - (2 * TL.assH + TL.assGap)) / 2;
  for (const word of [0, 1]) {
    const line = TITLE_TOKENS.map((t, i) => ({ t, i })).filter(({ t }) => t.word === word);
    const lw = line.reduce((n, { t }) => n + t.text.length, 0) * TL.assCharW;
    let cx = (FW - lw) / 2;
    for (const { t, i } of line) {
      const w = t.text.length * TL.assCharW;
      ass[i] = { x: cx, y: cy, w, h: TL.assH };
      cx += w;
    }
    cy += TL.assH + TL.assGap;
  }

  s.replaceChildren();
  set(s, { opacity: 0 });
  const field = svg("g", {}, s);
  const titles: { g: SVGGElement; p: Box; rect: SVGRectElement }[] = [];
  if (!lockupOnly)
    bricks.forEach((b, i) => {
      const p = pos[i];
      // the video's field is wider, so its brick count overflows this one by
      // two rows: clip them here (the title bricks all land higher up)
      if (b.ti < 0 && p.y + p.h > FH) return;
      const bg = svg("g", {}, b.ti < 0 ? field : s);
      const rect = svg(
        "rect",
        { x: p.x, y: p.y, width: p.w, height: p.h, rx: 3, class: "brick-bg" },
        bg,
      );
      dotsOf(
        bg,
        b.id,
        { x: p.x + (p.w - 18) / 2, y: p.y + (p.h - 18) / 2, size: 18 },
        "rgb(255 255 255 / 45%)",
        "rgb(255 255 255 / 10%)",
      );
      if (b.ti >= 0) titles[b.ti] = { g: bg, p, rect };
    });

  // the lockup: its 28-unit grid (built before the tokens, so the dots that
  // fly into it land on top), then the wordmark, at the middle
  const ls = Math.min(TL.lockupH / B.lockupH, (0.8 * FW) / B.lockupW);
  const lx = (FW - B.lockupW * ls) / 2,
    ly = (FH - B.lockupH * ls) / 2 - 20;
  const lockAt = `translate(${lx} ${ly}) scale(${ls})`;
  const lockup = svg("g", { transform: lockAt }, s);
  const well = svg("rect", { width: 28, height: 28, rx: 4, fill: "#1a1a1a" }, lockup);
  // without the field, the "LL" dots are drawn in the grid rather than flown in
  const llBits = tokenBits(TITLE_TOKENS[0].id);
  const llDots = lockupOnly
    ? llBits.map((bit, j) =>
        svg(
          "circle",
          {
            cx: 5 + 6 * (j % 4),
            cy: 5 + 6 * Math.floor(j / 4),
            r: 2,
            fill: bit ? TITLE_TINTS[0] : "rgb(255 255 255 / 8%)",
          },
          lockup,
        ),
      )
    : [];

  // the assembled faces: a tinted brick, the token's text, and its bit grid
  const faces = (lockupOnly ? [] : TITLE_TOKENS).map((t, i) => {
    const a = ass[i];
    const f = svg("g", {}, s);
    const face = svg(
      "rect",
      { x: a.x + 3, y: a.y, width: a.w - 6, height: a.h, rx: 6, fill: TITLE_TINTS[i] },
      f,
    );
    const label = svg(
      "text",
      {
        x: a.x + a.w / 2,
        y: a.y + a.h / 2,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": a.h * 0.62,
        "font-weight": 600,
        fill: "#fff",
        text: t.text,
      },
      f,
    );
    const D = a.h * 0.62;
    const bits = dotsOf(
      f,
      t.id,
      { x: a.x + (a.w - D) / 2, y: a.y + (a.h - D) / 2, size: D },
      "rgb(255 255 255 / 92%)",
      "rgb(255 255 255 / 18%)",
    );
    set(f, { opacity: 0, transformOrigin: "50% 50%" });
    set(bits, { opacity: 0 });
    return { f, face, label, bits, D };
  });

  // the wordmark moves in an outer group: an animated element's own transform
  // attribute would be read against its (huge) fill-box
  const wm = svg("g", {}, s);
  svg(
    "path",
    { d: B.wordmark.d, fill: "#fff" },
    svg("g", { transform: `${lockAt} ${B.wordmark.transform}` }, wm),
  );
  // the contacts under the lockup, one row no wider than it: the URL, a rule,
  // then the channel as a gold YouTube mark and its handle
  const FS = 44,
    mid = -0.36 * FS; // the cap-height middle, for centring marks on the text
  const row = svg("g", {}, s);
  const words = (at: number, text: string) =>
    svg("text", { x: at, y: 0, "font-size": FS, fill: "var(--anu-gold-2)", text }, row);
  const url = words(0, "llmsunplugged.org");
  let rx = url.getComputedTextLength() + 0.9 * FS;
  const rule = svg(
    "rect",
    { x: rx, y: mid - 0.5 * FS, width: 2, height: FS, fill: "rgb(229 169 48 / 45%)" },
    row,
  );
  rx += 2 + 0.9 * FS;
  const yh = 0.74 * FS,
    yw = 1.42 * yh;
  const yt = svg("g", {}, row);
  svg(
    "rect",
    { x: rx, y: mid - yh / 2, width: yw, height: yh, rx: 0.24 * yh, fill: "var(--anu-gold-2)" },
    yt,
  );
  const px = rx + yw / 2 - 0.1 * yh;
  svg(
    "polygon",
    {
      points: `${px},${mid - 0.2 * yh} ${px + 0.34 * yh},${mid} ${px},${mid + 0.2 * yh}`,
      fill: "var(--color-bg)",
    },
    yt,
  );
  rx += yw + 0.32 * FS;
  const handle = words(rx, "@llmsunplugged");
  const rowW = rx + handle.getComputedTextLength();
  const rs = Math.min(1, (B.lockupW * ls) / rowW);
  row.setAttribute(
    "transform",
    `translate(${(FW - rowW * rs) / 2} ${ly + B.lockupH * ls + 90}) scale(${rs})`,
  );
  set([well, wm, url, rule, yt, handle, llDots], { opacity: 0 });
  const lockDot = (j: number) => ({
    x: lx + (5 + 6 * (j % 4)) * ls,
    y: ly + (5 + 6 * Math.floor(j / 4)) * ls,
  });

  // ---- the timeline
  const tl = timeline();
  tl.to(s, { opacity: 1 }, 0, { dur: 0.6 });
  // the title tokens light and slide into place
  titles.forEach(({ rect }, i) =>
    tl.to(rect, { fill: TITLE_TINTS[i] }, 0.7 + i * 0.08, { dur: 0.3 }),
  );
  const tSlide = 1.2;
  titles.forEach(({ g: bg, p }, i) => {
    const a = ass[i];
    set(bg, { transformOrigin: "0 0" });
    tl.to(bg, { x: a.x - p.x, y: a.y - p.y, opacity: 0 }, tSlide + i * 0.08, {
      dur: 0.9,
      ease: "in-out-cubic",
    });
    tl.to(faces[i].f, { opacity: 1 }, tSlide + 0.55 + i * 0.08, { dur: 0.35 });
  });
  tl.to(field, { opacity: 0.35 }, tSlide, { dur: 0.6 });
  // each token flips to its number, as dots
  const tFlip = 2.6;
  faces.forEach(({ f, label, bits }, i) => {
    const t = tFlip + i * 0.12;
    tl.to(f, { scaleY: 0 }, t, { dur: 0.16, ease: "in-quad" });
    tl.set(label, { opacity: 0 }, t + 0.16);
    tl.set(bits, { opacity: 1 }, t + 0.16);
    tl.to(f, { scaleY: 1 }, t + 0.16, { dur: 0.2, ease: "out-quad" });
  });
  // the five grids fly together into the lockup's grid; "LL" stays
  const tMerge = 3.7;
  tl.to(field, { opacity: 0 }, tMerge, { dur: 0.5 });
  faces.forEach(({ face, bits, D }, i) => {
    tl.to(face, { opacity: 0 }, tMerge, { dur: 0.35 });
    [...bits.children].forEach((c, j) => {
      const to = lockDot(j);
      set(c, { transformOrigin: "50% 50%" });
      tl.to(
        c,
        {
          x: to.x - Number(c.getAttribute("cx")),
          y: to.y - Number(c.getAttribute("cy")),
          scale: (2 * ls) / (1.5 * (D / 18)),
        },
        tMerge + i * 0.05 + (j % 4) * 0.02,
        { dur: 0.8, ease: "in-out-cubic" },
      );
      if (i > 0) tl.to(c, { opacity: 0 }, tMerge + 0.55 + i * 0.05, { dur: 0.3 });
      else
        tl.to(c, { fill: llBits[j] ? TITLE_TINTS[0] : "rgb(255 255 255 / 8%)" }, tMerge + 0.5, {
          dur: 0.4,
        });
    });
  });
  // the lockup's grid, then the wordmark and contacts; the glint runs last
  const tLock = lockupOnly ? 0.3 : tMerge + 0.6;
  tl.to(well, { opacity: 1 }, tLock, { dur: 0.4 });
  tl.to(llDots, { opacity: 1 }, tLock + 0.15, { dur: 0.3, stagger: 0.02 });
  tl.fromTo(wm, { opacity: 0, x: -12 }, { opacity: 1, x: 0 }, tLock + 0.4, {
    dur: 0.6,
    ease: "out-cubic",
  });
  tl.to(url, { opacity: 1 }, tLock + 0.8, { dur: 0.6 });
  tl.to(rule, { opacity: 1 }, tLock + 1.0, { dur: 0.4 });
  set(yt, { transformOrigin: "50% 50%" });
  tl.fromTo(yt, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }, tLock + 1.15, {
    dur: 0.45,
    ease: "out-cubic",
  });
  tl.fromTo(handle, { opacity: 0, x: -12 }, { opacity: 1, x: 0 }, tLock + 1.3, {
    dur: 0.6,
    ease: "out-cubic",
  });
  glint(tl, well, tLock + 1.4, 1.6);
  return tl.finish(tLock + 3.2);
}

// A gold segment that travels once round the lockup's grid (the kit's
// `K.glint`, gold kind, a single lap).
function glint(tl: ReturnType<typeof timeline>, el: SVGRectElement, from: number, lap: number) {
  const ctm = el.getCTM();
  const L = el.getTotalLength() * (ctm ? Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c)) : 1);
  const o = svg("rect", {
    width: el.getAttribute("width") ?? 0,
    height: el.getAttribute("height") ?? 0,
    rx: el.getAttribute("rx") ?? 0,
    class: "glint-gold",
  });
  o.style.strokeDasharray = `${0.09 * L} ${L}`;
  el.after(o);
  const inOut = ease("in-out-cubic");
  tl.draw((t) => {
    const w = t - from;
    const on = w >= 0 && w < lap;
    o.style.strokeDashoffset = `${on ? -inOut(w / lap) * L : 0}`;
    o.style.opacity = `${on ? Math.min(1, w / 0.4, (lap - w) / 0.4) : 0}`;
  });
}
