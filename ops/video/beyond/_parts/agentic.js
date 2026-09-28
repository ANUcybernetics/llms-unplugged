// The Agentic AI beat, shared by beyond/agentic-ai-grid and
// beyond/agentic-ai-ledger (scripts ops/video/beyond/scripts/agentic-ai-*.md).
// The two videos differ only in the model (the magpie grid and a d10, or the
// magpie's ledger sheets and the cup); everything the harness does is here, so
// the siblings stay siblings:
//
// - desk(): the right-hand side of the desk both videos share: the paper strip
//   (notebook, pencil), the phone parked off the right edge, the rolled/drawn
//   punctuation tile that waits while the tool runs
// - writeWalk(): ". here comes the dog" written as the loop runs (line 0)
// - pending(): the punctuation tile lifts out of the model and waits on the
//   paper (the end of line 3)
// - toolCall(): the text message to three friends and the first reply (line 4)
// - splice(): the reply written whole, then the waiting tile (line 5)
// - backfill(): a slow reply; leave a gap, carry on, fill it in later (line 7)
// - harnessLoop() / harness(): the loop with a person at its centre, then the
//   person taken out (lines 8 and 9)
//
// Every function adds tweens at absolute times the caller's timing.json gives;
// nothing here reads a clock. The friend's reply is the script's invented one.

const K = () => window.KIT;

export const WALK = [".", "here", "comes", "the", "dog"];
export const REPLY = ["and", "it", "wants", "my", "sandwich"];
// the paper's second row: the reply between brackets (shown only when the
// reply is slow), the waiting full stop, and the words the pencil carries on
// with (". it" from the full stop's row, then "watches ." in the back-fill)
const ROW2 = ["[", ...REPLY, "]", ".", "it", "watches", "."];
const R2 = { open: 0, reply: [1, 2, 3, 4, 5], close: 6, stop: 7, it: 8, watches: 9, stop2: 10 };

// the geometry both videos share, in scene coordinates (the scene is the
// 1920x890 space above the caption band)
export const NOTE = { x: 940, y: 560, w: 920, h: 310, size: 40, rowH: 100, pad: 30 };
export const PHONE = { x: 1440, y: 20, w: 420, h: 450 };

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  K().el(
    "style",
    {
      text: `
      .ag-phone-back { position: absolute; inset: 0; border-radius: 32px; background: #2b2b2b; border: 4px solid #4a4a4a; }
      .ag-phone-screen { position: absolute; inset: 8px; border-radius: 26px; background: #eceae4; }
      .ag-bubble { position: absolute; border-radius: 18px; padding: 14px 18px; font-family: var(--font-ui); font-size: 25px; line-height: 1.32; }
      .ag-bubble.out { background: var(--gold); color: #241a04; }
      .ag-bubble.in { background: #ffffff; color: var(--ink); border: 1px solid rgb(0 0 0 / 12%); }
      .ag-contact { position: absolute; height: 56px; border-radius: 28px; background: #ffffff; border: 1px solid rgb(0 0 0 / 12%); }
      .ag-contact .avatar { position: absolute; left: 9px; top: 9px; width: 38px; height: 38px; border-radius: 50%; background: #b9b2a4; }
      .ag-contact .bar { position: absolute; left: 60px; top: 22px; height: 12px; border-radius: 6px; background: #d9d4ca; }
      .ag-dot { position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #8c867b; }
      .ag-fly { position: absolute; left: 0; top: 0; }
      .ag-slot { position: absolute; left: 0; top: 0; border: 4px dashed var(--gold-2); border-radius: 8px; }
      .pencil .w.p { vertical-align: -0.3em; }
      `,
    },
    document.head,
  );
}

// ------------------------------------------------------------------ objects

// The paper strip: rows of pencil words (punctuation as symbol tiles), each
// word hidden until written, with its scene position for things flying in.
function notebook(scene, rows, G = NOTE) {
  const k = K();
  const paper = k.paper(scene, { x: G.x, y: G.y, w: G.w, h: G.h });
  const lines = rows.map((words, r) => {
    const line = k.pencilLine(paper.el, words, { x: G.pad, y: G.pad + r * G.rowH, size: G.size });
    words.forEach((w, i) => {
      if (!k.isPunct(w)) return;
      const s = line.words[i];
      s.textContent = "";
      s.classList.add("p");
      k.punctTile(s, w);
    });
    return line;
  });
  // where word i of row r sits, in scene coordinates (its box's top left)
  const pos = (r, i) => {
    const s = lines[r].words[i];
    return {
      x: G.x + G.pad + s.offsetLeft,
      y: G.y + G.pad + r * G.rowH + s.offsetTop,
      w: s.offsetWidth,
      h: s.offsetHeight,
    };
  };
  return { el: paper.el, lines, pos, G };
}

// A flat top-down pencil (as the TASK-154 desks draw it), its tip at the
// layer's origin, lying up and to the right of the point it writes at.
function pencil(scene) {
  const k = K();
  const g = k.layer(scene, 0, 0);
  const s = k.svg(
    "svg",
    {
      width: 640,
      height: 40,
      viewBox: "0 0 640 40",
      style: "position: absolute; left: 0; top: -20px; overflow: visible",
    },
    g,
  );
  k.svg("polygon", { points: "0 20 36 4 36 36", fill: "#e9dcc5" }, s);
  k.svg("polygon", { points: "0 20 12 15 12 25", fill: "#1a1a1a" }, s);
  k.svg("rect", { x: 36, y: 4, width: 560, height: 32, fill: "var(--gold)" }, s);
  k.svg("rect", { x: 596, y: 4, width: 44, height: 32, rx: 6, fill: "#d98c8c" }, s);
  k.set(g, { scale: 0.34, rotation: -38, transformOrigin: "0 0" });
  return g;
}

// The phone, top-down: a message types itself, copies fly to three contacts,
// a reply drops in. Parked off the right edge until it slides in.
function phone(scene, S, G = PHONE) {
  const k = K();
  const el = k.layer(scene, S.W + 60, G.y);
  const screen = k.el(
    "div",
    { class: "ag-phone-back", style: { width: `${G.w}px`, height: `${G.h}px` } },
    el,
  );
  const inner = k.el("div", { class: "ag-phone-screen" }, screen);
  k.set(inner, { opacity: 0 });
  const msg = k.el(
    "div",
    { class: "ag-bubble out", style: { left: "20px", top: "20px", width: "364px" } },
    inner,
  );
  const msgWords = ["What", "comes", "next?", ...`"here comes the dog…"`.split(" ")].map((w) => {
    const s = k.el("span", { text: `${w} ` }, msg);
    k.set(s, { opacity: 0 });
    return s;
  });
  k.set(msg, { opacity: 0 });
  const contacts = [0, 1, 2].map((i) => {
    const r = k.el(
      "div",
      { class: "ag-contact", style: { left: "20px", top: `${140 + i * 66}px`, width: "364px" } },
      inner,
    );
    k.el("div", { class: "avatar" }, r);
    k.el("div", { class: "bar", style: { width: `${150 + 60 * k.jitter(i + 3)}px` } }, r);
    k.set(r, { opacity: 0 });
    return r;
  });
  const reply = k.el(
    "div",
    {
      class: "ag-bubble in",
      text: REPLY.join(" "),
      style: { left: "20px", top: "350px", width: "364px" },
    },
    inner,
  );
  k.set(reply, { opacity: 0 });
  // three dots: somebody is typing
  const typing = k.el(
    "div",
    { class: "ag-bubble in", style: { left: "20px", top: "350px", width: "96px", height: "54px" } },
    inner,
  );
  const dots = [0, 1, 2].map((i) =>
    k.el("div", { class: "ag-dot", style: { left: `${20 + i * 22}px`, top: "20px" } }, typing),
  );
  k.set(typing, { opacity: 0 });
  return {
    el: el,
    back: screen,
    screen: inner,
    msg,
    msgWords,
    contacts,
    reply,
    typing,
    dots,
    G,
    home: { x: G.x, y: G.y },
  };
}

// the right-hand side of the desk, shared by both videos
export function desk(scene, S) {
  style();
  const k = K();
  const note = notebook(scene, [[...WALK, "."], ROW2]);
  const pen = pencil(scene);
  const ph = phone(scene, S);
  // the rolled (or drawn) punctuation mark: a tile that waits, gold, while the
  // tool runs, then drops into its place after the reply
  const stop = k.el(
    // it lifts out of the model, over the mark it came from (an intended overlap)
    "div",
    { class: "ag-fly", "data-layout-allow-overlap": "", style: { fontSize: `${NOTE.size}px`, color: "var(--gold)" } },
    scene,
  );
  k.punctTile(stop, ".");
  stop.querySelectorAll("*").forEach((e) => e.setAttribute("data-layout-allow-overlap", ""));
  k.set(stop, { opacity: 0, transformOrigin: "50% 50%" });
  // park the pencil at the start of the first row
  const tip = (r, i, after = true) => {
    const p = note.pos(r, i);
    return { x: p.x + (after ? p.w : 0) + 2, y: p.y + p.h * 0.82 };
  };
  k.set(pen, tip(0, 0, false));
  return { note, pen, phone: ph, stop, tip };
}

// write word i of row r, and bring the pencil to its end
export function write(tl, d, r, i, t, { pen = true } = {}) {
  K().write(tl, d.note.lines[r].words[i], t, 0.25);
  if (pen) tl.to(d.pen, d.tip(r, i), t - 0.05, { dur: 0.3, ease: "out-cubic" });
}

// ". here comes the dog", word by word at the given times (line 0)
export function writeWalk(tl, d, times) {
  times.forEach((t, i) => write(tl, d, 0, i, t));
}

// a word flying from a point (scene coordinates) to its place on the paper,
// where the pencil word takes over
function flyWord(tl, scene, d, r, i, from, t, dur = 0.6) {
  const k = K();
  const to = d.note.pos(r, i);
  const clone = k.el(
    "div",
    {
      class: "pencil ag-fly",
      text: d.note.lines[r].words[i].textContent,
      style: { fontSize: `${NOTE.size}px` },
    },
    scene,
  );
  k.set(clone, { opacity: 0 });
  tl.set(clone, { x: from.x, y: from.y, opacity: 1 }, t);
  tl.to(clone, { x: to.x, y: to.y }, t, { dur, ease: "in-out-cubic" });
  tl.to(clone, { opacity: 0 }, t + dur - 0.06, { dur: 0.1 });
  tl.set(d.note.lines[r].words[i], { opacity: 1, y: 0 }, t + dur - 0.08);
}

// the punctuation tile lifts out of the model at `from` (its centre, scene
// coordinates) at t0, and waits, gold, just after "dog" from t1: the pencil
// stops (line 3)
export function pending(tl, d, from, t0, t1) {
  const k = K();
  const stop = d.stop;
  // over whatever the model drew after desk() (the strip, the focus row)
  stop.parentNode.appendChild(stop);
  const w = stop.offsetWidth,
    h = stop.offsetHeight;
  tl.set(stop, { x: from.x - w / 2, y: from.y - h / 2, scale: 1.3 }, t0);
  tl.to(stop, { opacity: 1, scale: 1.6 }, t0, { dur: 0.35, ease: "out-cubic" });
  const slot = d.note.pos(0, WALK.length);
  tl.to(stop, { x: slot.x + (slot.w - w) / 2, y: slot.y + (slot.h - h) / 2 - 22, scale: 1.1 }, t1, {
    dur: 0.7,
    ease: "in-out-cubic",
  });
  // the pencil lifts off the paper: generation has paused
  tl.to(d.pen, { y: "-=26" }, t1 + 0.4, { dur: 0.4, ease: "out-cubic" });
}

// the phone slides in over the model's side of the desk (end of line 3)
export function phoneIn(tl, d, t) {
  tl.to(d.phone.el, { x: d.phone.home.x }, t, { dur: 0.8, ease: "out-cubic" });
}

// ------------------------------------------------------------------ line 4
// "The tool is a text message. Send "What comes next?", and the sentence so
// far, to three friends or group chats." A beat of nothing, then one reply.
export function toolCall(tl, T, d, L) {
  const p = d.phone;
  const tScreen = T.word(L, "text");
  tl.to(p.screen, { opacity: 1 }, tScreen, { dur: 0.35 });
  tl.set(p.msg, { opacity: 1 }, T.word(L, "Send") - 0.1);
  const q = [T.word(L, "What"), T.word(L, "comes"), T.word(L, "next")];
  q.forEach((t, i) => tl.to(p.msgWords[i], { opacity: 1 }, t, { dur: 0.15 }));
  // the sentence so far, copied off the paper as it's named
  const tSoFar = T.word(L, "sentence");
  tl.to(d.note.lines[0].words.slice(1, WALK.length), { color: "#9a6a0b" }, tSoFar - 0.1, {
    dur: 0.25,
  });
  tl.to(d.note.lines[0].words.slice(1, WALK.length), { color: "var(--pencil)" }, tSoFar + 1.4, {
    dur: 0.4,
  });
  p.msgWords
    .slice(3)
    .forEach((s, i) => tl.to(s, { opacity: 1 }, tSoFar + 0.1 + i * 0.12, { dur: 0.15 }));
  // three contacts; a copy of the message flies to each
  const tThree = T.word(L, "three");
  const k = K();
  const origin = { x: p.G.x + p.G.w - 80, y: p.G.y + 60 };
  p.contacts.forEach((c, i) => {
    tl.to(c, { opacity: 1 }, tThree + i * 0.12, { dur: 0.25 });
    const dot = k.el(
      "div",
      {
        class: "ag-fly",
        style: { width: "22px", height: "22px", borderRadius: "50%", background: "var(--gold)" },
      },
      d.note.el.parentNode,
    );
    k.set(dot, { opacity: 0 });
    const t = T.word(L, "friends") + i * 0.18;
    tl.set(dot, { x: origin.x, y: origin.y, opacity: 1 }, t);
    tl.to(dot, { x: p.G.x + 36, y: p.G.y + 8 + 140 + i * 66 + 17 }, t, {
      dur: 0.45,
      ease: "in-quad",
    });
    tl.to(dot, { opacity: 0 }, t + 0.4, { dur: 0.12 });
  });
  // a beat of nothing, then one reply
  const tReply = T.end(L) + 0.4;
  tl.fromTo(p.reply, { opacity: 0, y: 16 }, { opacity: 1, y: 0 }, tReply, {
    dur: 0.35,
    ease: "out-cubic",
  });
  return tReply;
}

// ------------------------------------------------------------------ line 5
// "The first reply back is your tool result. Write the whole thing down, then
// the full stop you rolled. Then carry on, from the full stop." The reply's
// words fly onto the paper, then the waiting tile drops in after them.
// `rolled` is the line's word for it ("rolled." or "drew.").
export function splice(tl, T, d, L, rolled) {
  const p = d.phone;
  const scene = d.note.el.parentNode;
  tl.to(p.reply, { scale: 1.06 }, T.word(L, "reply"), { dur: 0.25, yoyo: true, ease: "out-cubic" });
  const tWrite = T.word(L, "Write");
  const from = { x: p.G.x + 40, y: p.G.y + 360 };
  R2.reply.forEach((i, n) => flyWord(tl, scene, d, 1, i, from, tWrite + n * 0.2, 0.6));
  tl.to(d.pen, d.tip(1, R2.reply.at(-1)), tWrite + 0.9, { dur: 0.4, ease: "out-cubic" });
  // then the waiting tile, into its place after the reply
  const tStop = T.word(L, "full") - 0.1;
  const slot = d.note.pos(1, R2.stop);
  const w = d.stop.offsetWidth,
    h = d.stop.offsetHeight;
  tl.to(d.stop, { x: slot.x + (slot.w - w) / 2, y: slot.y + (slot.h - h) / 2, scale: 1 }, tStop, {
    dur: 0.7,
    ease: "in-out-cubic",
  });
  tl.to(d.stop, { color: "var(--pencil)" }, tStop + 0.5, { dur: 0.25 });
  tl.set(d.note.lines[1].words[R2.stop], { opacity: 1 }, tStop + 0.72);
  tl.set(d.stop, { opacity: 0 }, tStop + 0.74);
  tl.to(d.pen, d.tip(1, R2.stop), tStop + 0.6, { dur: 0.3, ease: "out-cubic" });
  // "carry on, from the full stop": the tile lights
  const ring = K().ring(scene, { w: 100, h: 100 });
  const box = d.note.pos(1, R2.stop);
  tl.set(
    ring.el,
    { x: box.x - 8, y: box.y - 8, scaleX: (box.w + 16) / 100, scaleY: (box.h + 16) / 100 },
    0,
  );
  const tFrom = T.word(L, "from");
  tl.to(ring.el, { opacity: 1 }, tFrom, { dur: 0.25 });
  tl.to(ring.el, { opacity: 0 }, T.end(L) + 0.6, { dur: 0.3 });
  return { tFrom, ring };
}

// the word the model gives after the full stop ("it")
export const writeAfterStop = (tl, d, t) => write(tl, d, 1, R2.it, t);

// ring a word (or a run of words) on the paper from t0 to t1
export function ringWords(tl, d, r, a, b, t0, t1) {
  const k = K();
  const A = d.note.pos(r, a),
    B = d.note.pos(r, b);
  const ring = k.ring(d.note.el.parentNode, { w: 100, h: 100 });
  const pad = 8;
  tl.set(
    ring.el,
    {
      x: A.x - pad,
      y: A.y - pad,
      scaleX: (B.x + B.w - A.x + 2 * pad) / 100,
      scaleY: (A.h + 2 * pad) / 100,
    },
    0,
  );
  tl.to(ring.el, { opacity: 1 }, t0, { dur: 0.25 });
  tl.to(ring.el, { opacity: 0 }, t1, { dur: 0.3 });
  return ring;
}

// ------------------------------------------------------------------ line 7
// "Replies take time. If nothing's back by your next punctuation mark, leave
// a gap and fill it in later." The same call replayed slow: the reply isn't
// back, so the paper holds a bracketed gap and the pencil carries on; the
// reply lands later and fills the gap.
export function backfill(tl, T, d, L) {
  const p = d.phone;
  const words = d.note.lines[1].words;
  const t0 = T.start(L);
  // replay the call: the reply leaves the paper and the phone
  tl.to(
    R2.reply.map((i) => words[i]),
    { opacity: 0 },
    t0,
    { dur: 0.35 },
  );
  tl.to(p.reply, { opacity: 0 }, t0, { dur: 0.3 });
  // somebody is typing
  const tTime = T.word(L, "time");
  tl.to(p.typing, { opacity: 1 }, tTime - 0.2, { dur: 0.25 });
  const tFill = T.word(L, "fill");
  for (let t = tTime, n = 0; t < tFill; t += 0.2, n++) {
    const dot = p.dots[n % 3];
    tl.to(dot, { y: -6 }, t, { dur: 0.1, ease: "out-quad" });
    tl.to(dot, { y: 0 }, t + 0.1, { dur: 0.1, ease: "in-quad" });
  }
  // the gap, bracketed; the pencil carries on past it to the next punctuation mark
  const k = K();
  k.write(tl, words[R2.open], t0 + 0.5, 0.2);
  k.write(tl, words[R2.close], t0 + 0.65, 0.2);
  write(tl, d, 1, R2.watches, T.word(L, "back"));
  write(tl, d, 1, R2.stop2, T.word(L, "punctuation"));
  // "leave a gap": the brackets light
  const gap = ringWords(tl, d, 1, R2.open, R2.close, T.word(L, "gap"), T.end(L) + 0.9);
  // the reply lands, and fills the gap
  tl.to(p.typing, { opacity: 0 }, tFill - 0.1, { dur: 0.15 });
  tl.fromTo(p.reply, { opacity: 0, y: 16 }, { opacity: 1, y: 0 }, tFill, {
    dur: 0.3,
    ease: "out-cubic",
    immediate: false,
  });
  const from = { x: p.G.x + 40, y: p.G.y + 360 };
  const scene = d.note.el.parentNode;
  R2.reply.forEach((i, n) => flyWord(tl, scene, d, 1, i, from, tFill + 0.25 + n * 0.14, 0.55));
  return gap;
}

// ------------------------------------------------------------------ the loop
// Six stations on an ellipse, joined by gold arcs with arrowheads, drawn on
// in one stroke; a flat person at the centre whose hand reaches every
// station. labels[0] is the model's own step ("roll" or "draw").
export function harnessLoop(parent, { x, y, w, h, labels }) {
  const k = K();
  const g = k.layer(parent, x, y);
  const s = k.svg(
    "svg",
    { width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: "overflow: visible" },
    g,
  );
  const cx = w / 2,
    cy = h / 2,
    rx = w / 2 - 210,
    ry = h / 2 - 70;
  const n = labels.length;
  const at = (th) => ({ x: cx + rx * Math.cos(th), y: cy + ry * Math.sin(th) });
  const th = (i) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const GAP = 0.13; // radians kept clear around each station
  const gold = "#e5a930";
  const arcs = [],
    heads = [];
  for (let i = 0; i < n; i++) {
    const a = th(i) + GAP,
      b = th(i + 1) - GAP - 0.04;
    const p0 = at(a),
      p1 = at(b);
    const path = k.svg(
      "path",
      {
        d: `M ${p0.x} ${p0.y} A ${rx} ${ry} 0 0 1 ${p1.x} ${p1.y}`,
        fill: "none",
        stroke: gold,
        "stroke-width": 7,
        "stroke-linecap": "round",
      },
      s,
    );
    const L = path.getTotalLength() + 2;
    path.style.strokeDasharray = `${L}`;
    path.style.strokeDashoffset = `${L}`;
    // hidden until drawn: a round cap shows even on a fully offset dash
    k.set(path, { opacity: 0 });
    arcs.push(path);
    // the arrowhead, along the ellipse's tangent at the arc's end
    const tx = -rx * Math.sin(b),
      ty = ry * Math.cos(b),
      tn = Math.hypot(tx, ty);
    const ux = tx / tn,
      uy = ty / tn,
      S2 = 20;
    const tip = { x: p1.x + ux * 10, y: p1.y + uy * 10 };
    const head = k.svg(
      "polygon",
      {
        points: `${tip.x} ${tip.y} ${tip.x - ux * S2 - uy * S2 * 0.6} ${tip.y - uy * S2 + ux * S2 * 0.6} ${tip.x - ux * S2 + uy * S2 * 0.6} ${tip.y - uy * S2 - ux * S2 * 0.6}`,
        fill: gold,
      },
      s,
    );
    k.set(head, { opacity: 0 });
    heads.push(head);
  }
  const stations = labels.map((lab, i) => {
    const p = at(th(i));
    const dot = k.svg("circle", { cx: p.x, cy: p.y, r: 15, fill: gold }, s);
    const c = Math.cos(th(i)),
      sn = Math.sin(th(i));
    const anchor = c > 0.3 ? "start" : c < -0.3 ? "end" : "middle";
    const text = k.svg(
      "text",
      {
        x: p.x + c * 34,
        y: p.y + sn * 34 + (sn > 0.3 ? 30 : sn < -0.3 ? -8 : 12),
        "text-anchor": anchor,
        "font-size": 36,
        class: "ui",
        fill: "var(--text)",
        text: lab,
      },
      s,
    );
    k.set([dot, text], { opacity: 0 });
    return { dot, text, x: p.x, y: p.y };
  });
  // the person, and a hand (a gold line) to every station
  // (the fill sits on the group, so one tween recolours the whole figure)
  const person = k.svg("g", { style: "fill: #f2f2f2" }, s);
  k.svg("circle", { cx, cy: cy - 50, r: 30 }, person);
  k.svg("rect", { x: cx - 38, y: cy - 14, width: 76, height: 96, rx: 30 }, person);
  k.set(person, { opacity: 0, transformOrigin: "50% 50%" });
  const hands = stations.map((st) => {
    const dx = st.x - cx,
      dy = st.y - (cy + 10),
      dn = Math.hypot(dx, dy);
    const a = { x: cx + (dx / dn) * 70, y: cy + 10 + (dy / dn) * 70 },
      b = { x: st.x - (dx / dn) * 28, y: st.y - (dy / dn) * 28 };
    const line = k.svg(
      "line",
      {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: gold,
        "stroke-width": 5,
        "stroke-linecap": "round",
        "stroke-dasharray": "2 12",
      },
      s,
    );
    k.set(line, { opacity: 0 });
    return line;
  });
  s.insertBefore(person, s.firstChild);
  hands.forEach((l) => s.insertBefore(l, s.firstChild));
  return { el: g, svg: s, arcs, heads, stations, person, hands, cx, cy };
}

// draw the loop on in one stroke from t over dur, each station and label
// arriving as the stroke reaches it; everything rests half-lit
export function drawLoop(tl, loop, t, dur) {
  const n = loop.arcs.length,
    step = dur / n;
  loop.stations.forEach((st, i) =>
    tl.to([st.dot, st.text], { opacity: 0.55 }, t + i * step, { dur: 0.25 }),
  );
  loop.arcs.forEach((a, i) => {
    tl.set(a, { opacity: 1 }, t + i * step + 0.05);
    tl.to(a, { strokeDashoffset: 0 }, t + i * step + 0.05, { dur: step * 0.9, ease: "linear" });
    tl.to(a, { opacity: 0.5 }, t + dur + 0.2, { dur: 0.4 });
    tl.to(loop.heads[i], { opacity: 0.5 }, t + (i + 1) * step - 0.05, { dur: 0.15 });
  });
}

// light station i and the arrow out of it, from t (and hold)
export function lightStation(tl, loop, i, t) {
  tl.to(
    [loop.stations[i].dot, loop.stations[i].text, loop.arcs[i], loop.heads[i]],
    { opacity: 1 },
    t,
    { dur: 0.25 },
  );
}
export function dimStations(tl, loop, t) {
  loop.stations.forEach((st, i) =>
    tl.to([st.dot, st.text, loop.arcs[i], loop.heads[i]], { opacity: 0.5 }, t, { dur: 0.4 }),
  );
}

// ------------------------------------------------------------------ lines 8, 9
// "... It only rolled when to ask. And the thing that paused it, sent the
// message, and spliced the answer back in? That was you. You were the harness."
// then "Take the person out ...": the loop runs on its own. `verb` is "rolled"
// or "drew". Returns the time the model's own steps light (for the caller's
// model-side highlight).
export function harness(tl, T, loop, L, verb) {
  // the model's own step: roll (or draw), landing on punctuation
  const tAsk = T.word(L, verb);
  lightStation(tl, loop, 0, tAsk);
  lightStation(tl, loop, 1, T.word(L, "ask"));
  // the person appears; each hand-off step lights as it's named, the hand on it
  const tThing = T.word(L, "thing");
  tl.to(loop.person, { opacity: 1 }, tThing, { dur: 0.4 });
  const reach = (i, t) => {
    lightStation(tl, loop, i, t);
    tl.to(loop.hands[i], { opacity: 1 }, t, { dur: 0.3 });
  };
  reach(2, T.word(L, "paused"));
  reach(3, T.word(L, "sent"));
  reach(4, T.word(L, "spliced"));
  reach(5, T.word(L, "back"));
  // "That was you": the hand is on the model's steps too (it rolled the die)
  const tYou = T.word(L, "you");
  reach(0, tYou);
  reach(1, tYou + 0.15);
  // "You were the harness": the person lights gold
  const tHarness = T.word(L, "harness");
  tl.to(loop.person, { fill: "#e5a930" }, tHarness - 0.1, { dur: 0.3 });
  tl.to(loop.person, { scale: 1.12 }, tHarness - 0.1, { dur: 0.3, yoyo: true, ease: "out-cubic" });
  return tAsk;
}

export function takeOut(tl, T, loop, L, tEnd) {
  const tOut = T.word(L, "out");
  tl.to([loop.person, ...loop.hands], { opacity: 0 }, tOut - 0.1, { dur: 0.5, ease: "in-cubic" });
  dimStations(tl, loop, tOut);
  // the loop keeps turning, arrows lighting in turn
  const n = loop.stations.length;
  const t0 = tOut + 0.8,
    per = 0.55;
  for (let m = 0; t0 + m * per < tEnd; m++) {
    const i = m % n,
      t = t0 + m * per;
    tl.to(
      [loop.stations[i].dot, loop.stations[i].text, loop.arcs[i], loop.heads[i]],
      { opacity: 1 },
      t,
      { dur: 0.15 },
    );
    tl.to(
      [loop.stations[i].dot, loop.stations[i].text, loop.arcs[i], loop.heads[i]],
      { opacity: 0.45 },
      t + per,
      { dur: 0.35 },
    );
  }
}

// an opacity-only arrival (K.appear also tweens scale to 1, which would undo
// a layer's build-time scale: the grid's, the pencil's)
export const fadeIn = (tl, els, t, { dur = 0.5, stagger = 0 } = {}) =>
  tl.fromTo(els, { opacity: 0 }, { opacity: 1 }, t, { dur, stagger, ease: "out-cubic" });
