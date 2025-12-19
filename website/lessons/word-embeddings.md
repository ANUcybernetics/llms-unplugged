---
title: Word Embeddings
description:
  Turn each word's row into a vector and measure similarities between words in
  your model.
order: 7
topic: how-models-understand
keyIdea:
  A word's row in the grid is its embedding; distances between rows reveal
  grammatical and semantic closeness.
---

# Word Embeddings

::: info Lesson Info

This lesson is part of the
[How Models Understand](/topics/how-models-understand) topic, with instructions
for students (including examples) and [instructor notes](#instructor-notes).

:::

Transform words into numerical vectors that capture meaning, revealing semantic
relationships between words in your model.

![Hero image: Word Embeddings](/assets/images/hero-word-embeddings.avif)

<Prerequisites />

## You will need

- your completed bigram grid (context columns optional but helpful)
- another blank grid with the same headers (for distances)
- pen, paper, and dice as per _Grid Generation_

## Your goal

Create a similarity matrix (another square grid) that shows how similar or
different each pair of words is. Stretch goal: visualise the matrix (e.g., as a
map or clustering).

## Key idea

Each row of counts is an embedding---a numeric fingerprint of context. Comparing
rows tells you which words behave alike.

## Algorithm

1. Prepare two grids: the original bigram model and a new empty _distance_ grid
   with the same row/column headers.
2. For every pair of rows in the bigram model, sum the absolute differences
   between matching cells.
3. Write that sum into the corresponding cell of the distance grid (diagonal
   stays 0). You can skip the lower triangle since the distance is symmetric.

## Example

Text: `See Spot. Spot runs.`

1. Build the bigram grid as usual.
2. Compare `see` vs `spot` row by row: subtract counts cell-by-cell, take
   absolute values, and add them up (blanks count as 0). Here,
   `d(see, spot) = 3`.
3. Fill that value into the distance grid at (`see`, `spot`). Repeat for other
   pairs.

You'll find `see` and `.` can end up very similar (distance 0) while `see` and
`spot` differ more, revealing structure in your corpus.

## Instructor notes

### Discussion questions

- which words cluster together? why?
- do grammatically similar words have similar embeddings?
- can you predict which words will be close before calculating?
- how do context columns affect word similarity?
- what information is captured in these vectors?

### Connection to current LLMs

Word embeddings revolutionised NLP by turning words into numbers that computers
can process:

- **dimensions**: your (e.g.) 8-dimensional vectors → modern models use hundreds
  or thousands of dimensions
- **learning**: you used occurrence patterns → modern models learn from billions
  of contexts
- **semantic capture**: state-of-the-art embeddings encode meaning so well that
  "`king` - `man` + `woman` ≈ `queen`" actually works
- **foundation**: every modern language model starts by converting words to
  embeddings

The insight: words with similar meanings appear in similar contexts, so their
usage patterns (and thus embeddings) are similar. Your hand-calculated vectors
demonstrate this principle: `cat` and `dog` would have similar embeddings
because they both follow `the` and precede `ran` or `sat`. This discovery
enabled computers to "understand" that words have relationships and meanings
beyond just their spelling.

Note on the activity: while the lesson focuses on calculating distances between
embeddings (the similarity matrix), this is pedagogically deliberate. Embeddings
themselves are just rows of numbers, but distances reveal the relationships
between words---which is what makes embeddings useful in practice. The activity
emphasises the practical application of embeddings rather than just their
construction.
