---
id: TASK-104
title: dynamic route warnings
status: Done
assignee: []
created_date: '2026-03-11 03:13'
updated_date: '2026-03-11 03:31'
labels: []
dependencies: []
---

I'm seeing these warnings int the dev server - fix them.

```
14:02:31 watching for file changes...
14:02:33 [WARN] [router] A `getStaticPaths()` route pattern was matched, but no matching static path was found for requested path `/decks/example/`.

Possible dynamic routes being matched: node_modules/.pnpm/astromotion@https+++codeload.github.com+benswift+astromotion+tar.gz+8565834dd56e6f5ca71_0ab5ba37e8a0019194bfeb49001235f7/node_modules/astromotion/pages/[...slug].astro.
14:02:33 [404] /decks/example/ 6ms
14:02:38 [200] / 10ms
14:02:38 [vite] ✨ new dependencies optimized: astro/runtime/client/dev-toolbar/entrypoint.js
14:02:38 [vite] ✨ optimized dependencies changed. reloading
14:02:40 [200] / 5ms
14:02:41 [WARN] [router] A `getStaticPaths()` route pattern was matched, but no matching static path was found for requested path `/decks/example/`.

Possible dynamic routes being matched: node_modules/.pnpm/astromotion@https+++codeload.github.com+benswift+astromotion+tar.gz+8565834dd56e6f5ca71_0ab5ba37e8a0019194bfeb49001235f7/node_modules/astromotion/pages/[...slug].astro.
14:02:41 [404] /decks/example/ 1ms
14:02:41 [404] /src/components/DeckLoader.svelte 2ms
14:02:41 [404] /src/decks/deck-theme.css 1ms
14:02:41 [404] /node_modules/reveal.js/dist/reveal.css 1ms
14:02:43 [WARN] [router] A `getStaticPaths()` route pattern was matched, but no matching static path was found for requested path `/decks/`.

Possible dynamic routes being matched: node_modules/.pnpm/astromotion@https+++codeload.github.com+benswift+astromotion+tar.gz+8565834dd56e6f5ca71_0ab5ba37e8a0019194bfeb49001235f7/node_modules/astromotion/pages/[...slug].astro.
14:02:43 [404] /decks/ 1ms
14:02:52 [200] /decks/llms-unplugged/fundamentals/ 23ms
14:02:52 [vite] ✨ new dependencies optimized: @animotion/core
14:02:52 [vite] ✨ optimized dependencies changed. reloading
14:02:52 [200] /decks/llms-unplugged/fundamentals/ 1ms
14:03:07 [404] /apple-touch-icon-precomposed.png 2ms
14:03:07 [404] /apple-touch-icon.png 1ms
14:03:09 [200] /decks/llms-unplugged/fundamentals/ 5ms
14:06:08 [WARN] [router] A `getStaticPaths()` route pattern was matched, but no matching static path was found for requested path `/decks/llms-unplugged/fundamentals-pretrained-model-sampling/`.

Possible dynamic routes being matched: node_modules/.pnpm/astromotion@https+++codeload.github.com+benswift+astromotion+tar.gz+8565834dd56e6f5ca71_0ab5ba37e8a0019194bfeb49001235f7/node_modules/astromotion/pages/[...slug].astro.
14:06:08 [404] /decks/llms-unplugged/fundamentals-pretrained-model-sampling/ 1ms
14:06:14 [200] /decks/llms-unplugged/fundamentals-pre-trained-model-sampling/
```
