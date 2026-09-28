# Beyond-series parts

What the beyond videos share on top of `../../_kit`: a beat several videos reuse
(the book at machine speed, the tree, the morph) lives here as one ES module,
drawn once, so siblings stay siblings. A composition reaches it through its
`parts -> ../_parts` symlink (`import { … } from "./parts/tree.js"`).

- `<name>.js`: a part. Exports functions that take `(tl, S, T, parent, opts)` or
  similar, lay themselves out from `KIT`/`KIT_DATA` and add their tweens to `tl`
  at absolute times the caller passes in, so the caller's `timing.json` decides
  when. The kit's rules apply unchanged (only the timeline decides a frame; no
  `Math.random()`; canvas layers draw as a pure function of t).
- `build-<name>.py`: a uv script writing `generated/<name>.js` (gitignored) from
  `data/` via the CLI, for data the kit's `build-data.py` doesn't make. Each
  file's header says which videos use it.

Parts don't change `../../_kit`: the TASK-154 videos render from it.
