---
title: Context Columns Generation
description:
  Generate text using your context-enhanced bigram model by combining word and
  context counts.
order: 7
topic: how-models-understand
keyIdea:
  When generating, combine word-specific counts with context column counts for
  richer probability distributions.
dependsOn:
  - Context Columns Training
  - Basic Generation
---

# Context Columns Generation

::: info Lesson Info

This lesson is part of the
[How Models Understand](/topics/how-models-understand) topic, with instructions
for students (including examples) and [instructor notes](#instructor-notes). If
you'd like a printable version of the student handout,
[download it here](/assets/pdfs/context-columns.pdf).

:::

Use your context-enhanced bigram model to generate text with improved variety
and grammatical coherence.

![Hero image: Context Columns](/assets/images/hero-context-columns.jpg)

<Prerequisites />

## You will need

- your context-enhanced bigram model from _Context Columns Training_
- pen, paper, and dice as per _Basic Generation_

## Your goal

Generate text from your context-aware model. Compare the output to text
generated from a plain bigram model. Stretch goal: design your own context
columns and observe how they change generation.

## Key idea

During generation, you don't just look at the current word's row---you also add
in counts from the relevant context column. This gives words that commonly
follow verbs, pronouns, or prepositions a boost when appropriate.

## Algorithm

1. **Choose a starting word** from your model.
2. **Look up the word's row** to find possible next words and their counts.
3. **Check if the current word has a context type**:
   - if it's a verb, add the `after verb` column counts to each candidate
   - if it's a pronoun, add the `after pronoun` column counts
   - if it's a preposition, add the `after preposition` column counts
4. **Roll dice** on the combined counts (word-specific + context) to sample the
   next word.
5. **Repeat** from step 2 until you reach a stopping point or desired length.

## Example

Suppose your current word is `runs` (a verb), and you want to pick the next
word.

From the `runs` row, you might have:

- `to`: 2
- `quickly`: 1
- `.`: 1

From the `after verb` column, you might have:

- `to`: 5
- `quickly`: 3
- `.`: 2
- `the`: 1

Combined counts for sampling:

- `to`: 2 + 5 = 7
- `quickly`: 1 + 3 = 4
- `.`: 1 + 2 = 3
- `the`: 0 + 1 = 1

Total: 15. Roll your dice accordingly (e.g., 1-7 = `to`, 8-11 = `quickly`, 12-14
= `.`, 15 = `the`).

Notice how the context column boosts options that commonly follow _any_ verb,
not just `runs` specifically. This helps the model generalise.

## When multiple contexts apply

Some words might fit multiple categories. For simplicity, pick the most
prominent category, or add counts from all applicable columns. Experiment to see
what produces better text.

## Comparing outputs

Generate text using:

1. **Plain bigram**: only word-to-word counts
2. **Context-enhanced**: word counts plus context columns

Notice differences in:

- variety (does context-enhanced text repeat less?)
- grammatical flow (do sentences feel more natural?)
- unexpected word choices (do context columns introduce new possibilities?)

## Instructor notes

### Discussion questions

- how do context columns reduce repetition in generated text?
- what happens when a word has high counts in its row but the context column
  suggests different patterns?
- are grammatical contexts (verb→object, pronoun→verb) more reliable than
  word-specific transitions?
- could you design "negative" context columns that _reduce_ certain
  probabilities?

### Connection to current LLMs

This generation process mirrors how attention works in transformers:

- **context aggregation**: you manually combine word counts with context counts;
  transformers compute weighted sums across all previous positions
- **dynamic attention**: your context is fixed (verb/pronoun/preposition);
  transformers learn different attention patterns for each word
- **the innovation**: instead of pre-defining important contexts, transformers
  learn which previous words to "attend to" for each prediction

When a model predicts the next word after "The capital of France is", it
automatically learns to attend strongly to "capital" and "France" while ignoring
less relevant words. Your grammatical context columns do this manually for broad
categories, while modern AI discovers these patterns---and many more---through
learning.
