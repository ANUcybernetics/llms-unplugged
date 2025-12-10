# llms-unplugged

Static website for LLMs Unplugged.

## Architecture

VitePress static site with custom Vue components for interactive language model
demonstrations. Vite is the build tool.

### Tech stack

- VitePress 1.6+ (Vue-powered static site generator)
- Vue 3 (for custom components)
- TypeScript
- Vitest (testing)

## Project structure

```
website/
├── .vitepress/
│   ├── config.mts          # VitePress configuration
│   ├── theme/
│   │   ├── index.ts        # Theme entry point
│   │   ├── custom.css      # ANU colour scheme
│   │   └── components/     # Vue components
│   └── cache/              # (gitignored)
├── public/
│   ├── assets/
│   │   ├── images/         # Hero images
│   │   └── pdfs/           # Lesson handouts
│   ├── favicon.svg
│   └── CNAME
├── index.md                # Homepage
├── about.md
├── educators.md
├── faq.md
├── lessons/                # Lesson content
│   ├── index.md
│   ├── grid-training.md
│   └── ...
├── topics/                 # Topic overview pages
│   ├── index.md
│   ├── fundamentals.md
│   └── ...
├── test/                   # Vitest tests
└── package.json
```

## Development

- `npm run dev` - dev server with hot reload
- `npm run build` - production build to `.vitepress/dist/`
- `npm test` - run tests

## Custom components

Custom Vue components live in `.vitepress/theme/components/`.

## Build output

VitePress builds to `.vitepress/dist/`. Deployed to GitHub Pages.
