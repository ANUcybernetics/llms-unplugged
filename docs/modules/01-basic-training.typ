#import "utils.typ": *

#show: module-doc.with(title: [Basic Training], subtitle: "My First LM Module #1")

Build a bigram (word co-occurence) language model that tracks which words follow
which other words in text.

== You will need

- a short text (e.g. a few pages from a kids book, but can be anything)
- grid paper (for tracking word patterns)
- pen and pencil

== Key idea

Language models learn by counting patterns in text. "Training" means
building/constructing a model (shown in this activity as a grid or table) that
tracks which words follow other words.

== Algorithm

+ *prepare your text*:

  - convert everything to lowercase
  - treat words, commas and full stops as separate "words" (ignore other
    punctuation)

+ *set up your grid*:

  - take the first word from your text
  - write it in both the first row header and first column header of your grid

+ *fill in the grid* one _word pair_ at a time:
  - find the row for the first word and the column for the second word
  - add a tally mark in that cell (if the word isn't in the grid yet, add a new
    row _and_ column for it)
  - shift along by one word (so the second word becomes your "first" word)
  - repeat until you've gone through the entire text

== Example

Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
  jump."_

Prepared text: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,` `spot`
`,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

After the first two words (`see` `spot`) the model is:

#lm-grid-auto(("see", "spot"), nrows: 6, ncols: 7)

After the full text the model is:

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
