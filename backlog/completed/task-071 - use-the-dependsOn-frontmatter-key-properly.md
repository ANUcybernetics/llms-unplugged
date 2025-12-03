---
id: task-071
title: use the dependsOn frontmatter key properly
status: Done
assignee: []
created_date: "2025-11-28 05:15"
labels: []
dependencies: []
---

Currently that key is only used to print the names of the deps. Change it so
that:

- dependsOn is an array of lesson slugs (i.e. the name of the lesson.md file but
  without the .md extension)
- in both the LessonCard and the lesson page itself these are listed as
  pre-requisites (with a note "make sure you've done these first" or similar)
  and this text should use the full lesson title and be a link to that lesson
  card
