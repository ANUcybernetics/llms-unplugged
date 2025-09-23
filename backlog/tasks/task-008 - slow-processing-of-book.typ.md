---
id: task-008
title: slow processing of book.typ
status: To Do
assignee: []
created_date: "2025-09-23 10:08"
labels: []
dependencies: []
---

Recently, "guide words" were added to each page header in the @book.typ output
(see tasks 006 and 007).

However, this slowed down the `typst compile` command _greatly_.

Investigate exactly why the typesetting is now much slower, and whether there is
a fix (without complicating the codebase too much) which retains the guide words
and keeps the output the same, but is more performant (esp. on large documents).

Use the out/frankenstein-bigram-a4.pdf makefile target as a test file (it's the
shortest).
