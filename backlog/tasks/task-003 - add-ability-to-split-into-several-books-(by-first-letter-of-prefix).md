---
id: task-003
title: add ability to split into several books (by first letter of prefix)
status: Done
assignee: []
created_date: '2025-09-10 12:10'
updated_date: '2025-09-11 01:44'
labels: []
dependencies: []
---

## Description

For long input texts, the output pdf (as typeset by typst) is quite long. It
would be good to have an option to split the input into several books, grouped
by the first letter of the prefix (e.g. A-K, L-Z).

The easiest way to do this would be:

- keep the "calculate bigrams" part as-is
- based on the number of books (configurable by arg, but default == 1 i.e. no
  splitting) desired, write one output file per book (with the size of the books
  approx. balanced; use some sort of heuristic for this based on the number of
  followers)
- then call typst with each one, prepending an e.g. "A-K (book 1 of 2)" to the
  subtitle
