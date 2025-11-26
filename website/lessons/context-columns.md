---
title: Context Columns
description:
  Add simple attention-like context columns to your bigram grid to capture
  grammatical cues.
order: 6
topic: how-models-understand
keyIdea:
  Extra context columns let the model weight words differently after verbs,
  pronouns, or prepositions.
dependsOn:
  - Basic Training
  - Basic Generation
---

# Context Columns

::: info Lesson Info This lesson is part of the
[How Models Understand](/topics/how-models-understand) topic, with instructions
for students (including examples) and [instructor notes](#instructor-notes). If
you'd like a printable version of the student handout,
[download it here](/assets/pdfs/context-columns.pdf). :::

Enhance the bigram model with context columns that capture grammatical and
semantic patterns.

![Hero image: Context Columns](/assets/images/hero-context-columns.jpg)

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

## Instructor notes

### Discussion questions

- which context columns are most useful for your text?
- can you think of other helpful context patterns?
- how do context columns reduce repetition in generated text?
- what happens when multiple contexts apply at once?
- are grammatical contexts (verb→object, pronoun→verb) more reliable than
  word-specific ones (`word_a`→`word_b`)?

### Connection to current LLMs

Your hand-crafted context columns are what the "attention mechanism" in
transformers learns automatically:

- **manual vs learnt**: you chose 3 grammatical contexts; transformers learn
  hundreds of attention patterns
- **fixed vs dynamic**: your contexts are the same for all words; transformers
  adapt attention per word
- **the innovation**: instead of pre-defining important contexts, transformers
  learn which previous words to "attend to" for each prediction

This is why it's called "attention"—the model learns to pay attention to
relevant context. When a model predicts the next word after "The capital of
France is", it automatically learns to attend strongly to "capital" and "France"
while ignoring less relevant words. Your grammatical context columns
(verb→object, pronoun→verb) do this manually, while modern AI discovers these
patterns—and many more—through learning.
