---
id: TASK-132
title: Restructure website around lessons (workshop journeys) and modules
status: Done
assignee:
  - '@claude'
created_date: '2026-07-16 00:25'
updated_date: '2026-07-16 01:27'
labels:
  - website
  - lessons
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Why

The battle-tested slide decks (grid 60/90/2h, cutouts yr 5-6) are effectively invisible: /decks/ is a bare list linked only from two news posts, /workshops/ describes stale formats that don't match what we deliver and isn't in the nav, and the homepage funnels everyone to /lessons/ --- a parts catalogue with no assembly instructions. Meanwhile the operational knowledge (timings, prep checklists, droppable parts) is locked in deck MDX comments. Reorganise so the site serves a new visitor who wants to run this themselves, not just the creator.

New ontology: **lessons** are what you run (deck-backed workshop journeys); **modules** are what lessons are made of (the current /lessons/ pages); tools/library are what you print.

## Design

### Lessons (new content collection, pages at /lessons/<slug>/)

Named for the experience --- duration/apparatus (grid/cutouts/60min) are card metadata badges, never in the title:

1. **My First Language Model** --- the grid trio as ONE page with a choose-your-length table: 60min (training + generation), 90min (+ pretrained-generation), 2h (+ agentic-ai). Decks: grid-60min, grid-90min, grid-2h.
2. **How AI writes stories** --- cutouts yr 5-6, 90min. Deck: cutouts-yr5-6. Its deck header comment already contains the full lesson plan (5 parts with timings, droppable part 4, prep checklist) --- promote that to the page.
3. **Build, break, extend** --- 3h cutouts. `listed: false` for now (delivered once, needs work). Deck: cutouts-3h.
4. Going Deeper (advanced follow-on) is task-131, out of scope here.

Each lesson page: audience/duration/flavour/materials badges; deck link plus a shared "using the slides" section (fullscreen, `s` for speaker notes, presenter-guide PDF when available); aggregated "you will need" (dice, grid PDF, specific cutouts packs on /tools/); module sequence with timings; prep notes. Do NOT document the ?anu/?presenters deck params publicly (team-only).

### Modules (rename of current lessons collection)

- src/content/lessons -> src/content/modules, routes /modules/<slug>/ (slugs unchanged), sidebar label "Modules"
- each module page gets a "Used in" box (computed from the lessons collection) linking to the lessons that include it
- topic taxonomy (src/lib/topics.ts) unchanged

### Frontmatter consolidation

Single `listed: false` key everywhere (Astro-collection idiom, defaults true): replace deck `hidden: true` (a local cast in src/pages/decks/index.astro --- not an astromotion convention) in cer + acdict deck frontmatter; modules keep it (weighted-randomness); new lessons collection gets it. Unlisted pages stay out of sitemap and search.

### Nav and landing page

- nav: Lessons - Modules - Tools - Library - News - About (decide: Glossary + FAQ to footer/About, or keep FAQ as a 7th item)
- landing: primary CTA "Run a lesson" -> /lessons/, secondary "Explore the modules"; a "three ways in" section (run a tested lesson / explore modules / print materials); say explicitly that every lesson ships slides WITH full presenter notes; "Where should I start?" points at My First Language Model

### Redirects (astro.config.ts redirects block; precedent: agentic-tool-use entry)

- /lessons/<slug>/ -> /modules/<slug>/ for all 14 current module slugs (the /lessons/ index itself becomes the new lessons index --- a real page and redirects for former children coexist fine)
- /workshops/ -> /lessons/ (its Format 2 prose seeds task-131 before deletion)
- deck slugs renamed to follow lesson names (e.g. cutouts-yr5-6 -> how-ai-writes-stories-90) need redirects too; news posts link /decks/cutouts-yr5-6/ and /decks/acdict/

### Deck tweaks

- SocyLogo end slide is already unconditional in every deck --- keep; add llmsunplugged.org to it (or the What next? slide) so third-party-delivered classrooms have something to act on
- deck frontmatter descriptions gain duration/audience
- /decks/ index: replace bare list with grouped pointers to lesson pages (or redirect to /lessons/)

### Copy sweep

- FAQ says "high school age upwards" --- contradicts homepage (primary-to-executives) and the yr 5-6 lesson
- homepage "Although these activities are called lessons grouped into topics..." apology paragraph: delete (new structure makes it unnecessary)
- fundamentals composition inconsistency: lessons index says Training + Generation; workshops page said the 90min core includes Pre-trained Generation --- reconcile in the new lesson pages
- FAQ /workshops/ link -> /lessons/

### Follow-up (separate task, don't block on it)

Pre-generated presenter-guide PDFs per deck: headless Chrome print with preferCSSPageSize true against /decks/<slug>/?print-pdf&showNotes=separate-page, ghostscript /ebook compression (~147MB -> ~7MB). astromotion v0.12.1 already ships the print CSS fix that makes this view render correctly; a --notes mode on astromotion-pdf is the natural home.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 lessons index at /lessons/ presents My First Language Model and How AI writes stories (Build-break-extend unlisted but reachable by URL)
- [x] #2 each lesson page carries deck link, using-the-slides, you-will-need, module sequence with timings, and prep notes
- [x] #3 modules live at /modules/<slug>/ and every old /lessons/<slug>/ URL redirects there; /workshops/ redirects to /lessons/
- [x] #4 module pages show which lessons use them
- [x] #5 nav and landing page lead with the lessons path
- [x] #6 a single listed frontmatter key controls visibility for modules, lessons, and decks; unlisted content absent from sitemap and search
- [x] #7 copy inconsistencies fixed (FAQ age range, homepage lessons/topics apology, fundamentals composition)
- [x] #8 pnpm build and pnpm test pristine
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New lessons content collection + the How AI writes stories page as exemplar (pure addition, no breakage) --- review checkpoint
2. Remaining lesson pages: My First Language Model, Build break extend (unlisted)
3. Modules rename + all redirects
4. Nav + landing page
5. listed/hidden frontmatter consolidation
6. Copy sweep + deck URL-on-logo-slide tweak + /decks/ index rework
Commit at each checkpoint only when build + tests pristine.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented across six commits on main (befd998b..f1c06da0), each landing with build + tests + typecheck + lint + format pristine.

Decisions taken during implementation (beyond the ones recorded earlier):
- execution reordered: modules rename landed first to avoid a collection-name collision with the new lessons collection
- deck slugs renamed with NO redirects (private API per Ben): grid-60min/90min/2h -> my-first-language-model-{60min,90min,2h}, cutouts-yr5-6 -> how-ai-writes-stories, cutouts-3h -> build-break-extend; internal links (news post) updated
- Glossary + FAQ moved to a footer meta line; nav is Lessons/Modules/Tools/Library/News/About
- search exclusion: Pagefind 1.5 does NOT honour robots noindex (verified empirically), so the layouts scope indexing with data-pagefind-body instead --- unlisted pages omit it and drop out of search; side effect: deck pages and redirect stubs no longer pollute search. Unlisted pages also carry robots noindex (for search engines) and are filtered from the sitemap via a frontmatter scan in astro.config.ts
- lessons collection schema: audience/duration/flavour badges, decks [{slug,label}], modules [slugs] (drives the Used-in box), heroImage, order, listed
- socy-logo end slide in every deck now carries www.llmsunplugged.org (verified via screenshot)
- fundamentals composition inconsistency resolved by the MFLM choose-your-length table (60min = Training+Generation; 90min adds Pre-trained Generation)
- workshops Format 2 prose seeded into task-131; presenter-guide PDFs split out as task-133
<!-- SECTION:NOTES:END -->
