// Overview: ops/video/scripts/overview.md. The evergreen scene-setter, shared
// by index.html (landscape) and compositions/portrait.html (9:16): one
// build(tl, S, T). Every scene is a group built at a nominal size and fitted
// into a slot of S.area, and anything that shares the frame is stacked
// vertically, so the portrait variant is the same composition restacked.

const build = (tl, S, T) => {
  const K = KIT,
    D = KIT_DATA;
  const scene = document.getElementById("scene");
  const A = S.area,
    P = S.portrait;

  // ---------------------------------------------------------------- helpers
  // a group with a nominal size, fitted (contain, centred) into a slot by transform
  const group = (w, h) => {
    const el = K.layer(scene, 0, 0);
    gsap.set(el, { opacity: 0 });
    return { el, w, h };
  };
  const fit = (g, slot, { align = "centre", pad = 0 } = {}) => {
    const s = Math.min((slot.w - 2 * pad) / g.w, (slot.h - 2 * pad) / g.h);
    const x = slot.x + (slot.w - g.w * s) / 2;
    const y = align === "top" ? slot.y + pad : slot.y + (slot.h - g.h * s) / 2;
    gsap.set(g.el, { x, y, scale: s });
    return s;
  };
  // n vertical slots inside the area
  // n slots: side by side in landscape, stacked in portrait (the restack)
  const slots = (n, gap = 28) => {
    if (P) {
      const h = (A.h - gap * (n - 1)) / n;
      return Array.from({ length: n }, (_, i) => ({ x: A.x, y: A.y + i * (h + gap), w: A.w, h }));
    }
    const w = (A.w - gap * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => ({ x: A.x + i * (w + gap), y: A.y, w, h: A.h }));
  };
  const whole = { x: A.x, y: A.y, w: A.w, h: A.h };
  // a scene shown between two times
  const during = (el, t0, t1, fadeIn = 0.45, fadeOut = 0.35) => {
    tl.to(el, { opacity: 1, duration: fadeIn, ease: "power2.out" }, t0);
    if (t1 != null) tl.to(el, { opacity: 0, duration: fadeOut, ease: "power2.in" }, t1 - fadeOut);
  };
  const label = (
    parent,
    text,
    { x = 0, y = 0, size = 34, gold = false, weight = 400, align = "left" } = {},
  ) => {
    const d = K.el(
      "div",
      {
        class: `label${gold ? " gold" : ""}`,
        text,
        style: {
          fontSize: `${size}px`,
          fontWeight: weight,
          ...(align === "centre" ? { textAlign: "center", whiteSpace: "normal" } : {}),
        },
      },
      parent,
    );
    gsap.set(d, { x, y });
    return d;
  };
  const pencil = (parent, x, y, len = 520) => {
    const L = K.layer(parent, x, y);
    const s = K.svg("svg", { width: len + 40, height: 40, viewBox: `0 0 ${len + 40} 40` }, L);
    K.svg("polygon", { points: "0 20 36 4 36 36", fill: "#e9dcc5" }, s);
    K.svg("polygon", { points: "0 20 12 15 12 25", fill: "#1a1a1a" }, s);
    K.svg("rect", { x: 36, y: 4, width: len - 40, height: 32, fill: "var(--gold)" }, s);
    K.svg("rect", { x: len - 4, y: 4, width: 44, height: 32, rx: 6, fill: "#d98c8c" }, s);
    gsap.set(L, { rotation: -6, transformOrigin: "0 50%" });
    return L;
  };
  // a chat window: a dark panel with one reply bubble whose words flow inline
  const chat = (parent, words, { w = 1100, h = 420, size = 40 } = {}) => {
    const panel = K.el(
      "div",
      {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: `${w}px`,
          height: `${h}px`,
          background: "#161616",
          borderRadius: "22px",
          border: "1px solid rgb(255 255 255 / 10%)",
        },
      },
      parent,
    );
    K.el(
      "div",
      {
        style: {
          position: "absolute",
          left: "40px",
          top: "34px",
          width: "56px",
          height: "14px",
          borderRadius: "7px",
          background: "rgb(255 255 255 / 18%)",
        },
      },
      panel,
    );
    const bubble = K.el(
      "div",
      {
        style: {
          position: "absolute",
          left: "40px",
          right: "40px",
          top: "84px",
          padding: "28px 34px",
          background: "#2b2b2b",
          borderRadius: "18px",
          fontSize: `${size}px`,
          lineHeight: 1.35,
          color: "var(--text)",
          fontFamily: "var(--font-ui)",
        },
      },
      panel,
    );
    const spans = words.map((wd) => {
      const s = K.el(
        "span",
        { text: wd, style: { display: "inline-block", marginRight: "0.3em" } },
        bubble,
      );
      gsap.set(s, { opacity: 0 });
      return s;
    });
    const caret = K.el(
      "span",
      {
        style: {
          display: "inline-block",
          width: "3px",
          height: "0.9em",
          background: "var(--gold-2)",
          verticalAlign: "-0.15em",
        },
      },
      bubble,
    );
    return { el: panel, spans, caret, bubble };
  };
  const typeWords = (spans, t0, cadence = 0.32) =>
    spans.forEach((s, i) =>
      tl.fromTo(
        s,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" },
        t0 + i * cadence,
      ),
    );
  const bg = K.bigrams(K.split(D.grid.tokens), K.split(D.grid.vocab));
  const magpie = D.ledger["the-magpie"];
  const rowOf = (word) =>
    magpie.sheets.flatMap((s) => s.pages.flat()).find((r) => r.prefix[0] === word);
  const drawAll = (g, t) => g.cells.flat().forEach((c) => K.drawOn(tl, c.strokes, t, 0.01, 0));
  const CHAT = K.split("The magpie is back . It sits on the fence . It watches .");
  const CHAT_WORDS = ["The magpie is back.", "It sits on the fence.", "It watches."]
    .join(" ")
    .split(" ");

  // ---------------------------------------------------------------- lines 0–2: the chat window, the two phrases
  const g0 = group(1100, 420);
  const c0 = chat(g0.el, CHAT_WORDS);
  fit(g0, P ? { x: A.x, y: A.y + 200, w: A.w, h: 520 } : whole);
  during(g0.el, 0.1, T.start(3));
  typeWords(c0.spans, T.word(0, "write") - 0.2, 0.34);
  tl.to(c0.caret, { opacity: 0, duration: 0.2 }, T.word(0, "job"));
  // line 1: the window dims; the two phrases people reach for
  tl.to(c0.el, { opacity: 0.3, duration: 0.5 }, T.start(1));
  const g1 = group(1200, 300);
  label(g1.el, "“neural networks”", {
    x: 0,
    y: 0,
    size: 72,
    align: "centre",
    weight: 500,
  }).style.width = "1200px";
  label(g1.el, "“trained on the internet”", {
    x: 0,
    y: 150,
    size: 72,
    align: "centre",
    weight: 500,
  }).style.width = "1200px";
  fit(g1, P ? { x: A.x, y: A.y + 800, w: A.w, h: 400 } : { x: A.x, y: A.y + 470, w: A.w, h: 300 });
  tl.set(g1.el, { opacity: 1 }, T.word(1, "neural") - 0.1);
  gsap.set(g1.el.children[0], { opacity: 0 });
  gsap.set(g1.el.children[1], { opacity: 0 });
  K.appear(tl, g1.el.children[0], T.word(1, "neural"), { y: 16 });
  K.appear(tl, g1.el.children[1], T.word(1, "trained"), { y: 16 });
  tl.to(g1.el, { opacity: 0, duration: 0.35 }, T.start(3) - 0.35);

  // ---------------------------------------------------------------- line 3: the desk, object by object
  const desk = K.layer(scene, 0, 0);
  gsap.set(desk, { opacity: 0 });
  const book = K.bookPage(desk, ["The magpie"], { x: 0, y: 0, w: 460, h: 300, size: 64, pad: 48 });
  book.el.style.textAlign = "center";
  book.el.style.paddingTop = "110px";
  K.el(
    "div",
    {
      style: {
        position: "absolute",
        left: "48px",
        right: "48px",
        top: "205px",
        height: "4px",
        background: "var(--gold)",
      },
    },
    book.el,
  );
  const gridD = K.grid(desk, bg, { x: 0, y: 0, cell: 70, head: 100 });
  const pencilD = pencil(desk, 0, 0, 460);
  const dieD = K.die(desk, { x: 0, y: 0, size: 150, face: 7 });
  const cupD = K.cup(desk, { x: 0, y: 0, r: 110 });
  [
    ["red", 0],
    ["blue", 1],
    ["green", 2],
    ["red", 3],
    ["yellow", 4],
    ["red", 5],
  ].forEach(([c, i]) => gsap.set(cupD.add(c, i, 6).el, { opacity: 1 }));
  const sheetD = K.sheet(desk, magpie.sheets[2].pages.flat().slice(0, 2), D.palette, {
    x: 0,
    y: 0,
    w: 760,
    rowH: 110,
    fontSize: 34,
    prefixW: 190,
    header: [magpie.sheets[2].range[0][0], magpie.sheets[2].range[1][0]],
    title: magpie.title,
  });
  sheetD.rows.forEach((r) => r.cells.forEach((c) => K.drawOn(tl, c.strokes, 0, 0.01, 0)));
  const deskPos = P
    ? {
        book: [0, 0],
        pencil: [0, 330],
        grid: [0, 420],
        die: [620, 120],
        cup: [560, 380],
        sheet: [40, 960],
      }
    : {
        book: [0, 0],
        pencil: [10, 330],
        grid: [1300, 0],
        die: [660, 60],
        cup: [600, 280],
        sheet: [1000, 460],
      };
  const place = (el, [x, y]) => gsap.set(el, { x: A.x + x, y: A.y + y });
  place(book.el, deskPos.book);
  place(pencilD, deskPos.pencil);
  place(gridD.el, deskPos.grid);
  place(dieD.el, deskPos.die);
  place(cupD.el, deskPos.cup);
  place(sheetD.el, deskPos.sheet);
  const deskObjs = [book.el, pencilD, gridD.el, dieD.el, cupD.el, sheetD.el];
  gsap.set(deskObjs, { opacity: 0 });
  tl.set(desk, { opacity: 1 }, T.start(3));
  const slideIn = (el, t, from) =>
    tl.fromTo(
      el,
      { opacity: 0, x: `+=${from[0]}`, y: `+=${from[1]}` },
      {
        opacity: 1,
        x: `-=${from[0]}`,
        y: `-=${from[1]}`,
        duration: 0.6,
        ease: "power3.out",
        immediateRender: false,
      },
      t,
    );
  slideIn(book.el, T.word(3, "picture"), [-300, 0]);
  slideIn(gridD.el, T.word(3, "paper"), [300, 0]);
  slideIn(pencilD, T.word(3, "pen"), [-200, 60]);
  slideIn(dieD.el, T.word(3, "dice"), [0, -200]);
  slideIn(cupD.el, T.word(3, "dice") + 0.35, [0, 200]);
  slideIn(sheetD.el, T.word(3, "dice") + 0.6, [200, 100]);

  // ---------------------------------------------------------------- line 4: the wordmark over the desk
  const g4 = group(1400, 260);
  const wm = K.el(
    "div",
    {
      class: "wordmark",
      "data-layout-allow-overlap": "",
      text: "LLMs Unplugged",
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: "1400px",
        textAlign: "center",
        fontSize: "110px",
      },
    },
    g4.el,
  );
  const socy = label(g4.el, "School of Cybernetics, Australian National University", {
    x: 0,
    y: 160,
    size: 40,
    align: "centre",
  });
  socy.style.width = "1400px";
  socy.setAttribute("data-layout-allow-overlap", "");
  fit(g4, P ? { x: A.x, y: A.y + 560, w: A.w, h: 300 } : { x: A.x, y: A.y + 250, w: A.w, h: 300 });
  const scrim = K.el(
    "div",
    {
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: `${S.W}px`,
        height: `${S.H}px`,
        background: "rgb(13 13 13 / 72%)",
        opacity: 0,
      },
    },
    scene,
  );
  scene.insertBefore(scrim, g4.el);
  tl.to(scrim, { opacity: 1, duration: 0.5 }, T.start(4));
  gsap.set([wm, socy], { opacity: 0 });
  tl.set(g4.el, { opacity: 1 }, T.start(4));
  K.appear(tl, wm, T.word(4, "LLMs") - 0.1, { y: 20 });
  K.appear(tl, socy, T.word(4, "School"), { y: 16 });
  tl.to([g4.el, scrim, desk], { opacity: 0, duration: 0.4 }, T.start(5) - 0.4);

  // ---------------------------------------------------------------- line 5: the loop as one stroke, book → grid → paper → back
  const g5 = group(1500, 820);
  const b5 = K.bookPage(g5.el, ["Hop, Joey, hop.", "See Joey hop."], { x: 510, y: 0, w: 480, h: 170, size: 42, pad: 28 });
  const gr5 = K.grid(g5.el, bg, { x: 560, y: 205, cell: 60, head: 80 });
  const p5 = K.paper(g5.el, { x: 350, y: 640, w: 800, h: 120 });
  const pl5 = K.pencilLine(p5.el, ["see", "joey", ","], { size: 54, y: 30 });
  const d5 = K.die(g5.el, { x: 1190, y: 620, size: 150, face: 7 });
  gsap.set(d5.el, { opacity: 0 });
  const svg5 = K.svg("svg", { width: 1500, height: 820, viewBox: "0 0 1500 820" }, g5.el);
  const trainPath = K.svg("path", { d: "M 500 90 C 250 90 200 300 240 420 C 280 520 330 580 340 690", class: "draw", stroke: "var(--gold)", "stroke-width": 9 }, svg5);
  const genPath = K.svg("path", { d: "M 1160 690 C 1200 580 1260 520 1270 420 C 1300 300 1250 90 1000 90", class: "draw", stroke: "var(--gold)", "stroke-width": 9 }, svg5);
  K.prepDraw([trainPath, genPath]);
  const arrow = (x, y, rot) => { const a = K.svg("polygon", { points: "0 -16 30 0 0 16", fill: "var(--gold)", transform: `translate(${x} ${y}) rotate(${rot})` }, svg5); gsap.set(a, { opacity: 0 }); return a; };
  const arrowTrain = arrow(340, 690, 90), arrowGen = arrow(1012, 90, 180);
  const trainL = label(g5.el, "train", { x: 40, y: 380, size: 56, gold: true, weight: 500 });
  const genL = label(g5.el, "generate", { x: 1240, y: 380, size: 56, gold: true, weight: 500 });
  gsap.set([trainL, genL], { opacity: 0 });
  fit(g5, whole, { pad: 6 });
  during(g5.el, T.start(5), T.start(6));
  // train: the stroke draws from the book to the grid, pairs fly in, tallies draw
  const tTrain = T.word(5, "train");
  K.drawOn(tl, [trainPath], tTrain - 0.3, 1.0, 0, "power1.inOut");
  tl.to(arrowTrain, { opacity: 1, duration: 0.2 }, tTrain + 0.6);
  tl.to(trainL, { opacity: 1, duration: 0.3 }, tTrain);
  const tCount = T.word(5, "count");
  bg.pairs.forEach((p, i) => {
    const t = tCount + i * 0.28;
    const tile = K.el("div", { class: "tile", text: `${p.from} ${p.to}`, style: { fontSize: "30px", width: "170px", height: "50px" } }, g5.el);
    gsap.set(tile, { x: 660, y: 110, opacity: 0 });
    const cell = gr5.cells[p.r][p.c];
    tl.fromTo(tile, { opacity: 0, x: 660, y: 110, scale: 1 }, { opacity: 1, x: 560 + cell.cx - 85, y: 205 + cell.cy - 25, scale: 0.6, duration: 0.5, ease: "power2.inOut" }, t);
    tl.to(tile, { opacity: 0, duration: 0.15 }, t + 0.5);
    K.drawOn(tl, [cell.strokes[p.nth - 1]], t + 0.55, 0.25, 0);
  });
  // generate: the stroke continues to the paper, a word writes, a face lands, the next word writes, the arrow returns
  const tGen = T.word(5, "generate");
  K.drawOn(tl, [genPath], tGen + 0.4, 1.4, 0, "power1.inOut");
  tl.to(genL, { opacity: 1, duration: 0.3 }, tGen);
  K.write(tl, pl5.words[0], T.word(5, "last"));
  K.land(tl, d5, 7, T.word(5, "pick"));
  K.write(tl, pl5.words[1], T.word(5, "write"));
  tl.to(arrowGen, { opacity: 1, duration: 0.2 }, T.word(5, "again"));
  tl.to(d5.el, { opacity: 0, duration: 0.3 }, T.word(5, "again"));
  K.write(tl, pl5.words[2], T.word(5, "again") + 0.4);

  // ---------------------------------------------------------------- line 6: two vignettes: the grid and die; the cup
  const [s6a, s6b] = slots(2);
  const g6a = group(900, 700), g6b = group(900, 700);
  const gr6 = K.grid(g6a.el, bg, { x: 60, y: 60, cell: 90, head: 120 });
  const d6 = K.die(g6a.el, { x: 690, y: 480, size: 160, face: 2 });
  gsap.set(d6.el, { opacity: 0 });
  const cup6 = K.cup(g6b.el, { x: 180, y: 90, r: 240 });
  const rowIt = rowOf("it");
  const outC = K.counter(g6b.el, "red", { x: cup6.centre.x - 40, y: cup6.centre.y - 40, r: 40 });
  gsap.set(outC.el, { opacity: 0 });
  fit(g6a, s6a); fit(g6b, s6b);
  during(g6a.el, T.start(6) + 0.3, T.start(7));
  during(g6b.el, T.word(6, "ledger") - 0.2, T.start(7));
  bg.pairs.forEach((p, i) => K.drawOn(tl, [gr6.cells[p.r][p.c].strokes[p.nth - 1]], T.word(6, "count") + i * 0.18, 0.25, 0));
  K.land(tl, d6, 2, T.word(6, "roll"));
  let k6 = 0;
  const total6 = rowIt.followers.reduce((s, f) => s + f.count, 0);
  rowIt.followers.forEach((f, ci) => {
    for (let n = 0; n < f.count; n++) {
      const ct = cup6.add(D.palette[ci].name, k6, total6);
      tl.fromTo(ct.el, { opacity: 0, x: ct.x, y: ct.y - 220, scale: 1.3 }, { opacity: 1, y: ct.y, scale: 1, duration: 0.45, ease: "power3.out" }, T.word(6, "counters") + k6 * 0.12);
      k6++;
    }
  });
  tl.fromTo(outC.el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.1, duration: 0.3 }, T.word(6, "likely") - 0.2);
  tl.to(outC.el, { x: cup6.centre.x + 330, y: cup6.centre.y - 40, scale: 1, duration: 0.6, ease: "power2.inOut" }, T.word(6, "likely") + 0.1);

  // ---------------------------------------------------------------- line 7: three vignettes: your own model then the booklet; the phone; the butchers paper
  const [s7a, s7b, s7c] = slots(3);
  const g7a = group(900, 700), g7b = group(900, 700), g7c = group(900, 700);
  const gr7 = K.grid(g7a.el, bg, { x: 120, y: 30, cell: 96, head: 130 });
  drawAll(gr7, 0);
  const pg7 = K.pageImage(g7a.el, "snowy-river", D.booklet.pageOf.golden, { x: 20, y: 40, w: 860, h: 600 });
  pg7.moveTo(tl, pg7.around(pg7.lineBox(["golden"]), 560), 0, 0.01);
  pg7.highlight(pg7.lineBox(["golden"]));
  tl.set(pg7.hl, { opacity: 1 }, 0);
  gsap.set(pg7.el, { opacity: 0 });
  const phone = K.el("div", { style: { position: "absolute", left: "260px", top: "20px", width: "380px", height: "440px", background: "#2a2a2a", borderRadius: "30px", border: "2px solid rgb(255 255 255 / 12%)" } }, g7b.el);
  const bubble7 = K.el("div", { text: "out on the verandah", style: { position: "absolute", left: "28px", top: "300px", padding: "16px 22px", background: "var(--gold)", color: "#111", borderRadius: "16px", fontSize: "28px", fontFamily: "var(--font-ui)", whiteSpace: "nowrap" } }, phone);
  const p7 = K.paper(g7b.el, { x: 20, y: 540, w: 860, h: 120 });
  const pl7 = K.pencilLine(p7.el, ["the", "cat", "sat"], { size: 46, y: 34 });
  pl7.words.forEach((w) => gsap.set(w, { opacity: 1 }));
  const reply7 = K.el("div", { text: "out on the verandah", style: { position: "absolute", left: "290px", top: "34px", fontSize: "46px", fontFamily: "var(--font-tok)", fontStyle: "italic", color: "var(--pencil)", opacity: 0, whiteSpace: "nowrap" } }, p7.el);
  const bp = K.paper(g7c.el, { x: 20, y: 120, w: 860, h: 440 });
  const bpl1 = K.pencilLine(bp.el, K.split("the magpie is back ."), { size: 50, y: 60 });
  const bpl2 = K.pencilLine(bp.el, K.split("it sits on the fence ."), { size: 50, y: 160 });
  const bpl3 = K.pencilLine(bp.el, K.split("Here comes the postie ."), { size: 50, y: 260 });
  label(g7c.el, "butchers paper, up the front", { x: 20, y: 70, size: 28 }).style.opacity = 0.75;
  fit(g7a, s7a); fit(g7b, s7b); fit(g7c, s7c);
  during(g7a.el, T.start(7) + 0.3, T.start(8));
  tl.to(gr7.el, { opacity: 0, duration: 0.4 }, T.word(7, "trained") - 0.2);
  tl.to(pg7.el, { opacity: 1, duration: 0.4 }, T.word(7, "trained") - 0.1);
  during(g7b.el, T.word(7, "help") - 0.4, T.start(8));
  during(g7c.el, T.word(7, "room") - 0.3, T.start(8));
  tl.fromTo(bubble7, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, T.word(7, "help"));
  tl.to(bubble7, { x: 40, y: 250, duration: 0.6, ease: "power2.inOut" }, T.word(7, "help") + 0.7);
  tl.to(bubble7, { opacity: 0, duration: 0.2 }, T.word(7, "help") + 1.25);
  tl.to(reply7, { opacity: 1, duration: 0.2 }, T.word(7, "help") + 1.3);
  [...bpl1.words, ...bpl2.words, ...bpl3.words].forEach((w, i) => K.write(tl, w, T.word(7, "story") - 0.8 + i * 0.16));

  // ---------------------------------------------------------------- line 8: tallies become numbers, the numbers become one long row
  const g8 = group(1300, 700);
  const gr8 = K.grid(g8.el, bg, { x: 300, y: 0, cell: 110, head: 140 });
  drawAll(gr8, 0);
  const nums = [];
  gr8.cells.forEach((row, r) => {
    const total = bg.counts[r].reduce((s, c) => s + c, 0);
    row.forEach((c, ci) => {
      const v = total ? bg.counts[r][ci] / total : 0;
      const t = K.svg(
        "text",
        {
          x: c.cx,
          y: c.cy,
          "text-anchor": "middle",
          "dominant-baseline": "central",
          "font-size": 34,
          class: "ui",
          "font-weight": 600,
          fill: v ? "#1a1a1a" : "rgb(0 0 0 / 30%)",
          opacity: 0,
          text: v.toFixed(2),
        },
        gr8.svg,
      );
      nums.push({ el: t, v });
    });
  });
  fit(g8, P ? { x: A.x, y: A.y, w: A.w, h: 900 } : whole);
  during(g8.el, T.start(8), T.start(9));
  const tNum = T.word(8, "numbers");
  tl.to(
    gr8.cells.flat().flatMap((c) => c.strokes),
    { opacity: 0, duration: 0.4 },
    tNum,
  );
  tl.to(
    nums.map((n) => n.el),
    { opacity: 1, duration: 0.4, stagger: 0.02 },
    tNum + 0.1,
  );
  // the long row: the same numbers repeated, running off both edges and scrolling
  const rowL = K.layer(scene, 0, 0);
  gsap.set(rowL, { opacity: 0 });
  const seq = nums.map((n) => n.v.toFixed(2));
  const tilesRow = [];
  for (let i = 0; i < 90; i++) {
    const d = K.el(
      "div",
      {
        text: seq[i % seq.length],
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: "120px",
          height: "70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper)",
          color: "var(--ink)",
          borderRadius: "8px",
          fontFamily: "var(--font-ui)",
          fontWeight: 600,
          fontSize: "34px",
        },
      },
      rowL,
    );
    gsap.set(d, { x: i * 130, y: 0 });
    tilesRow.push(d);
  }
  gsap.set(rowL, { x: -400, y: A.y + (P ? 1000 : A.h / 2 - 35) });
  const tRow = T.word(8, "conversation");
  tl.to(g8.el, { opacity: 0, duration: 0.4 }, tRow);
  tl.to(rowL, { opacity: 1, duration: 0.4 }, tRow + 0.2);
  tl.to(
    rowL,
    { x: -400 - 130 * 60, duration: T.start(9) - tRow - 0.4, ease: "power1.in" },
    tRow + 0.3,
  );
  tl.to(rowL, { opacity: 0, duration: 0.3 }, T.start(9) - 0.3);

  // ---------------------------------------------------------------- line 9: the chat and the pencil in lockstep; the timeline
  const g9 = group(1200, 520);
  const c9 = chat(g9.el, CHAT_WORDS.slice(0, 9), { w: 1200, h: 300, size: 40 });
  const p9 = K.paper(g9.el, { x: 0, y: 360, w: 1200, h: 130 });
  const pl9 = K.pencilLine(p9.el, CHAT.slice(0, 11), { size: 48, y: 38 });
  fit(g9, P ? { x: A.x, y: A.y, w: A.w, h: 700 } : { x: A.x, y: A.y, w: A.w, h: 520 });
  during(g9.el, T.start(9), T.word(9, "Markov") - 1.2);
  const cad = 0.36,
    t9 = T.start(9) + 0.4;
  c9.spans.forEach((s, i) =>
    tl.fromTo(s, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.18 }, t9 + i * cad),
  );
  pl9.words.forEach((w, i) => K.write(tl, w, t9 + i * cad * 0.82));
  const g9b = group(1500, 300);
  const svg9 = K.svg("svg", { width: 1500, height: 300, viewBox: "0 0 1500 300" }, g9b.el);
  const line9 = K.svg(
    "path",
    {
      d: P ? "M 60 150 L 1440 150" : "M 60 150 L 1440 150",
      class: "draw",
      stroke: "var(--gold)",
      "stroke-width": 8,
    },
    svg9,
  );
  K.prepDraw([line9]);
  const stations = [
    ["1913 · Markov", 0.12, "Markov"],
    ["1948 · Shannon", 0.5, "Shannon"],
    ["today", 0.92, "today's"],
  ].map(([txt, f, word]) => {
    const x = 60 + f * 1380;
    const dot = K.svg("circle", { cx: x, cy: 150, r: 16, fill: "var(--gold)", opacity: 0 }, svg9);
    const t = label(g9b.el, txt, { x: x - 150, y: 190, size: 40, align: "centre", weight: 500 });
    t.style.width = "300px";
    gsap.set(t, { opacity: 0 });
    return { dot, t, x, word };
  });
  const icon = { el: K.layer(g9b.el, 20, 90) };
  const iconSvg = K.svg("svg", { width: 120, height: 120, viewBox: "0 0 120 120" }, icon.el);
  K.svg("path", { d: "M 60 14 A 46 46 0 1 1 18 44", fill: "none", stroke: "var(--gold)", "stroke-width": 9, "stroke-linecap": "round" }, iconSvg);
  K.svg("polygon", { points: "6 30 30 34 14 54", fill: "var(--gold)" }, iconSvg);
  gsap.set(icon.el, { opacity: 0 });
  fit(g9b, P ? { x: A.x, y: A.y + 800, w: A.w, h: 300 } : { x: A.x, y: A.y + 520, w: A.w, h: 300 });
  during(g9b.el, T.word(9, "Markov") - 1.0, T.start(10));
  K.drawOn(
    tl,
    [line9],
    T.word(9, "Markov") - 0.8,
    T.word(9, "today's") - T.word(9, "Markov") + 1.2,
    0,
    "power1.inOut",
  );
  tl.to(icon.el, { opacity: 1, duration: 0.2 }, T.word(9, "Markov") - 0.8);
  tl.to(
    icon.el,
    {
      x: 1440 - 100,
      duration: T.word(9, "today's") - T.word(9, "Markov") + 1.2,
      ease: "power1.inOut",
    },
    T.word(9, "Markov") - 0.8,
  );
  stations.forEach((st) => {
    const t = T.word(9, st.word);
    tl.to(st.dot, { opacity: 1, duration: 0.2 }, t);
    K.appear(tl, st.t, t, { y: 10 });
  });

  // ---------------------------------------------------------------- line 10: three vignettes: a cell ringed; numbers everywhere; a line rewritten
  // (the scratch alignment collapses this line's tail onto one time, so the beats pace by fractions of the line)
  const t10 = (f) => T.start(10) + f * (T.end(10) - T.start(10));
  const [s10a, s10b, s10c] = slots(3);
  const g10a = group(900, 700), g10b = group(900, 700), g10c = group(900, 700);
  const grA = K.grid(g10a.el, bg, { x: 120, y: 30, cell: 96, head: 130 }); drawAll(grA, 0);
  const ringA = K.ring(g10a.el, { w: 100, h: 100 });
  const cA = grA.cells[bg.idx.get("hop")][bg.idx.get(".")];
  tl.set(ringA.el, { x: 120 + cA.x + 6, y: 30 + cA.y + 6, scaleX: (cA.w - 12) / 100, scaleY: (cA.h - 12) / 100 }, 0);
  const grB = K.grid(g10b.el, bg, { x: 120, y: 30, cell: 96, head: 130 });
  grB.cells.forEach((row, r) => { const total = bg.counts[r].reduce((s, c) => s + c, 0); row.forEach((c, ci) => K.svg("text", { x: c.cx, y: c.cy, "text-anchor": "middle", "dominant-baseline": "central", "font-size": 30, class: "ui", "font-weight": 600, fill: "#1a1a1a", text: (total ? bg.counts[r][ci] / total : 0).toFixed(2) }, grB.svg)); });
  const pgC = K.pageImage(g10c.el, "snowy-river", D.booklet.pageOf.golden, { x: 20, y: 40, w: 860, h: 600 });
  pgC.moveTo(tl, pgC.around(pgC.lineBox(["gold"]), 560), 0, 0.01);
  const boxC = pgC.lineBox(["golden"]);
  const strike = K.el("div", { style: { position: "absolute", left: `${boxC.x}px`, top: `${boxC.y + boxC.h / 2}px`, width: `${boxC.w}px`, height: "6px", background: "var(--pencil)", transformOrigin: "0 50%", opacity: 0 } }, pgC.wrap);
  const rewrite = K.el("div", { text: "silver", style: { position: "absolute", left: `${boxC.x + boxC.w + 20}px`, top: `${boxC.y - 8}px`, fontFamily: "var(--font-tok)", fontStyle: "italic", color: "var(--pencil)", fontSize: `${boxC.h * 1.3}px`, opacity: 0 } }, pgC.wrap);
  fit(g10a, s10a); fit(g10b, s10b); fit(g10c, s10c);
  const t10a = t10(0.42), t10b = t10(0.62), t10c = t10(0.8);
  during(g10a.el, T.start(10) + 0.3, T.start(11)); during(g10b.el, t10b, T.start(11)); during(g10c.el, t10c, T.start(11));
  tl.to(ringA.el, { opacity: 1, duration: 0.3 }, t10a + 0.2);
  tl.fromTo(strike, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, t10c + 0.5);
  tl.to(rewrite, { opacity: 1, duration: 0.3 }, t10c + 1.0);

  // ---------------------------------------------------------------- line 11: the tools page
  const [s11a, s11b, s11c] = slots(3);
  const g11a = group(900, 700), g11b = group(900, 700), g11c = group(900, 700);
  const box11 = K.paper(g11a.el, { x: 20, y: 100, w: 860, h: 460 });
  box11.el.style.border = "3px solid var(--gold)";
  const pasted = ["The magpie is back.", "It sits on the fence. It watches.", "Here comes the postie.", "Down comes the magpie. Swoop!", "The postie runs, and up it goes,", "and back to the fence."].map((t, i) => K.el("div", { text: t, style: { position: "absolute", left: "34px", top: `${34 + i * 66}px`, fontFamily: "var(--font-tok)", fontSize: "40px", color: "var(--ink)", opacity: 0, whiteSpace: "nowrap" } }, box11.el));
  const pg11 = K.pageImage(g11b.el, "snowy-river", D.booklet.pageOf.golden, { x: 20, y: 40, w: 860, h: 600 });
  pg11.moveTo(tl, pg11.around(pg11.lineBox(["golden"]), 900), 0, 0.01);
  const sh11 = K.sheet(g11c.el, magpie.sheets[0].pages.flat().slice(0, 3), D.palette, { x: 20, y: 120, w: 860, rowH: 110, fontSize: 32, prefixW: 170, header: [magpie.sheets[0].range[0][0], magpie.sheets[0].range[1][0]], title: magpie.title });
  sh11.rows.forEach((r) => r.cells.forEach((c) => K.drawOn(tl, c.strokes, 0, 0.01, 0)));
  fit(g11a, s11a); fit(g11b, s11b); fit(g11c, s11c);
  during(g11a.el, T.start(11), T.start(12));
  pasted.forEach((d, i) => tl.to(d, { opacity: 1, duration: 0.3 }, T.word(11, "Paste") + i * 0.25));
  during(g11b.el, T.word(11, "booklets") - 0.2, T.start(12));
  during(g11c.el, T.word(11, "sheets") - 0.2, T.start(12));

  // ---------------------------------------------------------------- line 12: the site, the eight videos, the licence
  const g12 = group(1400, 800);
  const url = label(g12.el, "llmsunplugged.org", {
    x: 0,
    y: 0,
    size: 84,
    gold: true,
    weight: 600,
    align: "centre",
  });
  url.style.width = "1400px";
  const titles = [
    "Overview",
    "Training (grid)",
    "Generation (grid)",
    "Pre-trained generation",
    "Agentic AI",
    "Generation (ledger)",
    "Training (ledger)",
    "One story, all together",
  ];
  const list = titles.map((t, i) => {
    const d = label(g12.el, t, { x: 0, y: 150 + i * 56, size: 38, align: "centre" });
    d.style.width = "1400px";
    gsap.set(d, { opacity: 0 });
    return d;
  });
  const cc = K.svg(
    "svg",
    { width: 150, height: 150, viewBox: "0 0 100 100" },
    K.layer(g12.el, 625, 620),
  );
  K.svg(
    "circle",
    { cx: 50, cy: 50, r: 44, fill: "none", stroke: "var(--gold)", "stroke-width": 8 },
    cc,
  );
  K.svg(
    "text",
    {
      x: 50,
      y: 52,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-size": 40,
      "font-weight": 700,
      class: "ui",
      fill: "var(--gold-2)",
      text: "CC",
    },
    cc,
  );
  const ccL = cc.parentNode;
  gsap.set([url, ccL], { opacity: 0 });
  fit(g12, P ? { x: A.x, y: A.y + 150, w: A.w, h: 1100 } : whole);
  during(g12.el, T.start(12), null);
  K.appear(tl, url, T.word(12, "llmsunplugged.org") - 0.2, { y: 16 });
  list.forEach((d, i) => K.appear(tl, d, T.word(12, "video") + i * 0.12, { y: 12 }));
  K.appear(tl, ccL, T.word(12, "Creative"), { scale: 0.7, y: 0 });
};
