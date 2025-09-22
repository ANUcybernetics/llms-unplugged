---
title: "Word Embeddings"
socy_logo: true
prereqs: ["04-context-columns.md"]
---

Transform words into numerical vectors using their patterns from your language
model.

## You will need

- your completed model with context columns
- ruler for measuring distances (optional)
- paper for plotting word vectors

## Key idea

Language models create mathematical representations of words that capture
meaning through usage patterns. Each word's row in your model is its
embedding under that model---a numerical fingerprint that captures meaning
through context. Similar words have similar embeddings.

## Algorithm

1. **create word vectors**: use each word's full row (transition counts +
   context columns) as its "embedding"
   - each number becomes one dimension of the vector
   - include both next-word counts and context signals
2. **calculate word similarity**:
   - use the "Manhattan distance": sum of absolute differences
   - smaller distances means words are (more) similar
   - distance reveals grammatical and semantic relationships
3. **explore relationships**:
   - find closest word pairs
   - group words by similarity
   - discover emergent categories

## Example

Original text: _"See Spot run. Run, Spot, run."_

Tokenised: `see` `spot` `run` `.` `run` `,` `spot` `,` `run` `.`

Word vectors from our enhanced model:

| word   | dim. 1 | dim. 2 | dim. 3 | dim. 4 | dim. 5 | dim. 6 | dim. 7 | dim. 8 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| `see`  | 0      | 1      | 0      | 0      | 0      | 0      | 0      | 0      |
| `spot` | 0      | 0      | 2      | 0      | 0      | 0      | 1      | 0      |
| `run`  | 0      | 0      | 0      | 2      | 0      | 0      | 0      | 2      |

Distance between `see` and `spot`:

|0-0| + |1-0| + |0-2| + |0-0| + |0-0| + |0-0| + |0-1| + |0-0| = 4

Distance between `spot` and `run`:

|0-0| + |0-0| + |2-0| + |0-2| + |0-0| + |0-0| + |1-0| + |0-2| = 7

The smaller value (4 vs 7) indicates that `see` and `spot` are closer (more
similar) than `spot` and `run`.
