---
title: "Word Embeddings"
socy_logo: true
prereqs: ["04-context-columns.md"]
---

## Description

Transform words into numerical vectors using their behavioural patterns from
your matrix. This activity demonstrates how language models create mathematical
representations of words that capture meaning through usage patterns---a
foundational concept in modern NLP.

## Materials

- your completed matrix with context columns
- ruler for measuring distances (optional)
- paper for plotting word vectors

## Core concepts

Words become numbers through their usage patterns. Each word's row in your
matrix is its embedding---a numerical fingerprint that captures meaning through
context. Similar words have similar embeddings.

## Activity steps

1. **create word vectors**: Use each word's full row (transition counts +
   context columns) as its "embedding"
   - each number becomes one dimension of the vector
   - include both next-word counts and context signals
2. **calculate word similarity**:
   - use Manhattan distance: sum of absolute differences
   - smaller distances means words are (more) similar
   - distance reveals grammatical and semantic relationships
3. **explore relationships**:
   - find closest word pairs
   - group words by similarity
   - discover emergent categories

## Example

Original text: _"See Spot run. Run, Spot, run."_

Tokenised: `see` `spot` `run` `.` `run` `,` `spot` `,` `run` `.`

Word vectors from our enhanced matrix:

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

## Discussion questions

- which words cluster together? why?
- do grammatically similar words have similar embeddings?
- can you predict which words will be close before calculating?
- how do context columns affect word similarity?
- what information is captured in these vectors?

## Activity variations

### Word clustering

- calculate all pairwise distances
- create a similarity matrix
- group words with distance < 3
- name the emergent categories

### Mystery word game

- facilitator provides an embedding vector
- participants deduce the word from its pattern
- "This word appears twice after commas..."

### Synonym search

- find word pairs with smallest distances
- are they actually synonyms or just grammatically similar?
- discuss the difference between syntactic and semantic similarity

### Vector arithmetic (advanced)

- add two word vectors together
- find the closest word to the result
- does `spot` + `run` ≈ something meaningful?

## Connection to modern LLMs

Word embeddings revolutionised NLP by turning words into numbers that computers
can process:

- **dimensions**: your 8D vectors → GPT uses 768--1536 dimensions
- **learning**: you used occurrence patterns → modern models learn from billions
  of contexts
- **semantic capture**: industrial embeddings encode meaning so well that
  "`king` - `man` + `woman` ≈ `queen`" actually works
- **foundation**: every modern language model starts by converting words to
  embeddings

The breakthrough insight: words with similar meanings appear in similar
contexts, so their usage patterns (and thus embeddings) are similar. Your
hand-calculated vectors demonstrate this principle: `cat` and `dog` would have
similar embeddings because they both follow `the` and precede `ran` or `sat`.
This discovery enabled computers to finally "understand" that words have
relationships and meanings beyond just their spelling.
