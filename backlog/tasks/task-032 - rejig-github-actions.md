---
id: task-032
title: rejig github actions
status: To Do
assignee: []
created_date: "2025-11-19 21:57"
labels: []
dependencies: []
---

This project should have the following GH actions:

- build & test the CLI tool (doesn't have to run on every push)
- typeset all the typst files
- build & deploy the website
- make a release

The typeset task should run for all website deploys, and should move the typeset
pdf files into the static assets dir (so they can be served by the website).
This will be nicer than the current setup where we have to commit a couple of
the built pdf artefacts to the repo, then copy them over.
