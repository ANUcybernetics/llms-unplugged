---
id: task-072
title: simplify hero image generation script
status: Done
assignee: []
created_date: "2025-11-28 05:37"
updated_date: "2025-11-28 05:44"
labels: []
dependencies: []
---

The @website/scripts/generate-hero-images.ts is a bit too complicated - it tries
to have "batches" of images that it generates.

Instead, I want it to just take as args one or more lesson slugs (filename
without the .md extension), or a special `--all` flag to generate all images.

In addition, run the build/test to see which lessons are missing hero images,
and generate them.
