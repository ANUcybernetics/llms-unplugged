---
title: Word Embeddings
description:
  Turn each word’s row into a vector and measure similarities between words in
  your model.
order: 7
topic: how-models-understand
pdf: /assets/pdfs/07-embeddings.pdf
keyIdea:
  A word’s row in the grid is its embedding; distances between rows reveal
  grammatical and semantic closeness.
dependsOn:
  - Basic Training
  - Context Columns
hero: /assets/images/workshop-1.jpg
templateEngineOverride: njk,md
---

# Word Embeddings

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Transform words into numerical vectors that capture meaning, revealing semantic
relationships between words in your model.

{% if hero %} ![Workshop participant comparing counts across a grid]({{ hero }})
{% endif %}

## You will need

- your completed bigram grid (context columns optional but helpful)
- another blank grid with the same headers (for distances)
- pen, paper, and dice as per _Basic Generation_

## Your goal

Create a similarity matrix (another square grid) that shows how similar or
different each pair of words is. Stretch goal: visualise the matrix (e.g., as a
map or clustering).

## Key idea

Each row of counts is an embedding—a numeric fingerprint of context. Comparing
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

You’ll find `see` and `.` can end up very similar (distance 0) while `see` and
`spot` differ more, revealing structure in your corpus.
