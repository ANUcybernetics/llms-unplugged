---
id: task-012
title: "specify repo git revision in metadata, display on copyright page"
status: Done
assignee: []
created_date: "2025-09-24 22:37"
labels: []
dependencies: []
---

As part of the build step, the current git revision (with -dirty appended if
there are uncommitted changes) should be put in the metadata field of the json
output file.

Then, @book.typ should include a short version of this in the "Credits:" section
of the copyright page.

Ensure that any change is well-tested.
