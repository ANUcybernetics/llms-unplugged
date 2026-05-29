# LLMs Unplugged

Website for [LLMs Unplugged](https://www.llmsunplugged.org) --- hands-on
teaching resources for understanding how large language models work, using pen,
paper, and dice. No computers required.

## Tech stack

- [Astro](https://astro.build) --- static site generator
- [Svelte 5](https://svelte.dev) --- interactive widgets (runes)
- MDX --- lessons and news with embedded components
- TypeScript
- [pnpm](https://pnpm.io) --- package manager
- oxlint + oxfmt (with Prettier for `.astro`/`.svelte`) and Vitest

## Development

```bash
pnpm install
pnpm run dev      # dev server with hot reload
pnpm run build    # production build to dist/
pnpm run preview  # preview the production build
pnpm run test     # run the test suite
```

## Project structure

```
website/
├── src/
│   ├── pages/          # Astro routes
│   ├── content/
│   │   ├── lessons/    # lesson MDX (content collection)
│   │   └── news/       # news markdown (content collection)
│   ├── components/     # Astro and Svelte components
│   ├── layouts/        # page layouts (Base, Page, Lesson, News)
│   ├── decks/          # Reveal.js slide decks (astromotion)
│   ├── lib/            # shared utilities and Svelte stores
│   └── styles/         # global CSS
├── public/             # static assets (images, PDFs, CNAME)
└── package.json
```

## About LLMs Unplugged

LLMs Unplugged helps educators and learners understand large language models
through hands-on activities. You count word patterns in a text, record them as
tally marks or paper cutouts, then roll dice to generate new text --- building a
language model from scratch and seeing exactly how AI text generation works.
It's part of the [ANU School of Cybernetics](https://cybernetics.anu.edu.au)
Cybernetic Studio.

## Licence

Website source © Ben Swift, MIT.

Lesson and instructor-notes PDF files CC BY-NC-SA 4.0.
