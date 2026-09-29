# LLMs Unplugged video style

The project half of the `styled-video` skill (in Ben's `ben` plugin): the skill
carries the method and the craft, this file carries what's particular to LLMs
Unplugged. `README.md` next to it is the series plan (the eight videos, tone,
visual grammar, captions, formats) and wins on anything editorial.

## Where things live

- `scripts/<slug>.md`: each video's key idea, beat sheet and script, with a
  `_Visual:_` direction and a `_Reads:_` list per stretch of picture. Ben and
  Ushini own the script and approve the reads; a read still marked `(draft)`
  isn't built. `voice.py` skips `_Visual` and `_Reads` paragraphs. A `[beat]`
  (or `[beat 1.2]`, seconds) inside a spoken line is a held pause for a step to
  land: left out of the caption, silence in the scratch voice, and a pause in
  the real read.
- `<slug>/`: the HyperFrames project: `index.html` (the composition),
  `lines.json`, `timing.json` and `captions.vtt` (from `align.py`),
  `assets/voice.wav` (not committed), and a `kit -> ../_kit` symlink.
- `_kit/`: the shared kit (`README.md` there is its contract): `kit.css` (the
  stage and the paper objects' look), `kit.js` (the objects), `fonts/`,
  `generated/` (gitignored; `build-data.py` writes it), and `motion ->`
  astromotion's `video/` engine as installed in `website/node_modules`, so the
  engine's version is the website's astromotion pin. Run `pnpm install` in
  `website/` before building a video.
- `recut/`: the talk-recording recut path: the fallback frame renderer
  `render-frames.mjs`, `overlay-template.html` (a page it renders, with the crop
  and placement helpers) and `title-card.html` (the deck's hero grammar as a
  still).
- `out/video/<slug>/`: renders, stills and staged inputs (gitignored). Finished
  renders, VO takes and footage go to the bucket under `video/<slug>/`, never
  git.

`README.md` lists the build commands (`build-data.py`, `voice.py`, `align.py`,
`video.py check|render|stills|upload`).

## Sources of truth

- **Palette and type**: `website/src/styles/common.css` (gold, ground, text) and
  `website/src/decks/theme.css` (paper, the eight `tc-N` token colours).
  `_kit/kit.css` carries copies with pointers back; the CSS wins if they
  disagree.
- **Token colours**: the hash in `website/src/lib/tokenColors.ts` (matched by
  `cli/cutout-common.typ`) decides a word's colour on a slide and on paper;
  `kit.js` ports it. Never pick a colour for a word.
- **Examples and data**: the grid line, rolls and sequences come from
  `website/src/decks/examples.ts`; ledger rows and booklet entries from the CLI
  runs `build-data.py` makes (the same recipes as the Makefile's pack targets).
  The video shows the same example the slides and the printed sheets show.
- **Printed pages**: `pdf-assets.sh` turns a CLI-printed PDF into page images
  and every text line's bounding box, so a highlight lands on a word from the
  PDF's own text layer, never by eye. Page images render at 300 dpi and lay out
  in 150-dpi units, so they stay sharp in a 4K push-in.
- **Fonts**: Public Sans and Libertinus Serif, from `_kit/fonts/` (full OTFs;
  the subsets in `website/src/assets/fonts/` are for the browser Typst compiler
  and miss glyphs and weights).
- **Deck artwork**: `website/src/decks/assets/bg-*.avif` (`avifdec` to PNG).

## The look

- **The participant's seat**: a desk seen flat from above, with the paper
  objects on it (word tiles, the grid sheet, ledger sheets, booklet pages,
  cutout slips, the writing strip), in the site's type. The desk is the decks'
  slide ground, so a video sits beside the slides as black and white with gold
  and the token colours as accents. No tilted photos, no perspective.
- **Paper is white paper**: anything that stands for a printed or written sheet
  is a white object with square corners, not a drawing.
- **Everything else is line drawing**, after the ANU brand guidelines'
  illustration style (§4.7: single-weight fine linework, loose rather than
  geometric): white lines 2 px at 1080 (4 px in a 4K master), no fills, gold on
  the one part that matters (a pencil's point, the reply bubble, the die's
  number, the harness person's head). Not skeuomorphic: the cup is a rim with
  its counters, the die is a decagon with its number centred on the ink, the
  phone is a plain outline. Counters stay filled in their four colours, because
  the colour is the data. A soft `--gold` tint disc (20%) may sit behind a hero
  drawing.
- **Where the drawings come from**: iconoir (`@iconify-json/iconoir`, already a
  website dependency) for utility props at the same line weight, and public
  domain (CC0) silhouettes drawn as their outline only, never filled or
  decorated with gold shapes: the dog is openclipart 169096 (standing dog), the
  magpie PhyloPic's pied currawong (ac6920cc…, the Australian magpie's closest
  relative with a CC0 silhouette; no CC0 Australian magpie exists). Nothing
  stands on a drawn fence or ground line.
- **Square corners**: the ANU theme's `--at-border-radius: 0`, on paper, tiles,
  rings, bars, bubbles and panels. The one exception is below.
- **Punctuation is a symbol tile**: an enlarged bold mark in a rounded square,
  as on the printed sheets and the site (the kit's `punctBox`/`punctTile`),
  wherever a punctuation token appears as a word. Its rounded corner is what the
  sheets print, so it stays.
- **Outlines glint**: a significant outline (a drawing, a circle, a panel's
  border) can carry a slow glint, a short segment (about 9% of its length) that
  travels once round it with an ease in and out, then rests: in gold over the
  line, or as a gap in the line that shows what's behind. A few seconds a lap,
  staggered between objects, never on paper or text; it gives a held frame life
  without moving anything.
- **Pencil marks hold still**: tallies and pencil-written words draw on, then
  stay put. No boil, jitter or paper texture: at 4K any frame-to-frame redraw
  reads as wobble, not hand-drawing.
- **Movers land on top**: a token flying into a cell, a counter into the cup, a
  slip onto a pile travels and lands in front of what it lands on, never behind
  it (`K.raise`; `K.flyTo` does it for you). Build order otherwise decides, and
  whatever was built first ends up underneath.
- **Gold does the pointing**: row and column bands, rings and highlights are
  `--gold`; dimming the rest of the desk leads the eye.
- **Captions** sit in a reserved band below the scene (190 px landscape, 300 px
  portrait), the script line whole, in Public Sans; nothing animates under it.
- **Stage** 1920x1080 (the Overview also 1080x1920, restacked, never cropped);
  masters 4K at 50 fps, drafts 1080p25.

## Faithfulness

When a recording and the artefact disagree (someone names a colour that isn't
the printed one, reads the wrong row), decide explicitly rather than letting the
video be quietly wrong or quietly confusing. The usual answer is clarity for the
viewer: rebuild the video's copy of the asset to match what was said, keep the
real set untouched, and list every deviation in the timeline data so the next
person knows the video isn't the paper. Never annotate the discrepancy on
screen.
