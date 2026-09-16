---
name: llms-unplugged-video
description:
  Produces LLMs Unplugged videos --- a talk recording or talking head cut with
  animated overlays, an explainer for a module or lesson on the website, a
  screencast of a widget, a clip that animates a printed artefact (search
  sheets, cutouts, ledger pages) or a deck's slides --- as an HTML composition
  rendered with HyperFrames (headless Chrome + ffmpeg). Use it whenever the task
  involves video, animation, a recut, a title card, a voiceover transcript,
  frame rendering, or turning the project's own materials into moving pictures,
  even when the user only says "make a clip" or "animate this".
---

# LLMs Unplugged videos

A video here is an HTML composition: the project's real materials laid out on a
1920x1080 stage with timing attributes and a seekable animation timeline,
rendered frame by frame by
[HyperFrames](https://github.com/heygen-com/hyperframes). Everything on screen
comes from what the project already makes: the sheets, cutouts and ledger pages
the CLI prints, the widgets and decks the website ships, the palette and fonts
they share, and the footage of whoever is talking. Rebuild those assets for the
video rather than redrawing them by hand, and the video stays faithful to what a
room actually holds.

HyperFrames does the mechanical parts (seeking footage per frame, capturing,
encoding, mixing audio). The judgement --- what to show when, and how a move
should feel --- is per video, and lives in that video's composition.

## Where a video's files go

- `ops/video/README.md` --- the series plan, production phases, tone and
  composition sources; `ops/video/scripts/<slug>.md` --- each video's beat sheet
  and script, with the to-camera lines tagged (TC). Read the script before
  building its composition, and keep the two in step: a re-cut starts from a
  script edit.
- `ops/video/<slug>/` --- the HyperFrames project: `index.html` (the
  composition), `hyperframes.json`, `package.json` with the pinned CLI,
  `lines.json`/`timing.json`/`captions.vtt` (from `ops/video/align.py`) and
  `assets/voice.wav` (not committed). The explainer series shares
  `ops/video/_kit/` (stage, objects, motion helpers, fonts, generated data; its
  README is the contract) through a `kit -> ../_kit` symlink, because
  HyperFrames serves only the project root and its lint rejects `../` paths.
  `ops/video/README.md` lists the build commands.
- `out/video/<slug>/` --- staged inputs (recording, transcript, page images) and
  renders. `out/` is gitignored; finished videos are published elsewhere (the
  bucket, YouTube).
- `.claude/skills/llms-unplugged-video/` --- this skill: project-specific
  scripts in `scripts/`, starting points in `assets/`, ffmpeg recipes in
  `references/ffmpeg.md`.

Read the composition of an earlier video before starting a new one of the same
kind; the beat structure transfers even when the content doesn't.

## Sources of truth

- **Palette and type**: `website/src/styles/common.css` (gold, ground, text
  tokens) and `website/src/decks/theme.css` (the eight `tc-N` token colours and
  the hero-slide grammar). `assets/overlay-template.html` carries copies with
  comments pointing back; if the values there ever disagree with the CSS, the
  CSS wins.
- **Token colours**: the hash in `website/src/lib/tokenColors.ts` (matched by
  `cli/cutout-common.typ`) decides a word's colour on a slide and on paper. The
  template includes it, so a token drawn in a caption is the colour it is on the
  printed sheet. Don't invent a colour for a word.
- **Printed artefacts**: build them with the CLI (or the Makefile pack target
  that pins a delivery's exact run), then `scripts/pdf-assets.sh` turns the PDF
  into page images, thumbnails and a JSON of every text line's bounding box.
  Positions come from the PDF's text layer, never from eyeballing.
- **Deck artwork**: `website/src/decks/assets/bg-*.avif` are the backgrounds
  (`avifdec` to PNG for the stage); a title card reuses the deck's hero grammar
  (`assets/title-card.html` shows it).
- **Fonts**: the site's Public Sans and Libertinus Serif. HyperFrames renders in
  its own downloaded Chrome, which sees no system fonts, so every family the
  composition uses needs an `@font-face` pointing at a file under
  `assets/fonts/`; the lint reports a bare family name. (The subsets in
  `website/src/assets/fonts/` are for the browser Typst compiler and miss glyphs
  and weights.)

## Engine: HyperFrames

Scaffold a project (pin the version the way `init` does, so a re-render months
later matches):

```bash
cd ops/video
HYPERFRAMES_SKIP_SKILLS=1 npx -y hyperframes@latest init <slug> --example blank --non-interactive
# or, for a talking head: --video out/video/<slug>/talk.mp4  (also writes a Whisper transcript)
```

The composition contract, learnt from its lint:

- the root carries `data-composition-id`, `data-start`, `data-duration`,
  `data-width`, `data-height` and `data-fps` (50 for the explainer series, 25 to
  match a 25p recording; it defaults to 30)
- every element on the timeline is `class="clip"` with `data-start`,
  `data-duration` and `data-track-index`
- footage with its own sound is `<video ... data-has-audio="true">`; anything
  else is `muted`, with a separate `<audio>` clip. The output audio is mixed
  from these; nothing to mux by hand
- motion is a paused GSAP timeline registered as
  `window.__timelines[<composition id>]`, which the renderer seeks per frame;
  the registration line has to appear literally in the HTML (the lint greps for
  it), and a GSAP timeline is a thenable, so never resolve a promise with one
  bare (it waits for the paused timeline to finish: forever). Animate transforms
  and opacity (`x`, `y`, `scale`), never `left`, `top`, `width` or `height`:
  layout properties snap to whole pixels and stutter. CSS transitions are not
  seekable; CSS keyframes are
- a value the DOM can't tween (a page crop, a highlight box computed from a PDF
  bounding box) is a plain object tweened by GSAP with an `onUpdate` that
  applies it, which keeps it seek-safe. The crop/placement helpers in
  `assets/overlay-template.html` are written for exactly that

Then, every time the composition changes:

```bash
npm run check                      # lint + runtime + layout + motion + contrast
npm run render -- --resolution landscape-4k --fps 50 --output ../../out/video/<slug>/<slug>.mp4
npm run render -- --quality draft --output review.mp4        # 1080p at data-fps, fast pass for watching
npm run render -- --format png-sequence --output frames      # stills at the beats
```

A simple 1080p composition renders at roughly 25 frames a second across its
worker pool. The first render downloads Chrome into `~/.cache/hyperframes`
(about 260 MB). The CLI reports anonymous telemetry unless
`npx hyperframes telemetry disable` (or `HYPERFRAMES_NO_TELEMETRY=1`) has been
run.

HyperFrames ships twenty agent skills of its own: a `/hyperframes` router,
creation workflows (product launch, faceless explainer, captions, talking-head
recut, PR-to-video, motion graphics, music video, slideshow, general video) and
the domain skills they lean on (core, animation, keyframes, creative, CLI,
media-use, audio). Don't install them: `hyperframes skills update` (and `init`
without `HYPERFRAMES_SKIP_SKILLS=1`) writes all nine core ones into the user's
global `~/.claude/skills`, `~/.agents/skills`, `~/.codex/skills` and
`~/.gemini/skills`, where they load into every session on the machine. This
skill already carries the composition contract; when one of theirs is needed,
fetch its markdown into the scratchpad and read it there:

```bash
curl -sL https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/<name>/SKILL.md
```

The two worth reading for our videos are `hyperframes-keyframes` (seek-safe
motion beyond GSAP: CSS keyframes, WAAPI, SVG draw and morph) and
`talking-head-recut` (lower-thirds, callouts and side panels synced to a
transcript).

## Timeline first

Write the beats as data before touching the composition: a `script.json` of what
is said when, what should appear, and what it refers to (sheet 39, the pair "old
man"), with times in seconds (or `mm:ss.ss`) of the source. Every reference to a
sheet or pair gets checked against the deal (`sheets.json`) so the video shows a
sheet that really holds that pair. The composition reads this file (or inlines
its values) and builds its GSAP timeline from it, so retiming a beat is an edit
to one number and a re-render.

For a recording, get a word-level transcript first and take the beat times from
it; guessing times by scrubbing costs far more than a transcript does.
`init --video` writes one; `scripts/transcribe.py` does the same for footage you
are not scaffolding around.

## Moves that read well, learnt the hard way

- ease in-out for camera moves, ease-out for things appearing; 0.4--0.7 s
- **zooms tween the scale logarithmically**, so a 15x zoom feels even
- a page growing out of its grid cell tweens its on-screen placement (corner
  moves straight, size eases up); a camera move within a page tweens the crop,
  so the point of interest tracks. Mixing the two up makes the page swim
- a "show of hands" across a grid staggers each cell with a deterministic jitter
  (hash the index), never `Math.random()`: frames must be reproducible
- after an answer lands, stay on it for a beat (a `linger` of a few seconds)
  even if the next question comes quickly --- but be back on the wide view
  before the next cue needs it
- when the talk shrinks into a corner to make room for a panel, keep the
  speaker's face inside the crop; `object-fit: cover` on a scaled video element
  is what makes that cheap

## What this pipeline renders well

Chrome draws each frame, ffmpeg only encodes them, so the ceiling is what Chrome
draws crisply at 25 fps with no motion blur and what 8-bit 4:2:0 H.264 keeps.
Design to the strengths and the result looks deliberate; design against them and
it looks amateurish however slick the idea.

Reliably good: flat vector (SVG, solid fills, the site's type) tweening
transform and opacity with easing; a push-in on a group while the rest dims; SVG
stroke draw-on (`stroke-dashoffset`) for marks, lines and arrows; staggered
reveals; hard cuts and short crossfades; a logarithmic zoom-out across scales.

Reliably janky: slow creeping pans, which judder and make thin lines and text
shimmer (move fast and short, or hold still); animated `filter`, `blur` and
`drop-shadow`; large gradients and photographic texture, which band and moiré
under the encoder; physics or particles (tumbling counters, bouncing dice);
perspective or 3D transforms of text; thin saturated lines and small coloured
text, which bleed in chroma subsampling. A "desk from above" is a flat top-down
illustration, not a tilted photo.

## Fallback engine

`scripts/render-frames.mjs` is the hand-rolled renderer the showcase recut used,
for a page that computes the whole frame itself from a time `t` (`window.setup`,
`window.renderFrame(t)`, optional `window.seekVideo`). Reach for it only when a
composition can't express the video, and read its header first: under it nothing
may depend on the wall clock, so no CSS transitions at all, the source footage
needs a short-GOP re-encode before Chrome can seek it quickly, and assembly is
by hand with the recipes in `references/ffmpeg.md`. Those recipes also cover the
case HyperFrames doesn't: splicing a rendered section back into an untouched
recording on one frame grid.

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

- `npm run check` is clean (its motion and contrast checks catch real problems,
  not just style)
- stills at every beat boundary and at the middle of every move
- the draft render watched at 1x with sound; what is shown lands on the word
  that names it, not a second early
- the fonts rendered (a fallback sans is the commonest silent failure, and the
  lint only sees families it can't resolve, not a wrong file)
