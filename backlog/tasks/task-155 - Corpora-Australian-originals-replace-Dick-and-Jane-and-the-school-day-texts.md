---
id: TASK-155
title: 'Corpora: Australian originals replace Dick and Jane and the school-day texts'
status: In Progress
assignee: []
created_date: '2026-09-14 11:03'
updated_date: '2026-09-14 11:34'
labels:
  - data
  - ledger
  - video
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ledger walkthrough book (Fun with Dick and Jane) has no cultural pull for an Australian audience and an unclear copyright position, and the five school-day training texts frame the reader as a child when the lesson is meant to work for all ages up to executives. The bigram setup fixes the register (short sentences, tiny vocabulary, pairs that come round again), so neutrality and flavour come from the subject: the Australian outdoors. Draft texts are in data/originals/: the-magpie.txt is the walkthrough book (133 tokens, 24 prefixes, no prefix wider than four, so the pack's --max-followers 4 drops nothing and the printed tallies are honest counts; full-stop row is lopsided 7:4:3:3 for the fill-the-cup beat; 'comes' has one follower; 'here comes the magpie' is a sentence the book never says). outdoors-{beach,storm,kookaburra,creek,bush}.txt are the training set (57-69 tokens, widest row four, pooled 'the' has 17 followers, each text has a word only it holds: gull, frogs, kookaburra, yabby, wallaby). The grid lesson gets its own example independent of the ledger: 'Hop, Joey, hop. See Joey hop.' has the same token shape as 'Run, Spot, run. See Spot run.' so the deck's dice bands and rolls carry over, and the pre-trained booklet is built from an out-of-copyright Australian text (Banjo Paterson's verse or Dorothy Wall's Blinky Bill) long enough to earn diamonds. The four-colour, four-follower recipe is the current pack's; an eight-colour room relaxes it, so the texts are written to it but not contorted for it. Texts are approved by Ben before any constant, deck or script moves; the videos (task-154) name these texts, so they wait on this.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 the-magpie.txt built with the pack recipe (140 budget, four-colour palette, --max-followers 4) deals every prefix in one row with no follower dropped and ops/ledger-sweep.py reports dead 0
- [ ] #2 each outdoors text has no prefix wider than four at four columns, the five share a core vocabulary, pooled 'the' has at least 15 followers, and a ledger set for each builds without warnings
- [ ] #3 Makefile LEDGER_BOOKS and LEDGER_TEXTS use the new texts, the pack builds clean, and the school-day texts are removed
- [ ] #4 the ledger deck's ROW_* constants are re-read from the magpie and outdoors sheets, the walkthrough chain in the deck partials and the finale's five rows follow the new texts, and pnpm run check passes
- [ ] #5 the lesson page, pack README and docs no longer mention Dick and Jane or the school-day texts
- [ ] #6 the grid decks' example is 'Hop, Joey, hop. See Joey hop.' with EXAMPLE_* constants, dice bands and rolls re-derived and the walk still going no-choice, equal, unequal
- [ ] #7 an out-of-copyright Australian text is added under data/ for the pre-trained booklet, the booklet builds with at least one diamond entry, and the grid decks' pre-trained example comes from it
- [ ] #8 the eight video scripts in ops/video/scripts name the new texts: the joey line, the booklet's text, the magpie chain, and the outdoors words in the finale
- [ ] #9 Ben has signed off the final texts; building proceeds on the drafts meanwhile, since a text change re-flows through data/ and a re-render
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Makefile: LEDGER_BOOKS swaps fun-with-dick-and-jane for the-magpie (data/originals/), LEDGER_TEXTS becomes the outdoors set; make pack-how-ai-writes-stories-ledger; check the brief's counters-per-colour figure.
2. Re-read ROW_* constants off the built magpie and outdoors ledger.json into the ledger deck; rewrite the walkthrough chain in decks/partials/ledger-*.mdx (a chain that glues two magpie sentences, e.g. 'here comes the magpie'), the finale's five 'the' rows and the unique-word draw; pnpm run check.
3. Lesson page, docs/packs README, deck notes: replace every Dick and Jane / school-day mention; git rm the school-day texts.
4. Grid: EXAMPLE_TOKENS/VOCAB/GENERATION in website/src/decks/examples.ts to the joey line (same shape: hop , joey , hop . see joey hop .); confirm the walk and dice bands; decks:check.
5. Booklet: fetch an out-of-copyright Australian text (Paterson, Gutenberg) into data/, build the booklet with the CLI, confirm a diamond entry, set EXAMPLE_TEXT/PRETRAINED_* from it.
6. Scripts: update the grid, pre-trained, agentic and ledger scripts' spoken examples and Visual: lines to the new texts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Grid half landed 2026-09-14 (commits 7e98456c, ebfa3e14, 2fdee25b): Paterson data file, joey example, pre-trained walk golden→grass→grown→hollow→;, video scripts. The ledger half (Makefile, ledger deck, lesson page, docs, git rm of school-day texts) is split out to its own task because the ledger deck runs in a workshop on 2026-09-15; the videos build their ledger data from the same recipes via ops/video/build-data.py meanwhile.
<!-- SECTION:NOTES:END -->
