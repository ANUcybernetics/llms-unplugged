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

## Development

- the LLMs Unplugged lesson content source files are in `lessons/*.md`, grouped
  by `topic` frontmatter (defined in `lessons/topics.ts`)
- custom Vue components live in `.vitepress/theme/components/`

- `npm run dev` - dev server with hot reload
- `npm run build` - production build to `.vitepress/dist/`
- `npm run test` - run tests

Whenever the linter/checker reports warnings or errors, fix them.
