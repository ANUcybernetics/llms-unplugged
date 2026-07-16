---
id: TASK-133
title: Pre-generate presenter-guide PDFs for lesson decks
status: To Do
assignee: []
created_date: '2026-07-16 01:27'
labels:
  - website
  - decks
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Each lesson page's using-the-slides section should eventually offer a downloadable presenter guide (slides with interleaved speaker-notes pages). Tested recipe from the task-132 planning: headless Chrome print with preferCSSPageSize: true against /decks/<slug>/?print-pdf&showNotes=separate-page, then ghostscript /ebook compression (~147MB -> ~7MB). astromotion v0.12.1 already ships the print CSS fix that makes this view render correctly; a --notes mode on astromotion-pdf is the natural home for the implementation. decktape cannot do notes pages. Once the PDFs exist, add the download link to the UsingTheSlides component (it currently mentions no PDF).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 a presenter-guide PDF exists (or is generated at build time) for each listed lesson's decks
- [ ] #2 UsingTheSlides links to the PDF for decks that have one
<!-- AC:END -->
