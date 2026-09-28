# Beyond the slides

The second LLMs Unplugged video series (TASK-167), alongside the eight in
`../README.md`, which stay as they are. The scripts aren't bound to the slides:
they refer to the same slides and printed artefacts, but they can use
explanations a slide can't carry: continuous morphs between representations,
many-sample simulations and real corpus data at scale. Everything in
`../README.md` on tone, production phases, captions, format and visuals applies
here unless this file says otherwise; `../STYLE.md` holds the look.

## Series

Twelve videos. The how-it-works videos are single-format: a teacher running one
flavour of workshop sees only that flavour's materials. They are built from
shared kit parts and one structure per stage, so the grid and ledger versions of
a stage are siblings rather than separate builds. Slugs can repeat the first
series' (both have a `training-grid`) because this series lives under `beyond/`,
in its own bucket prefix.

| Slug                         | Format  | Key idea                                                                                      |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `training-grid`              | grid    | a language model learns by counting which word follows which, and the counts are all it keeps |
| `generation-grid`            | grid    | text is written one word at a time, each picked in proportion to the counts                   |
| `pretrained-generation-grid` | grid    | you can generate from a model someone else trained; a booklet is a grid stored another way    |
| `agentic-ai-grid`            | grid    | a tool call is a token the model draws like any other; the harness does the rest              |
| `training-ledger`            | ledger  | as `training-grid`, on ledger sheets                                                          |
| `generation-ledger`          | ledger  | as `generation-grid`, with the cup; works from pre-filled or self-filled sheets               |
| `agentic-ai-ledger`          | ledger  | as `agentic-ai-grid`, on sheets and the cup (the deck is TASK-168)                            |
| `generation-cutouts`         | cutouts | as `generation-grid`, matching cutouts picked at random                                       |
| `same-algorithm`             | all     | grid tallies, ledger marks, counters, cutouts and numbers are one model                       |
| `overview`                   | ---     | you can run the same next-word loop Claude or ChatGPT runs, by hand                           |
| `making-things-up`           | ---     | a model that only knows what comes next can say fluent things that aren't true                |
| `real-models`                | ---     | what your grid shares with Claude or ChatGPT, and what it doesn't                             |

`same-algorithm` carries what crosses formats: the morph from tallies to marks
to counters to cutouts to numbers, and a walk that switches forms (the cup for
the full stop, the die for _it_, the slips for _the_). Chained under one cold
open, it and one format's how-it-works videos (without their hand-offs) make the
long cut.

## One example

The worked example throughout is _The magpie_ (`data/originals/the-magpie.txt`:
133 tokens, 24 words), the ledger lesson's walkthrough book. It is small enough
to draw as a whole grid and rich enough to have real choices (the row for _the_
is fence 6, magpie 5, postie 4, dog 4).

The ledger lesson can generate from finished sheets before it trains, so
`generation-ledger` never assumes the room did the counting, and there is no
separate pre-trained ledger video. `pretrained-generation-grid` is the booklet:
someone else's counts from a much bigger text, stored as thresholds.

## Framing

Phase 2 may put a portrait talking-head beside the animation. Beats that could
sit next to one (the tree, for instance, which compresses horizontally without
losing its reads) are laid out to survive trimming to a squarer frame on the
left; which beats get the squarer frame is decided per beat at the storyboard.

## Deck alignment

Each how-it-works video covers a contiguous run of its deck partial's
explanation slides (from the section title up to its "Your turn"), and says
which run in its **Builds on** line, so a deck variant can later swap the run
for the embedded video.

## Scripts

`scripts/<slug>.md`, in the format of `../scripts/`. Each beyond-the-slides beat
carries a `_Beyond:_` line naming the read it makes clearer than the slides can;
`voice.py` skips it with the `_Visual` and `_Reads` paragraphs. The tools take
the nested slug (`voice.py scratch beyond/training-grid`,
`video.py render beyond/training-grid`), and renders go under
`out/video/beyond/<slug>/` and the bucket's `video/beyond/<slug>/`.
