---
id: task-023
title: cut a release
status: To Do
assignee: []
created_date: "2025-10-20 22:22"
labels: []
dependencies: []
---

There's currently no GH action for creating a release---need to make one. This
will trigger the zenodo "mint a DoI" workflow as well.

The release tar/zip should contain:

- a (release) version of the `my_first_lm` CLI (which can be used
  cross-platform)
- at least one "training" txt file in `data/`
- the README.md, licence and citation files
- three pdfs:
  - `modules.pdf`
  - `instructor-notes.pdf`
  - the `grid.pdf` file

Think hard---are there any other files which should be in the release?
