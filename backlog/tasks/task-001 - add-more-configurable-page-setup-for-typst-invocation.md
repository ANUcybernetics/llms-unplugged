---
id: task-001
title: add more configurable page setup for typst invocation
status: To Do
assignee: []
created_date: "2025-08-14 01:17"
labels: []
dependencies: []
---

## Description

The current version of @book.typ allows the page size to be set via an --input
on the cli, but it's probably necessary to set the number of columns and base
font size as well (since when one of those changes, the others need to change
too).

In addition, update the @Makefile so that the "a5" outputs have 3 cols (instead
of 4 for a4). Keep the font size the same (i.e. the default of 8pt) for both a5
and a4.
