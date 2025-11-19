---
id: task-032
title: rejig github actions
status: Done
assignee: []
created_date: '2025-11-19 21:57'
updated_date: '2025-11-19 23:14'
labels: []
dependencies: []
---

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Implementation

### New workflows created:
1. **cli.yml** - Build & test CLI on push to cli/** or manual trigger
2. **typeset.yml** - Typeset all handouts, callable by other workflows

### Modified workflows:
3. **deploy-website.yml** - Now calls typeset workflow and copies PDFs to static assets
4. **release.yml** - Now uses typeset artifacts instead of committed PDFs

### Other changes:
- Vendored anu-typst-template into handouts/packages/local/
- Removed committed PDFs from git (modules.pdf, grid.pdf, instructors-notes.pdf)
- Updated .gitignore to ignore all PDFs

### Setup required:
- No additional secrets needed (template is vendored)
- Website deploy will automatically typeset and include PDFs
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files changed:
- .github/workflows/cli.yml (new)
- .github/workflows/typeset.yml (new)
- .github/workflows/deploy-website.yml (modified)
- .github/workflows/release.yml (modified)
- .gitignore (modified)
- handouts/packages/local/anu-typst-template/0.2.0/ (new, vendored)

Removed from git:
- handouts/out/modules.pdf
- handouts/out/worksheets/grid.pdf
- website/src/assets/pdfs/modules.pdf
- website/src/assets/pdfs/instructors-notes.pdf

Committed and pushed: a8936ca

Workflow triggered automatically on push
<!-- SECTION:NOTES:END -->

This project should have the following GH actions:

- build & test the CLI tool (doesn't have to run on every push)
- typeset all the typst files
- build & deploy the website
- make a release

The typeset task should run for all website deploys, and should move the typeset
pdf files into the static assets dir (so they can be served by the website).
This will be nicer than the current setup where we have to commit a couple of
the built pdf artefacts to the repo, then copy them over.
