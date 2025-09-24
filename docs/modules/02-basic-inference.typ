#import "utils.typ": *

#show: module-doc.with(title: [Basic Inference])

Use a pre-trained model to generate new text through weighted random sampling.

== You will need

- your completed model (i.e. the word co-occurence grid) from _Basic Training_
- d20 (or similar) for weighted sampling
- paper for writing down the generated "output text"

== Key idea

Language models generate text by predicting one word at a time based on learnt
patterns. Your trained model provides the "next word" options and their
probabilities; dice rolls provide the randomness to choose one of those options.

== Algorithm

+ *choose a starting word*---pick any word from the first column of your grid
+ *look at that word's row* to identify all possible next words and their counts
+ *roll dice weighted by the counts* (see the _Weighted Random Sampling_ module)
+ *write down the chosen word* and use that as your next starting word
+ *repeat* from step 2 until you reach the desired length _or_ a natural
  stopping point (e.g. a full stop `.`)

You can *try different starting words* to see how it affects the output.

== Example

Here's a pre-trained language model grid:

#lm-grid-auto((
  "see",
  "spot",
  "run",
  ".",
  "see",
  "spot",
  "jump",
  ".",
  "run",
  ",",
  "spot",
  ",",
  "run",
  ".",
  "jump",
  ",",
  "spot",
  ",",
  "jump",
  ".",
))

To generate the next word after `see`:

- `see` (row) → `spot` (column); it's the only option, so write down `spot` as
  next word
- `spot` → `run` or `jump`; both have 2 occurrences, so each has a 50%
  chance---roll dice to choose
- let's say dice picks `jump`; write it down
- `jump` → `.`; it's the only option, so write down `.`
- `.` → `see` (50%), `run` (25%), or `jump` (25%); three possible choices for
  next word
- let's say dice picks `see`; write it down
- `see` → `spot`; it's the only option, so write down `spot`

After the above steps, the full output text is _"see spot jump. see spot"_
