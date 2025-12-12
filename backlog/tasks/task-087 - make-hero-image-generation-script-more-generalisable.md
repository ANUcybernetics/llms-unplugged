---
id: task-087
title: make hero image generation script more generalisable
status: To Do
assignee: []
created_date: "2025-12-12 04:02"
labels: []
dependencies: []
---

The @website/scripts/generate-hero-images.ts is currently hardcoded to generate
"hero" images (for a specific page, using that page's YAML frontmatter as part
of the prompt).

Refactor that page so that it just takes a prompt and output filepath as args.
It should still use the example images as references, and concat the input
prompt with the "base prompt" as before. And it should convert the output image
to an avif (using the same params as the other script).

In the comment at the top of the script you can include an example of how to get
the old behaviour (e.g. just generate a hero image by lesson name).

If it's no longer necesasry you can remove the parallelisation stuff, too.
