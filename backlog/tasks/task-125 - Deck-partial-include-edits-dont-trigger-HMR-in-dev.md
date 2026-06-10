---
id: TASK-125
title: Deck partial (@include) edits don't trigger HMR in dev
status: Done
assignee:
  - '@claude'
created_date: '2026-06-01 01:01'
updated_date: '2026-06-10 04:06'
labels:
  - dx
  - bug
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Editing a deck partial included via the {/* @include ./partials/foo.mdx */} directive does not refresh the running `astro dev` server. The server keeps serving the .deck.mdx that was compiled at startup, so partial edits only appear after a dev-server restart or a full `pnpm build` + `pnpm preview`. This bites repeatedly when authoring the cutouts decks, where most content lives in partials such as cutouts-generation.mdx.

Root cause: @include splices partials via readFileSync at MDX compile time, so partials are not Vite module dependencies of the parent deck. astromotion v0.5.1 already ships and registers a dev plugin (astromotion:watch-includes, src/vite-plugin-watch-includes.ts) that watches the partial files and sends a full-reload on edit --- but Astro / @astrojs/mdx never invalidates the cached compiled .deck.mdx module on the server, so the reload just re-serves stale output. Reproduced on astro 6.4.2 / @astrojs/mdx 6.0.1.

Tracked upstream in the astromotion backlog (its task-2, In Progress): the watch-file plumbing is done, but end-to-end HMR is blocked on the deeper Astro/MDX server-side invalidation, which the upstream findings note affects even direct parent .deck.mdx edits in that setup.

This is the downstream tracker: confirm a clean fix once it lands upstream, and meanwhile scope whether any local-only mitigation exists. Workaround for now: rebuild + preview, or restart the dev server.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Editing a deck partial (e.g. a cutouts-* partial) is reflected in the running astro dev server without restarting it or falling back to build + preview
- [x] #2 A clean dev-only mitigation (Astro/Vite config knob, @astrojs/mdx bump, or wiring change) is identified and applied; if none exists, findings are recorded and the task stays blocked on the upstream astromotion fix
- [x] #3 Verified by editing src/decks/partials/cutouts-generation.mdx and seeing the change in the browser without touching the parent .deck.mdx
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause confirmed: astromotion's watch-includes plugin (still true at v0.5.3) sends a full-reload on partial edit but never invalidates the compiled parent .deck.mdx module, so the dev server re-serves stale output. Mitigation applied: dev-only Vite plugin (llms-unplugged:deck-partial-hmr-shim) in website/astro.config.ts that, on a partials/*.mdx change, calls server.moduleGraph.onFileChange() for every deck whose transitive include set (via astromotion's own collectIncludePaths) contains the file, then sends full-reload. Verified end-to-end: edited src/decks/partials/cutouts-generation.mdx with astro dev running; both cutouts-yr5-6 and cutouts-3h re-rendered fresh server-side (curl) and a connected browser auto-reloaded with the change (agent-browser). Nested includes (denouement -> qualtrics) covered by the transitive walk. Shim is marked for removal once the upstream astromotion fix (its task-2) ships the same invalidation in handleHotUpdate.
<!-- SECTION:NOTES:END -->
