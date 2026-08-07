---
id: TASK-140
title: Visionaries Showcase deck (15 Aug 2026)
status: In Progress
assignee: []
created_date: '2026-08-07 04:07'
updated_date: '2026-08-07 04:51'
labels:
  - decks
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Slides and visual aids for Ben's 14-minute talk at the ANU Visionaries Among Us Showcase (Manning Clark Hall, 15 Aug 2026, 3:46pm slot). A new deck alongside unplugged-age-of-ai.deck.mdx, which is the stylistic template --- but the content differs: this talk trains the model live on a Wacom tablet (hybrid Old Man and the Sea + Cat in the Hat corpus, 26x26 grid, bag-of-balls sampling) rather than dealing sheets to the room, and closes on Human-Scale AI and the Cybernetic Studio. The fuller talk plan (beats, timings, props, risks) lives in Ben's nb note anu-visionaries-showcase-2026.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 deck exists at website/src/decks/visionaries-showcase.deck.mdx with listed: false and builds cleanly
- [x] #2 deck covers the talk beats with speaker notes, and hands off to / returns from the live Wacom grid segment cleanly (explicit switch points in the notes)
- [x] #3 scale beat reuses GridZoom/StaticGrid components where they fit the new corpus (42 tokens, 26x26)
- [ ] #4 backup static image of the pre-drawn 26x26 grid (labels only) exported, usable if the Wacom or AV fails
- [ ] #5 AV deliverables exported: presenter intro slide image, any side-screen/background images, and a cue sheet for the AV company
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define hybrid-corpus token/vocab data (42 tokens, 26 vocab, two sources)\n2. Extend StaticGrid if needed for two-colour (per-source) tallies and an empty-grid step\n3. Write visionaries-showcase.deck.mdx following unplugged-age-of-ai structure (beats in speaker notes, whiteboard-annotation switch points)\n4. Build check\n5. AV exports (intro slide, backup grid image, cue sheet) as follow-up
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deck live at website/src/decks/visionaries-showcase.deck.mdx (unlisted, 15 slides). BigramCountsTable extended with bigramsB (two-source tally colours: gold Hemingway / blue Seuss, no shared cells in this corpus) and dense mode for the 26x26 grid; corpus colour classes added to widgets.css. Full check suite green (typecheck, lint, format, 171 tests, astromotion-check: all slides fit); grid + reveal slides verified in-browser. Gotcha encoded in the deck comment: MDX splits multi-line JSX children into sibling <p>s, so the reveal slide's coloured paragraphs must stay single-line. Remaining: AC4 (export empty-grid slide as backup image) and AC5 (AV deliverables) once specs are confirmed with Kenyon.
<!-- SECTION:NOTES:END -->
