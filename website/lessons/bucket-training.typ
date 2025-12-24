// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "/typst/utils.typ": *

// Apply base styling
#show: lesson-setup

#lesson-hero(
  "Training (bucket version)",
  "/typst/images/CYBERNETICS_A_038.jpg",
  url: "https://www.llmsunplugged.org/lessons/training",
)[
  Build a bigram language model using physical tokens and buckets to track which
  words follow which other words.

  == You will need

  - some text (e.g. a few pages from a kids book) printed or handwritten on
    paper (big enough that you can cut it into individual words)
  - several containers (buckets are great, but could also cups, bowls,
    envelopes, or labelled areas on a table)
  - scissors, pen and sticky notes or paper for bucket labels

  == Your goal

  To produce a collection of labelled buckets containing tokens from your text.
  *Stretch goal*: keep training your model on more input text.

  == Key idea

  Language models learn by counting patterns in text. "Training" means building
  a model that tracks which words follow other words. In this version, the
  "following" relationship is captured physically---each bucket contains the
  tokens that appeared after its label in the original text.
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *prepare your tokens*:

    - print or write out your training text on paper
    - use scissors to cut the text into individual words (called "tokens");
      commas & full stops into separate pieces as well (and disregard all other
      punctuation)... but *keep them in order*

  + *build the model* one token at a time, starting with the first:
    - if this token doesn't have a bucket yet, create one and label it with this
      word
    - take the _next_ token from your pile and put it _into_ the current token's
      bucket
    - now apply the same process to that next token (create its bucket if
      needed)
    - repeat until all tokens are in buckets

  == Example

  Original text: _"See Spot run. See Spot jump."_

  Prepared tokens: `see` `spot` `run` `.` `see` `spot` `jump` `.`

  #colbreak()

  After processing the first two tokens (`see` `spot`):

  #table(
    columns: 2,
    align: left,
    table.header([*Bucket*], [*Tokens inside*]),
    [`see`], [`spot`],
  )

  After all tokens have been processed:

  #table(
    columns: 2,
    align: left,
    table.header([*Bucket*], [*Tokens inside*]),
    [`see`], [`spot` `spot`],
    [`spot`], [`run` `jump`],
    [`run`], [`.`],
    [`.`], [`see`],
    [`jump`], [`.`],
  )

  Notice that the "see" bucket contains two `spot` tokens because "spot"
  followed "see" twice in the original text. This captures the same information
  as a grid with tally marks, but in a physical form you can touch and
  manipulate.
]
