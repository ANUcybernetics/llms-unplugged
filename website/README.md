# LLMs Unplugged

Website for [LLMs Unplugged](https://www.llmsunplugged.org).

TODO add a one paragraph description of what LLMs Unplugged is.

## Tech stack

- **11ty** for static site generation
- **Vite** for asset bundling with the Tailwind Vite plugin
- **Vitest** for testing
- **Tailwind CSS v4** for styling (no PostCSS required)
- **ES6 modules** throughout

## Development

```bash
npm run dev
```

Starts the 11ty dev server with live reload at http://localhost:8080
and runs Linkinator against the built `_site` output after each
rebuild (console output only; the server keeps running on failures).
Before the server starts, `npm run ensure-pdfs` checks for
`src/assets/pdfs/modules.pdf`, symlinking to `handouts/out/` (or
running `make modules` in `handouts/`) if the PDFs aren't present so
local PDF links work.

## Build

```bash
npm run build
```

Builds assets with Vite, then generates the static site with 11ty. Output goes
to `_site/`. The build also runs `npm run ensure-pdfs` so PDF links are
populated in production builds.

## Test

```bash
npm test
```

Runs integration tests that verify:

- build output exists (`_site/` directory)
- CSS and JS bundles are generated
- Tailwind CSS is properly processed
- HTML structure is valid
- key content is present

For watch mode during development:

```bash
npm run test:watch
```

## Lighthouse

```bash
npm run lighthouse
```

Runs Lighthouse CI (`lhci autorun`) against the built `_site` output, auditing
the main pages (`/`, `/related/`, `/contact/`). Reports are written to
`.lighthouse/` (JSON and HTML). The command runs `npm run build` first; if you
prefer to inspect existing build output, run `lhci autorun` directly.

## Project structure

```
src/
  _layouts/        # Nunjucks layout templates
  _includes/       # Reusable template partials
  assets/          # CSS and JS source files
  index.md         # Homepage content
```

## About LLMs Unplugged

LLMs Unplugged is a resource exploring large language models and AI through a
practical, hands-on lens.

## Licence

Website source (c) Ben Swift, MIT

Module/instructor notes pdf files CC BY-SA-NC 4.0
