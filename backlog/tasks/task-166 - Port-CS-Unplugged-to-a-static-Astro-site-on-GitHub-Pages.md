---
id: TASK-166
title: Port CS Unplugged to a static Astro site on GitHub Pages
status: To Do
assignee: []
created_date: '2026-09-22 22:39'
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
Move www.csunplugged.org (Django/Postgres/Docker, uccser/cs-unplugged) and classic.csunplugged.org (Hugo, uccser/cs-unplugged-classic) to one clean static Astro site on astro-theme-university with a CS Unplugged brand layer, hosted on GitHub Pages rather than university infrastructure. It stays a separate site from LLMs Unplugged. Context: the Fellowship of the Unplugged steering-committee discussion (PKB note 1510).

Contingent on approval from Tim Bell and the current technical maintainers (Jack Morgan and the UC crew). Get their sign-off on scope, hosting and repo ownership before starting any work.

## Once-off changes to fit the static setup

- topics, unit plans, lessons (junior/senior), curriculum integrations, CT links, glossary, learning outcomes: ~800 English Markdown files plus YAML structure, which Django loads into Postgres at build time. Port to content collections; convert verto tags ({panel}, {image}, {iframe}, {video}) to MDX components
- printable resources: 20 Python generators (WeasyPrint/Pillow). Production already serves pre-generated PDFs of every option combination, so run the generators as a build step producing static files (a Typst rewrite is a later option)
- at-home and at-a-distance: reveal.js decks with decktape PDF export, which map onto astromotion decks and the print-pdf recipe
- search: Postgres full-text with content-type filters, replaced by Pagefind with filters
- translations: 9 UI locales, patchy content coverage (mi 70, fr 54, de 38, es 13, zh_Hans 9 files vs ~800 en). Use the TASK-101 theme i18n with Astro fallback; keep the Crowdin workflow working on Markdown/YAML
- Classic site: fold in as an archive section (~50 pages, 216 PDFs, ~850 MB; large PDFs may need release assets or LFS rather than the Pages repo)
- URLs: redirect map from the old /<lang>/topics/... routes and the classic redirects; curricula link to these widely

## Needs a real backend (separate subdomain, separate deploy)

- Plugging it in: Python and Blockly programming challenges whose test cases run on a Jobe server via a Django proxy, with attempts saved in the server session. Either keep a minimal Jobe service at a subdomain (not uni-hosted), or remove the backend entirely: Pyodide for Python in the browser, Blockly client-side, attempts in localStorage. Check usage analytics before choosing
- Django admin: probably unused since content comes from files; confirm with the maintainers before dropping it

The static site must not depend on the backend at build time or for any page except the challenges themselves.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tim and the technical maintainers have approved the scope, GitHub Pages hosting and repo ownership
- [ ] #2 Every current topic, lesson, curriculum integration and resource page has a static equivalent, and every old URL (including classic redirects) resolves via redirect
- [ ] #3 All resource PDF combinations the current site serves are downloadable from the static site
- [ ] #4 Search covers the ported content with content-type filtering
- [ ] #5 Translated content in every existing locale is published, with English fallback for untranslated pages
- [ ] #6 Classic activities and their PDFs are reachable from the new site
- [ ] #7 Programming challenges either run with no backend or run against a separately deployed service at a subdomain, and the static site builds and deploys without it
- [ ] #8 The site deploys to GitHub Pages from CI, and the UC servers can be retired
<!-- AC:END -->
