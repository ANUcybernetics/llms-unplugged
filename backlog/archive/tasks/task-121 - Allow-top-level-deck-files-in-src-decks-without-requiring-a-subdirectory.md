---
id: TASK-121
title: Allow top-level deck files in src/decks/ without requiring a subdirectory
status: To Do
assignee: []
created_date: '2026-03-16 09:34'
labels:
  - routing
  - dx
dependencies: []
references:
  - 'pages/[...slug].astro'
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently, astromotion's deck routing (`[...slug].astro`) only discovers `.deck.svelte` files inside subdirectories of `src/decks/`. Files placed directly in `src/decks/` are ignored. This forces every project to have at least one subdirectory (e.g. `src/decks/my-project/`), which adds a redundant path segment to URLs when there's only one collection of decks.

**Current behaviour:**
- `src/decks/llms-unplugged/fundamentals.deck.svelte` → `/decks/llms-unplugged/fundamentals`
- `src/decks/fundamentals.deck.svelte` → not discovered, 404

**Desired behaviour:**
- Top-level `*.deck.svelte` files in `src/decks/` should be discovered and routed using just the filename as the slug (e.g. `fundamentals.deck.svelte` → `/decks/fundamentals`)
- Subdirectory-based decks continue to work exactly as they do today (backwards-compatible)
- The `slides.deck.svelte` → directory-name shortcut still applies within subdirectories

**Why:**
Most astromotion users will only have one collection of decks. Requiring a subdirectory just to namespace them adds unnecessary nesting in both the filesystem and the URL structure.

**Implementation notes:**
The change is in `pages/[...slug].astro` `getStaticPaths()` --- add a scan for `*.deck.svelte` files directly in the `decksDir` (not just in subdirectories). For these top-level files, the slug is just the filename stem (no directory prefix).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 *.deck.svelte files placed directly in src/decks/ are discovered and routed at /decks/{name}
- [ ] #2 existing subdirectory-based decks continue to work unchanged
- [ ] #3 slides.deck.svelte shortcut still works within subdirectories
- [ ] #4 no config changes required --- works out of the box
<!-- AC:END -->
