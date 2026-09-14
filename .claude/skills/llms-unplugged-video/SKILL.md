---
name: llms-unplugged-video
description:
  Produces LLMs Unplugged videos --- a talk recording re-cut with an animated
  overlay, an explainer for a module or lesson on the website, a screencast of a
  widget, a clip that animates a printed artefact (search sheets, cutouts,
  ledger pages) or a deck's slides --- as a data-driven timeline rendered
  frame-by-frame in headless Chrome and assembled with ffmpeg. Use it whenever
  the task involves video, animation, a recut, a title card, a voiceover
  transcript, frame rendering, or turning the project's own materials into
  moving pictures, even when the user only says "make a clip" or "animate this".
---

# LLMs Unplugged videos

A video here is a timeline (data) plus a renderer (an HTML page that draws any
instant of the timeline) plus an assembly (ffmpeg). Everything on screen comes
from the project's real materials: the sheets, cutouts and ledger pages the CLI
prints, the widgets and decks the website ships, the palette and fonts they
share. Rebuild those assets for the video rather than redrawing them by hand,
and the video stays faithful to what a room actually holds.

The bundled scripts do the mechanical parts; the judgement --- what to show
when, and how a move should feel --- is per video, and lives in that video's
timeline and overlay page.

## Where a video's files go

- `out/video/<slug>/` --- staged inputs (recording, transcript, page images),
  rendered chunks, the finished mp4. `out/` is gitignored, and the videos are
  never committed: they are published elsewhere (the bucket, YouTube).
- `ops/video/<slug>/` --- the timeline (`script.json`), the overlay page and any
  per-video assembly script, when the video belongs to the project (an explainer
  for a module, say). A one-off cut of a talk recording can keep these files
  outside the repo; the scripts take `LLMSU_ROOT` for that.
- `.claude/skills/llms-unplugged-video/` --- this skill: generic scripts in
  `scripts/`, starting points in `assets/`, ffmpeg recipes in
  `references/ffmpeg.md`.

Read the timeline file of an earlier video before starting a new one of the same
kind; the beat structure transfers even when the content doesn't.

## Sources of truth

- **Palette and type**: `website/src/styles/common.css` (gold, ground, text
  tokens) and `website/src/decks/theme.css` (the eight `tc-N` token colours and
  the hero-slide grammar). `assets/overlay-template.html` carries copies with
  comments pointing back; if the values there ever disagree with the CSS, the
  CSS wins.
- **Token colours**: the hash in `website/src/lib/tokenColors.ts` (matched by
  `cli/cutout-common.typ`) decides a word's colour on a slide and on paper. The
  template includes it, so a token drawn in the overlay is the colour it is on
  the printed sheet. Don't invent a colour for a word.
- **Printed artefacts**: build them with the CLI (or the Makefile pack target
  that pins a delivery's exact run), then `scripts/pdf-assets.sh` turns the PDF
  into page images, thumbnails and a JSON of every text line's bounding box.
  Positions come from the PDF's text layer, never from eyeballing.
- **Deck artwork**: `website/src/decks/assets/bg-*.avif` are the backgrounds; a
  title card reuses the deck's own hero art (`assets/title-card.html`).
- **Fonts**: the site's Public Sans and Libertinus Serif. A `file://` page in
  headless Chrome only sees fonts the OS has installed; check `fc-list` and
  install them before rendering, or the page silently falls back to a sans that
  looks nothing like the deck. (`website/src/assets/fonts/` holds subsets for
  the browser Typst compiler, not full families.)

## Timeline first

Write the timeline as data (`script.json`) before touching the renderer. Times
are `mm:ss.ss` in the source recording (or in the voiceover), one entry per
beat: when a thing is said, when it should appear, what it refers to (sheet 39,
the pair "old man"). Every reference to a sheet or pair gets checked
against the deal (`sheets.json`) so the video shows a sheet that really holds
that pair.

For a recording, get a word-level transcript first (`scripts/transcribe.py`) and
take the beat times from it; guessing times by scrubbing costs far more than a
transcript does. Retiming a beat is then an edit to one number and a re-render.

Keep the vocabulary of the timeline small and declarative: views (grid, page,
readback), highlights (from, to, what), captions, steps. The renderer turns
those into geometry; the timeline never holds pixels.

## The renderer is a pure function of time

The overlay page exposes `window.setup(opts)` and `window.renderFrame(t)`, and
draws the whole 1920x1080 frame for time `t` from scratch: which elements are
on, their opacity, the page crop, the caption. Nothing depends on the previous
frame or on the wall clock, which means:

- **no CSS transitions or animations** --- they run on wall time, and a
  screenshot taken after a seek catches them mid-flight. Compute every tween
  from `t` with an easing function.
- any frame is reproducible: `render-frames.mjs preview 53:23.5` writes a PNG
  you can look at before rendering the lot.
- frames can be rendered in parallel workers and concatenated.

Moves that read well, learnt the hard way:

- ease in-out for camera moves, ease-out for things appearing; 0.4--0.7 s.
- **zooms tween the scale logarithmically**, so a 15x zoom feels even.
- a page growing out of its grid cell tweens its on-screen placement (corner
  moves straight, size eases up); a camera move within a page tweens the crop,
  so the point of interest tracks. Mixing the two up makes the page swim.
- a "show of hands" across a grid staggers each cell with a deterministic jitter
  (hash the index), never `Math.random()`.
- after an answer lands, stay on it for a beat (a `linger` of a few seconds)
  even if the next question comes quickly --- but be back on the wide view
  before the next cue needs it.
- when a video element is part of the frame, seek it to `t - offset` and await
  `seeked`; after setting an image `src`, await `decode()`; then wait two
  animation frames before the screenshot. Skipping any of these gives torn or
  stale frames that only show up on playback.

## Rendering

`scripts/render-frames.mjs` drives any page written to that contract (see the
header for the flags). It finds Chrome the way astromotion does, reuses the
website's `puppeteer-core`, samples each frame at its midpoint, snaps the
section boundaries to the frame grid and pipes PNGs into ffmpeg per worker.
Useful facts:

- 25 fps unless the source recording is something else; match the source.
- render only the section that changes; the untouched parts are cut straight
  from the source at assembly.
- a source video the page seeks through needs a **short GOP re-encode**
  (`-g 25`) first, or every seek decodes back to a keyframe seconds away and the
  render crawls.
- ~11k frames took about six minutes across eight workers on a desktop
  machine (CPU rendering); preview a dozen frames at the beats before
  committing to that.

## Assembly

`references/ffmpeg.md` has the recipes: fetching a recording, the short-GOP cut,
cutting the untouched parts on the same frame grid, upscaling 720p, laying a
title card over an opening, concatenating, and muxing one audio track cut
straight from the source. The rule that keeps sync trivial: **every part is a
whole number of frames on one grid that starts at the first frame**, and the
audio is one uncut span of the source. Verify the rendered part's frame count
with ffprobe before concatenating; a one-frame drift is invisible in the numbers
and obvious in the lip sync.

## Faithfulness and clarity

When the recording and the artefact disagree (someone calls out a colour that
isn't the printed one, reads the wrong row), decide explicitly rather than
letting the video be quietly wrong or quietly confusing. The usual answer is
clarity for the viewer: rebuild the video's copy of the asset to match what was
said, keep the real set untouched, and list every deviation in the timeline file
so the next person knows the video is not the paper. Never annotate the
discrepancy on screen; a caption explaining a mistake is worse than either
choice.

## Review before calling it done

- preview frames at every beat boundary and at the middle of every move
- watch the assembled video at 1x with sound; check that what is shown lands on
  the word that names it, not a second early
- check the fonts rendered (a fallback sans is the commonest silent failure)
- check the first and last frames of the rendered section match the source
  frames either side of it
