---
id: TASK-115
title: replace hardcoded table grids with widgets
status: Done
assignee: []
created_date: '2026-03-12 03:09'
updated_date: '2026-03-13 19:55'
labels: []
dependencies: []
---

In e.g. the training lesson (grid version) there are a couple of example grids
(in the Algorithms section) which are just hardcoded md tables.

The interactive widget (futher down the page) is already working well. Can we
use some of that same infrastructure to generate those earlier grids? With a
fixed input (so that the surrounding copy still makes sense) and perhaps with a
parameter so the grid stays the same size across the two "steps" (just with more
empty cells in the first case).
