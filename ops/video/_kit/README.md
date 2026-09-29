# Composition kit

What every explainer video composition (`ops/video/<slug>/index.html`) is built
from. `kit.css` and `kit.js` are the shared look and objects, `fonts/` the type,
`generated/` (gitignored, written by `../build-data.py`) the data and page
images, and `motion/` a symlink to astromotion's video engine as installed in
`website/node_modules` (its `README.md` is the timeline API; run `pnpm install`
in `website/` first). A composition reaches the kit through its `kit -> ../_kit`
symlink because HyperFrames serves only the project root: paths are
`kit/kit.css`, `kit/kit.js`, `kit/generated/data.js`.
`../training-grid/index.html` is the worked example; read it before writing a
new one.

## The contract

```html
<link rel="stylesheet" href="kit/kit.css" />
<script src="kit/generated/data.js"></script>
<script type="module" src="kit/kit.js"></script>
...
<div
  id="stage"
  class="stage"
  data-aspect="landscape"
  data-composition-id="<slug>"
  data-start="0"
  data-duration="<timing.json duration, rounded up>"
  data-width="1920"
  data-height="1080"
  data-fps="50"
>
  <div
    id="scene"
    class="clip layer scene"
    data-start="0"
    data-duration="…"
    data-track-index="0"
  ></div>
  <audio
    id="voice"
    class="clip"
    src="assets/voice.wav"
    data-start="0"
    data-duration="…"
    data-track-index="1"
  ></audio>
</div>
<script type="module">
  const build = (tl, S, T) => {
    /* lay out, then add tweens to tl at times from T */
  };
  KIT.ready(build).then(({ tl }) => {
    window.__timelines["<slug>"] = tl;
  });
</script>
```

`KIT.ready` loads the fonts and `timing.json` (from `../align.py`), calls
`build`, adds the caption band and compiles the timeline into Web Animations;
the composition registers the compiled controller (the lint looks for that line
in the HTML). Both scripts are modules, so the inline one runs after `kit.js`
has defined `KIT`. The portrait variant is a second entry file with
`data-aspect="portrait"`, 1080x1920 and the same `build`, branching on
`S.portrait`; render it with
`--composition portrait.html --resolution portrait-4k`.

- `S` (stage): `W`, `H`, `portrait`, `captionH`, `area` =
  `{x, y, w, h, cx, cy}`, the space above the caption band; put everything
  inside it. The `.scene` layer is clipped to it.
- `T` (timing): `T.start(i)` / `T.end(i)` of script line `i` (0-based, the order
  in `lines.json`), `T.word(i, "fence")` the start of that word in line `i`
  (`T.word(i, "the", 3)` the third "the"; punctuation and case ignored),
  `T.wordEnd`, `T.duration`. A visual lands on the word that names it, never a
  second early. `T.word` throws if the word is not in the line, which is the
  check that the composition and the script agree.
- `tl`: `tl.to(targets, props, at, { dur, ease, stagger, yoyo })`,
  `tl.fromTo(targets, from, to, at, opts)`, `tl.set(targets, props, at)`,
  `tl.sample(targets, at, dur, (p) => props, { ease })` for computed motion (a
  logarithmic zoom). Eases are `out-cubic`, `in-out-quad` and so on (see the
  engine README).

## Objects

All take `(parent, …, { x, y, … })`, place themselves by transform, and return
`{ el, … }` with handles to animate. Sizes are free: pick what reads on a
screen, not what fits a printed page.

- `K.tiles(parent, tokens, { size, gap, maxW, padX })` →
  `{ el, tiles[{ el, text, x, y, w, h }], width, height }`
- `K.bigrams(tokens, vocab)` →
  `{ vocab, counts[r][c], pairs[{ i, r, c, from, to, nth }] , idx }`;
  `K.rowOptions(bg, r)`, `K.diceBands(options)` (the booklet's rounding)
- `K.grid(parent, bg, { cell, head })` →
  `{ el, cells[r][c]{ strokes, cx, cy, x, y, w, h }, rowBands, colBands, rowHead, colHead, dimmer, width, height, at(r, c) }`;
  strokes are prepped for `K.drawOn`
- `K.strip(parent, bands, { face })` →
  `{ el, faces, blocks, labels, nums, shade(tl, t), light(tl, i, t), faceAt(i) }`
- `K.die(parent, { size, face })` → `{ el, texts, outline }` (a decagon, the
  number centred on its ink); `K.land(tl, die, face, t)` lands it showing `face`
- `K.ledgerRow(parent, entry, palette, { w, h })` →
  `{ el, cells[{ lit, strokes, wordEl, box, rule, colour, hex, follower, cx, cy }], prefixEl, lit }`;
  entries come from `KIT_DATA.ledger[name].sheets[].pages[][]`
- `K.sheet(parent, entries, palette, { w, rowH, header: [from, to], title })` →
  `{ el, rows, headerEl, rowAt(i) }`
- `K.cup(parent, { r })` →
  `{ el, rim, add(colour, i, n) → { el, x, y }, counters, centre, cr }`;
  `K.counter(parent, colour, { r })`
- `K.paper(parent, { w, h })`, `K.pencilLine(paper.el, words, { size })` →
  `{ el, words[] }`, `K.write(tl, span, t)`
- `K.bookPage(parent, lines, { w, h, size })`, `K.ring(parent, { w, h })` →
  `{ el, around(tl, box, t, dur, pad) }`, `K.spanBox(tiles, a, b)`
- `K.pageImage(parent, name, sheetNo, { w, h })` →
  `{ el, lineBox(words), fit(), around(box, cw), moveTo(tl, crop, t, dur), highlight(box), hl }`
  (a real booklet or sheet page from `generated/pages/`)
- `K.loop(parent, { w, h, labels })` →
  `{ el, path, stations[{ dot, text, x, y }] }`
- line art (STYLE.md; classes `.line`, `.line.faint`, `.line.gold`,
  `.gold-fill`): `K.pencil(parent, { x, y, len, angle })` (x, y is the gold
  point), `K.icon(parent, name, { x, y, size, gold })` → `{ el, svg, paths }`
  (iconoir: `smartphone-device`, `chat-bubble`, `coffee-cup`, `user`),
  `K.outline(parent, name, { x, y, w, h, flip, rotate })` → `{ el, paths }` (the
  CC0 `magpie` and `dog` in `art/`, outline only)
- `K.glint(tl, shapes, { kind, phase, lap, rest, seg, from, to })`: a segment
  that travels round an outline and rests, `kind` `"gold"` or `"gap"`; SVG
  shapes only, never paper or text
- `K.el`, `K.svg` (a text's `fill` goes inline), `K.layer(parent, x, y)`,
  `K.set(targets, props)` / `K.get(el, prop)` (build-time values),
  `K.tally(g, n, x, y)`, `K.prepDraw(paths)`, `K.colourIndex`, `K.tokenColour`,
  `K.isPunct`, `K.split`, `K.jitter(i)`

Motion: `K.appear(tl, els, t, { dur, y, scale, stagger })`, `K.vanish`,
`K.show`, `K.hide`, `K.drawOn(tl, paths, t, dur, stagger)`,
`K.flyTo(tl, item, { x, y }, t)`, `K.camera(layerEl, S)` →
`to(tl, { px, py, s, sx, sy }, t, dur)`, `reset(tl, t, dur)`,
`logZoom(tl, { px, py, from, to }, t, dur)`.

Data: `KIT_DATA.grid` (`tokens`, `vocab`, `generation`, `rolls`,
`pretrainedSeq`, `pretrainedRolls`, from `website/src/decks/examples.ts`),
`KIT_DATA.ledger[name]` (`sheets[].range`, `sheets[].pages[][]` entries
`{ prefix: [w], followers: [{ text, count }] }`, `title`), `KIT_DATA.palette`
(red, blue, green, yellow: the counter colours, in column order), `KIT_DATA.art`
and `KIT_DATA.icons` (from `art/` and iconoir), `KIT_DATA.booklet`
(`entries[word] = { maxRoll, followers: [[w, threshold]] }`, `pageOf[word]`),
`KIT_DATA.pages[name]` (`bbox`, `imgW`, `imgH` in 150-dpi layout units; the
files are 300 dpi).

## Rules that keep a render right

- Only the timeline decides what a frame shows: transform, opacity,
  stroke-dashoffset, fill. No CSS transitions, no callbacks, no text swaps
  mid-timeline (prebuild the alternatives and toggle opacity).
- Anything not on screen at t=0 is created hidden (`K.set(el, { opacity: 0 })`)
  and brought in with `K.appear` or `tl.to`: the renderer seeks cold to any
  frame. An `appear` that is an element's first opacity tween also holds it
  hidden until its cue.
- A build-time `K.set` is the element's resting value for the whole video; a
  mid-video reposition is a `tl.set` at its time.
- Positions are `x`/`y` transforms; never tween `left`/`top`/`width`/`height`.
- Every frame must be reproducible: no `Math.random()`, no wall clock.
- The layout check flags text over text. Before a push-in, fade out whatever the
  scaled group will cover; bring it back on the pull-back.
- `npm run check` clean (its contrast pass cannot read `oklch()` and warns;
  everything else it reports is real), then `npm run render -- --quality draft`
  and stills at every beat before calling a composition done.
