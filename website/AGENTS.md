# llms-unplugged

Static website for LLMs Unplugged.

## Architecture

VitePress static site with custom Vue components for interactive language model demonstrations.

### Tech stack

- VitePress 1.5+ (Vue-powered static site generator)
- Vue 3 (for custom components)
- TypeScript (configuration and components)

## Project structure

```
website/
├── .vitepress/
│   ├── config.mts          # VitePress configuration
│   ├── theme/
│   │   ├── index.ts        # Theme entry point
│   │   ├── custom.css      # ANU colour scheme
│   │   └── components/     # Vue components (LmGrid, LmTable)
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
│   ├── basic-training.md
│   └── ...
├── topics/                 # Topic overview pages
│   ├── index.md
│   ├── fundamentals.md
│   └── ...
└── package.json
```

## Development

- `npm run dev` - dev server with hot reload
- `npm run build` - production build to `.vitepress/dist/`
- `npm run preview` - preview the built site

## Custom components

### LmGrid

Renders bigram grid tables from token sequences:

```vue
<LmGrid tokens="see spot run . see spot jump ." />
<LmGrid tokens="see spot" :nrows="6" :ncols="7" />
```

### LmTable

Renders data tables with tally mark conversion:

```vue
<LmTable :headers="['word 1', 'word 2', 'count']" :data="[['see', 'spot', 1]]" />
```

## Build output

VitePress builds to `.vitepress/dist/`. Deploy to GitHub Pages or any static host.
