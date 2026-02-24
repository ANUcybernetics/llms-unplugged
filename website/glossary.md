---
title: Glossary
description:
  Key terms and concepts used in LLMs Unplugged, with plain-language
  explanations and links to relevant lessons.
---

# Glossary

This glossary connects the hands-on activities in LLMs Unplugged with the
technical terms used in modern language models. Each entry provides a plain
language explanation and links to relevant lessons.

## Core concepts

### Token

A single unit of text that the model works with. In our activities, each word
and punctuation mark (`.`, `,`) is a token. Modern LLMs use subword tokens that
can be parts of words.

_Synonyms:_ word (in introductory contexts)

_Style note:_ the lessons use "word" initially to keep things accessible, then
transition to "token" once the concept is established. Both terms refer to the
same thing in our activities.

_See:_ [Training](/lessons/training)

### Vocabulary

All the unique tokens your model knows. The words across the top and side of
your grid (or the bucket labels) form your vocabulary.

_See:_ [Training](/lessons/training)

### Language model

A system that predicts what text comes next based on patterns learned from
training data. Your hand-built grid or bucket collection is a language model.

_See:_ [Training](/lessons/training), [Generation](/lessons/generation)

### Training

The process of building a model by counting patterns in text. When you tally
word transitions or fill buckets with tokens, you're training your model.

_Synonyms:_ learning

_See:_ [Training](/lessons/training)

### Generation

Using a trained model to produce new text by repeatedly predicting and selecting
the next token.

_Synonyms:_ inference (in broader AI/ML contexts)

_See:_ [Generation](/lessons/generation)

### Probability distribution

A set of options with associated likelihoods. In your model, the counts in a row
(or tokens in a bucket) form a probability distribution over possible next
words.

_See:_ [Generation](/lessons/generation), [Sampling](/lessons/sampling)

## Model types

### Bigram model

A model that predicts the next word based on one previous word. This is what you
build in the fundamental lessons---each row of your grid represents what can
follow a single word.

_Synonyms:_ 2-gram model

_See:_ [Training](/lessons/training), [Generation](/lessons/generation)

### Trigram model

A model that uses two previous words for prediction, capturing more context than
a bigram. The grid becomes three-dimensional (or you track word pairs instead of
single words).

_Synonyms:_ 3-gram model

_See:_ [Trigram](/lessons/trigram)

### N-gram model

The general term for models that predict based on the previous _n-1_ words.
Bigrams are 2-grams, trigrams are 3-grams, and so on.

_See:_ [Training](/lessons/training), [Trigram](/lessons/trigram)

### Context window

How many previous tokens the model considers when making predictions. Bigrams
have a context window of 1, trigrams have 2, and modern models like GPT-4 can
consider 128,000+ tokens.

_See:_ [Trigram](/lessons/trigram), [Context Columns](/lessons/context-columns)

## Training variants

### Grid variant

The matrix-based approach where you draw a grid with words as row and column
headers, then add tally marks to track which words follow which.

_See:_ [Training](/lessons/training)

### Bucket variant

The physical container approach where each bucket is labelled with a word and
contains paper tokens representing words that followed it in the training text.

_See:_ [Training](/lessons/training)

### Matrix

A grid or table showing relationships between tokens. Your hand-drawn grids are
matrices tracking which words follow other words. Each row can also be
interpreted as an embedding vector.

_See:_ [Training](/lessons/training),
[Word Embeddings](/lessons/word-embeddings)

## Sampling and generation

### Weighted random sampling

Choosing the next token with probability proportional to its frequency. Your
dice rolls implement this---words with higher counts are more likely to be
selected.

_See:_ [Generation](/lessons/generation)

### Temperature

A parameter controlling randomness in generation. Dividing counts by temperature
makes output more random (high temperature) or more predictable (low
temperature).

_See:_ [Sampling](/lessons/sampling)

### Greedy sampling

Always choosing the most likely next word (equivalent to temperature approaching
zero). Produces predictable but often repetitive text.

_Synonyms:_ greedy decoding

_See:_ [Sampling](/lessons/sampling)

### Beam search

A generation strategy that tracks multiple possible sequences simultaneously,
choosing the best overall path rather than committing to one word at a time.

_See:_ [Beam Search](/lessons/beam-search)

### Beam width

How many candidate paths to track during beam search. Beam width 1 is equivalent
to greedy search; larger widths explore more possibilities.

_See:_ [Beam Search](/lessons/beam-search)

### Truncation strategy

A rule that limits which tokens are eligible for selection before sampling.
Examples include top-k (only consider the k most likely) and top-p/nucleus (only
consider tokens until cumulative probability reaches p).

_See:_ [Sampling](/lessons/sampling)

## Understanding and meaning

### Embedding

A numerical representation of a word. Each row in your bigram grid is that
word's embedding vector---a fingerprint of its usage context.

_Synonyms:_ word vector, embedding vector

_See:_ [Word Embeddings](/lessons/word-embeddings)

### Similarity matrix

A grid showing how similar or different each pair of words is, calculated by
comparing their embedding vectors. Words used in similar contexts have similar
embeddings.

_Synonyms:_ distance matrix, distance grid

_See:_ [Word Embeddings](/lessons/word-embeddings)

### Attention mechanism

The ability to focus on relevant previous words when making predictions. Context
columns are a manual form of attention, letting you consider grammatical
categories rather than just the immediately preceding word.

_See:_ [Context Columns](/lessons/context-columns)

## Advanced concepts

### Fine-tuning

Additional training on specific text to adapt a model for a particular domain or
task. Like adding more tallies to your grid from a new text source.

_See:_ [LoRA](/lessons/lora), [Synthetic Data](/lessons/synthetic-data)

### LoRA (Low-Rank Adaptation)

A technique for efficiently fine-tuning models by training a small "adaptation
layer" rather than modifying all the original parameters.

_See:_ [LoRA](/lessons/lora)

### RLHF (Reinforcement Learning from Human Feedback)

A training technique where human preferences guide the model to produce more
helpful, harmless, and honest outputs.

_See:_ [RLHF](/lessons/rlhf)

### Agentic tool use

The ability of language models to act as agents by recognising when to call
external tools (like calculators or search engines) in a loop rather than
generating text directly.

_See:_ [Agentic Tool Use](/lessons/agentic-tool-use)

### Synthetic data

Training data generated by models rather than collected from humans. Can be used
to augment training sets or create specialised datasets.

_See:_ [Synthetic Data](/lessons/synthetic-data)

### Hallucination

When models generate plausible-sounding but false information. This happens
because models learn patterns, not facts---they predict what text _looks like_
rather than what is true.

### Parameters

The numbers stored in the model that encode learned patterns. Each tally mark in
your grid is a parameter. Modern models have billions of parameters.

_See:_ [Training](/lessons/training)

### Transformer

The neural network architecture used by GPT, Claude, and other modern LLMs. It
uses attention mechanisms to process all words in parallel rather than
sequentially.

## Connections to your activities

| Your activity                   | Real LLM equivalent                    |
| ------------------------------- | -------------------------------------- |
| Tallying word pairs             | Counting n-grams during training       |
| Rolling dice for next word      | Sampling from probability distribution |
| Grid rows/columns               | Weight matrices in neural networks     |
| Adding context columns          | Learning attention patterns            |
| Calculating word distances      | Computing embedding similarities       |
| Dividing tallies by temperature | Applying temperature to logits         |
| Keeping top beam paths          | Beam search with specified beam width  |
| Picking from buckets            | Weighted random sampling               |
| Training on new text            | Fine-tuning on domain-specific data    |

## Key insights

1. **Scale is the main difference:** your small grid vs billions of parameters,
   but the core concepts are identical.

2. **Randomness creates variety:** both your dice and ChatGPT use controlled
   randomness to avoid repetitive output.

3. **Context improves prediction:** more context (bigram → trigram →
   transformer) enables better text generation.

4. **Embeddings capture meaning:** words used similarly get similar vectors,
   whether hand-calculated or learned by neural networks.

5. **Training is just counting:** at its core, training means observing patterns
   in data---exactly what you did with tally marks.

The hands-on activities demonstrate the fundamental operations of language
models. The main advances in modern AI come from doing these same operations at
massive scale with learned (rather than hand-crafted) patterns.
