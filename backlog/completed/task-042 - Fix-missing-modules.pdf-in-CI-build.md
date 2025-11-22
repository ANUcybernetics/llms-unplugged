---
id: task-042
title: Fix missing modules.pdf in CI build
status: Done
assignee: []
created_date: '2025-11-21 09:36'
labels:
  - ci
  - website
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The deploy-website CI job fails on the broken links check because `modules.pdf` is not present in `_site/assets/pdfs/`.

The typeset job runs successfully and uploads artifacts, but the PDF isn't ending up where expected. The download-artifact step completes without error, but `modules.pdf` is missing when linkinator runs.

Error from CI:
```
[404] _site/assets/pdfs/modules.pdf
ERROR: Detected 1 broken links.
```

Need to investigate why the artifact download isn't placing `modules.pdf` correctly.
<!-- SECTION:DESCRIPTION:END -->
