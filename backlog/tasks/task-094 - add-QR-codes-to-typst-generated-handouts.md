---
id: task-094
title: add QR codes to typst-generated handouts
status: Done
assignee: []
created_date: '2025-12-18 23:54'
updated_date: '2025-12-24 00:56'
labels: []
dependencies: []
---

Here's how it should work:

- the main utils function in @utils.typ takes an optional string arg
- if present, use a typst QR generator to create a QR code for that string (gold
  on black, using the ANU colours) and place it on top of the hero image in the
  bottom RH corner of the first page of the card
- each \*.typ file in website/lessons/ should be updated to point to full URL to
  the online version of the lesson (in most cases this is easy, but in some
  cases a bit trickier e.g. the grid and bucket versions should both point to
  the same URL, because the website has them both consolidated onto one page)

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation

1. Added QR code support to `typst/utils.typ`:
   - Imported the `cades` QR code package (`@preview/cades:0.3.1`)
   - Modified `lesson-hero` function to accept an optional `url` parameter
   - When URL is provided, a gold-on-black QR code (2.2cm × 2.2cm) is placed in the bottom-right corner of the hero image with 0.3cm padding

2. Updated all 13 lesson `.typ` files with their corresponding URLs:
   - `grid-training.typ` → `https://www.llmsunplugged.org/lessons/training`
   - `bucket-training.typ` → `https://www.llmsunplugged.org/lessons/training`
   - `grid-generation.typ` → `https://www.llmsunplugged.org/lessons/generation`
   - `bucket-generation.typ` → `https://www.llmsunplugged.org/lessons/generation`
   - `grid-trigram.typ` → `https://www.llmsunplugged.org/lessons/trigram`
   - `bucket-trigram.typ` → `https://www.llmsunplugged.org/lessons/trigram`
   - `sampling.typ` → `https://www.llmsunplugged.org/lessons/sampling`
   - `context-columns.typ` → `https://www.llmsunplugged.org/lessons/context-columns`
   - `word-embeddings.typ` → `https://www.llmsunplugged.org/lessons/word-embeddings`
   - `synthetic-data.typ` → `https://www.llmsunplugged.org/lessons/synthetic-data`
   - `lora.typ` → `https://www.llmsunplugged.org/lessons/lora`
   - `pretrained-generation.typ` → `https://www.llmsunplugged.org/lessons/pretrained-generation`
   - `weighted-randomness.typ` → `https://www.llmsunplugged.org/lessons/weighted-randomness`

Note: Grid and bucket variants point to the same URL since the website consolidates them onto a single page.
<!-- SECTION:NOTES:END -->
