# LLMs Unplugged video style

The project half of the `styled-video` skill (in Ben's `ben` plugin): the skill
carries the method and the craft, this file carries what's particular to LLMs
Unplugged. `README.md` next to it is the series plan (the eight videos, tone,
visual grammar, captions, formats) and wins on anything editorial.

## Where things live

- `scripts/<slug>.md`: each video's key idea, beat sheet and script, with a
  `_Visual:_` direction and a `_Reads:_` list per stretch of picture. Ben and
  Ushini own the script and approve the reads; a read still marked `(draft)`
  isn't built. `voice.py` skips `_Visual` and `_Reads` paragraphs.
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

- **The participant's seat**: a desk seen flat from above, white paper objects
  on it (word tiles, the grid sheet, ledger sheets, booklet pages, the cup and
  counters, a pencil), in the site's type. The desk is the decks' slide ground,
  so a video sits beside the slides as black and white with gold and the token
  colours as accents. No tilted photos, no perspective.
- **Punctuation is a symbol tile**: an enlarged bold mark in a rounded square,
  as on the printed sheets and the site (the kit's `punctBox`/`punctTile`),
  wherever a punctuation token appears as a word.
- **Pencil marks boil**: tallies (on the grid and the ledger) and pencil-written
  words redraw slightly differently twelve times a second, as the kit sets up.
  Everything printed stays crisp: headers, the book's text, sheets, booklet
  pages, captions. No paper grain or texture layer.
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
