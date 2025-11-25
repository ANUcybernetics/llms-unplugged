---
id: task-047
title: change nomenclature around the resources
status: Done
assignee: []
created_date: "2025-11-25 02:08"
updated_date: "2025-11-25 02:35"
labels: []
dependencies: []
---

I want to change the nomenclature throughout this whole project:

- "modules" should be "lessons"

- "lessons" are grouped into "topics" (note: this higher-level grouping of the
  lessons/modules doesn't currently exist on the website, but we need to add it)

- "topics" are:

  1. **Fundamentals**

     - 00 - Weighted Randomness _(optional—can be skipped if students are
       comfortable with weighted random selection)_
     - 01 - Basic Training
     - 02 - Basic Generation

  2. **Scaling up**

     - 03 - Pre-trained Model Generation
     - 05 - Trigram Model

  3. **Controlling output**

     - 04 - Sampling Strategies

  4. **How models "understand"**

     - 06 - Context Columns
     - 07 - Word Embeddings

  5. **Adaptation and data**
     - 08 - LoRA
     - 09 - Synthetic Data

This will require lots of changes to the codebase. I want to be consistent...
don't keep any of the old nomenclature for "backwards compat"; no-one is using
this yet so we can make the changes now and keep it simple.

In terms of the website layout, I'd like to have the main topics/ page have a
list of the topics (with a description of each), and then topics/TOPIC_NAME/
pages which have a list of the actual lessons. So the main modules/ pages (which
lists all the modules) won't exist anymore.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Completed nomenclature change from 'modules' to 'lessons' with 'topics' as
grouping:

**Website changes:**

- Renamed `src/modules/` to `src/lessons/`
- Created `src/_data/topics.json` with 5 topic groupings
- Created `src/topics.md` (topics index) and individual topic pages in
  `src/topics/`
- Updated `eleventy.config.js` (lessons collection, filterByOrder filter)
- Updated navigation in `base.njk` (Modules → Topics)
- Updated `links.json` (modules → topics, modules_pdf → lessons_pdf)
- Updated all content in `index.md` and `instructor-notes.md`
- Updated integration tests for new URL structure

**Handouts changes:**

- Renamed `module-setup`/`module-hero` to `lesson-setup`/`lesson-hero` in
  `utils.typ`
- Updated all 10 numbered lesson files (00-09)
- Renamed `worksheets/blank-module.typ` to `worksheets/blank-lesson.typ`
- Updated `Makefile` (modules.pdf → lessons.pdf, added `lessons` target)
- Updated runsheets with new terminology
- Updated `AGENTS.md`

**Documentation:**

- Updated root `README.md` and `AGENTS.md`

**Tests:** All npm (50 tests) and cargo (31 tests) pass.

<!-- SECTION:NOTES:END -->
