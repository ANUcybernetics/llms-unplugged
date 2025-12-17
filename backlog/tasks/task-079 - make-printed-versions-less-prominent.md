---
id: task-079
title: make printed versions less prominent
status: Done
assignee: []
created_date: '2025-12-09 21:54'
updated_date: '2025-12-17 22:46'
labels: []
dependencies: []
---

As the web version of these lessons become better, they really are the canonical
versions - we should hold the printed pdf cards for occasions where that really
is the right tool for the job. They can still be mentioned somewere on the
website (perhaps just a link to the full lessons.pdf in an FAQ entry), but not
in the info box at the top of each lesson, because it's really no longer the
same content as the web versions evolve and improve.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed PDF download links from the info boxes in all 10 lesson files that had them (grid-training, grid-generation, weighted-randomness, sampling, context-columns, word-embeddings, lora, synthetic-data, grid-trigram, pretrained-generation).

Added new FAQ entry "Are there printable versions of the lessons?" with link to /assets/pdfs/lessons.pdf, positioned after the materials question.

Build and tests pass (93 tests).
<!-- SECTION:NOTES:END -->
