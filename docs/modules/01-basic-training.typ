#import "utils.typ": *

// Apply base styling
#show: module-setup

#module-hero(
  "Basic Training",
  "images/CYBERNETICS_A_009.jpg",
)[
  Build a bigram (word co-occurence) language model that tracks which words
  follow which other words in text.

  == You will need

  - some text (e.g. a few pages from a kids book, but can be anything)
  - pen, pencil and grid paper

  == Your goal

  To produce a grid that captures the patterns in your input text data. This
  grid is your _bigram language model_. *Stretch goal*: keep training your model
  on more input text.

  == Key idea

  Language models learn by counting patterns in text. "Training" means
  building/constructing a model (i.e. filling out the grid) to track which words
  follow other words.
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *preprocess your text*:

    - convert everything to lowercase
    - treat words, commas and full stops as separate "words" (and ignore other
      punctuation and whitespace)

  + *set up your grid*:

    - take the first word from your text
    - write it in both the first row header and first column header of your grid

  + *fill in the grid* one _word pair_ at a time:
    - find the row for the first word and the column for the second word
    - add a tally mark in that cell (if the word isn't in the grid yet, add a
      new row _and_ column for it)
    - shift along by one word (so the second word becomes your "first" word)
    - repeat until you've gone through the entire text

  == Example

  Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
    jump."_

  Preprocessed text: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,`
  `spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

  #colbreak()

  After the first two words (`see` `spot`) the model looks like:

  #lm-grid-auto(("see", "spot"), nrows: 6, ncols: 7)

  After the full text the model looks like:

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
]
