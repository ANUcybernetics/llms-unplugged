# Composition kit

What every explainer video composition (`ops/video/<slug>/index.html`) is built
from. `kit.css` and `kit.js` are the shared look and objects, `fonts/` and
`vendor/gsap.min.js` the assets, `generated/` (gitignored, written by
`../build-data.py`) the data and page images. A composition reaches the kit
through its `kit -> ../_kit` symlink because HyperFrames serves only the project
root: paths are `kit/kit.css`, `kit/kit.js`, `kit/generated/data.js`.
`../training-grid/index.html` is the worked example; read it before writing a
new one.

## The contract

```html
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
<script>
  const build = (tl, S, T) => {
    /* lay out, then add tweens to tl at times from T */
  };
  KIT.ready(build).then(({ tl }) => {
    window.__timelines["<slug>"] = tl;
  });
</script>
```

`KIT.ready` loads the fonts and `timing.json` (from `../align.py`), calls
`build`, adds the caption band and hands back the paused timeline; the
composition registers it (the lint looks for that line in the HTML). The
portrait variant is a second entry file with `data-aspect="portrait"`, 1080x1920
and the same `build`, branching on `S.portrait`; render it with
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
- `K.die(parent, { size, face })` → `{ el, texts }`; `K.land(tl, die, face, t)`
  lands it showing `face`
- `K.ledgerRow(parent, entry, palette, { w, h })` →
  `{ el, cells[{ lit, strokes, wordEl, box, bar, colour, hex, follower, cx, cy }], prefixEl, lit }`;
  entries come from `KIT_DATA.ledger[name].sheets[].pages[][]`
- `K.sheet(parent, entries, palette, { w, rowH, header: [from, to], title })` →
  `{ el, rows, headerEl, rowAt(i) }`
- `K.cup(parent, { r })` →
  `{ el, add(colour, i, n) → { el, x, y }, counters, centre, cr }`;
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
- `K.el`, `K.svg` (a text's `fill` goes inline), `K.layer(parent, x, y)`,
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
(red, blue, green, yellow: the counter colours, in column order),
`KIT_DATA.booklet` (`entries[word] = { maxRoll, followers: [[w, threshold]] }`,
`pageOf[word]`), `KIT_DATA.pages[name]` (`bbox`, `imgW`, `imgH`).

## Rules that keep a render right

- Only tweens on the timeline decide what a frame shows: transform, opacity,
  stroke-dashoffset, fill. No CSS transitions, no `call()` side effects, no text
  swaps mid-timeline (prebuild the alternatives and toggle opacity).
- Anything not on screen at t=0 is created hidden (`gsap.set(el, { opacity: 0 })`)
  and brought in with `K.appear` (a fromTo) or `tl.to`: the renderer seeks cold
  to any frame, so an element that only appears later is visible before its cue
  unless it starts hidden. A bare `tl.from` on a hidden element would animate
  to the hidden state.
- Positions are `x`/`y` transforms set by `K.layer`/`gsap.set`; never tween
  `left`/`top`/`width`/`height`.
- Every frame must be reproducible: no `Math.random()`, no wall clock.
- The layout check flags text over text. Before a push-in, fade out whatever the
  scaled group will cover; bring it back on the pull-back.
- `npm run check` clean (its contrast pass cannot read `oklch()` and warns;
  everything else it reports is real), then `npm run render -- --quality draft`
  and stills at every beat before calling a composition done.
