---
title: Lessons
description: All LLMs Unplugged lessons for teaching how language models work.
---

# Lessons

The lessons are split into **Fundamentals** that everyone should complete, and
**Extensions** that you can pick and choose based on your interests and
available time. If you're new to _LLMs Unplugged_, start with the
**Fundamentals** lessons below.

::: info Grid or bucket?

The Fundamentals lessons (and a couple of the extensions) offer two "flavours":
**Grid** (paper grids and dice) or **Bucket** (physical tokens and containers).
Use the toggle at the top of each lesson to switch between them.

The **grid** version connects well to probability concepts in the maths
curriculum---students fill in a table with tally marks and use dice to sample
from weighted distributions.

The **bucket** version is simpler and more tactile---students cut up tokens and
draw them from physical containers. Great for younger learners or when you want
to skip the dice maths.

Both teach the same core concepts. Pick whichever suits your group.

:::

## Fundamentals

These two lessons build on each other and should be completed in order.

<CardList :lessons="['training', 'generation']" />

## Extensions

These lessons can be done in any order after completing the fundamentals. Each
one explores a different aspect of how modern language models work.

### Scaling up

<CardList :lessons="['pretrained-generation', 'trigram']" />

### Controlling output

<CardList :lessons="['sampling', 'beam-search', 'tool-use']" />

### Context and meaning

These two lessons work well together---context columns extends the grid model,
and word embeddings uses those extended grids to explore semantic similarity.

<CardList :lessons="['context-columns', 'word-embeddings']" />

### Model tuning

<CardList :lessons="['lora', 'rlhf', 'synthetic-data']" />
