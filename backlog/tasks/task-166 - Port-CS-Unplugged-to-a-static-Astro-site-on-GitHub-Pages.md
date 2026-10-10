---
id: TASK-166
title: Port CS Unplugged to a static Astro site
status: To Do
assignee: []
created_date: '2026-09-22 22:39'
updated_date: '2026-10-10 22:51'
labels:
  - cs-unplugged
  - fellowship
  - website
dependencies:
  - TASK-101
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move www.csunplugged.org (Django/Postgres/Docker, uccser/cs-unplugged) and classic.csunplugged.org (Hugo, uccser/cs-unplugged-classic) to one clean static Astro site on astro-theme-university with a CS Unplugged brand layer. The aim is a modern, best-practice dev workflow (every change a commit, checks and build in CI, automatic deploys to a static host); it is not about getting the site off UC's infrastructure, and static files can be served from anywhere. It stays a separate site from LLMs Unplugged. Context: the Fellowship of the Unplugged steering-committee discussion (PKB note fellowship-of-the-unplugged).

Tim Bell and the current technical maintainers (Jack Morgan and the UC crew) have given permission to spike this and see how it goes (October 2026). They are happy for the repo to move to the ANU Cybernetics GitHub organisation and for the site to be hosted on Ben's org accounts (GitHub Pages, Cloudflare or similar). The full port goes ahead only if the spike proves out; the spike is the subtask of this one.

## Decisions

- CS Unplugged keeps its own identity: the brand layer carries its existing name, logo and palette, and LLMs Unplugged keeps its own. The two sites share only the theme package underneath
- no database and no backend anywhere: content is files in git, edited through GitHub (editors are assumed comfortable with it), so pull requests and the Crowdin workflow keep working
- hosting is Cloudflare on Ben's org account, chosen for its server-side redirect rules. A small monthly cost is acceptable, so don't trade quality for a free tier
- the Astro site is a new repo in the ANU Cybernetics GitHub organisation. uccser/cs-unplugged stays untouched as the content source until the spike proves out, then it is transferred or archived
- the spike is a thin vertical slice: one topic end to end (unit plans and lessons, verto tags as MDX components, one printable from the bucket, one Pyodide challenge with tests, Pagefind, redirects for those URLs, CI and deploy)
- the spike is English only, with locale-ready URLs and content layout; translations follow once the TASK-101 theme i18n lands
- programming challenges run in the browser with Pyodide; the Jobe server is retired
- fallbacks, only if the maintainers ask for them: a git-backed form editor (Keystatic, Sveltia CMS; untested against the theme) for editing without git, then EmDash via astro-theme-university/emdash if a real CMS is needed (roles, scheduling, review)

## Hosting split

Code and markup live in the git repo and deploy to the static host. PDFs and other large binaries live in a public bucket behind a pdf.* subdomain, the same arrangement as llmsunplugged.org (see ops/bucket-sync.py), so they never enter the deploy artifact or .git. Every old URL gets a redirect (host redirect rules, or Astro `redirects` pages); a large redirect set is fine, broken links are not.

## Once-off changes to fit the static setup

- topics, unit plans, lessons (junior/senior), curriculum integrations, CT links, glossary, learning outcomes: ~800 English Markdown files plus YAML structure, which Django loads into Postgres at build time. Port to content collections; convert verto tags ({panel}, {image}, {iframe}, {video}) to MDX components
- printable resources: 20 Python generators (WeasyPrint/Pillow). Production already serves pre-generated PDFs of every option combination, so run the generators as an offline step and publish the output to the bucket (a Typst rewrite is a later option)
- at-home and at-a-distance: reveal.js decks with decktape PDF export, which map onto astromotion decks and the print-pdf recipe
- search: Postgres full-text with content-type filters, replaced by Pagefind with filters
- translations: 9 UI locales, patchy content coverage (mi 70, fr 54, de 38, es 13, zh_Hans 9 files vs ~800 en). Use the TASK-101 theme i18n with Astro fallback; keep the Crowdin workflow working on Markdown/YAML
- Classic site: fold in as an archive section (~50 pages). Its 216 PDFs total 699 MB; Ghostscript (`-sDEVICE=pdfwrite -dPDFSETTINGS=/printer`, keeping the original when it is not smaller) takes them to 228 MB with no visible change on the page spot-checked. Most of the bloat is the ~20 MB Chinese activity PDFs, PDFium exports that draw every glyph as thousands of duplicated form XObjects (no embedded fonts); these drop to ~3 MB each. Visually diff every page before publishing the compressed set
- URLs: redirect map from the old /<lang>/topics/... routes and the classic redirects; curricula link to these widely

## Plugging it in: Pyodide in place of Jobe

Only Python ever runs on Jobe: the block-based editor generates Python from Blockly client-side (static/js/jobe-editor.js) and the Scratch challenges execute nothing. JobeProxyView is a pass-through, and the test comparison and feedback already run in the browser (static/js/test-code.js). Of 98 programming challenges, 32 have automated test cases: 103 cases, 101 stdin/stdout and 2 function-call.

- replace `run_code` with a Pyodide runner returning the same four outcomes (ran, syntax error, time limit exceeded, other error)
- run it in a Web Worker and terminate the worker on timeout (infinite loops)
- feed each test case's input as stdin; keep the existing blanking of `input()` prompts so output matches
- serve the Pyodide files from the site's own origin, not a public CDN (school network filters)
- attempts move from the Django session (SaveAttemptView) to localStorage
- check first-load time and memory on old school devices

Django admin: probably unused since content comes from files; confirm with the maintainers before dropping it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tim and the technical maintainers have approved the scope, the static hosting and deploy workflow, and repo ownership
- [ ] #2 Every current topic, lesson, curriculum integration and resource page has a static equivalent, and every old URL (including classic redirects) resolves via redirect
- [ ] #3 All resource PDF combinations the current site serves are downloadable from the static site
- [ ] #4 Search covers the ported content with content-type filtering
- [ ] #5 Translated content in every existing locale is published, with English fallback for untranslated pages
- [ ] #6 Classic activities and their PDFs are reachable from the new site
- [ ] #7 Every programming challenge with test cases runs and is checked in the browser with Pyodide, with no backend, and an infinite loop reports time limit exceeded
- [ ] #8 Checks and the build run in CI on every change and the site deploys automatically to the static host, with no Django, Postgres or Jobe service needed
- [ ] #9 PDFs are served from a bucket, and neither the deploy artifact nor the git history contains them
<!-- AC:END -->
