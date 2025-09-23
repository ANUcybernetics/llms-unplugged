---
id: task-009
title: a5 option not being applied to frontmatter pages
status: To Do
assignee: []
created_date: "2025-09-23 10:34"
labels: []
dependencies: []
---

There are a couple of "frontmatter" pages that @book.typ puts at the beginning
of every output document. However, they seem to be a4, even if the a5 "input
option" is specified (the later pages do come out as a5, though). Fix this so
that if a5 is passed in, the _whole pdf_ is a5.
