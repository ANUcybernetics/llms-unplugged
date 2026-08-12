---
id: TASK-140
title: Visionaries Showcase deck (15 Aug 2026)
status: In Progress
assignee: []
created_date: '2026-08-07 04:07'
updated_date: '2026-08-12 08:19'
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
- [x] #2 The live demonstration uses the 120-sheet anonymous three-source corpus. One complete set covers the model; the second printed copy is redundancy against empty seats, not a requirement
- [x] #3 Notes cover distribution, seeding, random sampling, missing-sheet recovery, and the 14-minute hard stop
- [x] #4 Source identities remain hidden until after generation, then a three-source reveal explains how shared contexts let the model cross boundaries it cannot see
- [x] #5 The talk targets 13:00, retains the Human-Scale AI and ANU 80th-anniversary brief, and explicitly links Tergel Namsrai before it to Cecilia Nie after it
- [x] #6 The comparison with frontier LLMs distinguishes more context, generalisation, instruction tuning, training-data scale, and parameter scale without presenting a transformer as an enlarged N-gram grid
- [x] #7 AV and facilitator notes match the setup: sheets handed out by the ushering team from walk-on (zone bundles, complete A set first), whiteboard replaced by the Wacom for scribing the generated tokens, one laptop-feed cue plus house-lights up/down around the activity, and no cards/balls/live-grid dependency
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
The deck is rewritten around the search sheets (18 slides, targets 13:00) and
the printed materials are finalised. Both are done; what remains is rehearsal.

PRINT SET --- `make showcase` in cli/, reproducible byte-for-byte:
  - brief.pdf --- two pages, A4, lectern only. Never handed out.
  - participants.pdf --- 120 A4 sheets at 53-54 token pairs each (--rows 15
    --font-size 19.2pt), 6,406 bigrams across three corpora, zero dead ends.

One complete set of 120 IS the model. Print a second copy for the 200-seat
hall so every pair is held by two people and an empty seat no longer takes a
transition out of the room --- but everything past the first 120 is bonus, not
a requirement. Seat the complete A set first, B copies in a different zone.

Input order and --seed 42 are load-bearing: the deal only reproduces from that
exact combination, so a reprint matches what is already in the hall.

Handed out at full A4, not imposed two-up onto A5: the imposition scales the
page by 1/sqrt(2), taking 19.2pt down to an effective 13.6pt, which is too
small at arm's length in a darkened hall. 19.2pt is itself the ceiling --- the
largest size that still fits most pairs in one of four columns on A4.

Verified: no source name, title or URL anywhere in the text layer of either
PDF, so nothing leaks before the three-source reveal.

WACOM --- still used, for one job: writing the generated tokens as they come
in, replacing a whiteboard and scribe. Shift-W over slide 7. Ink is committed
per slide, so the seed is collected on slide 6 and written on 7 with the rest
of the sentence, and the sentence does not follow you forward --- read it
aloud before advancing, because slides 8 and 10 both point back at it. Do not
press Escape or W mid-activity; that discards the ink.

DECK --- the Wacom-drawn grid, 42 A3 cards, bag of balls and MC choreography
are gone. The reveal is the spine: three books, never named until slide 11,
built in three clicks with Seuss last. Slide 12 explains the seam --- each
book counted separately, no pair spanning the join, and generation crossing
between them anyway because a bigram model cannot see which book it is in.

The sheets palette is 8 colours chosen for nameability and for printed rather
than on-screen distinctness: black, grey, red, brown, green, blue, purple,
magenta, worst-case ΔE 0.102 across coated, uncoated and newsprint. Sheets and
cutouts are on brand (Public Sans, horizontal lockup in the headers).

Program links verified against the showcase runsheet and ANU material: Tergel
Namsrai immediately precedes Ben and works on sleep/brain health; Cecilia Nie
immediately follows with "Spicing up cholesterol: a novel cure for parasitic
diseases".

REVISIONS (11 Aug, post-review): deck now 19 slides, still targets 13:00.
  - crossing beat: evidence no longer depends on the sampled sentence ---
    the hands-were-the-seam retrospective (every 'said' round drew hands from
    all three books) plus the old-man bridge (old->man in Hemingway ~27x and
    Poe ~13x, same cells) carry slide 12; sentence-visibly-crossed is bonus
  - close re-sequenced: 1946 -> data centre (hands-up callback) -> new
    harder-to-bullsh*t impact slide -> QR (fog-machine tag + Cecilia hand-off
    delivered while the room scans) -> School mark. Time check: past 12:15,
    drop the fog tag; the hand-off cannot be cut
  - opening restored to the program sandwich (Ann / Brad+Brian / 6,409 words)
    with the Tergel bridge folded in
  - scale numbers (15T tokens, ~1T parameters) typeset on slide 14;
    instruction-tuning objection promoted from conditional footnote to beat
  - training gets its one-liner in the slide-9 mapping (counting = training)
  - sheets go UNDER seats (taped/tucked), not on them, so they aren't read
    during Ann's talk; needs Advancement staffing, unconfirmed
  - AV is now TWO cues: feed at walk-on + house lights up/down around the
    activity (sheets unreadable in a darkened hall) --- update cue sheet
  - nb beat sheet rewritten for the sheets talk (previously still described
    the superseded grid/cards/balls version); Kenyon delta recorded there,
    not yet communicated
Checks: pnpm run check green incl. decks:check (422 slides / 8 decks all fit).

AMENDMENTS (11 Aug, later): the event is an open public sci-comm event
(celebration of 80 years of ANU research), not an Advancement/donor function
--- register notes adjusted (e.g. 'school essays', not 'grandchildren's').
Sheet distribution is by the USHERING TEAM from walk-on, per Ben: zone
bundles prepared in advance, complete A set spread across zones first, done
by ~1:20 with the seed ask at 2:45 as the hard deadline; house lights double
as the ushers' working light. Slide 4 retitled 'what you've just been given';
AC #7 updated to match.

AMENDMENTS (12 Aug): attendance revised to ~360, so the set is now PRINTED
THREE TIMES (120 x 3 = 360 sheets). The corpus is unchanged, deliberately:
The Tell-Tale Heart and The Cat in the Hat are already complete texts, so the
only source with room to grow is Hemingway (the excerpt is 1,808 words of the
full novel), and tripling through it alone would move the balance from
1961/1999/2446 bigrams (31/31/38 Seuss/Hemingway/Poe) to ~70% Hemingway ---
which the three-source reveal cannot afford, needing all three audible in the
sentence and Seuss last. Holding the balance at 3x would need ~6,300 words per
author: two or three more Seuss books and more Poe. That is a different
corpus, not a longer excerpt, three days out.

A third identical printing is free and better: every count triples so the
distribution is untouched, and the ~10% of generation steps that land on a
context held by a single pair put three hands up instead of one --- at 360
seats, the difference between visible and invisible from the stage. Median
step goes from ~34 hands to ~100. The sheets carry no A/B/C mark (the header
lockup just cycles the five title tokens), so a third copy is the same PDF
again, and the paper is the same either way.

Why the corpus needs nothing more: branching factor 3.52, perplexity 11.1,
entropy 3.47 bits/token, only 11.2% of steps forced (89% are real choices),
and 75.6% of pairs sit on contexts shared by two or more sources, with 86
contexts in all three (the 416, . 376, , 264, I 223, and 207, said 63). The
crossing beat and 'nobody wrote this sentence' are both already carried.

HEADER TITLE changed to 'Ben Swift/ANU Visionaries Showcase' (was 'ANU
Visionaries') and the set regenerated: same --seed 42 and input order, so the
deal is identical pair for pair (sheet 1 still opens market -> in), only the
header text differs. Leak check re-run: zero source names, authors or URLs in
the participants text layer. brief.pdf is 1 page, participants.pdf 120.
The daysy copy in ~/Downloads/visionaries-showcase/ has been refreshed and
md5-matches the local build; the older visionaries-showcase-search-sheets.pdf
and llms-unplugged-showcase-sheets.pdf in ~/Downloads are superseded.

Deck updated for the new size: three printings throughout, A/B/C zones, the
1:20 hand-out flagged as the likeliest thing to slip, brief corrected to one
page, and a new rehearsal note --- at ~100 hands the bottleneck is hearing the
answer, not the search, so pick near an aisle and repeat the token back before
writing it. The brief's own copy advice is now count-agnostic ('print the
whole set again, once per extra roomful') rather than saying twice, which
regenerated the five published website sheet PDFs.

STILL OPEN: rehearsal to 13:00; AV cue sheet (two cues) not yet sent; usher
briefing at the 1 pm sound check, now a 360-sheet hand-out; Kenyon delta in
the nb beat sheet still not communicated.
Checks: cargo test 118 passed; pnpm run check green (186 tests, 422 slides /
8 decks all fit).

The header title is 'Ben Swift — ANU Visionaries Showcase' (em dash, not a
slash). Passed through as a literal U+2014 rather than Typst's `---`, because
the title reaches the template as JSON metadata and is placed as a string, not
parsed as markup. Renders correctly in Public Sans; the deal is unchanged
again (sheet 1 still opens market -> in). daysy re-synced.

AV CUE SHEET written (12 Aug), in the nb beat sheet (home:1258) under 'AV cue
sheet (hand this over)' --- self-contained, so the desk needs nothing else.
Three cues: Q1 walk-on = feed + house lights up together; Q2 ~7:30 = lights
down; Q3 = off by 4:00. Also specifies 16:9 with no overscan/letterbox (fixed
canvas, full-bleed backgrounds), lapel/headset mic, no playback, and the
sound-check list.

Change of substance: the lights cue moved from ~1:20 to walk-on. At 240 sheets
having the ushers work the first eighty seconds in the dark was tolerable; at
360 it isn't. Deck and beat sheet aligned to match.

Beat sheet also de-staled for 360: print set three printings, A/B/C zone
bundles, brief one page, header title, and the distribution risk re-stated as
360 sheets in ~2:45. Kenyon delta now lists the 200 -> ~360 attendance change;
still owed to him is the presenter intro image, and the cue sheet still needs
handing over (deliberately at/before the 1 pm sound check, not emailed).

2026-08-12 --- deck cut from 18 slides to 13 for a TED-style delivery: no
visual aids, slides as position cues, everything explanatory spoken. Removed
the distributed-model slide, the cross-book confluence slide, the GridZoom
grid comparison, the frontier-scale build, and the closing QR/logo slides;
their content now lives in the speaker notes on the neighbouring slides. The
ANU 1946 slide lost its title and runs full-bleed with its two lines. Two new
gold corner-motif backgrounds (bg-first-tool, bg-anu-1946) --- corner motifs
because centred impact text is illegible over a full-frame illustration, which
decks:check does not catch. Running order retargeted to 12:00, the freed time
going to the run.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-10 12:08
---
Pivot approved after the 10 Aug search-sheet talk/demo worked well. The 100-sheet master corpus has been generated and duplicated for a 200-person room; this task now plans the deck rewrite, not the superseded Wacom/grid version.
---
<!-- COMMENTS:END -->
