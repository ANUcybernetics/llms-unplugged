---
title: Context Columns
description:
  Add simple attention-like context columns to your bigram grid to capture
  grammatical cues.
order: 6
topic: how-models-understand
pdf: /assets/pdfs/06-context-columns.pdf
keyIdea:
  Extra context columns let the model weight words differently after verbs,
  pronouns, or prepositions.
dependsOn:
  - Basic Training
  - Basic Generation
hero: /assets/images/sxsw-2.jpg
templateEngineOverride: njk,md
---

# Context Columns

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Enhance the bigram model with context columns that capture grammatical and
semantic patterns.

{% if hero %} ![Hands rolling dice over a worksheet]({{ hero }}) {% endif %}

## You will need

- your completed bigram model from _Basic Training_
- pen, paper, and dice as per _Basic Generation_

## Your goal

Add new context columns to your bigram model and generate text from this
context-aware version. Stretch goal: invent and test your own context columns.

## Key idea

Attention focuses on relevant context. Adding columns like _after verb_, _after
pronoun_, and _after preposition_ gives the model richer cues about what should
come next.

## Algorithm (training)

1. Add three columns to your grid: `after verb`, `after pronoun`,
   `after preposition`.
2. Train as usual: update the word→word cell for each observed pair.
3. Also update the matching context column when the first word is:
   - a verb → increment `after verb` for the second word
   - a pronoun → increment `after pronoun`
   - a preposition → increment `after preposition`

You update two cells per pair: the normal transition count and one context
column (if applicable).

## Algorithm (generation)

1. Choose a starting word.
2. Read its row as usual, but if the word is a verb/pronoun/preposition, add the
   relevant context-column counts before sampling.
3. Roll dice on the combined counts, pick the next word, and repeat until you
   stop naturally or reach your target length.

You can add your own context columns for patterns you care about, then include
them in the combined counts when sampling.
