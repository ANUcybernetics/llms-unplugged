---
id: task-088
title: change image generation script reference images
status: To Do
assignee: []
created_date: "2025-12-12 04:15"
labels: []
dependencies: []
---

The @website/scripts/generate-hero-images.ts script uses 3 "example" pngs as
reference images. I'd like to change those images to be the hero images from the
following lesson:

- introduction
- sampling
- pre-trained model generation
- bucket training
- grid-trigram

In each case, the nano banana model only takes png/jpg images, so convert them
to those formats (and put them in the same folder as the example images
currently are... then remove the now-uneeded example images).
