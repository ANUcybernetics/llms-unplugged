#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Trigram Model",
  "images/CYBERNETICS_A_027.jpg",
)[
  Extend the bigram model to consider _two_ words of context instead of one,
  leading to better text generation.

  == You will need

  - same as _Basic Training_ module
  - additional paper for the three-column model
  - pen, paper & dice as per _Basic Inference_

  == Your goal

  To train a trigram language model (a table this time, not a grid like your
  bigram model from _Basic Training_) and use it to generate text. *Stretch
    goal*: train on more data, or generate more text.

  == Key idea

  More context leads to better predictions. A trigram model considers two
  previous words instead of one, demonstrating the trade-off between context
  length and data requirements that shapes all language models.
]

// Training section in two columns
#columns(2, gutter: 1em)[
  == Algorithm (training)

  + *create a four-column table* (see example on right)
  + *extract all word triples*: for each (overlapping) _word 1_/_word 2_/_word
      3_ "triple" in your text increment the _count_ column for that triple, or
    create a new row if it's a triple you've never seen before and set the count
    to 1 (note: row order doesn't matter)

  == Example (training)

  After the first four words (`see` `spot` `run` `.`) the model is:

  #lm-table(
    ([Word1], [Word2], [Word3], [Count]),
    (
      ([`see`], [`spot`], [`run`], 1),
      ([`spot`], [`run`], [`.`], 1),
    ),
  )

  #colbreak()

  After the full text (`see` `spot` `run` `.` `see` `spot` `jump` `.`) the model
  is:

  #lm-table(
    ([Word1], [Word2], [Word3], [Count]),
    (
      ([`see`], [`spot`], [`run`], 1),
      ([`spot`], [`run`], [`.`], 1),
      ([`run`], [`.`], [`see`], 1),
      ([`.`], [`see`], [`spot`], 1),
      ([`see`], [`spot`], [`jump`], 1),
      ([`spot`], [`jump`], [`.`], 1),
    ),
  )
]

Note: the order of the rows doesn't matter, so you can re-order to group them by
_word 1_ if that helps.

// Gold horizontal rule
#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))

// Inference section in two columns
#columns(2, gutter: 1em)[
  == Algorithm (inference)

  + pick any row from your table; write down _word 1_ and _word 2_ as your
    starting words
  + find *all rows* where _word 1_ and _word 2_ are exact matches for your two
    starting words, and make note of their _count_ columns
  + as per _Basic Inference_ roll a d20 weighted by the counts and select the
    _word 3_ associated with the chosen row
  + move along by _one_ word (so _word 2_ becomes your new _word 1_ and _word 3_
    becomes your new _word 2_) and repeat from step 2

  #colbreak()

  == Example (inference)

  + from the table above, choose `see` (_word 1_) and `spot` (_word 2_) as your
    starting words
  + find all rows with _word 1_ = `see` and _word 2_ = `spot`; in this case rows
    1 and 5 (both have _count_ == 1)
  + roll a d20 and write down the _word 3_ from the row chosen by the dice roll
  + move along by _one_ word (so _word 1_ is `spot` and _word 2_ is either `run`
    or `jump` depending on your dice roll) and repeat from step 2
]
