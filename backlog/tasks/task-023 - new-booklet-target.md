---
id: task-023
title: new booklet target
status: To Do
assignee: []
created_date: "2025-10-06 09:31"
labels: []
dependencies: []
---

I'd like to add a new target to the @Makefile which creates bigram booklets for
the following four datasets in data/

- aus-constitution.txt
- beatles.txt
- gospels-web.txt
- dr-seuss.txt

I want them to follow the same out/pdf and out/json approach that the existing
TARGETS use, but just use a new target called WORKSHOP_TARGETS, and have
`make workshop` build all these.
