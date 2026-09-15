---
id: TASK-156
title: 'Ledger deck, pack and lesson page move to the magpie and the outdoors texts'
status: Done
assignee: []
created_date: '2026-09-14 11:34'
updated_date: '2026-09-15 06:02'
labels:
  - data
  - ledger
  - decks
dependencies:
  - TASK-155
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ledger half of task-155, held back because the how-ai-writes-stories-ledger deck is being run in a workshop on 2026-09-15 with the Dick and Jane set. Not before 2026-09-16. The videos (task-154) already follow the magpie chain, so the deck follows the videos: the generation walkthrough starts from the full-stop row and runs 'it sits on the fence. Here comes the magpie.' (draws: full stop→it 7/17 red; it→sits 3/10 red; sits, on: one follower; the→fence 6/19 blue; fence→full stop; full stop→Here 4/17 blue, the unlikely one; Here, comes: one follower; the→magpie 5/19 red, same row different word; magpie→full stop 3/5 blue). Every count is read off the built sheets: the row for the is magpie 5, fence 6, postie 4, dog 4; the full-stop row is it 7, Here 4, Down 3, Swoop 3; it is sits 3, watches 3, goes 3, is 1; magpie is is 2, full stop 3. Sheet ranges: !→back, comes→goes, Here→on, postie→Swoop, the→watches (the is on sheet 5, full stop on sheet 1, it on sheet 3). The training walkthrough's pair is 'the magpie' (five times in the book). The finale's five rows for the are beach (sand 2, water 2, dog 3, sun 1), storm (sky 2, tin 1, dog 2, rain 1), kookaburra (kookaburra 3, gum 1, cat 2, street 1), creek (creek 2, rocks 2, mud 2, yabby 2), bush (track 3, hill 1, sun 1, water 1); the drawn word is yabby (creek, yellow). ops/video/build-data.py builds the same sets the pack does, so the numbers can be re-read from ops/video/_kit/generated/data.js.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Makefile LEDGER_BOOKS swaps fun-with-dick-and-jane for the-magpie (data/originals/, via a book_src lookup) and LEDGER_TEXTS becomes beach storm kookaburra creek bush with the outdoors- prefix; make pack-how-ai-writes-stories-ledger builds clean and the brief's counters-per-colour figure is checked (magpie max tally 8, max row 19)
- [x] #2 the deck's ROW_* and SHEET constants are re-read from the built magpie and outdoors ledger.json, the walkthrough chain in decks/partials/ledger-*.mdx follows the videos' chain above, DJ_OPENING becomes the magpie's opening, and the finale's five rows and unique-word draw follow the outdoors texts
- [x] #3 the lesson page, docs/packs README and the deck's notes no longer mention Dick and Jane or the school-day texts, and the school-day texts are git rm'd
- [x] #4 pnpm run check passes and the rebuilt pack is uploaded with ops/bucket-sync.py
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pack, deck, lesson page and docs moved; school-day texts removed; pnpm run check, build and tests pass, and the changed slides were checked in the browser. Remaining: upload the rebuilt pack with ops/bucket-sync.py, held until the 2026-09-15 workshop is over.

Pack rebuilt and uploaded after the workshop; served zip verified against the local build; manifest unchanged (PDFs only).
<!-- SECTION:NOTES:END -->
