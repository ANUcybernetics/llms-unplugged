# LLMs Unplugged

Website for [LLMs Unplugged](https://www.llmsunplugged.org).

Ready-to-use teaching resources for understanding how large language models work
through hands-on activities. No computers required.

## Tech stack

- **VitePress** for static site generation
- **Vue 3** for custom interactive components
- **TypeScript** for configuration and component logic

## Development

```bash
npm install
npm run dev
```

Starts the VitePress dev server with hot reload.

## Build

```bash
npm run build
```

Builds the static site to `.vitepress/dist/`.

## Preview

```bash
npm run preview
```

Preview the built site locally.

## Project structure

```
website/
├── .vitepress/           # VitePress config and theme
│   ├── config.mts        # Site configuration
│   └── theme/            # Custom theme and components
├── public/               # Static assets (images, PDFs)
├── lessons/              # Lesson content (markdown)
├── topics/               # Topic pages
├── index.md              # Homepage
└── package.json
```

## About LLMs Unplugged

LLMs Unplugged helps [educators](https://www.llmsunplugged.org/educators) and
learners understand large language models through hands-on activities using pen,
paper, and dice. Build your own language model from scratch and experience
exactly how AI text generation works.

## Licence

Website source (c) Ben Swift, MIT

Lesson/instructor notes PDF files CC BY-NC-SA 4.0
