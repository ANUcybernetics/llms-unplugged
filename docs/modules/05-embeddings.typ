#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

// Place image on left side of first page, under the golden rule and logos
#place(
  top + left,
  dx: -2.5cm,
  dy: -2.5cm,
  box(
    width: 11.9cm,
    height: 26cm,
    clip: true,
    image("images/CYBERNETICS_A_061.jpg", width: 100%, height: 100%, fit: "cover"),
  ),
)

// Create a two-column layout for the first page
#grid(
  columns: (11.9cm - 2.5cm, auto),
  column-gutter: 1cm,
  [],  // Empty left column where the image is
  [
    = Word Embeddings
    _"My First LM Module #5"_

    Transform words into numerical vectors using their patterns from your language
    model.

  == You will need

  - your completed bigram model grid (including context columns if you have
    them)
  - another empty grid (same size as your bigram model)

  == Your goal

  To create a similarity matrix (another square grid) which captures how similar
  (or different) all the words in your bigram model are.

  == Key idea

    Language models create mathematical representations of words that capture
    meaning through usage patterns. Each word's row in your model is its embedding
    under that model---a numerical fingerprint that captures meaning through
    context. Distances between words real grammatical and semantic relationships.
    Similar words have similar embeddings.
  ],
)

#pagebreak()

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

  You can immediately put 0 in all the "main diagonal" cells of the embedding
  distance grid, because the distance between a word and itself is always 0.
  Similarly, you will only need to do the calculation for the "top triangle" of
  the embedding distance grid, because the "bottom triangle" will be a mirror
  image due to the symmetry of the distance calculation

  == Example

  Original text: _"See Spot. Spot runs."_

  Prepared text: `see` `spot` `.` `spot` `runs` `.`

  Bigram model grid:

  #lm-grid-auto(("see", "spot", ".", "spot", "runs", "."))

  Each row is that word's embedding vector (using 0 for blank cells):
  - `see`: [0, 1, 0, 0]
  - `spot`: [0, 0, 1, 1]
  - `.`: [0, 1, 0, 0]
  - `runs`: [0, 0, 1, 0]

  Calculating distance between the first two rows (`see` and `spot`):

  $|0-0| + |1-0| + |0-1| + |0-1| = 0 + 1 + 1 + 1 = 3$

  Put this distance in the embedding distance grid (note diagonals are already
  pre-filled with 0 as well):

  #table(
    columns: 5,
    [], [`see`], [`spot`], [`.`], [`runs`],
    [`see`], [0], [3], [], [],
    [`spot`], [], [0], [], [],
    [`.`], [], [], [0], [],
    [`runs`], [], [], [], [0],
  )

  Complete embedding distance grid (no need to fill out the bottom triangle):

  #table(
    columns: 5,
    [], [`see`], [`spot`], [`.`], [`runs`],
    [`see`], [0], [3], [0], [2],
    [`spot`], [], [0], [3], [2],
    [`.`], [], [], [0], [2],
    [`runs`], [], [], [], [0],
  )

  The distances show that `see` and `.` have identical embeddings (distance =
  0), while `see` and `spot` are quite different (distance = 3).
]
