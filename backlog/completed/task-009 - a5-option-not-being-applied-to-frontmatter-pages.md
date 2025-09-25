---
id: task-009
title: a5 option not being applied to frontmatter pages
status: Done
assignee: []
created_date: '2025-09-23 10:34'
updated_date: '2025-09-23 22:25'
labels: []
dependencies: []
---

There are a couple of "frontmatter" pages that @book.typ puts at the beginning
of every output document. However, they seem to be a4, even if the a5 "input
option" is specified (the later pages do come out as a5, though). Fix this so
that if a5 is passed in, the _whole pdf_ is a5.

## Solution

Fixed by adding the `paper_size` parameter to the `set page()` calls in all frontmatter functions in book.typ:
- `title-page()` function (line 86)
- `copyright-page()` function (line 108)
- `introduction()` function (line 160)
- `table-of-contents()` function (line 185)

These functions now use `set page(paper_size, margin: ...)` instead of just `set page(margin: ...)`, ensuring they respect the paper size input parameter passed via `--input paper_size=a5`.
