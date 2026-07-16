---
id: TASK-133
title: Pre-generate presenter-guide PDFs for lesson decks
status: Done
assignee:
  - '@claude'
created_date: '2026-07-16 01:27'
updated_date: '2026-07-16 02:04'
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
- [x] #1 a presenter-guide PDF exists (or is generated at build time) for each listed lesson's decks
- [x] #2 UsingTheSlides links to the PDF for decks that have one
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented via astromotion v0.13.0's new astromotion-pdf --notes mode (headless Chrome print of the ?print-pdf&showNotes=separate-page view with preferCSSPageSize: true via puppeteer-core, then ghostscript /ebook compression --- decktape can't do notes pages). Website bumped to v0.13.0 with puppeteer-core as devDependency. Presenter guides pre-generated (not build-time: each takes ~1-2 min of headless Chrome) into website/public/decks/<slug>/presenter-guide.pdf for the four listed-lesson decks (my-first-language-model-60min/-90min/-2h, how-ai-writes-stories), 3.4-7.4 MB each, whitelisted in .gitignore. UsingTheSlides.astro links a guide when the file exists on disk at build time, so unlisted build-break-extend degrades gracefully until its deck is reworked. Regeneration recipe documented in website/CLAUDE.md. Commits 6692b7cb + 63a9269a (website), astromotion 4d1ff0a + v0.13.0 release.
<!-- SECTION:NOTES:END -->
