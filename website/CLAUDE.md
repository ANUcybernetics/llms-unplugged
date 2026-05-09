# llms-unplugged

Static website for LLMs Unplugged.

## Architecture

Astro 6 static site with Svelte 5 components for interactive language model
demonstrations.

### Tech stack

- Astro 6 (static site generator)
- Svelte 5 (interactive components using runes)
- MDX (lessons with embedded components)
- TypeScript
- pnpm (package manager)
- oxfmt (JS/TS/MD/MDX/CSS/JSON/YAML formatting) + Prettier (Astro/Svelte formatting)
- oxlint (linting)
- Vitest (testing)

### Project structure

- `src/pages/` - Astro page routes
- `src/content/lessons/` - lesson MDX files (content collection)
- `src/content/news/` - news markdown files (content collection)
- `src/components/` - Astro and Svelte components
- `src/layouts/` - page layouts (Base, Page, Lesson, News)
- `src/lib/` - shared utilities and stores
- `src/styles/` - global CSS
- `public/` - static assets (images, favicon, CNAME)

### Styling: website vs decks

The main website (`src/styles/`) and slide decks (`src/decks/theme.css`) share
the same visual language but operate in fundamentally different rendering
models. The website is a responsive Astro site; decks are Reveal.js
presentations rendered into a fixed 1280×720 viewport that gets scaled to fill
the screen. This means:

**What is shared (and should stay shared):**

- **Colour tokens** (`--anu-*`, `--color-*`, `--lm-highlight-*`) --- defined
  once in `src/styles/common.css` and imported by both `global.css` and
  `theme.css`. Add new shared tokens there.
- **Widget component styles** (`src/styles/widgets.css`) --- decks already
  import this file. Base widget classes (`.lm-widget`, `.token`, `.cutout`,
  `.dice-value`, etc.) work in both contexts.

**What cannot be shared (different by design):**

- **Root font size** --- website uses `20px`, decks use `16px` (Reveal.js
  sizes everything in `rem` relative to this)
- **Reveal.js variables** (`--r-*`) --- deck-only, no website equivalent
- **Layout tokens** (`--nav-height`, `--sidebar-width`, etc.) --- website-only
- **Typography scaling** --- deck headings/body text are sized for projection;
  website text is sized for reading on screen
- **Container queries** --- widgets use `@container` queries on the website for
  responsive layout, but decks override widget sizing with `:global()` rules
  per-slide because the fixed viewport makes container queries behave
  differently

When modifying colours or widget styles, update both `global.css` and
`theme.css` to keep them in sync. When modifying typography or layout, treat
them as independent.

### Key patterns

- **Variant toggle**: grid/cutouts variant uses CSS `data-variant` attribute on
  `<html>` with `.grid-only`/`.cutouts-only` CSS classes. No JS framework needed
  for the toggle itself---just a `<Variant is="grid">` Astro component that
  renders a div with the appropriate class.
- **Svelte stores**: shared state (variant, training text, playback) uses Svelte
  5 runes in `.svelte.ts` files
- **Content collections**: lessons and news use Astro content collections with
  Zod schemas defined in `src/content.config.ts`

## Development

- `pnpm run dev` - dev server with hot reload
- `pnpm run build` - production build to `dist/`
- `pnpm run test` - run tests

Whenever the linter/checker reports warnings or errors, fix them.

## Image generation style

When generating images (via styled-image-gen, astromotion-deck, or any other
image generation tool), always append this prompt fragment to ensure visual
consistency with the existing illustrations:

Prompt suffix: Flat 2D vector illustration on a pure black background ---
absolutely NO 3D rendering, NO perspective, NO isometric, NO faceted/low-poly
shapes, NO photographic depth, NO drop shadows, NO realistic lighting.
Strictly limited colour palette: gold/amber, black, white, and warm beige/tan
tones. Clean, consistent-weight outlines (black, white, or gold strokes) with
flat filled shapes --- no gradients, no photorealism. Subtle background
texture of interlocking circles or rounded geometric grid patterns in a very
dark grey. Geometric and slightly stylised --- people (if any) are simplified
faceless silhouettes drawn as single flat shapes (NOT low-poly polygonal or
3D-faceted figures). Occasional soft gold glow effects for emphasis. Sparse,
balanced composition with generous negative space. STRICTLY NO TEXT, NO
WORDS, NO LETTERS, NO NUMBERS, NO LABELS, NO ANNOTATIONS, NO TALLY MARKS, NO
GLYPHS, NO SYMBOLS RESEMBLING LETTERS anywhere in the image. Modern editorial
illustration style --- conceptual and symbolic rather than literal.

Reference images: src/decks/assets/ (deck backgrounds). The most reliable
style exemplars are `bg-randomness.avif`, `bg-shannon.avif`, and
`bg-div-mechanic.avif` --- prefer these as `--input-image` references.

Prompting tips (the model will silently ignore the no-text rule and the
flat-2D rule when it sees these triggers in the scene prompt itself):

- avoid words that imply written content: "word-cards", "labels",
  "annotated", "diagram", "blueprint", "schematic", "concept-map", "tag"
- never quote the target words verbatim (e.g. saying "build, break, extend"
  almost guarantees those exact words appear printed on the image)
- describe what's drawn, not what it represents: "small blank rectangles"
  (not "tokens"), "empty speech bubbles" (not "dialogue exchange")
- for figures, say "flat silhouette drawn as a single filled shape" --- the
  model interprets bare "geometric figure" as low-poly 3D
- expect to re-roll: review every generated image before committing
