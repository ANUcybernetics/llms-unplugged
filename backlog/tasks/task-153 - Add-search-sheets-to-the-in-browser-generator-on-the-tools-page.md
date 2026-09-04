---
id: TASK-153
title: Add search sheets to the in-browser generator on the tools page
status: To Do
assignee: []
created_date: '2026-09-04 01:57'
labels:
  - website
  - tools
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Generate Your Own tool on /tools/ (website/src/components/TypstCompiler.svelte) offers booklet and cutouts output. Add a third workflow, search sheets, so an educator can make a room-scale sheet set from any pasted or uploaded text without installing the CLI. Mirror the CLI sheets subcommand: shuffle the corpus and deal bigrams round-robin across N sheets (one pair on exactly one sheet), with the facilitator brief as page one, using cli/tokenized-sheets.typ. Expose sheet count, seed and multiple inputs dealt as separate sequences. The NeurIPS 2026 Education Track two-pager describes this tool as live at llmsunplugged.org/tools, so it needs to exist before the track in December.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Search sheets appears as an output type in the TypstCompiler workflow select, alongside booklet and cutouts
- [ ] #2 Sheet count and seed are configurable, and the output matches the CLI sheets subcommand for the same corpus, count and seed
- [ ] #3 The generated PDF leads with the facilitator brief and one page per participant, matching the CLI layout
- [ ] #4 The /tools/ page's search-sheets section links to the in-browser generator
<!-- AC:END -->
