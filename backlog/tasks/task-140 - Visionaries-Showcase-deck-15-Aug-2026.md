---
id: TASK-140
title: Visionaries Showcase deck (15 Aug 2026)
status: In Progress
assignee: []
created_date: '2026-08-07 04:07'
updated_date: '2026-08-11 11:17'
labels:
  - decks
dependencies: []
modified_files:
  - cli/src/main.rs
  - cli/tests/integration_test.rs
  - cli/CLAUDE.md
  - website/src/decks/visionaries-showcase.deck.mdx
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rewrite Ben's 14-minute ANU Visionaries Among Us Showcase talk for Manning Clark Hall (15 Aug 2026, 3:46 pm) around the search-sheet demonstration that succeeded on 10 Aug. The room becomes a pre-trained bigram model built from three anonymously presented sources: The Cat in the Hat, an opening excerpt of The Old Man and the Sea, and The Tell-Tale Heart. Keep the showcase-specific Human-Scale AI/ANU 80th-anniversary thesis, avoid merely replaying the Age of AI talk, and make explicit transitions from Tergel Namsrai's preceding 3MT on sleep and brain health into Cecilia Nie's following 3MT on cholesterol as a treatment route for parasitic disease.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deck remains unlisted and passes the site build, deck checks, and slide-fit validation
- [x] #2 The live demonstration uses the 100-sheet anonymous three-source corpus, printed twice, with notes covering distribution, seeding, random sampling, missing-sheet recovery, and the 14-minute hard stop
- [x] #3 Source identities remain hidden until after generation, then a three-source reveal explains how shared contexts let the model cross boundaries it cannot see
- [x] #4 The talk targets 13:00, retains the Human-Scale AI and ANU 80th-anniversary brief, and explicitly links Tergel Namsrai before it to Cecilia Nie after it
- [x] #5 The comparison with frontier LLMs distinguishes more context, generalisation, instruction tuning, training-data scale, and parameter scale without presenting a transformer as an enlarged N-gram grid
- [x] #6 AV and facilitator notes match the simplified setup: sheets pre-placed, one complete set guaranteed in occupied seats, whiteboard/scribe ready, one laptop-feed cue, and no Wacom/cards/balls dependency
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Target running order: 13:00 against the 14:00 hard stop.

1. 0:00–1:20 — Enter from the preceding talk. Open on Tergel Namsrai having taken the room inside the relationship between sleep and brain health; pivot to the other apparently hidden system in the program, a machine that talks. Keep the strongest existing lines—“we got the tool before we got the story” and “it is hard to have an opinion on a machine you have never seen the inside of”—but omit the Bandura sequence so repeat attendees do not hear the 10 Aug talk verbatim. Promise that the room will become the machine.

2. 1:20–2:45 — Reveal the sheets, not the sources. Have them pre-placed face-down to avoid a distribution pause. Explain one token pair, the shuffle, and the collective model. Use the neutral sheet label; state 6,409 tokens, 1,115 distinct tokens, and 6,406 bigrams across 100 unique sheets. Explain that the set is printed twice: every transition is doubled equally, so the probabilities are unchanged and one missing copy does not remove a transition. Seat/distribute the complete A set first, with B copies in a different room zone; if attendance is under 100, consolidate multiple A sheets with helpers rather than omit unique pages.

3. 2:45–3:30 — Seed and algorithm. Ask one nearby participant for any pair, write both tokens, then show the compact four-step age-of-AI algorithm: call the last token and colour, hands up for boxed matches, choose a hand randomly, write the next token. Stress random selection once; do not explain all the jargon yet.

4. 3:30–7:30 — Run the room for about four minutes and 12–15 generated tokens. Keep the whiteboard/scribe loop fast. Narrate only two observations during motion: the number of hands is the probability distribution, and a different random hand makes a different sentence. The corpus has zero structural terminal contexts; if a round is quiet, name a missing physical sheet and reseed. Stop while the room wants another round, then read the result straight.

5. 7:30–9:30 — Cash out the experience. Land “we just ran a language model,” map sheets/hands/random pick/board sentence to parameters/distribution/sampling/generation, and state that nobody wrote the resulting sentence. Keep this close to the proven age-of-AI sequence because the audience has just supplied its referents.

6. 9:30–10:45 — Three-source reveal. Build in three clicks: Hemingway first, Poe second, Seuss last for the largest recognition/laugh. Use only short identifying fragments. Explain that document boundaries were preserved during training, yet shared contexts such as “the old man,” “said,” “house,” and function words let generation cross between sources because a bigram model cannot see provenance. This replaces the old two-colour grid reveal.

7. 10:45–12:00 — Scale without changing the loop. Compress the age-of-AI “three things” and scale run into two slides: frontier models use much longer context, generalise between related tokens, and are instruction-tuned; they have vastly more training text and learned numbers and use different machinery. Finish the comparison on “still words in → words out,” not the old claim that a trillion parameters is merely a large grid.

8. 12:00–13:00 — Fit the showcase brief and hand forward. The room has literally made a human connection into computational machinery: the model existed only in their coordinated actions. Tie that to ANU at 80—founded in 1946 to help a country understand a transformed world, with AI as the present version of that public task—and land Human-Scale AI in one sentence. Close the program bridge: Tergel took us inside a sleeping brain; this room went inside a talking machine; Cecilia Nie now takes us inside a parasite, using cholesterol as a possible treatment route. Retain Brad Tucker/Brian Schmidt and the fog-machine joke only as an optional whole-program tag, not as the immediate hand-off.

9. Remove obsolete staging and visuals: Wacom grid annotation, 42 A3 cards, balls/bag, two-colour tally grid, MC volunteer choreography, and their backup requirements. Reuse the age-of-AI sheet, algorithm, role-mapping, “not in the book,” scale, QR, and School-mark visual language where it serves the shorter spine; keep the Visionaries title, 1946 close, and event-specific notes.

10. Validate the rewrite with the anonymous PDF in hand: confirm no source names leak before the reveal, run the deck through build/check/slide-fit, rehearse to 13:00 with a hard cut at 12:15 into the closing minute, and update the AV cue sheet/presenter image for the simplified one-feed setup.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The current 15-slide deck still implements the superseded Wacom/grid/cards/bag
version; the revised implementation plan above is the source of truth and has
not yet been applied to the deck.

Printed materials are finalised and reproducible via `make showcase` in cli/.
The set is 120 A4 participant sheets at 53--54 token pairs each (--rows 15
--font-size 19.2pt), 6,406 bigrams across three corpora, zero terminal
contexts. Both the input order and --seed 42 are load-bearing: the deal only
reproduces from that exact combination, so a reprint matches the copies
already in the hall.

  - out/sheets/visionaries-showcase/brief.pdf --- two pages, A4, for the
    lectern. Never handed out.
  - out/sheets/visionaries-showcase/participants.pdf --- 120 A4 sheets.
    PRINT TWICE for the 200-seat hall: every token pair is then held by two
    people, so the probabilities are unchanged and one empty seat no longer
    takes a transition out of the room. 240 sheets of paper, single-sided.

Handed out at full A4 rather than imposed two-up onto A5. The imposition
halves the paper but scales the page by 1/sqrt(2), taking 19.2pt type down to
an effective 13.6pt --- too small to read at arm's length in a darkened hall.
Getting it back through the imposition would need ~27pt source and over 250
sheets. 19.2pt is itself the largest size that still fits most pairs in one of
four columns on A4; past it, wide pairs take two slots each and the sheet
count runs away (21pt needs 195 sheets, 24pt 196 even at three columns).

Verified: no source name, title or URL appears anywhere in the text layer of
either PDF, so nothing leaks before the three-source reveal.

The sheets CLI accepts repeated --input while preserving document boundaries,
and --title/--author overrides keep the sources off the printed pages.
CutoutsMetadata carries a document count, which the brief uses to explain
generation crossing between texts --- a count a --title override cannot hide.

The brief gained three things every corpus needs: what to do when the room is
a different size from the sheet count, the seam between combined texts, and
seeding the first round. It runs to two pages for every corpus now.

The sheets palette is 8 colours, down from 11, and chosen for nameability and
for printed rather than on-screen distinctness: black, grey, red, brown,
green, blue, purple, magenta. Worst-case ΔE 0.102 across coated, uncoated and
newsprint. The participant sheets no longer print a colour key --- the names
are the ones a room would use unprompted. Sheets and cutouts are also on
brand now (Public Sans, the horizontal lockup in the headers).

Program links verified against the showcase runsheet and ANU material: Tergel
Namsrai immediately precedes Ben and works on sleep/brain health; Cecilia Nie
immediately follows with "Spicing up cholesterol: a novel cure for parasitic
diseases".
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-10 12:08
---
Pivot approved after the 10 Aug search-sheet talk/demo worked well. The 100-sheet master corpus has been generated and duplicated for a 200-person room; this task now plans the deck rewrite, not the superseded Wacom/grid version.
---
<!-- COMMENTS:END -->
