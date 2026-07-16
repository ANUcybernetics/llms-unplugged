---
id: TASK-131
title: 'Design the advanced follow-on lesson (working title: Going Deeper)'
status: To Do
assignee: []
created_date: '2026-07-16 00:01'
updated_date: '2026-07-16 01:24'
labels:
  - website
  - lessons
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The site restructure (July 2026) reorganises content into modules (the current lesson pages) and lessons (deck-backed workshop journeys). The battle-tested decks cover the fundamentals trajectories, but the less-delivered modules --- In-context Memory, Induction Heads, Word Embeddings (plus possibly Sampling, LoRA, RLHF, Synthetic Data) --- have no lesson or deck yet. The current /workshops/ page's 'Format 2: Going deeper' prose is the seed: a follow-on for groups that have done the fundamentals, comfortable with more abstraction. Open questions to resolve before building: which modules make the cut (and in what sequence), whether it needs a deck from day one or launches as a lesson page only, target audience/duration, and what it's actually called (naming principle from the restructure: name the experience, keep duration/apparatus out of the title).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 lesson concept decided: module sequence, audience, duration, and name
- [ ] #2 lesson page exists under /lessons/ (listed or unlisted as appropriate) with you-will-need, timings, and prep notes
- [ ] #3 deck decision made explicitly: either a deck exists or the page states the lesson runs without one
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Seed prose from the deleted /workshops/ page (Format 2: Going deeper), captured verbatim before the July 2026 restructure removed the page:

---

time: 2-3 hours (or split across sessions). for: senior high school onwards, or any group ready to tackle more abstract material.

For groups ready to go further, this extended trajectory adds the 'how models understand' topic. After covering the fundamentals, you explore how models reuse earlier context, complete patterns from a prompt, and how words get represented as numerical vectors. This path suits later-year high school students, computing electives, professional-development cohorts, or anyone who wants to understand what 'attention' and 'embeddings' actually mean.

Modules: training, generation, pretrained-generation, in-context-memory, induction-heads, word-embeddings.

What the additions cover: In-context memory adds a short-term memory that nudges generation toward recently-used words, so the text stays on topic --- a hand-run version of what transformer attention does. Induction heads goes a step further: find the last time the current word appeared and copy what followed; this completes patterns the model never trained on --- the circuit behind in-context learning and few-shot prompting. Word embeddings turns each word's row in the model into a numerical vector and measures similarities between words --- the foundation of how modern LLMs represent meaning, calculable by hand.

Why split the trajectory: the fundamentals work for any audience and require only 90 minutes. The understanding lessons require more time and comfort with abstraction, but connect directly to concepts anyone will encounter in deeper study of AI: attention mechanisms, embeddings, vector similarity. Running them as a second session (or a follow-up for the interested) keeps the core workshop accessible while offering a clear path forward.

(Also from the old page, possibly relevant: Format 3 'Controlling output' --- sampling as a 30-min add-on, ages 14+; and the 'Adaptation and data' topic for data-science/ethics/media-literacy groups, with synthetic-data flagged as especially discussion-friendly.)
<!-- SECTION:NOTES:END -->
