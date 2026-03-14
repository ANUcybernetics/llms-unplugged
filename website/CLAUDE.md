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
- oxfmt (JS/TS formatting) + Prettier (Astro/Svelte/MD/CSS formatting)
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

### Key patterns

- **Variant toggle**: grid/bucket variant uses CSS `data-variant` attribute on
  `<html>` with `.grid-only`/`.bucket-only` CSS classes. No JS framework needed
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

## Image style

When generating images (via styled-image-gen, astromotion-deck, or any other
image generation tool), always append this prompt fragment to ensure visual
consistency with the existing illustrations:

> Flat vector-style illustration on a dark charcoal/near-black background.
> Strictly limited colour palette: dark gold/amber, black, white, and warm
> beige/tan tones. Clean, consistent-weight outlines (black, white, or gold
> strokes) with flat filled shapes --- no gradients, no photorealism. Subtle
> background texture of interlocking circles or rounded geometric grid patterns
> in a slightly lighter charcoal. Geometric and slightly stylised --- people (if
> any) are simplified and faceless. Occasional soft gold glow effects for
> emphasis. Sparse, balanced composition with generous negative space. No text,
> no words, no numbers, no labels whatsoever. Modern editorial illustration
> style --- conceptual and symbolic rather than literal.
