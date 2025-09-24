#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#set page(paper: "a4", flipped: true, columns: 2)

#show: anu-template.with(
  title: [Word Embeddings],
  socy_logo: true,
  dark: sys.inputs.at("anu_theme", default: "dark") == "dark",
)

Transform words into numerical vectors using their patterns from your language
model.

== You will need

- your completed bigram model grid (including context columns if you have them)
- more grid paper (for similarity matrix)
- ruler and graph paper for plotting and measuring word vectors (optional)

== Key idea

Language models create mathematical representations of words that capture
meaning through usage patterns. Each word's row in your model is its embedding
under that model---a numerical fingerprint that captures meaning through
context. Distances between words real grammatical and semantic relationships.
Similar words have similar embeddings.

== Algorithm

For this algorithm you'll need two grids: your original _bigram model_ grid and
a new _embedding distance_ grid (with the same words as row/column headers, but
otherwise blank to start with).

+ for the first row and second row in the bigram model, add up the total of the
  absolute differences between corresponding cells in the two rows and write it
  in the empty cell for that word pair in the embedding distance grid
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

The distances show that `see` and `.` have identical embeddings (distance = 0),
while `see` and `spot` are quite different (distance = 3).
