---
id: task-004
title: update teaching module docs
status: To Do
assignee: []
created_date: "2025-09-21 10:23"
labels: []
dependencies: []
---

I want to make some changes to the training materials in @docs/modules/ . In
particular, for all the modules 01 (basic training) to 07 (evaluation) I want to
refactor each md file so that there's a consistent structure (it's mostly there
in most cases, will just need a few tweaks):

- Description
- You will need (formerly "Materials")
- Key idea (i.e. core cocepts, key insight, etc)
- Algorithm (i.e. the activity steps)
- Example

I want to make **minimal** changes to the content---I think that it's already
really good. So only make the minimal changes as required to make things still
flow clearly within the new structure.

While we're doing this refactoring, I also want to

- use the term "model" (not matrix), including in the titles
- don't have the 0s in the example tables (those cells should be blank)
- for context columns, rotate long headers by 90 degrees
- for the later modules with lots of options/variations, just pick a few, and
  also remove the "activity variation" section
