# Beyond the slides

The second LLMs Unplugged video series (TASK-167), alongside the eight in
`../README.md`, which stay as they are. The scripts aren't bound to the slides:
they refer to the same slides and printed artefacts, but they can use
explanations a slide can't carry: continuous morphs between representations,
many-sample simulations and real corpus data at scale. Everything in
`../README.md` on tone, production phases, captions, format and visuals applies
here unless this file says otherwise; `../STYLE.md` holds the look.

## Series

| Slug                    | Kind         | Key idea (draft)                                                                              | Endings               |
| ----------------------- | ------------ | --------------------------------------------------------------------------------------------- | --------------------- |
| `training`              | how it works | a language model learns by counting which word follows which, and the counts are all it keeps | grid, ledger          |
| `generation`            | how it works | text is written one word at a time, each picked in proportion to the counts                   | grid, ledger, cutouts |
| `pretrained-generation` | how it works | you can generate from a model someone else trained; a booklet is a grid stored another way    | booklet               |
| `agentic-ai`            | how it works | a tool call is a token the model samples like any other; the harness does the rest            | grid                  |
| `overview`              | backstory    | you can run the same next-word loop Claude or ChatGPT runs, by hand                           | ---                   |
| `making-things-up`      | backstory    | a model that only knows what comes next can say fluent things that aren't true                | ---                   |
| `real-models`           | backstory    | what your grid shares with Claude or ChatGPT, and what it doesn't                             | ---                   |

The four how-it-works videos are one argument in four parts. Each stands alone,
but they share one example and their morphs call back to each other, so chained
under one cold open (without their endings) they make a long cut.

## One example, every format

The worked example throughout is _The magpie_ (`data/originals/the-magpie.txt`:
133 tokens, 24 words), the ledger lesson's walkthrough book. It is small enough
to draw as a whole grid and rich enough to have real choices (the row for _the_
is fence 6, magpie 5, postie 4, dog 4).

Grid tallies, ledger marks, counters in the cup, faces of the d10 and cutout
slips all hold the same numbers: how often one word followed another. So each
video explains the mechanism in whichever form reads best, and only its ending,
the hand-off to the activity, belongs to one format. An ending is a composition
parameter (like the Overview's aspect), one render per format.

The ledger lesson generates from finished sheets before it trains, so
`generation` never assumes the viewer did the counting, and in that lesson it
plays before `training`. `pretrained-generation` is the booklet: someone else's
counts from a much bigger text, stored as thresholds.

## Deck alignment

Each how-it-works video covers a contiguous run of a deck partial's explanation
slides (from the section title up to its "Your turn"), and says which run in its
**Builds on** line. That's so a deck variant can later swap the run for the
embedded video, playing the ending that matches the deck's format.

## Scripts

`scripts/<slug>.md`, in the format of `../scripts/`, plus a
`### Ending: <format>` section per format after the script. Each
beyond-the-slides beat carries a `_Beyond:_` line naming the read it makes
clearer than the slides can. Before these are built, `voice.py` has to learn to
skip `_Beyond` paragraphs and to voice one ending per render.
