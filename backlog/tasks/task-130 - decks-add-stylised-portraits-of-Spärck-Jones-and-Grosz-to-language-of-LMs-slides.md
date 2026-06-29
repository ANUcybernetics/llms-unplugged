---
id: TASK-130
title: >-
  decks: add stylised portraits of Spärck Jones and Grosz to language-of-LMs
  slides
status: To Do
assignee: []
created_date: '2026-06-29 22:32'
labels:
  - decks
  - content
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The recurring "The _language_ of language models" slide carries a stylised portrait of a field luminary on only two variants today: Markov (grid-training) and Shannon (grid-generation). The two variants we use most regularly --- the pre-trained generation slide and the agentic AI slide --- currently fall back to generic backgrounds.

Add two new stylised portraits, matching the visual register of the existing Markov/Shannon portraits, and wire them into those two slides:

- Karen Spärck Jones --- pioneer of IDF and information retrieval; the foundational-heavyweight register that suits the pre-trained / foundation model slide.
- Barbara Grosz --- computational linguistics giant whose work on collaborative plans between agents prefigures today's agentic systems; suits the agentic AI slide.

The pairing need not be tied to the specific lesson vocabulary --- these are field-luminary portraits, like Markov and Shannon. Deliberately avoiding the "stochastic parrots" group (Bender, Gebru, Mitchell).

Generate the portraits with the styled-image-gen workflow, using the existing bg-markov.avif / bg-shannon.avif portraits as style references so the new ones match. Output AVIF backgrounds into src/decks/assets/.

Slides to update:
- src/decks/partials/grid-pretrained-generation.mdx (currently bg-language-of-lms.avif) --- Spärck Jones
- src/decks/partials/grid-agentic-ai.mdx and src/decks/partials/cutouts-agentic-ai.mdx (currently bg-vocabulary.avif) --- Grosz
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Two new stylised portrait backgrounds (Karen Spärck Jones, Barbara Grosz) exist in src/decks/assets/ as AVIF files matching the visual style of bg-markov.avif / bg-shannon.avif
- [ ] #2 grid-pretrained-generation.mdx language-of-LMs slide uses the Spärck Jones portrait
- [ ] #3 grid-agentic-ai.mdx and cutouts-agentic-ai.mdx language-of-LMs slides use the Grosz portrait
- [ ] #4 Decks build cleanly (pnpm run build) with no broken image references
<!-- AC:END -->
