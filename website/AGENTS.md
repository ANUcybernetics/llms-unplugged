# llms-unplugged

Static website for LLMs Unplugged.

## Architecture

Eleventy 3.1.2 static site using the official `@11ty/eleventy-plugin-vite`
integration. All configuration is consolidated in `eleventy.config.js`---there
is no separate `vite.config.js`.

### Tech stack

- Eleventy 3.1.2 (static site generator)
- Vite 7.1.12 (build tool and dev server)
- `@11ty/eleventy-plugin-vite` (official integration)
- Tailwind CSS v4.1.16 (`@tailwindcss/vite` plugin)
- Vitest 4.0.3 (unit/integration testing)
- Playwright 1.56.1 (browser testing)

### Critical architectural constraints

- Vite configuration goes in `eleventy.config.js` via `viteOptions` parameter
- Do not create a separate `vite.config.js`
- Tailwind CSS v4 uses `@import "tailwindcss"` in CSS, not `@tailwind`
  directives
- The `@tailwindcss/vite` plugin handles Tailwind (no PostCSS needed)

## Project structure

```
src/
  _layouts/        # Nunjucks templates
  _includes/       # Template partials
  assets/
    main.css       # Entry point with @import "tailwindcss"
    main.js        # JavaScript entry point
  index.md         # Main content (markdown with frontmatter)

_site/             # Build output (generated, not in git)

test/
  integration.test.js   # Vitest tests for build output

eleventy.config.js      # All configuration (Eleventy + Vite + Tailwind)
vitest.config.js        # Vitest configuration
package.json            # Dependencies and scripts
```

## Development

- `npm run dev` - dev server at http://localhost:8080 with HMR
- `npm run build` - production build to `_site/`
- `npm test` - run Vitest tests (requires prior build)
- `npm run preview` - serve the built `_site/` directory

## Build process

Vite processes CSS and JS (with content hashing), Eleventy transforms markdown
to HTML using Nunjucks layouts and injects hashed asset references. Output goes
to `_site/`.

## Testing

Tests verify build output structure, CSS/JS bundles with content hashing,
Tailwind utilities, HTML validity, and content presence. Tests expect `_site/`
to exist---run `npm run build` first.
