---
title: Context Columns Training
description:
  Add context columns to your bigram model to capture grammatical patterns like
  verbs, pronouns, and prepositions.
order: 6
topic: how-models-understand
keyIdea:
  Extra context columns let the model track broader patterns beyond individual
  word pairs.
dependsOn:
  - Basic Training
---

# Context Columns Training

::: info Lesson Info

This lesson is part of the
[How Models Understand](/topics/how-models-understand) topic, with instructions
for students (including examples) and [instructor notes](#instructor-notes). If
you'd like a printable version of the student handout,
[download it here](/assets/pdfs/context-columns.pdf).

:::

Enhance your bigram model with context columns that capture grammatical and
semantic patterns.

![Hero image: Context Columns](/assets/images/hero-context-columns.jpg)

<Prerequisites />

## You will need

- your completed bigram model from _Basic Training_
- pen and paper (or extend your existing grid)

## Your goal

Add new context columns to your bigram model that track grammatical categories.
Stretch goal: invent and test your own context columns for patterns you find
interesting.

## Key idea

Standard bigram models only know what word came immediately before. Context
columns add extra information about the _type_ of word that preceded---verbs,
pronouns, prepositions---giving the model richer cues about what should come
next.

## Why context matters

Consider these two sentences:

- "The dog **runs** quickly"
- "She **runs** quickly"

In both cases, `runs` is followed by `quickly`. But the context differs: in the
first, a noun precedes the verb; in the second, a pronoun does. By tracking
these grammatical categories separately, the model can learn patterns like
"after a pronoun-verb combination, adverbs are common".

## Algorithm

1. **Extend your grid** with three new columns: `after verb`, `after pronoun`,
   `after preposition`.
2. **Train as usual**: for each word pair in your text, increment the
   word-to-word cell.
3. **Also update context columns**: when the first word is:
   - a verb (e.g., run, jump, see) → increment `after verb` for the second word
   - a pronoun (e.g., he, she, it, they) → increment `after pronoun`
   - a preposition (e.g., in, on, at, to) → increment `after preposition`

You update two cells per pair: the normal transition count, plus one context
column if the first word belongs to a grammatical category.

## Example

Training text: _"She runs to the park. He walks to the store."_

After processing `She runs`:

- increment cell (`she`, `runs`) as normal
- `she` is a pronoun, so also increment `after pronoun` for `runs`

After processing `runs to`:

- increment cell (`runs`, `to`) as normal
- `runs` is a verb, so also increment `after verb` for `to`

After processing `to the`:

- increment cell (`to`, `the`) as normal
- `to` is a preposition, so also increment `after preposition` for `the`

The context columns accumulate counts across all words in their category,
building up patterns like "prepositions are often followed by articles".

## Tips for identifying word types

- **Verbs**: action words (run, jump, eat, think, is, was)
- **Pronouns**: words replacing nouns (I, you, he, she, it, we, they, this,
  that)
- **Prepositions**: words showing relationships (in, on, at, to, from, with, by,
  for)

When unsure, make your best guess---the model learns from aggregate patterns, so
occasional misclassifications won't break it.

## Instructor notes

### Discussion questions

- which context column accumulates counts fastest? what does this tell you about
  English?
- are there words that fit multiple categories (e.g., "run" as noun vs verb)?
  how did you handle them?
- what other grammatical categories might be useful to track?
- how do context columns differ from simply having a bigger vocabulary?

### Connection to current LLMs

Your hand-crafted context columns are a simplified version of what the
"attention mechanism" in transformers learns automatically:

- **manual vs learnt**: you chose 3 grammatical contexts; transformers learn
  hundreds of attention patterns
- **categorical vs continuous**: your contexts are binary (is/isn't a verb);
  transformers learn weighted attention scores
- **the insight**: both approaches recognise that _what type of word came
  before_ matters as much as _which specific word came before_

The attention mechanism got its name because models learn to "pay attention" to
relevant context. Your grammatical categories are hand-picked attention
patterns.
