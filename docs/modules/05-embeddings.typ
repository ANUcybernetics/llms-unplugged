#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Word Embeddings],
  socy_logo: true,
)

Transform words into numerical vectors using their patterns from your language
model.

== You will need

- your completed model with context columns
- ruler for measuring distances (optional)
- paper for plotting word vectors

== Key idea

Language models create mathematical representations of words that capture
meaning through usage patterns. Each word's row in your model is its
embedding under that model---a numerical fingerprint that captures meaning
through context. Similar words have similar embeddings.

== Algorithm

+ *create word vectors*: use each word's full row (transition counts +
   context columns) as its "embedding"
   - each number becomes one dimension of the vector
   - include both next-word counts and context signals
+ *calculate word similarity*:
   - use the "Manhattan distance": sum of absolute differences
   - smaller distances means words are (more) similar
   - distance reveals grammatical and semantic relationships
+ *explore relationships*:
   - find closest word pairs
   - group words by similarity
   - discover emergent categories

== Example

Original text: _"See Spot run. Run, Spot, run."_

Tokenised: `see` `spot` `run` `.` `run` `,` `spot` `,` `run` `.`

Word vectors from our enhanced model:

#table(
  columns: 9,
  stroke: 1pt,
  align: (col, row) => if row == 0 { center } else { left },
  table.header([word],[dim. 1],[dim. 2],[dim. 3],[dim. 4],[dim. 5],[dim. 6],[dim. 7],[dim. 8]),
  [`see`], [], [#tally(1)], [], [], [], [], [], [],
  [`spot`], [], [], [#tally(2)], [], [], [], [#tally(1)], [],
  [`run`], [], [], [], [#tally(2)], [], [], [], [#tally(2)],
)

Distance between `see` and `spot`:

|0-0| + |1-0| + |0-2| + |0-0| + |0-0| + |0-0| + |0-1| + |0-0| = 4

Distance between `spot` and `run`:

|0-0| + |0-0| + |2-0| + |0-2| + |0-0| + |0-0| + |1-0| + |0-2| = 7

The smaller value (4 vs 7) indicates that `see` and `spot` are closer (more
similar) than `spot` and `run`.