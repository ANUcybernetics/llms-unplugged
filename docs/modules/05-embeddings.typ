#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Word Embeddings",
  "images/CYBERNETICS_A_102.jpg",
)[
  Transform words into numerical vectors that capture meaning, revealing the
  semantic relationships between words in your model.

  == You will need

  - your completed bigram model grid (including context columns if you have
    them)
  - another empty grid (same size as your bigram model)
  - pen, paper & dice as per _Basic Inference_

  == Your goal

  To create a similarity matrix (another square grid) which captures how similar
  (or different) all the words in your bigram model are. *Stretch goal*: create
  a visual representation of this similarity matrix.

  == Key idea

  Each word's row in your model is its embedding under that model---a numerical
  fingerprint that captures meaning through context. Distances between words
  real grammatical and semantic relationships. Similar words have similar
  embeddings.
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  For this algorithm you'll need two grids: your original _bigram model_ grid
  and a new _embedding distance_ grid (with the same words as row/column
  headers, but otherwise blank to start with).

  + for the first row and second row in the bigram model, add up the total of
    the absolute differences between corresponding cells in the two rows and
    write it in the empty cell for that word pair in the embedding distance grid
  + fill out the embedding distance grid by repeating step 1 for all different
    pairs of rows in the bigram model grid

  == Example

  Original text: _"See Spot. Spot runs."_

  Completed bigram model grid:

  #lm-grid-auto(("see", "spot", ".", "spot", "runs", "."))

  #colbreak()

  The embedding distance between the first two rows (`see` and `spot`) is the
  sum of the absolute differences between corresponding elements (0 for blank
  cells):

  $
    d("see", "spot") & = |0-0| + |1-0| + |0-1| + |0-1| \
                     & = 0 + 1 + 1 + 1 \
                     & = 3
  $

  Put this distance in the embedding distance grid (note diagonals are already
  pre-filled with 0 as well):

  #table(
    columns: (1fr, 1fr, 1fr, 1fr, 1fr),
    [], [`see`], [`spot`], [`.`], [`runs`],
    [`see`], [0], [#text(fill: anu-colors.gold, weight: "bold")[3]], [], [],
    [`spot`], [], [0], [], [],
    [`.`], [], [], [0], [],
    [`runs`], [], [], [], [0],
  )

  Complete embedding distance grid (no need to fill out the bottom
  triangle---the embedding distance is symmetric):

  #table(
    columns: (1fr, 1fr, 1fr, 1fr, 1fr),
    [], [`see`], [`spot`], [`.`], [`runs`],
    [`see`], [0], [3], [0], [2],
    [`spot`], [], [0], [3], [2],
    [`.`], [], [], [0], [2],
    [`runs`], [], [], [], [0],
  )

  The distances show that `see` and `.` have identical embeddings (distance =
  0), while `see` and `spot` are quite different (distance = 3).
]
