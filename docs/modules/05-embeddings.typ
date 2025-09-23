#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Word Embeddings],
  socy_logo: true,
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

For this algorithm you'll need two grids: your original bigram model grid and a
new _embedding distance_ grid (with the same words as row/column headers, but
otherwise blank to start with).

The numbers in each word's full row in the bigram model grid (including blanks
as 0) are its _embedding vector_.

+ for the first row and second row in the bigram model, add up the total of the
  absolute differences between all the cells in the two rows, and write it in
  the empty cell in the embedding distance grid corresponding to those two words
+ fill out the embedding distance grid by repeating step 1 for all different
  pairs of rows in the bigram model grid

You can immediately put 0 in all the "main diagonal" cells of the embedding
distance grid, because the distance between a word and itself is always 0.
Similarly, you will only need to do the calculation for the "top triangle" of
the embedding distance grid, because the "bottom triangle" will be the mirror
image due to the symmetry of the distance calculation

== Example

Original text: _"See Spot run. Run, Spot, run."_

Tokenised: `see` `spot` `run` `.` `run` `,` `spot` `,` `run` `.`

Word vectors from our enhanced model:

#lm-table(
  (
    [word],
    [dim. 1],
    [dim. 2],
    [dim. 3],
    [dim. 4],
    [dim. 5],
    [dim. 6],
    [dim. 7],
    [dim. 8],
  ),
  (
    ([`see`], [], 1, [], [], [], [], [], []),
    ([`spot`], [], [], 2, [], [], [], 1, []),
    ([`run`], [], [], [], 2, [], [], [], 2),
  ),
)
Distance between `see` and `spot`:

|0-0| + |1-0| + |0-2| + |0-0| + |0-0| + |0-0| + |0-1| + |0-0| = 4

Distance between `spot` and `run`:

|0-0| + |0-0| + |2-0| + |0-2| + |0-0| + |0-0| + |1-0| + |0-2| = 7

The smaller value (4 vs 7) indicates that `see` and `spot` are closer (more
similar) than `spot` and `run`.
