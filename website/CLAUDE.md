# llms-unplugged website

Astro 7 static site with Svelte 5 (runes) components for interactive language
model demonstrations, plus astromotion slide decks. MDX content, TypeScript,
pnpm, Vitest, oxlint, stylelint.

Formatting is oxfmt for everything except `.astro`, which oxfmt cannot parse ---
those go through Prettier with `prettier-plugin-astro`. `pnpm run format` runs
both; keep both.

## Dev server

Astro 7 backgrounds `astro dev` automatically when it detects an agent
environment, so run it plainly rather than `astro dev &` plus polling for
"Local:". Manage it with `astro dev status`, `astro dev logs --follow` and
`astro dev stop`.

## Project structure

- `src/pages/` --- Astro page routes
- `src/content/modules/` --- module MDX (content collection): the building-block
  activities
- `src/content/lessons/` --- lesson MDX (content collection): deck-backed
  workshop journeys assembled from modules
- `src/content/news/` --- news markdown (content collection)
- `src/decks/` --- `*.deck.mdx` decks, shared `partials/`, `assets/` and
  `theme.css`
- `src/components/` --- Astro and Svelte components
- `src/layouts/` --- page layouts
- `src/lib/` --- shared utilities and stores
- `src/styles/` --- global CSS
- `public/` --- static assets (images, favicon, CNAME)

Content collections use Zod schemas in `src/content.config.ts`. Shared state
(variant, training text, playback) uses Svelte 5 runes in `.svelte.ts` files.
The grid/cutouts variant toggle is pure CSS: a `data-variant` attribute on
`<html>` plus `.grid-only`/`.cutouts-only` classes, driven by a
`<Variant is="grid">` Astro component.

## Styling: website vs decks

The website is responsive; decks are Reveal.js slides in a fixed 1280x720
viewport scaled to fill the screen. Colour tokens (`--anu-*`, `--color-*`,
`--lm-highlight-*`) live once in `src/styles/common.css`, and widget component
styles in `src/styles/widgets.css`; both are imported by `global.css` and by
`src/decks/theme.css`. Add new shared tokens to `common.css`, and when changing
colours or widget styles check both consumers.

Typography and layout are deliberately independent: root font size (website
20px, decks 16px), Reveal's `--r-*` variables, layout tokens like
`--nav-height`, and container queries (decks override widget sizing with
`:global()` rules per slide instead) all differ by design. Don't try to unify
them.

**Deck components must not set outer margins.** The slide owns the gaps between
its children: `astro-theme-university/styles/deck.css` gives every direct child
of a `section` a `margin-block-end`, and Svelte's scoping class outspecifies
that zero-specificity rule, so a component with its own `margin` sits flush
against whatever follows. Use `margin-inline` when a root needs centring. The
exception is a root that genuinely owns its geometry (a full-bleed,
absolutely-positioned layer).

## Deck source formatting

Deck sources format like any other MDX, so hand-rolled inline HTML has to
survive a reflow. MDX parses an element's children as blocks once they span more
than one line, so a wrapped `<p class="fragment">...</p>` ends up with a `<p>`
inside a `<p>` and the class on an empty element. The `{/* prettier-ignore */}`
comments above those blocks are what stop it --- keep them, and add one when you
write markup that would wrap. For the same reason, never let an inline tag start
a line inside a prose paragraph: oxfmt reads it as a new block and splits the
paragraph in two.

## Commands

- `pnpm run dev`, `pnpm run build`, `pnpm run test`
- `pnpm run check` --- typecheck, lint, format check, tests, `decks:check`
- `pnpm run decks:check` --- checks every slide for content overflowing the
  fixed canvas. Worth running alone after any deck edit or theme bump: the
  build's "Checked N deck(s) --- no structural violations" line is a different
  check, and says nothing about whether slides fit. See the header of
  `node_modules/astromotion/scripts/deck-check.mjs` for its flags and limits. A
  bad partial is reported once per deck that includes it --- fix the partial. It
  measures fit only; whether a slide _reads_ well still needs a screenshot.
- `pnpm run pdf <slug> [output.pdf]` --- export a deck to PDF via astromotion's
  `astromotion-pdf`

Presenter guides (slides plus interleaved speaker-notes pages) live in the
Tigris bucket behind `pdf.llmsunplugged.org`, as do all published PDFs (see
`../ops/bucket-sync.py`), and are linked by the `UsingTheSlides` component,
gated on the committed manifest `src/data/pdf-manifest.json`. After editing a
deck, regenerate and republish:

```bash
ASTROMOTION_CHROME_ARGS=--no-sandbox pnpm exec astromotion-pdf <slug> \
  ../out/pdfs/decks/<slug>/presenter-guide.pdf --notes
../ops/bucket-sync.py upload ../out/pdfs
../ops/bucket-sync.py manifest   # then commit the refreshed manifest
```

`src/wasm-pkg/` is committed wasm-bindgen output built from `../cli` --- rebuild
with `mise run wasm-build` from the repo root after Rust changes.
`test/wasmPkg.test.ts` asserts the committed bundle matches current Rust
behaviour via `../cli/tests/fixtures/tokenization_cases.json`, which also pins
`src/lib/tokens.ts` (the pure-TS port of the CLI tokeniser).

Whenever the linter or checker reports warnings or errors, fix them.

## Image generation style

Append this fragment to every image generation prompt (via `styled-image-gen` or
any other tool) so new art matches the existing illustrations:

> Flat 2D vector illustration on a pure black background --- absolutely NO 3D
> rendering, NO perspective, NO isometric, NO faceted/low-poly shapes, NO
> photographic depth, NO drop shadows, NO realistic lighting. Strictly limited
> colour palette: gold/amber, black, white, and warm beige/tan tones. Clean,
> consistent-weight outlines (black, white, or gold strokes) with flat filled
> shapes --- no gradients, no photorealism. Subtle background texture of
> interlocking circles or rounded geometric grid patterns in a very dark grey.
> Geometric and slightly stylised --- people (if any) are simplified faceless
> silhouettes drawn as single flat shapes (NOT low-poly polygonal or 3D-faceted
> figures). Occasional soft gold glow effects for emphasis. Sparse, balanced
> composition with generous negative space. STRICTLY NO TEXT, NO WORDS, NO
> LETTERS, NO NUMBERS, NO LABELS, NO ANNOTATIONS, NO TALLY MARKS, NO GLYPHS, NO
> SYMBOLS RESEMBLING LETTERS anywhere in the image. Modern editorial
> illustration style --- conceptual and symbolic rather than literal.

Use `src/decks/assets/bg-randomness.avif`, `bg-shannon.avif` and
`bg-div-lessons.avif` as `--input-image` references: they are the most reliable
style exemplars.

Read "black background" as the surface the art actually lands on.
`bg-impact.avif` fills `_class: impact` slides, which the theme paints ANU gold,
so it is drawn on flat gold with the dice in black and beige --- match the
surface so nothing punches a rectangle into it. That asset and
`deco-whiteboard.avif` are the corner-motif treatment (a small dice cluster
bleeding off one corner, the rest of the canvas left empty for centred text or a
presenter's pen); state the flat-fill and full-bleed clauses outright for those,
or the model shades each die face with a gradient and lays a white margin down
one edge.

The model silently ignores the no-text and flat-2D rules when the scene prompt
itself contains these triggers:

- words implying written content: "word-cards", "labels", "annotated",
  "diagram", "blueprint", "schematic", "concept-map", "tag"
- the target words quoted verbatim (saying "build, break, extend" almost
  guarantees those words appear printed in the image)
- abstractions rather than drawings --- say "small blank rectangles", not
  "tokens"; "empty speech bubbles", not "dialogue exchange"
- "geometric figure", which it reads as low-poly 3D --- say "flat silhouette
  drawn as a single filled shape"

Expect to re-roll, and review every generated image before committing.
