---
title: Trigram Model
description:
  Extend the bigram model to use two words of context for better predictions.
order: 5
topic: scaling-up
pdf: /assets/pdfs/05-trigram.pdf
keyIdea:
  More context improves predictions—trigrams track two previous words, trading
  simplicity for richer patterns.
dependsOn:
  - Basic Training
  - Basic Generation
hero: /assets/images/workshop-5.jpg
templateEngineOverride: njk,md
---

# Trigram Model

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Extend the bigram model to consider two words of context instead of one, leading
to better generation.

{% if hero %} ![Participants comparing two grids side by side]({{ hero }})
{% endif %}

## You will need

- the same materials as _Basic Training_
- extra paper for a three-column table
- pen, paper, and dice as per _Basic Generation_

## Your goal

Train a trigram language model (a table, not a grid) and use it to generate
text. Stretch goal: train on more data or generate longer outputs.

## Key idea

Trigrams show how more context boosts prediction quality. They also reveal the
cost: more rows to track and more data needed.

## Algorithm (training)

1. Draw a four-column table: `word1 | word2 | word3 | count`.
2. Slide a window over your text, collecting every overlapping triple of words.
3. For each triple, increment its count (or add a new row starting at 1).

### Example (training)

After the first four words (`see` `spot` `run` `.`) the model is:

{% lmTable ["word 1", "word 2", "word 3", "count"], [["`see`", "`spot`", "`run`", 1], ["`spot`", "`run`", "`.`", 1]] %}

After the full text (`see` `spot` `run` `.` `see` `spot` `jump` `.`) the model
is:

{% lmTable ["word 1", "word 2", "word 3", "count"], [["`see`", "`spot`", "`run`", 1], ["`spot`", "`run`", "`.`", 1], ["`run`", "`.`", "`see`", 1], ["`.`", "`see`", "`spot`", 1], ["`see`", "`spot`", "`jump`", 1], ["`spot`", "`jump`", "`.`", 1]] %}

Note: the order of the rows doesn't matter, so you can re-order to group them by
_word 1_ if that helps.

## Algorithm (generation)

1. Pick any row and write down `word1` and `word2` as your starting words.
2. Find all rows where `word1` and `word2` match your current context; note
   their counts.
3. Roll weighted by those counts to pick a row; take its `word3` as the next
   word.
4. Shift the window by one word (new context is old `word2` + chosen `word3`)
   and repeat from step 2.

This mirrors Basic Generation but with two-word context instead of one.
