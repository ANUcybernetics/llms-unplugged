---
title: Lessons
description: All LLMs Unplugged lessons for teaching how language models work.
---

# Lessons

The lessons are split into a **Core Track** that everyone should complete, and
**Extensions** that you can pick and choose based on your interests and
available time.

::: info Getting started

New to LLMs Unplugged? Start with the **Fundamentals** lessons below. Or check
out our curated paths for [professionals](/professionals),
[educators](/educators), and [parents](/parents).

:::

::: tip Grid or bucket?

The core lessons offer two methods: **Grid** (paper grids and dice) or
**Bucket** (physical tokens and containers). Use the toggle at the top of each
lesson to switch between them.

The **grid** version connects well to probability concepts in the maths
curriculum---students fill in a table with tally marks and use dice to sample
from weighted distributions.

The **bucket** version is simpler and more tactile---students cut up tokens and
draw them from physical containers. Great for younger learners or when you want
to skip the dice maths.

Both teach the same core concepts. Pick whichever suits your group.

:::

## Core track

These lessons build on each other and should be completed in order.

### Fundamentals

<CardList :lessons="['training', 'generation']" />

### Scaling up

<CardList :lessons="['pretrained-generation', 'trigram']" />

### Controlling output

<CardList :lessons="['sampling']" />

## Extensions

These lessons can be done in any order after completing the core track. Each one
explores a different aspect of how modern language models work.

### Context and meaning

These two lessons work well together---context columns extends the grid model,
and word embeddings uses those extended grids to explore semantic similarity.

<CardList :lessons="['context-columns', 'word-embeddings']" />

### Adaptation

<CardList :lessons="['lora']" />

### Data and evaluation

<CardList :lessons="['synthetic-data']" />
