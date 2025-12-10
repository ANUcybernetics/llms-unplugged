---
id: task-080
title: consolidate bucket and dice versions into one linear progression
status: Done
assignee: []
created_date: '2025-12-09 21:55'
updated_date: '2025-12-10 09:33'
labels: []
dependencies: []
---

There are now both bucket and "dice" (called "basic" at the moment, but maybe
should be renamed) versions of those first two training/generation lessons. I
want the "basic" (i.e. the grid) versions to be renamed (including the filenames
and all references) to "Grid Training" and "Grid Generation". In each case, add
a note (and link) that there's a bucket version which covers the same ideas but
in a slightly different way; and vice versa for the bucket versions.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation completed

Renamed "Basic Training" and "Basic Generation" to "Grid Training" and "Grid Generation" throughout the codebase:

### Files renamed
- `basic-training.md` → `grid-training.md`
- `basic-generation.md` → `grid-generation.md`
- `basic-training.typ` → `grid-training.typ`
- `basic-generation.typ` → `grid-generation.typ`
- `hero-basic-training.avif` → `hero-grid-training.avif`
- `hero-basic-generation.avif` → `hero-grid-generation.avif`
- `basic-training.pdf` → `grid-training.pdf`
- `basic-generation.pdf` → `grid-generation.pdf`

### Cross-references added
- Grid lessons now link to Bucket versions as alternatives
- Bucket lessons already linked to Grid versions (updated from Basic)

### References updated in
- config.mts (navigation)
- topics/fundamentals.md, topics/index.md
- educators.md, parents.md
- intro.md
- bucket-training.md, bucket-generation.md
- All dependent lessons (lora, trigram-model, word-embeddings, synthetic-data, context-columns-training, context-columns-generation, pretrained-generation, sampling)
- All Typst files
- build.test.ts
- AGENTS.md
- generate-hero-images.ts

All 85 tests pass.
<!-- SECTION:NOTES:END -->
