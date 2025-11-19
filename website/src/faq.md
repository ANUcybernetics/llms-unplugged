---
layout: base.njk
title: FAQ
---

# Frequently asked questions

## Who is this for?

Anyone curious about how language models work. The activities are designed for
learners from high school age upwards, with no technical background required.
Educators, students, and professionals have all found value in the hands-on
approach.

## Did some of this stuff used to be called "My First Language Model"?

Yep, it sure did... and we still sometimes use that as a workshop title at the
ANU. But this website and resources are for _all_ the LLMs Unplugged resources,
not just the ones we use in that particular workshop.

## Do I need any special materials?

You'll need dice (ideally d10 or d20), paper, and pencils. The PDF booklets can
be printed on standard A4 or A5 paper. For larger groups, having multiple sets
of dice speeds things up.

## How long do the activities take?

A basic bigram text generation activity takes 30--60 minutes. Building your own
model from scratch takes longer---allow 2--3 hours for a complete workshop that
includes both building and generating.

## Can I use these materials in my classroom?

Yes. All materials are released under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), so you
can use, adapt, and share them for non-commercial educational purposes with
attribution.

## What's the difference between bigrams and trigrams?

Bigrams predict the next word based on one previous word. Trigrams use two
previous words, producing more coherent text but requiring larger lookup tables.
We recommend starting with bigrams.

## Why dice instead of computers?

Using physical randomness makes the probabilistic nature of text generation
tangible. When you roll dice and look up words in a table, you're doing exactly
what a computer does---just slower. This builds genuine understanding rather
than treating AI as a black box.

## How does this relate to ChatGPT and other LLMs?

Modern LLMs use the same fundamental principle: predict the next token based on
context. The differences are scale (billions of parameters vs dozens) and
learned vs hand-counted statistics. The core mechanism---weighted random
selection based on patterns in training data---is identical.

## Can I generate my own booklets from custom text?

Yes. The [source code](https://github.com/ANUcybernetics/llms-unplugged)
includes tools to process any text file into a printable booklet. You'll need
basic command-line familiarity to run the tools.

## The generated text is nonsense. Is that right?

Mostly, yes. Bigram models capture local word patterns but have no long-range
coherence. This is actually the point---it shows both the power and limitations
of statistical language modelling. Trigrams produce noticeably better results.

## I found an error in the materials.

Please [open an issue](https://github.com/ANUcybernetics/llms-unplugged/issues)
on GitHub or [contact us](/contact/). We appreciate corrections and suggestions.
